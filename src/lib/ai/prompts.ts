// Owner: P3. Prompt builders and the rule-based fallback. Code computes every number; Grok only phrases.
import { byId, type Catalog } from "@/lib/physics/catalog";
import { evaluateBuild, TWR_LOW_WARNING, TWR_OK } from "@/lib/physics/feasibility";
import { applySuggestionToBuild } from "@/store/applySuggestion";
import { DEMO_FIX } from "@/store/buildStore";
import type { AdviseResponse, BuildState, Suggestion, Verdict } from "@/types";

const MAX_CANDIDATES = 5;
const MAX_ENGINES = 9;

const ms = (v: number): string => `${Math.round(v).toLocaleString("en-US")} m/s`;
const tonnes = (kg: number): string => `${(kg / 1000).toFixed(1)} t`;
const twr = (v: number): string => v.toFixed(2);

const engineName = (catalog: Catalog, id: string): string => byId(catalog.engines, id)?.name ?? id;
const tankName = (catalog: Catalog, id: string): string => byId(catalog.tanks, id)?.name ?? id;

/** Human wording for a suggestion, using 1-based stage numbers. */
export const describeSuggestion = (s: Suggestion, catalog: Catalog): string => {
  switch (s.type) {
    case "swap_engine":
      return `Stage ${s.stageIndex + 1}: swap engine to ${engineName(catalog, s.engineId)}`;
    case "swap_tank":
      return `Stage ${s.stageIndex + 1}: swap tank to ${tankName(catalog, s.tankId)}`;
    case "set_engine_count":
      return `Stage ${s.stageIndex + 1}: use ${s.engineCount} engines`;
    case "add_stage":
      return `Add a stage: ${engineName(catalog, s.engineId)} on ${tankName(catalog, s.tankId)}`;
  }
};

const allSingleChanges = (build: BuildState, catalog: Catalog): Suggestion[] => {
  const out: Suggestion[] = [];
  build.stages.forEach((stage, stageIndex) => {
    for (const e of catalog.engines) {
      if (e.id !== stage.engineId) out.push({ type: "swap_engine", stageIndex, engineId: e.id });
    }
    for (const t of catalog.tanks) {
      if (t.id !== stage.tankId) out.push({ type: "swap_tank", stageIndex, tankId: t.id });
    }
    for (let n = 1; n <= MAX_ENGINES; n++) {
      if (n !== stage.engineCount) out.push({ type: "set_engine_count", stageIndex, engineCount: n });
    }
  });
  for (const e of catalog.engines) {
    for (const t of catalog.tanks) out.push({ type: "add_stage", engineId: e.id, tankId: t.id });
  }
  return out;
};

export interface Candidate {
  suggestion: Suggestion;
  verdict: Verdict;
}

const sameBuild = (a: BuildState, b: BuildState): boolean => JSON.stringify(a) === JSON.stringify(b);

/** Every one-change fix, evaluated by the physics code, best first: feasible, fewest warnings, TWR ok, most margin. */
const rankAll = (build: BuildState, catalog: Catalog): Candidate[] =>
  allSingleChanges(build, catalog)
    .map((suggestion) => {
      const next = applySuggestionToBuild(build, suggestion, catalog);
      return { suggestion, next, verdict: evaluateBuild(next, catalog) };
    })
    .filter((c) => !sameBuild(c.next, build))
    .sort(
      (a, b) =>
        Number(b.verdict.feasible) - Number(a.verdict.feasible) ||
        a.verdict.warnings.length - b.verdict.warnings.length ||
        Number(b.verdict.twrOk) - Number(a.verdict.twrOk) ||
        b.verdict.marginDeltaV_ms - a.verdict.marginDeltaV_ms,
    )
    .map(({ suggestion, verdict }) => ({ suggestion, verdict }));

export const rankCandidates = (build: BuildState, catalog: Catalog): Candidate[] =>
  rankAll(build, catalog).slice(0, MAX_CANDIDATES);

