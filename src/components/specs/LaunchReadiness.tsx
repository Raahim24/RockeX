"use client";
// Owner: P3. Launch readiness, shown once the whole rocket is on the stack: the three things the physics
// checks (speed budget, liftoff push, parts that fit), each with a gauge, so the gap is something you can see.
// Facts only, never a hint about which part to pick: the numbers come from the same verdict Grok reads.

import { plainProblem } from "@/components/grok/voiceTools";
import { byId, loadCatalog } from "@/lib/physics/catalog";
import { TWR_OK } from "@/lib/physics/feasibility";
import { useBuild, useVerdict } from "@/store/buildStore";
import type { Verdict } from "@/types";
import { useEffect, useState } from "react";

const TWR_SCALE = 2; // the push gauge runs from 0 to 2x the rocket's weight
const DV_HEADROOM = 1.25; // the speed gauge runs to 125 % of what the trip needs

const speed = (ms: number): string => (Math.abs(ms) < 1000 ? `${Math.round(Math.abs(ms))} m/s` : `${(Math.abs(ms) / 1000).toFixed(1)} km/s`);

/** Rule problems that aren't about the push (that one has its own gauge), in plain words, once each. */
const ruleProblems = (v: Verdict): string[] => [...new Set(v.warnings.filter((w) => !/TWR/.test(w)).map(plainProblem))];

/** True while a launch is on screen (flying, in space or landed), until it is back on the pad or reset. */
function useInFlight(complete: boolean): boolean {
  const [flying, setFlying] = useState(false);
  useEffect(() => {
    const start = (): void => setFlying(true);
    const stop = (): void => setFlying(false);
    const onClick = (e: Event): void => {
      const btn = (e.target as Element | null)?.closest?.("button");
      if (btn?.id === "btn-build-all" && btn.textContent === "Launch") start();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key.toLowerCase() === "l" && !(e.target as Element | null)?.closest?.("input, textarea")) start();
    };
    const onCommand = (e: Event): void => {
      if ((e as CustomEvent<{ cmd: string }>).detail.cmd === "launch") start();
    };
    const onReport = (e: Event): void => {
      const { kind, text } = (e as CustomEvent<{ kind: string; text: string }>).detail;
      if (kind === "pad" || (kind === "launch" && /^(Pad abort|Not launched)/.test(text))) stop();
    };
    // The screen re-enables Launch once no launch is showing (back to pad by Esc, Grok, reset or a rebuild).
    const launchBtn = document.getElementById("btn-build-all") as HTMLButtonElement | null;
    const watch = new MutationObserver(() => {
      if (launchBtn && !launchBtn.disabled) stop();
    });
    if (launchBtn) watch.observe(launchBtn, { attributes: true, attributeFilter: ["disabled"] });
    addEventListener("click", onClick, true);
    addEventListener("keydown", onKey, true);
    addEventListener("assembly:command", onCommand);
    addEventListener("assembly:report", onReport);
    return () => {
      watch.disconnect();
      removeEventListener("click", onClick, true);
      removeEventListener("keydown", onKey, true);
      removeEventListener("assembly:command", onCommand);
      removeEventListener("assembly:report", onReport);
    };
  }, []);
  return flying && complete;
}

const backToPad = (): void => void dispatchEvent(new CustomEvent("assembly:command", { detail: { cmd: "back_to_pad" } }));

