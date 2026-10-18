// Owner: P3. The tools Grok may call in the live voice session, and the code that runs them. Grok only asks;
// this code checks every id against the catalog, makes the change through the store (or the screen), and
// returns the new verdict from the physics code, so the numbers Grok says next are the code's numbers.
import { advisorCandidates, describeSuggestion } from "@/lib/ai/prompts";
import { sanitizeSuggestion } from "@/lib/ai/schemas";
import { byId, loadCatalog } from "@/lib/physics/catalog";
import { evaluateBuild, maxEngineCount, TWR_LOW_WARNING } from "@/lib/physics/feasibility";
import { applySuggestionToBuild } from "@/store/applySuggestion";
import { useBuildStore } from "@/store/buildStore";
import type { BuildState, Suggestion, Verdict } from "@/types";
import { getPreset, presetIds } from "../../../prototype/rocket-assembly/src/data/catalog.js";

const catalog = loadCatalog();
const ids = (items: { id: string }[]): string[] => items.map((i) => i.id);
const stageIndex = { type: "integer", minimum: 0, maximum: 8, description: "0 = bottom stage" };
const fn = (name: string, description: string, properties: Record<string, unknown> = {}) => ({
  type: "function",
  name,
  description,
  parameters: { type: "object", properties, required: Object.keys(properties), additionalProperties: false },
});

export const VOICE_TOOLS = [
  fn("swap_engine", "Put a different engine on one stage, and how many of it.", {
    stageIndex,
    engineId: { type: "string", enum: ids(catalog.engines) },
    engineCount: { type: "integer", minimum: 1, maximum: 9, description: "use the option's engineCount, or the current count" },
  }),
  fn("swap_tank", "Put a different tank on one stage.", { stageIndex, tankId: { type: "string", enum: ids(catalog.tanks) } }),
  fn("set_engine_count", "Change how many engines one stage has.", {
    stageIndex,
    engineCount: { type: "integer", minimum: 1, maximum: 9 },
  }),
  fn("add_stage", "Add a new stage on top of the rocket.", {
    engineId: { type: "string", enum: ids(catalog.engines) },
    tankId: { type: "string", enum: ids(catalog.tanks) },
  }),
  fn("remove_stage", "Remove one stage.", { stageIndex }),
  fn("set_payload", "Change what the rocket carries.", { payloadId: { type: "string", enum: ids(catalog.payloads) } }),
  fn("set_mission", "Change where the rocket is going.", { missionId: { type: "string", enum: ids(catalog.missions) } }),
  {
    type: "function",
    name: "remove_parts",
    description: "Take parts off the rocket. Parts come off from the top, so everything above the given part comes off too. Without partId, only the top part comes off.",
    parameters: { type: "object", properties: { partId: { type: "string", description: "a part id from SCREEN, e.g. s0-tank (stage 1 tank) or payload" } }, required: [], additionalProperties: false },
  },
  {
    type: "function",
    name: "place_parts",
    description: "Put parts on the rocket, bottom up, up to and including the given part. Without partId, only the next part.",
    parameters: { type: "object", properties: { partId: { type: "string", description: "a part id from SCREEN, e.g. s0-tank (stage 1 tank) or payload" } }, required: [], additionalProperties: false },
  },
  fn("inspect_part", "Open the info card of a part that is on the rocket and zoom to it.", { partId: { type: "string", description: "a part id from SCREEN, e.g. s0-tank (stage 1 tank) or payload" } }),
  fn("reset_view", "Close any info card and bring the camera back to the whole rocket."),
  {
    type: "function",
    name: "show_options",
    description:
      "Put choices for a part on screen as real 3D parts beside the rocket (paged, with each part's type and size), and get their details including what each would do and why some won't work. Works for the next part, or for a part already on the rocket (to swap it). Call it whenever you start talking about choices. Without ids it shows all of them; with ids, just those.",
    parameters: {
      type: "object",
      properties: {
        partId: { type: "string", description: "which part (an id from SCREEN); default: the next part to place" },
        ids: { type: "array", items: { type: "string" }, description: "record ids to show (default: all)" },
      },
      required: [],
      additionalProperties: false,
    },
  },
  fn("hide_options", "Take the choices off the screen."),
  {
    type: "function",
    name: "peek_outcomes",
    description:
      "See how each option for a part would turn out (GO/NO-GO, margin) and the fix the code would suggest. Only when the user asks for help or the answer, or is stuck after trying; then give a hint before any answer.",
    parameters: { type: "object", properties: { partId: { type: "string", description: "default: the next part" } }, required: [], additionalProperties: false },
  },
  fn("build_next", "Place the next part on the rocket (one step of the guided build)."),
  fn("build_all", "Animate the whole rocket being stacked on the pad (only if they ask to build it all at once)."),
  fn("launch", "Launch the finished rocket: a countdown and a flight simulation. The result comes back as an event. A rocket that breaks a rule gets a pad abort."),
  fn("show_twin", "Show the closest real rocket in history beside this one (finished rocket only). The result comes back as an event."),
  fn("hide_twin", "Hide the closest-real-rocket comparison."),
  fn("switch_rocket", "Load another rocket onto the pad, either fully built or as an empty pad to build step by step.", {
    presetId: {
      type: "string",
      enum: presetIds,
      description: presetIds.map((id: string) => `${id} = ${getPreset(id)?.name ?? id}`).join("; "),
    },
    built: { type: "boolean", description: "true: appears fully built; false: empty pad to build it together" },
  }),
  fn("see_through", "Toggle the see-through view that shows the insides of every part."),
  fn("render_image", "Make a Grok Imagine picture of the rocket (takes 15 to 45 seconds; it appears on screen)."),
  fn("save_card", "Save a picture card of the rocket and its numbers to the user's computer."),
  fn("play_story", "Play the guided story mode that builds and flies a rocket on its own."),
  fn("explode", "Toggle the exploded view that pulls the stages apart, and back."),
  fn("reset", "Clear the pad back to the start."),
  fn("back_to_pad", "Bring the rocket back to the launch pad, still built: during a flight, from space, or after it lands."),
];

