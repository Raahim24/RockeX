// Owner: P3. "Your Mission Story": five chapters of this exact rocket's flight, one moment, one idea and one real
// number each. Which chapters exist and how the story ends come from code (the screen's own ascent result, else
// the verdict). Every number in a caption is computed here from the data and the physics; images never carry text.
import { byId, type Catalog } from "@/lib/physics/catalog";
import { G0, ispForStage_s, rocketEquationDeltaV_ms, stageMass_kg } from "@/lib/physics/deltav";
import { evaluateBuild } from "@/lib/physics/feasibility";
import type { BuildState } from "@/types";
import { flightOutcome, type FlightOutcome, type ScreenFlight } from "./videoPrompt";

export interface StoryScene {
  id: "pad" | "liftoff" | "staging" | "space" | "payoff" | "lesson" | "grounded";
  /** Short chapter name shown above the caption. */
  title: string;
  caption: string;
  prompt: string;
  /** Edit this scene from our own 3D still, so it shows the exact rocket (costs more than plain generation). */
  fromStill: boolean;
}

const fromScreen: Record<ScreenFlight["outcome"], FlightOutcome> = { orbit: "success", shortfall: "shortfall", impact: "impact" };
const LANDING_BOOSTER_ENGINES = new Set(["merlin-1d"]);

// Earth constants (same values as the screen's ascent sim, prototype/rocket-assembly/src/ascent.js).
const MU = 3.986004418e14; // m^3/s^2, WGS 84
const RE = 6371e3; // m, mean radius
const LEO_ALT = 200e3; // m, the "LEO (~200 km)" mission in missions.json

const STYLE =
  "Photorealistic, like an official NASA or SpaceX mission photo: sharp detail, real-world scale and lighting, cinematic composition, 16:9.";
const NEGATIVE = "No text, no captions, no logos, no watermarks, no people, no extra rockets, no cartoon or CGI look.";

// What each payload looks like doing its job (visual only), and one plain sentence on why it matters.
const PAYLOAD_STORY: Record<string, { view: string; why: string }> = {
  jwst: {
    view: "the James Webb Space Telescope in deep space, its huge honeycomb of gold hexagonal mirrors unfolded above a giant silver five-layer sunshield, stars all around",
    why: "an infrared telescope that sees light from the first galaxies",
  },
  hubble: {
    view: "the Hubble Space Telescope, a silver cylinder with two long solar panels, floating in orbit above the blue Earth",
    why: "a space telescope that photographs the universe from above the air",
  },
  "goes-r": {
    view: "the GOES-R weather satellite with its large solar panel, high above the Earth, a huge swirling storm visible on the planet below",
    why: "a weather satellite that watches storms and hurricanes as they form",
  },
  "nova-c": {
    view: "the Nova-C lander, a hexagonal six-legged spacecraft, touching down on the grey cratered surface of the Moon in harsh sunlight, the Earth in the black sky",
    why: "a robotic lander that delivers science instruments to the Moon",
  },
};

const DESTINATION_VIEW: Record<string, string> = {
  leo: "in low orbit a few hundred kilometres up, the curved blue Earth and its thin glowing atmosphere filling the frame below",
  gto: "high above the Earth, the whole planet a round blue globe below against black space",
  "moon-transfer": "far out in black space, the grey cratered Moon ahead and the small blue Earth behind",
  "lunar-orbit": "in orbit close above the grey cratered surface of the Moon, the blue Earth rising over the lunar horizon",
  "mars-transfer": "deep in black space, the rusty red planet Mars glowing ahead and the Earth a tiny blue dot behind",
  "earth-escape": "leaving the Earth behind for good, the Earth and Moon small and distant against black space",
};

const n0 = (n: number) => Math.round(n).toLocaleString("en-US");
const t1 = (kg: number) => n0(kg / 1000);
const kms = (ms: number) => (ms / 1000).toFixed(1);

const colorWord = (hex: string): string => {
  const v = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const [r, g, b] = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  const max = Math.max(r, g, b);
  if (max - Math.min(r, g, b) < 24) return max > 200 ? "white" : max > 90 ? "grey" : "black";
  if (r === max) return g > b * 1.4 ? "orange" : "red";
  return g === max ? "green" : "blue";
};

