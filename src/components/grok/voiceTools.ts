// Owner: P3. The tools Grok may call in the live voice session, and the code that runs them. Grok only asks;
// this code checks every id against the catalog, makes the change through the store (or the screen), and
// returns the new verdict from the physics code, so the numbers Grok says next are the code's numbers.
import { advisorCandidates, describeSuggestion } from "@/lib/ai/prompts";
import { sanitizeSuggestion } from "@/lib/ai/schemas";
import { byId, loadCatalog } from "@/lib/physics/catalog";
import { evaluateBuild, isVacuumOnly, maxEngineCount } from "@/lib/physics/feasibility";
import { useBuildStore } from "@/store/buildStore";
import type { BuildState, Suggestion, Verdict } from "@/types";

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
  fn("build_next", "Place the next part on the rocket (one step of the guided build)."),
  fn("build_all", "Animate the whole rocket being stacked on the pad."),
  fn("explode", "Toggle the exploded view that pulls the stages apart, and back."),
  fn("reset", "Clear the pad back to the start."),
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
  const asSuggestionAfterSwap = (s: Suggestion) => {
    const valid = sanitizeSuggestion(s, useBuildStore.getState().build, catalog);
    if (!valid) return fail("that stage does not exist");
    useBuildStore.getState().applySuggestion(valid);
    return { ok: true, change: describeSuggestion(valid, catalog), ...verdictReport() };
  };
  const asSuggestion = (s: Suggestion) => {
    const valid = sanitizeSuggestion(s, build, catalog);
    if (!valid) return fail("that stage or part does not exist");
    store.applySuggestion(valid);
    return { ok: true, change: describeSuggestion(valid, catalog), ...verdictReport() };
  };
  switch (name) {
    case "swap_engine": {
      const out = asSuggestion({ type: "swap_engine", stageIndex: Number(args.stageIndex), engineId: String(args.engineId) });
      if (!out.ok || args.engineCount === undefined) return out;
      return asSuggestionAfterSwap({ type: "set_engine_count", stageIndex: Number(args.stageIndex), engineCount: Number(args.engineCount) });
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
    case "build_next":
    case "build_all":
    case "explode":
    case "reset":
      screen(name);
      return { ok: true, change: `screen: ${name.replace("_", " ")}` };
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
const ROLE: Record<string, string> = {
  engines: "the engines, which make the thrust",
  tank: "the tank, which holds the propellant the engines burn",
  interstage: "the interstage, the ring that joins one stage to the next",
  payload: "the payload, what the rocket is actually carrying",
  fairing: "the fairing, the nose cone that protects the payload through the air",
};

const kg = (v: number): string => `${Math.round(v).toLocaleString("en-US")} kg`;
const blocking = (v: Verdict): string[] => v.warnings.filter((w) => w !== "liftoff TWR below 1.2");

interface SlotOption {
  id: string;
  name: string;
  /** For engines: how many of them this option uses (as many as fit, up to the current count). */
  engineCount?: number;
  about: string;
  current: boolean;
  finishedRocket: { feasible: boolean; margin_ms: number; liftoffTWR: number };
}

/** The options for one slot that actually work there, with what each does to the finished rocket. Code picks. */
export const slotOptions = (build: BuildState, part: BuildPart): SlotOption[] => {
  const i = part.stageIndex ?? 0;
  const stage = build.stages[i];
  const tryBuild = (next: BuildState, id: string, name: string, about: string, engineCount?: number): SlotOption | null => {
    const v = evaluateBuild(next, catalog);
    if (blocking(v).length > 0) return null; // would break a rule: not offered as an option
    return {
      id,
      name,
      ...(engineCount === undefined ? {} : { engineCount }),
      about,
      current: id === part.recordId,
      finishedRocket: { feasible: v.feasible, margin_ms: Math.round(v.marginDeltaV_ms), liftoffTWR: Number(v.liftoffTWR.toFixed(2)) },
    };
  };
  let options: (SlotOption | null)[] = [];
  if (part.kind === "engines" && stage) {
    const tank = byId(catalog.tanks, stage.tankId);
    options = catalog.engines
      .filter((e) => !(i === 0 && isVacuumOnly(e)))
      .map((e) => {
        const count = tank ? Math.min(stage.engineCount, maxEngineCount(tank.diameter_m, e.diameter_m)) : stage.engineCount;
        return tryBuild(
          { ...build, stages: build.stages.map((st, j) => (j === i ? { ...st, engineId: e.id, engineCount: count } : st)) },
          e.id,
          e.name,
          `${count} x ${e.name}: ${e.propellant}, ${i === 0 ? `${Math.round(e.thrustSL_kN)} kN at sea level` : `${Math.round(e.thrustVac_kN)} kN in vacuum`} each, efficiency (Isp) ${Math.round(i === 0 ? e.ispSL_s : e.ispVac_s)} s`,
          count,
        );
      });
  } else if (part.kind === "tank" && stage) {
    options = catalog.tanks.map((t) =>
      tryBuild(
        { ...build, stages: build.stages.map((st, j) => (j === i ? { ...st, tankId: t.id } : st)) },
        t.id,
        t.name,
        `${t.propellant}, holds ${kg(t.propellantMass_kg)} of propellant, ${t.diameter_m} m wide`,
      ),
    );
  } else if (part.kind === "payload") {
    options = catalog.payloads.map((p) => tryBuild({ ...build, payloadId: p.id }, p.id, p.name, `${kg(p.mass_kg)}`));
  }
  const valid = options.filter((o): o is SlotOption => o !== null);
  const current = valid.filter((o) => o.current);
  const others = valid
    .filter((o) => !o.current)
    .sort((a, b) => Number(b.finishedRocket.feasible) - Number(a.finishedRocket.feasible) || b.finishedRocket.margin_ms - a.finishedRocket.margin_ms);
  return [...current, ...others].slice(0, OPTIONS_SHOWN);
};

const slotName = (part: BuildPart): string =>
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
  const options = slotOptions(build, next);
  if (options.length === 0) {
    return `(Event: guided build. ${placed}NEXT, step ${step}: ${slotName(next)}, ${role}. There is no choice to make: say one short line about it, then call build_next.)`;
  }
  return `(Event: guided build. ${placed}NEXT, step ${step}: ${slotName(next)}, ${role}. OPTIONS (finishedRocket = what the whole rocket would do with this choice): ${JSON.stringify(options)}. Keep it short: if something was just placed, one sentence on what it does in plain words; then offer these options (name plus a few words each) and ask which one they want. Do not build yet.)`;
};

/** What is physically on the screen right now, in words, so Grok never talks about parts that aren't there. */
export const screenSummary = (progress: BuildProgress): string => {
  if (progress.length === 0) return "SCREEN: the launch pad is loading; nothing is built yet.";
  const placed = progress.filter((p) => p.built);
  const todo = progress.filter((p) => !p.built);
  if (placed.length === 0) {
    return `SCREEN: the launch pad is EMPTY. Nothing is built yet. The ROCKET PLAN below is the blueprint for this rocket (${progress.length} parts); none of it is standing on the pad.`;
  }
  if (todo.length === 0) return "SCREEN: the whole rocket is built and standing on the pad.";
  return `SCREEN: ${placed.length} of ${progress.length} parts are on the pad: ${placed.map(placedName).join(", ")}. Not built yet: ${todo.map(placedName).join(", ")}.`;
};
