"use client";
// Owner: P3. Advisor message, Apply suggestion, mic (spoken advice) and Render it.

import { describeSuggestion } from "@/lib/ai/prompts";
import { loadCatalog } from "@/lib/physics/catalog";
import { useBuild, useBuildStore, useVerdict } from "@/store/buildStore";
import type { AdviseResponse } from "@/types";
import { useState } from "react";
import { MicButton } from "./MicButton";
import { RenderButton } from "./RenderButton";

const UNAVAILABLE: AdviseResponse = { message: "Grok is unavailable right now.", suggestion: null };

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; reply: AdviseResponse; askedFor: string };

export function GrokBar() {
  const build = useBuild();
  const verdict = useVerdict();
  const applySuggestion = useBuildStore((s) => s.applySuggestion);
  const [state, setState] = useState<State>({ status: "idle" });

  const buildKey = JSON.stringify(build);
  const stale = state.status === "done" && state.askedFor !== buildKey;

  const ask = async (): Promise<AdviseResponse> => {
    setState({ status: "loading" });
    let reply = UNAVAILABLE;
    try {
      const res = await fetch("/api/advise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ build, verdict }),
      });
      if (res.ok) reply = (await res.json()) as AdviseResponse;
    } catch {
      // Keep UNAVAILABLE.
    }
    setState({ status: "done", reply, askedFor: buildKey });
    return reply;
  };

  const textToSpeak = async (): Promise<string | null> =>
    state.status === "done" && !stale ? state.reply.message : (await ask()).message;

  const apply = (): void => {
    if (state.status !== "done" || !state.reply.suggestion) return;
    const { suggestion } = state.reply;
    applySuggestion(suggestion);
    setState({ status: "idle" });
  };

  const suggestion = state.status === "done" && !stale ? state.reply.suggestion : null;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-neutral-900 px-4 py-3 text-sm text-neutral-100">
      <div className="flex items-center gap-3">
        <MicButton getText={textToSpeak} />
        <button
          type="button"
          onClick={ask}
          disabled={state.status === "loading"}
          className="shrink-0 rounded-lg bg-white px-3 py-1.5 font-medium text-black disabled:opacity-50"
        >
          {state.status === "loading" ? "Thinking…" : "Ask Grok"}
        </button>
        <p className="min-w-0 flex-1">
          {state.status === "done"
            ? stale
              ? "Build changed. Ask Grok again."
              : state.reply.message
            : "Grok reads your build and suggests one fix."}
        </p>
        {suggestion && (
          <button
            type="button"
            onClick={apply}
            title={describeSuggestion(suggestion, loadCatalog())}
            className="shrink-0 rounded-lg bg-emerald-500 px-3 py-1.5 font-medium text-black"
          >
            Apply suggestion
          </button>
        )}
      </div>
      {suggestion && <p className="text-xs text-neutral-400">{describeSuggestion(suggestion, loadCatalog())}</p>}
      <RenderButton />
    </div>
  );
}
