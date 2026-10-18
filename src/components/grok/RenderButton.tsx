"use client";
// Owner: P3. "Render it": asks /api/render for a Grok Imagine picture of the current build.

import { useBuild, useVerdict } from "@/store/buildStore";
import type { RenderResponse } from "@/types";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const CACHED: RenderResponse = {
  imageUrl: "/fallback/render.jpg",
  promptUsed: "",
  fallback: true,
};

type State =
  | { status: "idle" }
  | { status: "loading"; startedAt: number }
  | { status: "done"; result: RenderResponse };

interface Props {
  /** Show the "Render it" button; Grok can still start a render (render_image) when it's hidden. */
  showButton?: boolean;
}

export function RenderButton({ showButton = true }: Props) {
  const build = useBuild();
  const verdict = useVerdict();
  const [state, setState] = useState<State>({ status: "idle" });
  const [now, setNow] = useState(0);

  const loading = state.status === "loading";
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [loading]);

  const render = async (): Promise<void> => {
    const startedAt = Date.now();
    setNow(startedAt);
    setState({ status: "loading", startedAt });
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ build, verdict }),
      });
      setState({
        status: "done",
        result: res.ok ? ((await res.json()) as RenderResponse) : CACHED,
      });
    } catch {
      setState({ status: "done", result: CACHED });
    }
  };

  // Grok's render_image tool asks for a render through this event.
  const renderRef = useRef(render);
  useEffect(() => {
    renderRef.current = render;
  });
  useEffect(() => {
    const onAsk = (): void => void renderRef.current();
    addEventListener("grok:render", onAsk);
    return () => removeEventListener("grok:render", onAsk);
  }, []);

  const elapsed_s =
    state.status === "loading"
      ? Math.max(0, Math.round((now - state.startedAt) / 1000))
      : 0;

  return (
    <div className="flex flex-col gap-2">
      {(showButton || loading) && (
        <button
          type="button"
          onClick={render}
          disabled={loading}
          className="grok-panel-button disabled:opacity-50"
        >
          {loading ? `Rendering… ${elapsed_s} s` : "Render it"}
        </button>
      )}
      {loading && (
        <p className="text-xs text-neutral-400">
          Grok Imagine usually takes 15–45 seconds.
        </p>
      )}
      {state.status === "done" && (
        <figure className="relative overflow-hidden rounded-lg">
          <Image
            src={state.result.imageUrl}
            alt="Grok Imagine render of your rocket"
            width={1024}
            height={576}
            unoptimized
            className="h-auto w-full"
          />
          {state.result.fallback && (
            <figcaption className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs text-neutral-200">
              cached
            </figcaption>
          )}
        </figure>
      )}
    </div>
  );
}
