"use client";
// Owner: P3. Live voice conversation with Grok (xAI Voice Agent API, WebSocket). The mic streams to Grok as
// 24 kHz PCM16, Grok's voice streams back and plays as it arrives, the server hears when the user starts and
// stops talking, and talking over Grok cuts it off. Tool calls run through voiceTools (checked by our code).

import type { AgentTurn } from "@/lib/ai/schemas";
import { useBuildStore } from "@/store/buildStore";
import type { Verdict } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { runVoiceTool, VOICE_TOOLS } from "./voiceTools";

const RATE = 24000;
const MEMORY_TURNS = 20; // how much of the conversation a new session is given
const VOICE_SPEED = 1.05; // a touch quicker than default: lively, not read out
const IDLE_STOP_MS = 3 * 60_000; // a forgotten live session ends itself (it is billed per minute)
// Tools that change the rocket itself; Grok narrates those changes, so the next "built" event is not repeated.
const ROCKET_CHANGING_TOOLS = new Set(["swap_engine", "swap_tank", "set_engine_count", "add_stage", "remove_stage", "set_payload", "set_mission"]);
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

const currentRocket = (verdict: Verdict, screen: string, history: AgentTurn[]) => ({
  build: useBuildStore.getState().build,
  verdict,
  screen,
  history: history.slice(-MEMORY_TURNS),
});

export interface LiveGrok {
  live: boolean;
  connecting: boolean;
  speaking: boolean;
  /** The user is talking (server voice detection). */
  hearing: boolean;
  level: React.RefObject<number>;
  start: (verdict: Verdict, screen: string) => Promise<boolean>;
  stop: () => void;
  /** Tell Grok what just happened on screen; it reacts when nobody is talking. */
  notify: (event: string) => void;
  /** Refresh Grok's picture of the rocket. */
  refresh: (verdict: Verdict, screen: string) => void;
  /** Paused: the mic is off and Grok neither listens nor talks until resumed. */
  paused: boolean;
  pause: () => void;
  resume: () => void;
}

/** `onToolChange` runs after one of Grok's tool calls changed the rocket. */
export interface LiveOptions {
  /** Runs after one of Grok's tool calls changed the rocket. */
  onToolChange?: () => void;
  /** The conversation so far (until the page reloads); live turns are added to it, and new sessions continue it. */
  memory: React.RefObject<AgentTurn[]>;
  onTurn: (turn: AgentTurn) => void;
}