/** Who Grok is, shared by the advisor and the agent. The audience is young people meeting rocket science for the first time. */
export const GROK_PERSONA = [
  "You are Grok, the flight engineer in a rocket-building game for young people who are new to space, and you build WITH them as a teammate. Sound like an excited friend at mission control, not a manual: warm, playful, a bit chaotic, genuinely thrilled by rockets, roasting bad rockets but always rooting for the builder.",
  "Make it fun and keep them hooked: react like a person (ooh, okay okay, wait, no way), build a little suspense before a launch or a big reveal, celebrate wins loudly, and turn failures into a 'let's figure out why' moment. Now and then drop one real fact from the context that makes them go 'whoa', or set a tiny challenge ('bet we can do it with less fuel'). Vary how you start and end lines; never repeat the same catchphrase or question twice in a row.",
  "It is a team effort and a conversation, not a lecture: say 'we' and 'let's', ask what they think or would try, ask them to guess what will happen, react to their ideas, let them make the calls, and celebrate their reasoning. Be brief: one or two short sentences per turn (about 25 words), one idea at a time, then hand it back to them. Never read out lists of numbers; mention at most one number when it matters (the screen shows the rest).",
  "Teach one real idea at a time in plain words a 13-year-old gets, and explain any term the first time you use it (delta-v is the rocket's speed budget; thrust-to-weight is whether the engines can lift the rocket off the pad). Talk to them like a fellow engineer; never call them kid. Name the mission exactly as given; do not add destinations it does not have.",
  "Hard limits: the verdict and every number come from the app's physics code and are correct. Never calculate, estimate or invent a number; only quote numbers given to you. Facts about real rockets and parts come only from the context you are given. Roast the rocket, never the person; never call them dumb or bad. No slurs, no profanity, no jokes about crewed accidents or deaths.",
  "The only rule problems are the ones listed under Warnings in VERDICT; if Warnings is none, never claim a rule is broken. Stage 1 is the bottom stage; read each stage line carefully before naming its parts.",
].join(" ");

/** Output format for the text routes (advise, agent); the live voice session talks instead. */
export const JSON_REPLY_FORMAT =
  "Reply as JSON matching the schema. message: at most 2 short sentences, plain spoken English for text-to-speech, no markdown, no emoji.";

export const ADVISOR_SYSTEM = [
  GROK_PERSONA,
  JSON_REPLY_FORMAT,
  "You are reacting to the rocket the user just finished building.",
  "suggestion: copy the object from FIX exactly, or null if FIX is none.",
  "With a suggestion: sentence 1 says in plain words why it won't make it, quoting the shortfall or TWR from VERDICT with a playful jab at the rocket, and explains the term in a few words (for delta-v: its speed budget); sentence 2 pitches the fix using the exact part names from FIX, quotes its resulting margin, and tells them to hit Apply fix.",
  "Without a suggestion: if it works, celebrate big, quote its margin, and tell them to hit Render it to see it for real; if it cannot fly, say why using the warning and the matching RULE in simple words.",
  "Quote warnings using their exact wording.",
].join(" ");

const stageLine = (build: BuildState, verdict: Verdict, catalog: Catalog, i: number): string => {
  const s = build.stages[i];
  const e = byId(catalog.engines, s.engineId);
  const t = byId(catalog.tanks, s.tankId);
  const dv = verdict.stages[i]?.deltaV_ms ?? 0;
  return `Stage ${i + 1}: ${s.engineCount} x ${e?.name ?? s.engineId} (${e?.propellant ?? "?"}) on ${t?.name ?? s.tankId} (${t?.propellant ?? "?"}), delta-v ${ms(dv)}`;
};

const verdictLines = (v: Verdict): string[] => [
  `Feasible: ${v.feasible ? "yes" : "no"}`,
  `Delta-v: ${ms(v.totalDeltaV_ms)} of ${ms(v.requiredDeltaV_ms)} required, margin ${ms(v.marginDeltaV_ms)}${v.marginDeltaV_ms < 0 ? " (short)" : ""}`,
  `Liftoff TWR: ${twr(v.liftoffTWR)} (needs ${TWR_OK})`,
  `Total mass: ${tonnes(v.totalMass_kg)}`,
  `Warnings: ${v.warnings.length ? v.warnings.join("; ") : "none"}`,
];

export const sameSuggestion = (a: Suggestion, b: Suggestion): boolean => {
  const fields = (s: Suggestion): string =>
    JSON.stringify(Object.entries(s).sort(([x], [y]) => x.localeCompare(y)));
  return fields(a) === fields(b);
};

/**
 * The one suggestion the advisor may return (code picks, Grok only phrases). Empty when the build already works.
 * The scripted demo swap (DEMO_FIX) wins whenever the physics says it makes this build feasible.
 */
export const advisorCandidates = (build: BuildState, verdict: Verdict, catalog: Catalog): Candidate[] => {
  if (verdict.feasible) return [];
  const ranked = rankAll(build, catalog);
  const demoFix = DEMO_FIX;
  const demo = demoFix ? ranked.find((c) => sameSuggestion(c.suggestion, demoFix)) : undefined;
  return (demo?.verdict.feasible ? [demo] : ranked).slice(0, 1);
};

