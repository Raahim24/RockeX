"use client";
// Owner: P3. Speaks Grok's text via /api/voice. Any failure is silent: the text is already on screen.

import { useEffect, useRef, useState } from "react";

interface Props {
  /** Resolves to the text to speak, or null for nothing. */
  getText: () => Promise<string | null>;
}

export function MicButton({ getText }: Props) {
  const [busy, setBusy] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = (): void => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      URL.revokeObjectURL(audio.src);
      audioRef.current = null;
    }
  };

  useEffect(() => stop, []);

  const speak = async (): Promise<void> => {
    stop();
    setBusy(true);
    try {
      const text = await getText();
      if (!text) return;
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const audio = new Audio(URL.createObjectURL(await res.blob()));
      audioRef.current = audio;
      await audio.play();
    } catch {
      // Text-only fallback: nothing to show.
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={speak}
      disabled={busy}
      aria-label="Hear Grok"
      title="Hear Grok"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-neutral-100 hover:bg-neutral-700 disabled:opacity-50"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </svg>
    </button>
  );
}