/** Δv if the rocket burned every stage but never dropped an empty one (the "why stages" comparison). */
export function deltaVWithoutStaging(build: BuildState, catalog: Catalog): number {
  const payload = byId(catalog.payloads, build.payloadId)?.mass_kg ?? 0;
  const resolved = build.stages.map((s, i) => {
    const engine = byId(catalog.engines, s.engineId);
    const tank = byId(catalog.tanks, s.tankId);
    return engine && tank ? { isp: ispForStage_s(engine, i), prop: tank.propellantMass_kg, mass: stageMass_kg(engine, s.engineCount, tank) } : null;
  });
  if (resolved.some((r) => r === null)) return 0;
  let m = resolved.reduce((sum, r) => sum + (r?.mass ?? 0), payload);
  let dv = 0;
  for (const r of resolved) {
    if (!r) continue;
    dv += rocketEquationDeltaV_ms(r.isp, m, m - r.prop);
    m -= r.prop; // only the fuel goes; the empty tank and engines stay on board
  }
  return dv;
}

/** Circular orbit speed and lap time at the LEO mission's altitude. */
export const leoOrbit = () => {
  const r = RE + LEO_ALT;
  const v = Math.sqrt(MU / r);
  return { speed_ms: v, lap_min: (2 * Math.PI * r) / v / 60 };
};

