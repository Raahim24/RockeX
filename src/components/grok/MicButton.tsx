"use client";
// Owner: P3. Speaks Grok's text via /api/voice and measures how loud it is, so the orb can move with the voice.

import { useCallback, useEffect, useRef, useState } from "react";

export interface Speaker {
  /** Speaks the text; resolves to false if the voice could not be played (caller shows a caption instead). */
  speak: (text: string | null) => Promise<boolean>;
  speaking: boolean;
  /** Current loudness of the voice, 0..1, updated every frame while speaking. */
  level: React.RefObject<number>;
}

export function useSpeaker(): Speaker {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const level = useRef(0);
  const turn = useRef(0); // each speak() call gets a number; only the latest one may play

  const stop = useCallback((): void => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      URL.revokeObjectURL(audio.src);
      audioRef.current = null;
    }
    level.current = 0;
    setSpeaking(false);
  }, []);

  useEffect(() => stop, [stop]);

  const meter = useCallback((audio: HTMLAudioElement): void => {
    try {
      const ctx = ctxRef.current ?? new AudioContext();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaElementSource(audio).connect(analyser);
      analyser.connect(ctx.destination);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = (): void => {
        if (audioRef.current !== audio) return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((s, v) => s + v, 0) / data.length / 255;
        level.current = Math.min(1, avg * 2.5);
        requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // No Web Audio: the orb still pulses on its own while speaking.
    }
  }, []);

  const speak = useCallback(
    async (text: string | null): Promise<boolean> => {
      const mine = ++turn.current;
      stop();
      if (!text) return true;
      try {
        const res = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) return false;
        const blob = await res.blob();
        if (mine !== turn.current) return true; // a newer line started meanwhile: never talk over it
        stop();
        const audio = new Audio(URL.createObjectURL(blob));
        audioRef.current = audio;
        audio.onended = () => audioRef.current === audio && stop();
        meter(audio);
        setSpeaking(true);
        await audio.play();
        return true;
      } catch {
        stop();
        return false;
      }
    },
    [stop, meter],
  );

  return { speak, speaking, level };
}
