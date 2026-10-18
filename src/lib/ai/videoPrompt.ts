// Owner: P3. The Grok Imagine flight-video prompt, written by code from the build and its verdict.
// Code decides what happens (the physics verdict); the video only shows it. No numbers go into the prompt.
import type { Catalog } from "@/lib/physics/catalog";
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

// How video models read prompts best: one short visual description of the subject, then at most two shots with
// clear timing and camera direction, then style and negatives. Only things a camera can see (no engine or
// payload names). The first frame is our night-time pad render, so the footage is a night launch to match it.
const STYLE =
  "Photorealistic documentary footage of a real night launch, shot on a long telephoto lens from a few kilometres away: " +
  "floodlit pad, the engine flame lighting up the night sky and the exhaust clouds, real-world physics and scale, " +
  "smooth steady camera, natural film grain, cinematic colour grading.";
const NEGATIVE =
  "No text, no captions, no logos, no watermarks, no people, no extra rockets, no cartoon or CGI look, " +
  "the rocket never changes shape, colour or size.";

/** The video prompt for a build. Pure: the same build and flight always give the same prompt.
 *  `seconds` is the clip length; the two shots split it roughly in half. */
export function flightVideoPlan(build: BuildState, catalog: Catalog, flight?: ScreenFlight, seconds = 8): FlightVideoPlan {
  const mid = Math.max(2, Math.round(seconds / 2));
  const one = `Shot 1, 0 to ${mid} seconds`;
  const two = `Shot 2, ${mid} to ${seconds} seconds`;
  const outcome = flight ? fromScreen[flight.outcome] : flightOutcome(evaluateBuild(build, catalog));
  const lands = flight ? flight.boosterLands : LANDING_BOOSTER_ENGINES.has(build.stages[0]?.engineId ?? "");
  const stages = build.stages.length;
  const boosterEngines = build.stages[0]?.engineCount ?? 1;

  const body = colorWord(build.livery.primary);
  const trim = colorWord(build.livery.accent);
  const shape = stages >= 3 ? "a very tall multi-stage rocket" : stages === 2 ? "a tall, slender two-stage rocket" : "a single-stage rocket";
  const base = boosterEngines > 1 ? `a cluster of ${boosterEngines} engines at its base` : "a single engine at its base";
  const subject =
    `The rocket from the first frame, kept exactly as it is: ${shape}, ${body} body with ${body === trim ? "matching" : trim} ` +
    `bands, a rounded nose fairing on top and ${base}, standing next to its launch tower.`;

  const liftoff = (secs: string) =>
    `${secs}: the engines ignite in a bright orange-white flame, billowing exhaust clouds roll out across the pad, ` +
    "the rocket rises slowly and steadily off the pad and clears the tower while the camera tilts up to follow it.";

  const shots: Record<FlightOutcome, string[]> = {
    no_liftoff: [
      `${one}: the engines ignite and roar, huge exhaust clouds billow out across the pad, but the rocket stays held down on the pad and does not rise.`,
      `${two}: the engines shut down, the flame dies away and steam drifts across the floodlit, still-standing rocket.`,
    ],
    impact: [
      liftoff(one),
      `${two}: high in the dark sky the rocket slows, its flame flickers out, it slowly arcs over and falls back toward the ground, trailing smoke.`,
    ],
    shortfall: [
      liftoff(one),
      `${two}: far above the clouds against the black sky, the upper stage's engine glows, flickers and goes out, and the rocket drifts on in silence, short of its goal.`,
    ],
    success: [
      liftoff(one),
      lands
        ? `${two}: wide shot of the first-stage booster coming back down tail-first on a column of flame, landing legs deployed, touching down gently and upright on a floodlit landing pad in a cloud of dust.`
        : `${two}: high above the clouds the spent first stage separates and falls away, and the upper stage ignites and climbs on into the black sky.`,
    ],
  };

  const prompt = [STYLE, subject, ...shots[outcome], NEGATIVE].join(" ");
  return { outcome, prompt };
}