const verdictSummary = (v: Verdict) => ({
  feasible: v.feasible,
  deltaV_ms: Math.round(v.totalDeltaV_ms),
  required_ms: Math.round(v.requiredDeltaV_ms),
  margin_ms: Math.round(v.marginDeltaV_ms),
  liftoffTWR: Number(v.liftoffTWR.toFixed(2)),
  warnings: v.warnings,
});

/** The verdict and the one fix the code would pick, as Grok should hear them. */
export const verdictReport = () => {
  const { build } = useBuildStore.getState();
  const verdict = evaluateBuild(build, catalog);
  const fix = advisorCandidates(build, verdict, catalog)[0];
  return {
    verdict: verdictSummary(verdict),
    fix: fix && fix.verdict.feasible ? { change: describeSuggestion(fix.suggestion, catalog), resultMargin_ms: Math.round(fix.verdict.marginDeltaV_ms) } : null,
  };
};

const screen = (cmd: string): void => void dispatchEvent(new CustomEvent("assembly:command", { detail: { cmd } }));
const fail = (why: string) => ({ ok: false, why });

/** Runs one tool call from Grok. Returns what Grok is told back (as JSON). */
export const runVoiceTool = (name: string, rawArgs: string): Record<string, unknown> => {
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(rawArgs || "{}") as Record<string, unknown>;
  } catch {
    return fail("arguments were not valid JSON");
  }
  const store = useBuildStore.getState();
  const { build } = store;
  const asSuggestion = (s: Suggestion) => {
    const valid = sanitizeSuggestion(s, build, catalog);
    if (!valid) return fail("that stage or part does not exist");
    store.applySuggestion(valid);
    return { ok: true, change: describeSuggestion(valid, catalog), ...verdictReport() };
  };
  switch (name) {
    case "swap_engine": {
      const swap: Suggestion = { type: "swap_engine", stageIndex: Number(args.stageIndex), engineId: String(args.engineId) };
      if (args.engineCount === undefined) return asSuggestion(swap);
      // Engine and count change together, so the screen animates one swap (never e.g. nine F-1s for a moment).
      if (!sanitizeSuggestion(swap, build, catalog)) return fail("that stage or engine does not exist");
      const next = applySuggestionToBuild(
        applySuggestionToBuild(build, swap, catalog),
        { type: "set_engine_count", stageIndex: swap.stageIndex, engineCount: Number(args.engineCount) },
        catalog,
      );
      useBuildStore.setState({ build: next });
      return { ok: true, change: `Stage ${swap.stageIndex + 1}: ${next.stages[swap.stageIndex].engineCount} x ${byId(catalog.engines, swap.engineId)?.name}`, ...verdictReport() };
    }
    case "swap_tank":
      return asSuggestion({ type: "swap_tank", stageIndex: Number(args.stageIndex), tankId: String(args.tankId) });
    case "set_engine_count":
      return asSuggestion({ type: "set_engine_count", stageIndex: Number(args.stageIndex), engineCount: Number(args.engineCount) });
    case "add_stage":
      return asSuggestion({ type: "add_stage", engineId: String(args.engineId), tankId: String(args.tankId) });
    case "remove_stage": {
      const i = Number(args.stageIndex);
      if (!build.stages[i]) return fail("that stage does not exist");
      if (build.stages.length === 1) return fail("a rocket needs at least one stage");
      store.removeStage(i);
      return { ok: true, change: `removed stage ${i + 1}`, ...verdictReport() };
    }
    case "set_payload": {
      const payload = byId(catalog.payloads, String(args.payloadId));
      if (!payload) return fail("unknown payload");
      store.setPayload(payload.id);
      return { ok: true, change: `payload is now ${payload.name}`, ...verdictReport() };
    }
    case "set_mission": {
      const mission = byId(catalog.missions, String(args.missionId));
      if (!mission) return fail("unknown mission");
      store.setMission(mission.id);
      return { ok: true, change: `mission is now ${mission.name}`, ...verdictReport() };
    }
    case "show_options": {
      const next = args.partId ? guideProgress.find((p) => p.id === String(args.partId)) : guideProgress.find((p) => !p.built);
      if (!next) return fail(args.partId ? "no part with that id" : "every part is placed; pass the partId of the part to change");
      const all = slotOptions(build, next, Infinity);
      if (all.length === 0) return fail(`the ${slotName(next)} has no choice to make`);
      const wanted = Array.isArray(args.ids) ? args.ids.map(String) : [];
      // Every option for the slot (the screen pages them), or just the ones Grok names (ids of other kinds ignored).
      const chosen = all.filter((o) => wanted.includes(o.id));
      const picked = chosen.length >= 2 ? chosen : all;
      showOnScreen(next, picked);
      return {
        ok: true,
        part: slotName(next),
        alreadyOnRocket: next.built,
        // What each part is, and whether it breaks a rule (something they can reason about). Outcomes are not
        // included on purpose: they're for peek_outcomes, when the user asks for help.
        shown: picked.map(({ id, name, about, current, works, problem }) => ({ id, name, about, current, works, problem })),
        otherIds: all.filter((o) => !picked.includes(o)).map((o) => o.id),
      };
    }
    case "peek_outcomes": {
      const next = args.partId ? guideProgress.find((p) => p.id === String(args.partId)) : guideProgress.find((p) => !p.built);
      if (!next) return fail("no part to choose");
      const all = slotOptions(build, next, Infinity);
      return {
        ok: true,
        part: slotName(next),
        outcomes: all.map(({ id, name, works, problem, finishedRocket }) => ({ id, name, works, problem, finishedRocket })),
        anyChoiceHereReachesGo: all.some((o) => o.works && o.finishedRocket.feasible),
        ...verdictReport(),
        reminder: "Hint first; the full answer only if they still want it.",
      };
    }
    case "remove_parts":
    case "place_parts":
    case "inspect_part": {
      const partId = args.partId === undefined ? undefined : String(args.partId);
      if (partId !== undefined && !guideProgress.some((p) => p.id === partId)) return fail("no part with that id");
      if (name === "inspect_part" && !guideProgress.find((p) => p.id === partId)?.built) return fail("that part is not on the rocket");
      dispatchEvent(new CustomEvent("assembly:command", { detail: { cmd: name, partId } }));
      return { ok: true, change: `screen: ${name.replace("_", " ")}${partId ? ` (${partId})` : ""}` };
    }
    case "reset_view":
      screen(name);
      return { ok: true };
    case "hide_options":
      screen("hide_options");
      return { ok: true };
    case "build_next":
    case "build_all":
    case "explode":
    case "reset":
    case "back_to_pad":
    case "hide_twin":
    case "see_through":
    case "save_card":
    case "play_story":
      screen(name);
      return { ok: true, change: `screen: ${name.replaceAll("_", " ")}` };
    case "launch":
    case "show_twin":
      screen(name);
      return { ok: true, change: `screen: ${name.replace("_", " ")}`, note: "the result arrives as an event; react to it then" };
    case "switch_rocket": {
      const presetId = String(args.presetId);
      if (!presetIds.includes(presetId)) return fail("unknown rocket");
      dispatchEvent(new CustomEvent("assembly:command", { detail: { cmd: "switch_rocket", presetId, built: args.built !== false } }));
      return { ok: true, change: `loaded ${getPreset(presetId)?.name ?? presetId}${args.built === false ? " as an empty pad" : ""}` };
    }
    case "render_image":
      if (guideProgress.length === 0 || guideProgress.some((p) => !p.built)) return fail("finish building the rocket first");
      dispatchEvent(new CustomEvent("grok:render"));
      return { ok: true, note: "rendering; it appears on screen in 15 to 45 seconds" };
    default:
      return fail(`unknown tool ${name}`);
  }
};

