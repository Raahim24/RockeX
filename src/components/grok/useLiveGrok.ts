"use client";
// Owner: P3. Live voice conversation with Grok (xAI Voice Agent API, WebSocket). The mic streams to Grok as
// 24 kHz PCM16, Grok's voice streams back and plays as it arrives, the server hears when the user starts and
// stops talking, and talking over Grok cuts it off. Tool calls run through voiceTools (checked by our code).

import { useBuildStore } from "@/store/buildStore";
import type { Verdict } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { runVoiceTool, VOICE_TOOLS } from "./voiceTools";

const RATE = 24000;
const CHUNK = 2400; // 100 ms of mic audio per message

// Captures raw mic samples off the audio thread.
const CAPTURE_WORKLET = `
class Capture extends AudioWorkletProcessor {
  process(inputs) { const ch = inputs[0] && inputs[0][0]; if (ch) this.port.postMessage(ch.slice(0)); return true; }
}
registerProcessor("grok-capture", Capture);`;

interface Setup {
  instructions: string;
  keyterms: string[];
  welcome: string;
  model: string;
  voice: string;
  token?: string;
}

const toBase64 = (bytes: Uint8Array): string => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const pcm16 = (f: Float32Array): Uint8Array => {
  const out = new Int16Array(f.length);
  for (let i = 0; i < f.length; i++) out[i] = Math.max(-1, Math.min(1, f[i])) * 0x7fff;
  return new Uint8Array(out.buffer);
};
const fromPcm16 = (b64: string): Float32Array<ArrayBuffer> => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const ints = new Int16Array(bytes.buffer, 0, bytes.length >> 1);
  const out = new Float32Array(ints.length);
  for (let i = 0; i < ints.length; i++) out[i] = ints[i] / 0x8000;
  return out;
};
const loudness = (a: AnalyserNode, data: Uint8Array<ArrayBuffer>): number => {
  a.getByteFrequencyData(data);
  return Math.min(1, (data.reduce((s, v) => s + v, 0) / data.length / 255) * 3);
};

const currentRocket = (verdict: Verdict, screen: string) => ({ build: useBuildStore.getState().build, verdict, screen });

export interface LiveGrok {
  live: boolean;
  connecting: boolean;
  speaking: boolean;
  /** The user is talking (server voice detection). */
  hearing: boolean;
  level: React.RefObject<number>;
  /** `firstStep`: extra instructions for Grok's opening line (e.g. the first guided-build step). */
  start: (verdict: Verdict, screen: string, firstStep?: string | null) => Promise<boolean>;
  stop: () => void;
  /** Tell Grok what just happened on screen; it reacts when nobody is talking. */
  notify: (event: string) => void;
  /** Refresh Grok's picture of the rocket. */
  refresh: (verdict: Verdict, screen: string) => void;
}

