"use client";
// Owner: P3. Launch readiness, shown once the whole rocket is on the stack: the three things the physics
// checks (speed budget, liftoff push, parts that fit), each with a gauge, so the gap is something you can see.
// When all three pass: a one-time "LAUNCH READY" moment and the Launch button glows. Facts only, never a hint
// about which part to pick: the numbers come from the same verdict Grok reads.

import { plainProblem } from "@/components/grok/voiceTools";
import { byId, loadCatalog } from "@/lib/physics/catalog";
import { TWR_OK } from "@/lib/physics/feasibility";
import { useBuild, useVerdict } from "@/store/buildStore";
import type { Verdict } from "@/types";
import { useEffect, useRef, useState } from "react";

const CELEBRATE_MS = 2600;
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

/** True for a moment each time the finished rocket goes from not ready to ready. */
function useCelebration(ready: boolean): boolean {
  const [on, setOn] = useState(false);
  const was = useRef(false);
  useEffect(() => {
    if (ready === was.current) return;
    was.current = ready;
    if (!ready) return;
    const show = setTimeout(() => setOn(true), 0);
    const hide = setTimeout(() => setOn(false), CELEBRATE_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
      setOn(false);
    };
  }, [ready]);
  return on;
}

function Gauge({ value, target, max, ok }: { value: number; target: number; max: number; ok: boolean }) {
  const pct = (x: number): number => Math.max(0, Math.min(100, (x / max) * 100));
  const fill = pct(value);
  const mark = pct(target);
  return (
    <div className="relative mt-2 h-1.5 rounded-full bg-white/10">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${fill}%`, background: ok ? "var(--go)" : "var(--nogo)" }}
      />
      {!ok && fill < mark && (
        // The gap: what's missing between where the rocket is and where it needs to be.
        <div className="lr-gap absolute inset-y-0 rounded-r-full" style={{ left: `${fill}%`, width: `${mark - fill}%` }} />
      )}
      <div className="absolute -inset-y-[3px] w-[2px] rounded bg-[var(--text)]" style={{ left: `calc(${mark}% - 1px)` }} title="needed" />
    </div>
  );
}

function Check({ ok, focus, title, detail, children }: { ok: boolean; focus: boolean; title: string; detail: string; children?: React.ReactNode }) {
  return (
    <li className={`rounded-lg px-3 py-2 ${focus ? "lr-focus bg-[rgba(255,106,61,0.08)]" : ""}`}>
      <div className="flex items-baseline gap-2">
        <span className="w-3 shrink-0 text-[11px] font-bold" style={{ color: ok ? "var(--go)" : "var(--nogo)" }} aria-hidden>
          {ok ? "✓" : "✕"}
        </span>
        <span className="whitespace-nowrap text-[13px] text-[var(--text)]">{title}</span>
        <span className="ml-auto whitespace-nowrap font-[family-name:var(--mono)] text-[11.5px] tabular-nums" style={{ color: ok ? "var(--text-2)" : "var(--nogo)" }}>
          {detail}
        </span>
      </div>
      {children && <div className="pl-5">{children}</div>}
    </li>
  );
}

const CSS = `
@keyframes lr-stripes { to { background-position: 16px 0; } }
@keyframes lr-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,106,61,0.0); } 50% { box-shadow: 0 0 0 2px rgba(255,106,61,0.55); } }
@keyframes lr-ready-glow { 0%,100% { box-shadow: 0 0 0 1px rgba(46,230,182,0.45), 0 0 18px rgba(46,230,182,0.15); } 50% { box-shadow: 0 0 0 1px rgba(46,230,182,0.9), 0 0 28px rgba(46,230,182,0.35); } }
@keyframes lr-pop { 0% { transform: scale(0.6); opacity: 0; } 18% { transform: scale(1.08); opacity: 1; } 30% { transform: scale(1); } 82% { opacity: 1; } 100% { transform: scale(1.04); opacity: 0; } }
@keyframes lr-ring { 0% { transform: scale(0.3); opacity: 0.9; } 100% { transform: scale(2.6); opacity: 0; } }
.lr-gap { background: repeating-linear-gradient(135deg, rgba(255,106,61,0.65) 0 4px, rgba(255,106,61,0.15) 4px 8px); background-size: 16px 100%; animation: lr-stripes 0.8s linear infinite; outline: 1px dashed rgba(255,106,61,0.8); }
.lr-focus { animation: lr-pulse 1.6s ease-in-out infinite; }
.lr-ready { animation: lr-ready-glow 2s ease-in-out infinite; }
.lr-pop { animation: lr-pop ${CELEBRATE_MS}ms ease-out forwards; }
.lr-ring { animation: lr-ring 1.4s ease-out forwards; }
body.landing .launch-readiness { opacity: 0; pointer-events: none; }
@media (prefers-reduced-motion: reduce) { .lr-gap, .lr-focus, .lr-ready, .lr-ring { animation: none; } .lr-pop { animation-duration: 1ms; } }
`;

// While ready, the Launch button glows too (it is P4's button; this only styles it).
const LAUNCH_GLOW = `body .bar #btn-build-all:not(:disabled) { border-color: var(--go); color: var(--go); background: rgba(46,230,182,0.12); animation: lr-ready-glow 2s ease-in-out infinite; }`;

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
  const celebrating = useCelebration(ready);
  if (!complete) return null;
  if (flying) {
    // Grok can do this by voice too ("take it back to the pad"); the button is for anyone who'd rather tap.
    return (
      <button
        type="button"
        onClick={backToPad}
        className="launch-readiness fixed right-8 top-[60px] z-10 rounded-lg border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] backdrop-blur-md hover:bg-[var(--surface-2)]"
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
  // The first failing check is the one to look at; the others stay calm so it's clear where to start.
  const focus = !dvOk ? "dv" : !twrOk ? "twr" : !rulesOk ? "rules" : null;

  return (
    <>
      <style>{CSS}</style>
      {ready && <style>{LAUNCH_GLOW}</style>}

      <section
        aria-live="polite"
        className={`launch-readiness fixed right-8 top-[60px] z-10 w-[280px] rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-2 text-xs backdrop-blur-md transition-opacity duration-500 max-[760px]:left-4 max-[760px]:right-4 max-[760px]:top-14 max-[760px]:w-auto ${ready ? "lr-ready" : ""}`}
        style={{ fontFamily: "var(--font)" }}
      >
        <header className="px-3 pb-1.5 pt-1.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: ready ? "var(--go)" : "var(--nogo)" }} />
            <h2 className="text-[11px] font-semibold tracking-[0.14em]" style={{ color: ready ? "var(--go)" : "var(--nogo)" }}>
              {ready ? "LAUNCH READY" : "NOT READY YET"}
            </h2>
            <span className="ml-auto text-[11px] text-[var(--text-2)]">{ready ? "hit Launch" : `${toFix} to fix`}</span>
          </div>
          {mission && <p className="mt-0.5 truncate pl-3.5 text-[11px] text-[var(--text-2)]">to {mission.name}</p>}
        </header>

        <ul className="flex flex-col gap-0.5">
          {mission ? (
            <Check
              ok={dvOk}
              focus={focus === "dv"}
              title="Speed (Δv)"
              detail={dvOk ? `+${speed(verdict.marginDeltaV_ms)} spare` : `short ${speed(verdict.marginDeltaV_ms)}`}
            >
              <Gauge value={verdict.totalDeltaV_ms} target={verdict.requiredDeltaV_ms} max={verdict.requiredDeltaV_ms * DV_HEADROOM} ok={dvOk} />
            </Check>
          ) : (
            <Check ok={false} focus={focus === "dv"} title="Destination" detail="not picked" />
          )}

          <Check
            ok={twrOk}
            focus={focus === "twr"}
            title="Liftoff push"
            detail={twrOk ? `${verdict.liftoffTWR.toFixed(2)}× weight` : `${verdict.liftoffTWR.toFixed(2)}× · need ${TWR_OK}×`}
          >
            <Gauge value={verdict.liftoffTWR} target={TWR_OK} max={TWR_SCALE} ok={twrOk} />
          </Check>

          <Check ok={rulesOk} focus={focus === "rules"} title="Parts fit" detail={rulesOk ? "all good" : `${problems.length} problem${problems.length === 1 ? "" : "s"}`}>
            {!rulesOk && (
              <ul className="mt-1 flex flex-col gap-0.5 text-[11px]" style={{ color: "var(--nogo)" }}>
                {problems.slice(0, 3).map((p) => (
                  <li key={p}>• {p}</li>
                ))}
              </ul>
            )}
          </Check>
        </ul>
      </section>

      {celebrating && (
        // The moment: rings and a big word over the rocket, then it fades and the Launch button keeps glowing.
        <div className="pointer-events-none fixed inset-x-0 top-[22%] z-20 flex justify-center" aria-hidden>
          <div className="relative flex items-center justify-center">
            {[0, 250, 500].map((delay) => (
              <span
                key={delay}
                className="lr-ring absolute h-40 w-40 rounded-full border-2"
                style={{ borderColor: "var(--go)", animationDelay: `${delay}ms`, opacity: 0 }}
              />
            ))}
            <div className="lr-pop text-center" style={{ textShadow: "0 0 24px rgba(46,230,182,0.7)" }}>
              <div className="text-4xl font-black tracking-[0.18em]" style={{ color: "var(--go)" }}>
                LAUNCH READY
              </div>
              <div className="mt-1 text-sm text-[var(--text)]">all systems go · hit Launch</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