export function useLiveGrok({ onToolChange, memory, onTurn }: LiveOptions): LiveGrok {
  const [live, setLive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [hearing, setHearing] = useState(false);
  const [paused, setPaused] = useState(false);
  const level = useRef(0);
  const toolChangeRef = useRef(onToolChange);
  const turnRef = useRef(onTurn);
  useEffect(() => {
    toolChangeRef.current = onToolChange;
    turnRef.current = onTurn;
  }, [onToolChange, onTurn]);
  const s = useRef<{
    ws: WebSocket;
    ctx: AudioContext;
    stream: MediaStream;
    out: GainNode;
    nextTime: number;
    sources: Set<AudioBufferSourceNode>;
    responding: boolean;
    userTalking: boolean;
    paused: boolean;
    /** The user just finished talking: the server is about to answer on its own, so no events until it does. */
    awaitingReply: boolean;
    lastActivity: number;
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
    if (!st || st.paused || st.responding || st.userTalking || st.awaitingReply || st.sources.size > 0 || st.queue.length === 0) return;
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
    setPaused(false);
  }, []);

  useEffect(() => stop, [stop]);

  const play = (b64: string): void => {
    const st = s.current;
    if (!st || st.paused) return;
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
        if (st.paused) break;
        st.userTalking = true;
        st.lastActivity = Date.now();
        setHearing(true);
        silence(); // the user talked over Grok: stop talking
        break;
      case "input_audio_buffer.speech_stopped":
        st.userTalking = false;
        st.awaitingReply = true;
        setTimeout(() => {
          if (s.current === st && st.awaitingReply) {
            st.awaitingReply = false; // the server didn't answer (e.g. just noise): let events through again
            flush();
          }
        }, 3000);
        setHearing(false);
        break;
      case "response.created":
        st.responding = true;
        st.awaitingReply = false;
        st.lastActivity = Date.now();
        break;
      case "conversation.item.input_audio_transcription.completed": {
        const text = String(ev.transcript ?? "").trim();
        if (text) turnRef.current({ role: "user", text: text.slice(0, 300) });
        break;
      }
      case "response.output_audio_transcript.done": {
        const text = String(ev.transcript ?? "").trim();
        if (text) turnRef.current({ role: "grok", text: text.slice(0, 300) });
        break;
      }
      case "response.function_call_arguments.done": {
        const result = runVoiceTool(String(ev.name), String(ev.arguments ?? "{}"));
        if (result.ok && ROCKET_CHANGING_TOOLS.has(String(ev.name))) toolChangeRef.current?.();
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
    async (verdict: Verdict, screen: string): Promise<boolean> => {
      if (s.current) return true;
      setConnecting(true);
      try {
        const res = await fetch("/api/realtime", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...currentRocket(verdict, screen, memory.current ?? []), token: true }),
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
          paused: false,
          awaitingReply: false,
          lastActivity: Date.now(),
          toolOutputs: 0,
          queue: [] as string[],
        };
        s.current = st;

        let pending: Float32Array[] = [];
        let pendingLen = 0;
        capture.port.onmessage = (e: MessageEvent<Float32Array>) => {
          if (st.paused) return; // nothing leaves the browser while paused
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
              output: { format: { type: "audio/pcm", rate: RATE }, speed: VOICE_SPEED },
            },
            tools: VOICE_TOOLS,
          },
        });
        st.queue.push(
          (memory.current ?? []).length > 0
            ? "(Event: the user is back, continuing the same conversation (see CONVERSATION SO FAR). Do not greet them or introduce yourself again; pick up right where you left off in one short line.)"
            : `(Event: the user just tapped you to start talking. ${setup.welcome})`,
        );
        flush();

        const outData = new Uint8Array(outMeter.frequencyBinCount);
        const micData = new Uint8Array(micMeter.frequencyBinCount);
        const tick = (): void => {
          if (s.current !== st) return;
          if (Date.now() - st.lastActivity > IDLE_STOP_MS && !st.responding && st.sources.size === 0) return stop();
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

  const pause = useCallback((): void => {
    const st = s.current;
    if (!st || st.paused) return;
    st.paused = true;
    st.stream.getAudioTracks().forEach((t) => (t.enabled = false)); // the mic itself is off
    if (st.responding) send({ type: "response.cancel" });
    send({ type: "input_audio_buffer.clear" });
    silence();
    st.userTalking = false;
    st.awaitingReply = false;
    setHearing(false);
    setPaused(true);
  }, []);

  const resume = useCallback((): void => {
    const st = s.current;
    if (!st || !st.paused) return;
    st.paused = false;
    st.stream.getAudioTracks().forEach((t) => (t.enabled = true));
    st.lastActivity = Date.now();
    setPaused(false);
    flush(); // anything that happened on screen meanwhile
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notify = useCallback((event: string): void => {
    const st = s.current;
    if (!st) return;
    st.queue = [...st.queue, event].slice(-3); // a few recent events, so a launch result isn't lost behind a part landing
    flush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback((verdict: Verdict, screen: string): void => {
    if (!s.current) return;
    void fetch("/api/realtime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentRocket(verdict, screen, memory.current ?? [])),
    })
      .then((r) => (r.ok ? (r.json() as Promise<Setup>) : null))
      .then((setup) => setup && send({ type: "session.update", session: { instructions: setup.instructions } }))
      .catch(() => {});
  }, [memory]);

  return { live, connecting, speaking, hearing, level, start, stop, notify, refresh, paused, pause, resume };
}