/** `onToolChange` runs after one of Grok's tool calls changed the rocket. */
export function useLiveGrok(onToolChange?: () => void): LiveGrok {
  const [live, setLive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [hearing, setHearing] = useState(false);
  const level = useRef(0);
  const toolChangeRef = useRef(onToolChange);
  useEffect(() => {
    toolChangeRef.current = onToolChange;
  }, [onToolChange]);
  const s = useRef<{
    ws: WebSocket;
    ctx: AudioContext;
    stream: MediaStream;
    out: GainNode;
    nextTime: number;
    sources: Set<AudioBufferSourceNode>;
    responding: boolean;
    userTalking: boolean;
    toolOutputs: number;
    queue: string[];
  } | null>(null);

  const send = (msg: unknown): void => {
    const ws = s.current?.ws;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  };

  const silence = (): void => {
    const st = s.current;
    if (!st) return;
    st.sources.forEach((src) => {
      try {
        src.stop();
      } catch {
        // already stopped
      }
    });
    st.sources.clear();
    st.nextTime = 0;
    setSpeaking(false);
  };

  const flush = (): void => {
    const st = s.current;
    if (!st || st.responding || st.userTalking || st.sources.size > 0 || st.queue.length === 0) return;
    const event = st.queue.splice(0).join(" ");
    send({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text: event }] } });
    send({ type: "response.create" });
  };

  const stop = useCallback((): void => {
    const st = s.current;
    s.current = null;
    if (!st) return;
    st.ws.close();
    st.stream.getTracks().forEach((t) => t.stop());
    void st.ctx.close().catch(() => {});
    level.current = 0;
    setLive(false);
    setSpeaking(false);
    setHearing(false);
  }, []);

  useEffect(() => stop, [stop]);

  const play = (b64: string): void => {
    const st = s.current;
    if (!st) return;
    const samples = fromPcm16(b64);
    if (samples.length === 0) return;
    const buf = st.ctx.createBuffer(1, samples.length, RATE);
    buf.copyToChannel(samples, 0);
    const src = st.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(st.out);
    const at = Math.max(st.nextTime, st.ctx.currentTime + 0.03);
    src.start(at);
    st.nextTime = at + buf.duration;
    st.sources.add(src);
    setSpeaking(true);
    src.onended = () => {
      st.sources.delete(src);
      if (st.sources.size === 0) {
        setSpeaking(false);
        flush();
      }
    };
  };

  const onEvent = (ev: { type: string; [k: string]: unknown }): void => {
    const st = s.current;
    if (!st) return;
    switch (ev.type) {
      case "response.output_audio.delta":
      case "response.audio.delta":
        play(String(ev.delta ?? ""));
        break;
      case "input_audio_buffer.speech_started":
        st.userTalking = true;
        setHearing(true);
        silence(); // the user talked over Grok: stop talking
        break;
      case "input_audio_buffer.speech_stopped":
        st.userTalking = false;
        setHearing(false);
        break;
      case "response.created":
        st.responding = true;
        break;
      case "response.function_call_arguments.done": {
        const result = runVoiceTool(String(ev.name), String(ev.arguments ?? "{}"));
        if (result.ok && String(ev.name) !== "build_all" && String(ev.name) !== "explode" && String(ev.name) !== "reset") {
          toolChangeRef.current?.();
        }
        send({ type: "conversation.item.create", item: { type: "function_call_output", call_id: ev.call_id, output: JSON.stringify(result) } });
        st.toolOutputs++;
        break;
      }
      case "response.done":
        st.responding = false;
        if (st.toolOutputs > 0) {
          st.toolOutputs = 0;
          send({ type: "response.create" }); // let Grok say what the change did, using the numbers we returned
        } else {
          flush();
        }
        break;
      case "error":
        console.warn("[live grok]", ev);
        break;
    }
  };

  const start = useCallback(
    async (verdict: Verdict, screen: string, firstStep?: string | null): Promise<boolean> => {
      if (s.current) return true;
      setConnecting(true);
      try {
        const res = await fetch("/api/realtime", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...currentRocket(verdict, screen), token: true }),
        });
        if (!res.ok) return false;
        const setup = (await res.json()) as Setup;
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        const ctx = new AudioContext({ sampleRate: RATE });
        await ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([CAPTURE_WORKLET], { type: "text/javascript" })));
        const out = ctx.createGain();
        const outMeter = ctx.createAnalyser();
        out.connect(outMeter);
        out.connect(ctx.destination);
        const mic = ctx.createMediaStreamSource(stream);
        const micMeter = ctx.createAnalyser();
        const capture = new AudioWorkletNode(ctx, "grok-capture");
        mic.connect(micMeter);
        mic.connect(capture);

        const ws = new WebSocket(`wss://api.x.ai/v1/realtime?model=${encodeURIComponent(setup.model)}`, [
          `xai-client-secret.${setup.token}`,
        ]);
        const st = {
          ws,
          ctx,
          stream,
          out,
          nextTime: 0,
          sources: new Set<AudioBufferSourceNode>(),
          responding: false,
          userTalking: false,
          toolOutputs: 0,
          queue: [] as string[],
        };
        s.current = st;

        let pending: Float32Array[] = [];
        let pendingLen = 0;
        capture.port.onmessage = (e: MessageEvent<Float32Array>) => {
          pending.push(e.data);
          pendingLen += e.data.length;
          if (pendingLen < CHUNK) return;
          const all = new Float32Array(pendingLen);
          let o = 0;
          for (const p of pending) {
            all.set(p, o);
            o += p.length;
          }
          pending = [];
          pendingLen = 0;
          send({ type: "input_audio_buffer.append", audio: toBase64(pcm16(all)) });
        };

        const opened = await new Promise<boolean>((resolve) => {
          ws.onopen = () => resolve(true);
          ws.onerror = () => resolve(false);
          setTimeout(() => resolve(false), 8000);
        });
        if (!opened) {
          stop();
          return false;
        }
        ws.onmessage = (m) => onEvent(JSON.parse(String(m.data)) as { type: string });
        ws.onclose = () => s.current === st && stop();
        send({
          type: "session.update",
          session: {
            voice: setup.voice,
            instructions: setup.instructions,
            turn_detection: { type: "server_vad" },
            audio: {
              input: { format: { type: "audio/pcm", rate: RATE }, transcription: { language_hint: "en", keyterms: setup.keyterms } },
              output: { format: { type: "audio/pcm", rate: RATE } },
            },
            tools: VOICE_TOOLS,
          },
        });
        st.queue.push(
          firstStep
            ? `(Event: the user just tapped you to start talking. Say hi as Grok, their flight engineer, name the mission and payload in one exciting line, and say you will build the rocket together part by part. Then start: ${firstStep})`
            : `(Event: the user just tapped you to start talking. ${setup.welcome})`,
        );
        flush();

        const outData = new Uint8Array(outMeter.frequencyBinCount);
        const micData = new Uint8Array(micMeter.frequencyBinCount);
        const tick = (): void => {
          if (s.current !== st) return;
          level.current = Math.max(loudness(outMeter, outData), loudness(micMeter, micData));
          requestAnimationFrame(tick);
        };
        tick();
        setLive(true);
        return true;
      } catch (err) {
        console.warn("[live grok] could not start:", err);
        stop();
        return false;
      } finally {
        setConnecting(false);
      }
    },
    // onEvent/play/flush only read refs and stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stop],
  );

  const notify = useCallback((event: string): void => {
    const st = s.current;
    if (!st) return;
    st.queue = [event]; // only the latest news matters
    flush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback((verdict: Verdict, screen: string): void => {
    if (!s.current) return;
    void fetch("/api/realtime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentRocket(verdict, screen)),
    })
      .then((r) => (r.ok ? (r.json() as Promise<Setup>) : null))
      .then((setup) => setup && send({ type: "session.update", session: { instructions: setup.instructions } }))
      .catch(() => {});
  }, []);

  return { live, connecting, speaking, hearing, level, start, stop, notify, refresh };
}