// ---------- guided build: walk through the parts one at a time ----------

/** One part as the screen reports it, in build order. */
export interface BuildPart {
  id: string;
  kind: "engines" | "tank" | "interstage" | "payload" | "fairing" | string;
  stageIndex: number | null;
  recordId: string | null;
  built: boolean;
}
export type BuildProgress = BuildPart[];

const OPTIONS_SHOWN = 3;

// The screen's latest progress, so show_options knows which part is next (set by the Grok panel).
let guideProgress: BuildProgress = [];
export const setGuideProgress = (progress: BuildProgress): void => {
  guideProgress = progress;
};
const ROLE: Record<string, string> = {
  engines: "the engines, which make the thrust",
  tank: "the tank, which holds the propellant the engines burn",
  interstage: "the interstage, the ring that joins one stage to the next",
  payload: "the payload, what the rocket is actually carrying",
  fairing: "the fairing, the nose cone that protects the payload through the air",
};

const kg = (v: number): string => `${Math.round(v).toLocaleString("en-US")} kg`;
const blocking = (v: Verdict): string[] => v.warnings.filter((w) => w !== TWR_LOW_WARNING);

export interface SlotOption {
  id: string;
  name: string;
  /** For engines: how many of them this option uses (as many as fit, up to the current count). */
  engineCount?: number;
  about: string;
  /** A few words on what it is (shown on screen; never whether it wins). */
  trait: string;
  current: boolean;
  /** False when it breaks a rule; `problem` says why in plain words. Still allowed: that's how you learn. */
  works: boolean;
  problem?: string;
  finishedRocket: { feasible: boolean; margin_ms: number; liftoffTWR: number };
}

