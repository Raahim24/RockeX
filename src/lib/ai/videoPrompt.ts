// Owner: P3. The Grok Imagine flight-video prompt, written by code from the build and its verdict.
// Code decides what happens (the physics verdict); the video only shows it. No numbers go into the prompt.
import { byId, type Catalog } from "@/lib/physics/catalog";
import { evaluateBuild } from "@/lib/physics/feasibility";
import type { BuildState, Verdict } from "@/types";

export type FlightOutcome = "no_liftoff" | "impact" | "shortfall" | "success";

/** The assembly screen's own ascent result (prototype/rocket-assembly/src/ascent.js), sent with the launch. */
export interface ScreenFlight {
  outcome: "orbit" | "shortfall" | "impact";
  boosterLands: boolean;
}

// Without the screen's flight: boosters in the catalog that really fly back and land (visual story only).
const LANDING_BOOSTER_ENGINES = new Set(["merlin-1d"]);
// Same rule as the screen's ascent sim: these warnings are app rules a real vehicle breaks, not reasons it
// can't fly (the real Falcon 9 second stage is 3.2 % dry mass).
const NOT_GROUNDING = new Set(["liftoff TWR below 1.2", "tank dry mass below 4 percent of propellant"]);

/** What the flight does, from the verdict alone (used when the screen didn't send its own flight). */
export const flightOutcome = (verdict: Verdict): FlightOutcome => {
  const grounded = verdict.warnings.some((w) => !NOT_GROUNDING.has(w));
  if (verdict.stages.length === 0 || grounded) return "no_liftoff";
  return verdict.deltaVOk ? "success" : "shortfall";
};

const fromScreen: Record<ScreenFlight["outcome"], FlightOutcome> = { orbit: "success", shortfall: "shortfall", impact: "impact" };

const COLOR_NAMES: [string, string][] = [
  ["#ffffff", "white"],
  ["#000000", "black"],
  ["#c0c0c0", "silver"],
  ["#808080", "grey"],
];
const colorWord = (hex: string): string => {
  const known = COLOR_NAMES.find(([h]) => h === hex.toLowerCase());
  if (known) return known[1];
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 24) return max > 200 ? "white" : max > 90 ? "grey" : "black";
  if (r === max) return g > b * 1.4 ? "orange" : "red";
  if (g === max) return "green";
  return "blue";
};

export interface FlightVideoPlan {
  outcome: FlightOutcome;
  prompt: string;
}

/** The video prompt for a build. Pure: the same build always gives the same prompt. */
export function flightVideoPlan(build: BuildState, catalog: Catalog, flight?: ScreenFlight): FlightVideoPlan {
  const outcome = flight ? fromScreen[flight.outcome] : flightOutcome(evaluateBuild(build, catalog));
  const mission = byId(catalog.missions, build.missionId);
  const payload = byId(catalog.payloads, build.payloadId);
  const stageText = build.stages.map((s, i) => {
    const engine = byId(catalog.engines, s.engineId)?.name ?? "rocket";
    const which = i === 0 ? "first stage" : i === build.stages.length - 1 ? "upper stage" : `stage ${i + 1}`;
    return `${which} with ${s.engineCount} ${engine} engine${s.engineCount === 1 ? "" : "s"}`;
  });
  const look = `a ${build.stages.length}-stage rocket, ${colorWord(build.livery.primary)} body with ${colorWord(build.livery.accent)} trim`;
  const cargo = payload ? `, carrying ${payload.name} under its nose fairing` : "";
  const where = mission?.destination ?? "orbit";
  const lands = flight ? flight.boosterLands : LANDING_BOOSTER_ENGINES.has(build.stages[0]?.engineId ?? "");
  const booster = lands
    ? "the first stage separates, flips and comes back down to land upright on a landing pad"
    : "the first stage separates and falls away";

  const story: Record<FlightOutcome, string> = {
    no_liftoff:
      "The engines ignite with fire and billowing smoke, the rocket strains against the launch clamps and never rises.",
    impact: "It lifts off and climbs through the clouds, but it runs out of speed, slows, tips over and falls back toward Earth.",
    shortfall: `It lifts off and climbs through the clouds, ${booster}, but the upper stage engine sputters out before reaching ${where}; the rocket coasts silently, falling short.`,
    success: `It lifts off and climbs through the clouds on a column of flame, ${booster}, and the upper stage fires and carries the payload on toward ${where}.`,
  };

  const prompt = [
    `Photoreal cinematic launch footage of ${look}${cargo}: ${stageText.join(", ")}.`,
    "It starts on the launch pad exactly as in the first frame.",
    story[outcome],
    "Realistic hardware and proportions, natural camera moves, golden-hour light, no text, no logos, no watermarks.",
  ].join(" ");
  return { outcome, prompt };
}
