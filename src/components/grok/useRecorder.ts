"use client";
// Owner: P3. Records the user's voice while the orb is held, and measures its loudness for the orb.

import { useCallback, useRef, useState } from "react";

// Formats Grok's speech to text lists by name first; Chrome only records WebM, which the server sends as MKV.
const TYPES = ["audio/ogg;codecs=opus", "audio/mp4", "audio/webm;codecs=opus", "audio/webm"];

export interface Recorder {
  start: () => Promise<boolean>;
  /** Stops and returns the recording, or null if nothing was recorded. */
  stop: () => Promise<Blob | null>;
  cancel: () => void;
  listening: boolean;
  /** Mic loudness, 0..1, while listening. */
  level: React.RefObject<number>;
}

export function useRecorder(): Recorder {
  const [listening, setListening] = useState(false);
  const rec = useRef<{ recorder: MediaRecorder; stream: MediaStream; ctx: AudioContext; chunks: Blob[] } | null>(null);
  const level = useRef(0);

  const release = useCallback((): void => {
    const r = rec.current;
    rec.current = null;
    r?.stream.getTracks().forEach((t) => t.stop());
    void r?.ctx.close().catch(() => {});
    level.current = 0;
    setListening(false);
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    if (rec.current || typeof MediaRecorder === "undefined") return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = TYPES.find((t) => MediaRecorder.isTypeSupported(t));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const entry = { recorder, stream, ctx, chunks: [] as Blob[] };
      recorder.ondataavailable = (e) => e.data.size > 0 && entry.chunks.push(e.data);
      rec.current = entry;
      recorder.start();
      setListening(true);
      const tick = (): void => {
        if (rec.current !== entry) return;
        analyser.getByteFrequencyData(data);
        level.current = Math.min(1, (data.reduce((s, v) => s + v, 0) / data.length / 255) * 3);
        requestAnimationFrame(tick);
      };
      tick();
      return true;
    } catch {
      release(); // no mic, or permission denied
      return false;
    }
  }, [release]);

  const stop = useCallback(async (): Promise<Blob | null> => {
    const r = rec.current;
    if (!r) return null;
    const done = new Promise<void>((resolve) => (r.recorder.onstop = () => resolve()));
    r.recorder.stop();
    await done;
    release();
    return r.chunks.length ? new Blob(r.chunks, { type: r.recorder.mimeType }) : null;
  }, [release]);

  return { start, stop, cancel: release, listening, level };
}
