// Owner: P3. "Your Mission Story": three chapters of this exact rocket's flight (launch, space, the ending), one
// moment, one idea and real numbers each. Which chapters exist and how the story ends come from code (the screen's own ascent result, else
// the verdict). Every number in a caption is computed here from the data and the physics; images never carry text.
import { byId, type Catalog } from "@/lib/physics/catalog";
import { G0, ispForStage_s, rocketEquationDeltaV_ms, stageMass_kg } from "@/lib/physics/deltav";
import { evaluateBuild } from "@/lib/physics/feasibility";
import type { BuildState } from "@/types";
import { flightOutcome, type FlightOutcome, type ScreenFlight } from "./videoPrompt";

export interface StoryScene {
  id: "liftoff" | "space" | "payoff" | "lesson";
  /** Short chapter name shown above the caption. */
  title: string;
  caption: string;
  prompt: string;
  /** "still" = edit from our own 3D render so the rocket stays exactly this build (costs more), null = generate. */
  reference: "still" | null;
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

/** The three chapters (start, middle, end) for one flight. Pure: the same build and flight always give the same. */
export function storyScenes(build: BuildState, catalog: Catalog, flight?: ScreenFlight): StoryScene[] {
  const verdict = evaluateBuild(build, catalog);
  const outcome = flight ? fromScreen[flight.outcome] : flightOutcome(verdict);
  const mission = byId(catalog.missions, build.missionId);
  const payload = byId(catalog.payloads, build.payloadId);
  const booster = build.stages[0];
  const upper = build.stages[build.stages.length - 1];
  const boosterEngine = booster ? byId(catalog.engines, booster.engineId) : undefined;
  const upperEngine = upper ? byId(catalog.engines, upper.engineId) : undefined;
  const lands = flight ? flight.boosterLands : LANDING_BOOSTER_ENGINES.has(booster?.engineId ?? "");
  const stages = build.stages.length;

  const body = colorWord(build.livery.primary);
  const trim = colorWord(build.livery.accent);
  const rocket =
    `a tall slender ${stages >= 3 ? "multi-stage" : stages === 2 ? "two-stage" : "single-stage"} rocket with a ${body} body, ` +
    `${body === trim ? "matching" : trim} bands and a rounded nose fairing, ` +
    `${booster && booster.engineCount > 1 ? `a cluster of ${booster.engineCount} engines` : "a single engine"} at its base`;
  // Rocket chapters are edited from our own 3D still: the rocket must not change, only the scene around it.
  const keep = (scene: string) =>
    [
      STYLE,
      `Turn this into a real photograph. Keep the rocket from the reference image exactly the same: same shape, proportions, stages, colours, markings and engines (${rocket}).`,
      `Change only the scene: ${scene}`,
      NEGATIVE,
    ].join(" ");
  const where = mission?.name ?? "orbit";
  const weight_kN = (verdict.totalMass_kg * G0) / 1000;
  const ask = "Ask Grok how to fix it.";

  const launch: StoryScene = {
    id: "liftoff",
    title: "1 · Launch",
    reference: "still",
    caption: `${t1(verdict.totalMass_kg)} tonnes, mostly fuel. ${booster?.engineCount ?? 0} × ${boosterEngine?.name ?? "engine"} push ${n0(verdict.liftoffThrust_kN)} kN against ${n0(weight_kN)} kN of weight: ${verdict.liftoffTWR.toFixed(2)}× more push than weight, so it rises.`,
    prompt: keep(
      "a night launch seconds after ignition, the rocket rising off its floodlit launch pad beside the steel launch tower on a blinding orange-white flame, huge exhaust clouds billowing across the pad, searchlights and the flame lighting up the night sky.",
    ),
  };

  if (outcome === "no_liftoff") {
    return [
      {
        ...launch,
        title: "1 · On the pad",
        caption:
          verdict.liftoffTWR < 1
            ? `${n0(verdict.liftoffThrust_kN)} kN of push against ${n0(weight_kN)} kN of weight: push has to beat weight to lift off.`
            : `${t1(verdict.totalMass_kg)} tonnes on the pad, but the physics grounds it: ${verdict.warnings[0] ?? "this build can't fly"}.`,
        prompt: keep("night, the engines firing and exhaust clouds billowing across the floodlit pad, but the rocket held down and not rising, steam drifting around it."),
      },
      { id: "lesson", title: "2 · Grounded", reference: "still", caption: `It never leaves the pad. ${ask}`, prompt: keep("the floodlit launch pad at night after an aborted launch, engines off, the rocket still standing beside the tower in drifting steam and smoke.") },
    ];
  }

  if (outcome === "impact") {
    return [
      launch,
      {
        id: "lesson",
        title: "2 · Not enough speed",
        reference: "still",
        caption: `It reached ${kms(verdict.totalDeltaV_ms)} of the ${kms(verdict.requiredDeltaV_ms)} km/s it needed: not fast enough to stay up, so it falls back. ${ask}`,
        prompt: keep("high above the clouds in the night sky, the rocket arcing over after its engine cut off, falling back toward the Earth, trailing smoke."),
      },
    ];
  }

  const orbit = leoOrbit();
  const noStaging = deltaVWithoutStaging(build, catalog);
  const space: StoryScene = {
    id: "space",
    title: "2 · In space",
    reference: "still",
    caption:
      (stages > 1
        ? `The empty booster dropped away${lands ? " and flew back to land" : ""}: shedding dead weight gives ${kms(verdict.totalDeltaV_ms)} km/s instead of ${kms(noStaging)}. `
        : "") +
      `Now the ${upperEngine?.name ?? "upper stage"} pushes on. Orbit needs ${kms(orbit.speed_ms)} km/s: once around the Earth every ${Math.round(orbit.lap_min)} minutes.`,
    prompt: keep(
      "the rocket in space above the Earth with its engine glowing, the bright blue curved Earth, swirling white clouds and the thin glowing atmosphere below, black space and stars above, sunlight glinting off the rocket.",
    ),
  };

  if (outcome === "shortfall") {
    return [
      launch,
      space,
      {
        id: "lesson",
        title: "3 · Out of fuel",
        reference: "still",
        caption: `It ran out ${kms(Math.abs(verdict.marginDeltaV_ms))} km/s short of ${where} (it needed ${kms(verdict.requiredDeltaV_ms)} km/s). More efficient engines or one more stage would get there. ${ask}`,
        prompt: keep(
          `in black space, the rocket's engine flickering out with its last puff of exhaust, drifting, its destination still far away: ${DESTINATION_VIEW[mission?.id ?? ""] ?? "the Earth below"}.`,
        ),
      },
    ];
  }

  const story = payload ? PAYLOAD_STORY[payload.id] : undefined;
  const view = DESTINATION_VIEW[mission?.id ?? ""];
  return [
    launch,
    space,
    {
      id: "payoff",
      title: "3 · Mission accomplished",
      reference: null,
      caption: payload
        ? `${payload.name.replace(/ \(stowed\)$/, "")} delivered to ${where} with ${kms(verdict.marginDeltaV_ms)} km/s to spare.${story ? ` It's ${story.why}.` : ""}`
        : `${where} reached with ${kms(verdict.marginDeltaV_ms)} km/s to spare.`,
      prompt: [
        STYLE,
        story ? `A real spacecraft photographed in space: ${story.view}, ${view ?? "in space"}.` : `A rocket's upper stage ${view ?? "in orbit above the Earth"}.`,
        NEGATIVE,
      ].join(" "),
    },
  ];
}