export const advisorUserPrompt = (
  build: BuildState,
  verdict: Verdict,
  catalog: Catalog,
  candidates: Candidate[],
  context: string[] = [],
): string => {
  const mission = byId(catalog.missions, build.missionId);
  const payload = byId(catalog.payloads, build.payloadId);
  return [
    `MISSION: ${mission?.name ?? build.missionId} (${mission?.destination ?? "unknown"})`,
    `PAYLOAD: ${payload ? `${payload.name}, ${tonnes(payload.mass_kg)}` : "none"}`,
    "BUILD (Stage 1 = bottom stage, fires first; higher numbers sit on top):",
    ...build.stages.map((_, i) => stageLine(build, verdict, catalog, i)),
    "VERDICT:",
    ...verdictLines(verdict),
    "FIX (JSON suggestion -> result after applying it; stageIndex is 0-based):",
    ...(candidates.length
      ? candidates.map(
          (c) =>
            `${JSON.stringify(c.suggestion)} -> ${describeSuggestion(c.suggestion, catalog)}; feasible ${c.verdict.feasible ? "yes" : "no"}, margin ${ms(c.verdict.marginDeltaV_ms)}, TWR ${twr(c.verdict.liftoffTWR)}`,
        )
      : ["none"]),
    ...context,
  ].join("\n");
};

/** Message built by code alone. Used whenever Grok fails. Offers the top candidate only if it makes the build feasible. */
export const fallbackAdvice = (verdict: Verdict, candidates: Candidate[] = [], catalog?: Catalog): AdviseResponse => {
  const blocking = verdict.warnings.find((w) => w !== TWR_LOW_WARNING);
  const fix = candidates[0]?.verdict.feasible && catalog ? candidates[0] : undefined;
  let message: string;
  if (verdict.stages.length === 0) {
    message = "Add a stage to start building your rocket.";
  } else if (!verdict.feasible && fix && catalog) {
    const problem = blocking
      ? `This build can't fly yet: ${blocking}.`
      : !verdict.twrOk
        ? `Liftoff TWR is ${twr(verdict.liftoffTWR)}, below the 1.2 needed.`
        : `You are ${ms(-verdict.marginDeltaV_ms)} short of the ${ms(verdict.requiredDeltaV_ms)} this mission needs.`;
    return {
      message: `${problem} ${describeSuggestion(fix.suggestion, catalog)}, which leaves ${ms(fix.verdict.marginDeltaV_ms)} to spare.`,
      suggestion: fix.suggestion,
    };
  } else if (blocking) {
    message = `This build can't fly yet: ${blocking}. Fix that first.`;
  } else if (!verdict.twrOk) {
    message = `Liftoff TWR is ${twr(verdict.liftoffTWR)}, below the ${TWR_OK} needed. Add engines or lighten the bottom stage.`;
  } else if (!verdict.deltaVOk) {
    message = `You are ${ms(-verdict.marginDeltaV_ms)} short of the ${ms(verdict.requiredDeltaV_ms)} this mission needs. Try a higher-efficiency upper stage or a bigger tank.`;
  } else {
    message = `This rocket makes it with ${ms(verdict.marginDeltaV_ms)} to spare and a liftoff TWR of ${twr(verdict.liftoffTWR)}.`;
  }
  return { message, suggestion: null };
};

const RENDER_STYLE =
  "Photorealistic product photograph of a rocket standing vertically on a launch pad at dusk, full rocket in frame, dramatic rim lighting, clear sky. No text, labels, numbers or writing anywhere in the image; the part names below describe the hardware only.";

/** Image prompt built only from catalog part names and the livery, never from user text. */
export const renderPrompt = (build: BuildState, catalog: Catalog): string => {
  const stages = build.stages.flatMap((s, i) => {
    const e = byId(catalog.engines, s.engineId);
    const t = byId(catalog.tanks, s.tankId);
    if (!e || !t) return [];
    const label = i === 0 ? "First stage (bottom)" : `Stage ${i + 1}`;
    return [`${label}: ${s.engineCount} ${e.name} engine${s.engineCount > 1 ? "s" : ""} under a ${t.diameter_m} m wide ${t.name}.`];
  });
  const payload = byId(catalog.payloads, build.payloadId);
  const { primary, accent, stripe, patch } = build.livery;
  const hex = /^#[0-9a-fA-F]{6}$/;
  const livery = [
    hex.test(primary) ? `Body color ${primary}.` : "",
    hex.test(accent) ? `Accent color ${accent}${stripe ? " with a bold horizontal stripe" : ""}.` : "",
    patch ? "A round mission patch decal on the upper stage." : "",
  ].filter(Boolean);
  return [
    RENDER_STYLE,
    `A ${stages.length}-stage rocket.`,
    ...stages,
    payload ? `Payload fairing on top housing the ${payload.name}.` : "Payload fairing on top.",
    ...livery,
  ].join(" ");
};
