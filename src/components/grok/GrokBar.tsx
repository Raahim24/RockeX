"use client";
// Owner: P3. Phase 1 mock: asks /api/advise and shows the reply. Apply, mic and Render arrive in Phase 2.

import { describeSuggestion } from "@/lib/ai/prompts";
import { loadCatalog } from "@/lib/physics/catalog";
import { useBuild, useVerdict } from "@/store/buildStore";
import type { AdviseResponse } from "@/types";
import { useState } from "react";

type State = { status: "idle" } | { status: "loading" } | { status: "done"; reply: AdviseResponse };

export function GrokBar() {
  const build = useBuild();
  const verdict = useVerdict();
  const [state, setState] = useState<State>({ status: "idle" });

  const ask = async (): Promise<void> => {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/advise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ build, verdict }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setState({ status: "done", reply: (await res.json()) as AdviseResponse });
    } catch {
      setState({ status: "done", reply: { message: "Grok is unavailable right now.", suggestion: null } });
    }
  };

  return (
    <div className="flex items-center gap-4 rounded-xl bg-neutral-900 px-4 py-3 text-sm text-neutral-100">
      <button
        type="button"
        onClick={ask}
        disabled={state.status === "loading"}
        className="shrink-0 rounded-lg bg-white px-3 py-1.5 font-medium text-black disabled:opacity-50"
      >
        {state.status === "loading" ? "Thinking…" : "Ask Grok"}
      </button>
      <div className="flex flex-col gap-0.5">
        <p>{state.status === "done" ? state.reply.message : "Grok reads your build and suggests one fix."}</p>
        {state.status === "done" && state.reply.suggestion && (
          <p className="text-xs text-neutral-400">
            Suggestion: {describeSuggestion(state.reply.suggestion, loadCatalog())}
          </p>
        )}
      </div>
    </div>
  );
}