// The physics' blocking warnings, in words a 13-year-old gets (the exact warning goes to Grok too).
const PLAIN_PROBLEM: [RegExp, string][] = [
  [/propellant differ/, "wrong fuel for this tank"],
  [/vacuum-only/, "can't work at sea level"],
  [/don't fit/, "too many to fit"],
  [/engine count/, "not a valid engine count"],
  [/dry mass/, "tank too flimsy"],
  [/TWR below 1\.0/, "too heavy to lift off"],
];
export const plainProblem = (warning: string): string => PLAIN_PROBLEM.find(([re]) => re.test(warning))?.[1] ?? warning;

/**
 * Every record that can go in one slot, with what each does to the finished rocket. Options that break a rule
 * are kept (works: false + why): learning what fails is the point. Order: current, working by margin, broken.
 */
export const slotOptions = (build: BuildState, part: BuildPart, limit = OPTIONS_SHOWN): SlotOption[] => {
  const i = part.stageIndex ?? 0;
  const stage = build.stages[i];
  // Each candidate is evaluated first; problems are blamed on this slot only if this slot causes or can fix them.
  const candidates: { next: BuildState; id: string; name: string; about: string; trait: string; sortKey: number; engineCount?: number }[] = [];
  const consider = (next: BuildState, id: string, name: string, about: string, trait: string, sortKey: number, engineCount?: number): void => {
    candidates.push({ next, id, name, about, trait, sortKey, engineCount });
  };
  if (part.kind === "engines" && stage) {
    const tank = byId(catalog.tanks, stage.tankId);
    catalog.engines.forEach((e) => {
      const count = tank ? Math.min(stage.engineCount, maxEngineCount(tank.diameter_m, e.diameter_m)) : stage.engineCount;
      consider(
        { ...build, stages: build.stages.map((st, j) => (j === i ? { ...st, engineId: e.id, engineCount: count } : st)) },
        e.id,
        e.name,
        `${count} x ${e.name}: ${e.propellant}, ${i === 0 ? `${Math.round(e.thrustSL_kN)} kN at sea level` : `${Math.round(e.thrustVac_kN)} kN in vacuum`} each, efficiency (Isp) ${Math.round(i === 0 ? e.ispSL_s : e.ispVac_s)} s`,
        `${e.propellant} · ${Math.round(i === 0 && e.thrustSL_kN > 0 ? e.thrustSL_kN : e.thrustVac_kN).toLocaleString("en-US")} kN${i === 0 && e.thrustSL_kN <= 0 ? " (vacuum)" : ""}`,
        e.thrustSL_kN > 0 ? e.thrustSL_kN : e.thrustVac_kN,
        count,
      );
    });
  } else if (part.kind === "tank" && stage) {
    catalog.tanks.forEach((t) =>
      consider(
        { ...build, stages: build.stages.map((st, j) => (j === i ? { ...st, tankId: t.id } : st)) },
        t.id,
        t.name,
        `${t.propellant}, holds ${kg(t.propellantMass_kg)} of propellant, ${t.diameter_m} m wide`,
        `${t.propellant} · ${Math.round(t.propellantMass_kg / 1000).toLocaleString("en-US")} t of fuel`,
        t.propellantMass_kg,
      ),
    );
  } else if (part.kind === "payload") {
    catalog.payloads.forEach((p) =>
      consider({ ...build, payloadId: p.id }, p.id, p.name, `${kg(p.mass_kg)}`, `${(p.mass_kg / 1000).toFixed(1)} t`, p.mass_kg),
    );
  }
  const before = new Set(blocking(evaluateBuild(build, catalog)));
  const verdicts = candidates.map((c) => evaluateBuild(c.next, catalog));
  // A problem the rocket already has belongs to this slot if some choice here makes it go away.
  const fixableHere = new Set([...before].filter((w) => verdicts.some((v) => !blocking(v).includes(w))));
  const options: SlotOption[] = candidates.map((c, k) => {
    const v = verdicts[k];
    const mine = blocking(v).find((w) => !before.has(w) || fixableHere.has(w));
    return {
      id: c.id,
      name: c.name,
      ...(c.engineCount === undefined ? {} : { engineCount: c.engineCount }),
      about: c.about,
      trait: c.trait,
      current: c.id === part.recordId,
      works: !mine,
      ...(mine ? { problem: plainProblem(mine) } : {}),
      finishedRocket: { feasible: v.feasible, margin_ms: Math.round(v.marginDeltaV_ms), liftoffTWR: Number(v.liftoffTWR.toFixed(2)) },
    };
  });
  // Neutral order (by the slot's main property, like a parts catalog), never "best first": choosing is theirs.
  const order = new Map(candidates.map((c) => [c.id, c.sortKey]));
  return [...options].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)).slice(0, limit);
};