/** The chapters for one flight. Pure: the same build and flight always give the same chapters. */
export function storyScenes(build: BuildState, catalog: Catalog, flight?: ScreenFlight): StoryScene[] {
  const verdict = evaluateBuild(build, catalog);
  const outcome = flight ? fromScreen[flight.outcome] : flightOutcome(verdict);
  const mission = byId(catalog.missions, build.missionId);
  const payload = byId(catalog.payloads, build.payloadId);
  const booster = build.stages[0];
  const upper = build.stages[build.stages.length - 1];
  const boosterEngine = booster ? byId(catalog.engines, booster.engineId) : undefined;
  const upperEngine = upper ? byId(catalog.engines, upper.engineId) : undefined;
  const boosterTank = booster ? byId(catalog.tanks, booster.tankId) : undefined;
  const lands = flight ? flight.boosterLands : LANDING_BOOSTER_ENGINES.has(booster?.engineId ?? "");
  const stages = build.stages.length;

  const body = colorWord(build.livery.primary);
  const trim = colorWord(build.livery.accent);
  const rocket =
    `a tall slender ${stages >= 3 ? "multi-stage" : stages === 2 ? "two-stage" : "single-stage"} rocket with a ${body} body, ` +
    `${body === trim ? "matching" : trim} bands and a rounded nose fairing, ` +
    `${booster && booster.engineCount > 1 ? `a cluster of ${booster.engineCount} engines` : "a single engine"} at its base`;
  const p = (scene: string, subject = `The same rocket as in the reference: ${rocket}.`) => [STYLE, subject, scene, NEGATIVE].join(" ");
  const where = mission?.name ?? "orbit";
  const weight_kN = (verdict.totalMass_kg * G0) / 1000;

  const pad: StoryScene = {
    id: "pad",
    title: "1 · Your rocket",
    fromStill: true,
    caption: `${stages} stage${stages === 1 ? "" : "s"}, ${t1(verdict.totalMass_kg)} tonnes fully fuelled. Most of that is fuel: it has to lift all of it.`,
    prompt: p(
      "Turn this into a real photograph: the exact same rocket standing on its floodlit launch pad at night beside its steel launch tower, vapour venting from the tanks, searchlights in the dark sky.",
      "Keep the rocket in the reference image exactly as it is: same shape, proportions, stages and colours.",
    ),
  };

  const liftoff: StoryScene = {
    id: "liftoff",
    title: "2 · Liftoff",
    fromStill: false,
    caption: `${booster?.engineCount ?? 0} × ${boosterEngine?.name ?? "engine"} push ${n0(verdict.liftoffThrust_kN)} kN against ${n0(weight_kN)} kN of weight. Push beats weight ${verdict.liftoffTWR.toFixed(2)}×, so it rises.`,
    prompt: p(
      "Night launch, seconds after ignition: the rocket rising off its floodlit launch pad beside the launch tower on a blinding orange-white flame, huge exhaust clouds billowing across the pad, the flame lighting up the night sky.",
    ),
  };

  if (outcome === "no_liftoff") {
    return [
      pad,
      {
        id: "grounded",
        title: "2 · It can't leave the pad",
        fromStill: false,
        caption:
          verdict.liftoffTWR < 1
            ? `Push ${n0(verdict.liftoffThrust_kN)} kN, weight ${n0(weight_kN)} kN. Push has to beat weight to lift off. Ask Grok how to fix it.`
            : `The physics grounds it: ${verdict.warnings[0] ?? "this build can't fly"}. Ask Grok how to fix it.`,
        prompt: p("Night, the rocket standing on its floodlit launch pad, engines firing and exhaust clouds billowing, but held down and not rising, steam drifting across the pad."),
      },
    ];
  }

  const noStaging = deltaVWithoutStaging(build, catalog);
  const staging: StoryScene = {
    id: "staging",
    title: "3 · Staging",
    fromStill: false,
    caption:
      stages > 1
        ? `The empty booster drops away${lands ? " and flies back to land" : ""}. Dropping dead weight is why rockets have stages: ${kms(verdict.totalDeltaV_ms)} km/s instead of ${kms(noStaging)} km/s without staging.`
        : `One stage carries its empty ${boosterTank?.name ?? "tank"} all the way up. That's why most rockets have stages.`,
    prompt: p(
      lands
        ? "High above the clouds at twilight: the empty first-stage booster on its own, falling back tail-first on a column of flame with its landing legs unfolding, a floodlit landing pad on the coast far below."
        : "At the edge of space: the empty first stage separating and tumbling away while the upper stage's engine ignites with a bright flame, the curve of the Earth and its thin blue atmosphere below.",
      lands
        ? `The first-stage booster of the same rocket: a tall ${body} cylinder with ${booster?.engineCount ?? 1} engines at its base.`
        : undefined,
    ),
  };

  if (outcome === "impact") {
    return [
      pad,
      liftoff,
      {
        id: "lesson",
        title: "3 · Not enough speed",
        fromStill: false,
        caption: `It reached ${kms(verdict.totalDeltaV_ms)} km/s of its ${kms(verdict.requiredDeltaV_ms)} km/s budget: not fast enough to stay up, so it falls back. Ask Grok how to fix it.`,
        prompt: p("Night sky high above the clouds, the rocket arcing over after its engine cut off, falling back toward the Earth, trailing smoke."),
      },
    ];
  }

  const orbit = leoOrbit();
  const space: StoryScene = {
    id: "space",
    title: "4 · In space",
    fromStill: false,
    caption: `The ${upperEngine?.name ?? "upper stage"} keeps pushing in vacuum. Just to stay in orbit you need ${kms(orbit.speed_ms)} km/s: once around the Earth every ${Math.round(orbit.lap_min)} minutes.`,
    prompt: p(
      "In orbit above the Earth: only the upper stage of the rocket, alone in black space with its engine glowing, the bright blue curved Earth and swirling white clouds below, sunlight glinting off the stage.",
      `The upper stage of the same rocket: a ${body} cylinder with ${upper && upper.engineCount > 1 ? `${upper.engineCount} engines` : "one engine"} and the nose fairing on top.`,
    ),
  };

  if (outcome === "shortfall") {
    return [
      pad,
      liftoff,
      staging,
      space,
      {
        id: "lesson",
        title: "5 · Out of fuel",
        fromStill: false,
        caption: `It ran out ${kms(Math.abs(verdict.marginDeltaV_ms))} km/s short of ${where} (it needed ${kms(verdict.requiredDeltaV_ms)} km/s). More efficient engines or one more stage would get there. Ask Grok how to fix it.`,
        prompt: p(`In black space, the upper stage's engine flickering out with its last puff of exhaust, drifting, its destination still far away: ${DESTINATION_VIEW[mission?.id ?? ""] ?? "the Earth below"}.`),
      },
    ];
  }

  const story = payload ? PAYLOAD_STORY[payload.id] : undefined;
  const payoff: StoryScene = {
    id: "payoff",
    title: "5 · Mission accomplished",
    fromStill: false,
    caption: payload
      ? `${payload.name.replace(/ \(stowed\)$/, "")} delivered to ${where} with ${kms(verdict.marginDeltaV_ms)} km/s to spare.${story ? ` It's ${story.why}.` : ""}`
      : `${where} reached with ${kms(verdict.marginDeltaV_ms)} km/s to spare.`,
    prompt: p(
      story ? `${story.view}, ${DESTINATION_VIEW[mission?.id ?? ""] ?? "in space"}.` : `The upper stage ${DESTINATION_VIEW[mission?.id ?? ""] ?? "in orbit above the Earth"}.`,
      story ? "A real spacecraft photographed in space." : undefined,
    ),
  };

  return [pad, liftoff, staging, space, payoff];
}