function Gauge({ value, target, max, ok }: { value: number; target: number; max: number; ok: boolean }) {
  const pct = (x: number): number => Math.max(0, Math.min(100, (x / max) * 100));
  const fill = pct(value);
  const mark = pct(target);
  return (
    <div className="relative mt-2 h-[3px] rounded-full bg-white/10">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${fill}%`, background: ok ? "var(--text)" : "var(--nogo)" }}
      />
      {!ok && fill < mark && (
        // The gap: what's missing between where the rocket is and where it needs to be.
        <div className="absolute inset-y-0 bg-[rgba(255,106,61,0.25)]" style={{ left: `${fill}%`, width: `${mark - fill}%` }} />
      )}
      <div className="absolute -inset-y-[3px] w-px bg-[var(--text-2)]" style={{ left: `${mark}%` }} title="needed" />
    </div>
  );
}

function Check({ ok, title, detail, children }: { ok: boolean; title: string; detail: string; children?: React.ReactNode }) {
  return (
    <li className="py-2.5 first:pt-1">
      <div className="flex items-baseline gap-3">
        <span className="text-[13px] text-[var(--text)]">{title}</span>
        <span className="ml-auto whitespace-nowrap font-[family-name:var(--mono)] text-[11.5px] tabular-nums" style={{ color: ok ? "var(--text-2)" : "var(--nogo)" }}>
          {detail}
        </span>
      </div>
      {children}
    </li>
  );
}

const CSS = `body.landing .launch-readiness { opacity: 0; pointer-events: none; }`;

export function LaunchReadiness({ complete }: { complete: boolean }) {
  useEffect(() => {
    // Tells the screen's status line to leave Δv, TWR and GO / NO-GO to this panel.
    document.body.dataset.readinessPanel = "1";
    return () => void delete document.body.dataset.readinessPanel;
  }, []);
  const build = useBuild();
  const verdict = useVerdict();
  const flying = useInFlight(complete);
  const ready = complete && verdict.feasible;
  if (!complete) return null;
  if (flying) {
    // Grok can do this by voice too ("take it back to the pad"); the button is for anyone who'd rather tap.
    return (
      <button
        type="button"
        onClick={backToPad}
        className="launch-readiness fixed right-6 top-[60px] z-10 rounded-full border border-[var(--hairline)] bg-[var(--surface)] px-4 py-2 text-[13px] font-medium text-[var(--text)] backdrop-blur-md hover:bg-[var(--surface-2)]"
      >
        ↩ Back to pad
      </button>
    );
  }

  const mission = byId(loadCatalog().missions, build.missionId);
  const problems = ruleProblems(verdict);
  const rulesOk = problems.length === 0;
  const dvOk = Boolean(mission) && verdict.deltaVOk;
  const twrOk = verdict.twrOk;
  const toFix = [dvOk, twrOk, rulesOk].filter((ok) => !ok).length;

  return (
    <>
      <style>{CSS}</style>
      <section
        aria-live="polite"
        className="launch-readiness fixed right-6 top-[60px] z-10 w-[264px] rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] px-4 pb-2 pt-3.5 backdrop-blur-md transition-opacity duration-500 max-[760px]:left-4 max-[760px]:right-4 max-[760px]:top-14 max-[760px]:w-auto"
        style={{ fontFamily: "var(--font)" }}
      >
        <header className="flex items-baseline gap-2 pb-2">
          <span className="h-1.5 w-1.5 shrink-0 self-center rounded-full" style={{ background: ready ? "var(--go)" : "var(--nogo)" }} aria-hidden />
          <h2 className="text-[13px] font-semibold text-[var(--text)]">{ready ? "Ready to launch" : `${toFix} thing${toFix === 1 ? "" : "s"} to fix`}</h2>
          {mission && <span className="ml-auto truncate text-[12px] text-[var(--text-2)]">{mission.name}</span>}
        </header>

        <ul className="flex flex-col divide-y divide-[var(--hairline)]">
          {mission ? (
            <Check ok={dvOk} title="Speed (Δv)" detail={dvOk ? `+${speed(verdict.marginDeltaV_ms)} spare` : `${speed(verdict.marginDeltaV_ms)} short`}>
              <Gauge value={verdict.totalDeltaV_ms} target={verdict.requiredDeltaV_ms} max={verdict.requiredDeltaV_ms * DV_HEADROOM} ok={dvOk} />
            </Check>
          ) : (
            <Check ok={false} title="Destination" detail="not picked" />
          )}

          <Check ok={twrOk} title="Liftoff push" detail={twrOk ? `${verdict.liftoffTWR.toFixed(2)}× weight` : `${verdict.liftoffTWR.toFixed(2)}×, need ${TWR_OK}×`}>
            <Gauge value={verdict.liftoffTWR} target={TWR_OK} max={TWR_SCALE} ok={twrOk} />
          </Check>

          <Check ok={rulesOk} title="Parts fit" detail={rulesOk ? "all good" : `${problems.length} problem${problems.length === 1 ? "" : "s"}`}>
            {!rulesOk && (
              <ul className="mt-1.5 flex flex-col gap-1 text-[12px] text-[var(--text-2)]">
                {problems.slice(0, 3).map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
          </Check>
        </ul>
      </section>
    </>
  );
}