/** Shows options on the assembly screen as the real parts (prototype optionShelf). */
const showOnScreen = (part: BuildPart, options: SlotOption[]): void =>
  void dispatchEvent(
    new CustomEvent("assembly:command", {
      detail: {
        cmd: "show_options",
        partId: part.id,
        built: part.built,
        options: options.map((o) => ({
          recordId: o.id,
          engineCount: o.engineCount,
          title: o.engineCount && o.engineCount > 1 ? `${o.engineCount} × ${o.name}` : o.name,
          effect: `${o.trait}${o.current ? " · current" : ""}`,
        })),
      },
    }),
  );

export const slotName = (part: BuildPart): string =>
  part.stageIndex === null ? part.kind : `stage ${part.stageIndex + 1} ${part.kind === "engines" ? "engines" : part.kind}`;

const placedName = (part: BuildPart): string => {
  const record =
    part.kind === "engines"
      ? byId(catalog.engines, part.recordId ?? "")?.name
      : part.kind === "tank"
        ? byId(catalog.tanks, part.recordId ?? "")?.name
        : part.kind === "payload"
          ? byId(catalog.payloads, part.recordId ?? "")?.name
          : null;
  return `${slotName(part)}${record ? ` (${record})` : ""}`;
};

/**
 * What Grok is told for one step of the guided build: what was just placed, what comes next and, for a slot with
 * a choice, the options the code allows. Null when there is nothing to guide (empty, or the rocket is complete).
 */
export const guideEvent = (progress: BuildProgress, justPlaced: BuildPart | null): string | null => {
  const next = progress.find((p) => !p.built);
  if (!next) return null; // complete: the verdict event takes over
  const { build } = useBuildStore.getState();
  const step = `${progress.filter((p) => p.built).length + 1} of ${progress.length}`;
  const placed = justPlaced ? `${placedName(justPlaced)} was just placed. ` : "";
  const role = ROLE[next.kind] ?? next.kind;
  const hasChoice = slotOptions(build, next, 1).length > 0; // false only for connector parts (no records)
  if (!hasChoice) {
    return `(Event: guided build. ${placed}NEXT, step ${step}: ${slotName(next)}, ${role}. There is no choice to make: say one short line about it, then call build_next.)`;
  }
  return `(Event: guided build. ${placed}NEXT, step ${step}: ${slotName(next)}, ${role}. Keep it short: if something was just placed, a few words on what it does; then move on to choosing this part together, calling show_options as you bring up the choices. Let them reason and pick; do not say which is best. Do not build yet.)`;
};

const withId = (part: BuildPart): string => `${placedName(part)} [${part.id}]`;

/** What is physically on the screen right now, in words, so Grok never talks about parts that aren't there. */
export const screenSummary = (progress: BuildProgress): string => {
  if (progress.length === 0) return "SCREEN: the launch pad is loading; nothing is built yet.";
  const placed = progress.filter((p) => p.built);
  const todo = progress.filter((p) => !p.built);
  if (placed.length === 0) {
    return `SCREEN: the launch pad is EMPTY. Nothing is built and the user has not chosen anything yet. The ROCKET PLAN below is only the starter blueprint the app loaded by default, not their choice; none of it is on the pad. Its parts, bottom up: ${progress.map(withId).join(", ")}.`;
  }
  if (todo.length === 0) return `SCREEN: the whole rocket is built and standing on the pad: ${placed.map(withId).join(", ")}.`;
  return `SCREEN: ${placed.length} of ${progress.length} parts are on the pad: ${placed.map(withId).join(", ")}. Not built yet: ${todo.map(withId).join(", ")}.`;
};

/** The user tapped a part on the option shelf: swap it in (checked like a tool call); a next part is then placed. */
export const choosePicked = (part: BuildPart, pick: { recordId: string; engineCount?: number }): void => {
  if (pick.recordId !== part.recordId || (pick.engineCount !== undefined && part.kind === "engines")) {
    const stageIndex = part.stageIndex ?? 0;
    if (part.kind === "engines") {
      runVoiceTool("swap_engine", JSON.stringify({ stageIndex, engineId: pick.recordId, engineCount: pick.engineCount }));
    } else if (part.kind === "tank") {
      runVoiceTool("swap_tank", JSON.stringify({ stageIndex, tankId: pick.recordId }));
    } else if (part.kind === "payload") {
      runVoiceTool("set_payload", JSON.stringify({ payloadId: pick.recordId }));
    }
  }
  if (!part.built) screen("build_next");
};
