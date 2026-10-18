import { POST as realtime } from "@/app/api/realtime/route";
import { loadCatalog } from "@/lib/physics/catalog";
import { evaluateBuild } from "@/lib/physics/feasibility";
import { DEMO_BUILD, useBuildStore } from "@/store/buildStore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { guideEvent, runVoiceTool, screenSummary, slotOptions, VOICE_TOOLS, type BuildProgress } from "./voiceTools";

beforeEach(() => {
  useBuildStore.setState({ build: DEMO_BUILD });
  vi.stubGlobal("dispatchEvent", vi.fn());
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("voice tools", () => {
  it("only offers real ids to Grok", () => {
    const addStage = VOICE_TOOLS.find((t) => t.name === "add_stage");
    const engines = (addStage?.parameters.properties as { engineId: { enum: string[] } }).engineId.enum;
    expect(engines).toEqual(loadCatalog().engines.map((e) => e.id));
  });

  it("applies a valid change and returns the physics' new verdict", () => {
    const out = runVoiceTool("add_stage", JSON.stringify({ engineId: "rl10c-1", tankId: "centaur-iii-tank" }));
    expect(out.ok).toBe(true);
    expect(useBuildStore.getState().build.stages).toHaveLength(3);
    expect(out.verdict).toMatchObject({ feasible: true, margin_ms: 497 });
  });

  it("refuses made-up parts and stages without changing the rocket", () => {
    expect(runVoiceTool("swap_engine", JSON.stringify({ stageIndex: 0, engineId: "raptor-99" })).ok).toBe(false);
    expect(runVoiceTool("remove_stage", JSON.stringify({ stageIndex: 7 })).ok).toBe(false);
    expect(runVoiceTool("nonsense", "{}").ok).toBe(false);
    expect(runVoiceTool("swap_tank", "not json").ok).toBe(false);
    expect(useBuildStore.getState().build).toEqual(DEMO_BUILD);
  });

  it("never removes the last stage", () => {
    useBuildStore.setState({ build: { ...DEMO_BUILD, stages: [DEMO_BUILD.stages[0]] } });
    expect(runVoiceTool("remove_stage", JSON.stringify({ stageIndex: 0 })).ok).toBe(false);
  });

  it("sends screen commands to the assembly screen", () => {
    expect(runVoiceTool("build_all", "{}").ok).toBe(true);
    expect(dispatchEvent).toHaveBeenCalled();
  });
});

describe("/api/realtime", () => {
  const verdict = evaluateBuild(DEMO_BUILD, loadCatalog());
  const post = (token: boolean): Request =>
    new Request("http://test/api/realtime", { method: "POST", body: JSON.stringify({ build: DEMO_BUILD, verdict, token }) });

  it("gives instructions that explain the screen and list valid ids", async () => {
    const body = (await (await realtime(post(false))).json()) as { instructions: string; keyterms: string[] };
    expect(body.instructions).toContain("NO-GO");
    expect(body.instructions).toContain("ENGINE IDS: ");
    expect(body.instructions).toContain("Moon transfer");
    expect(body.keyterms).toContain("RL10C-1");
  });

  it("returns 502 when no live token can be made", async () => {
    vi.stubEnv("XAI_API_KEY", "");
    expect((await realtime(post(true))).status).toBe(502);
  });
});

describe("guided build", () => {
  const parts = (builtCount: number): BuildProgress =>
    [
      { id: "s0-engines", kind: "engines", stageIndex: 0, recordId: "merlin-1d" },
      { id: "s0-tank", kind: "tank", stageIndex: 0, recordId: "falcon9-s1-tank" },
      { id: "s0-interstage", kind: "interstage", stageIndex: 0, recordId: null },
      { id: "s1-engines", kind: "engines", stageIndex: 1, recordId: "rl10b-2" },
      { id: "s1-tank", kind: "tank", stageIndex: 1, recordId: "dcss-5m-tank" },
      { id: "payload", kind: "payload", stageIndex: null, recordId: "jwst" },
      { id: "fairing", kind: "fairing", stageIndex: null, recordId: null },
    ].map((p, i) => ({ ...p, built: i < builtCount }));

  it("offers only engines that work on the bottom stage, current pick first, with their effect", () => {
    const options = slotOptions(DEMO_BUILD, parts(0)[0]);
    expect(options[0]).toMatchObject({ id: "merlin-1d", current: true });
    expect(options.length).toBeGreaterThan(1);
    const vacuumOnly = loadCatalog().engines.filter((e) => e.thrustSL_kN <= 0).map((e) => e.id);
    expect(options.some((o) => vacuumOnly.includes(o.id))).toBe(false);
    expect(options[0].finishedRocket).toMatchObject({ feasible: false, margin_ms: -905 });
  });

  it("offers only tanks with the engine's propellant", () => {
    const tanks = loadCatalog().tanks;
    for (const o of slotOptions(DEMO_BUILD, parts(1)[1])) {
      expect(tanks.find((t) => t.id === o.id)?.propellant).toBe("kerolox");
    }
  });

  it("walks to the next part, and has Grok just place parts with no choice", () => {
    expect(guideEvent(parts(0), null)).toContain("NEXT, step 1 of 7: stage 1 engines");
    const interstage = guideEvent(parts(2), parts(2)[1]);
    expect(interstage).toContain("stage 1 tank (Falcon 9 Block 5 first-stage tank) was just placed");
    expect(interstage).toContain("no choice");
    expect(interstage).toContain("build_next");
  });

  it("stops guiding once the rocket is complete", () => {
    expect(guideEvent(parts(7), null)).toBeNull();
  });
});

describe("screen summary", () => {
  const list = (n: number): BuildProgress =>
    ["s0-engines", "s0-tank", "payload"].map((id, i) => ({
      id,
      kind: id === "payload" ? "payload" : id.split("-")[1],
      stageIndex: id === "payload" ? null : 0,
      recordId: id === "payload" ? "jwst" : id === "s0-tank" ? "falcon9-s1-tank" : "merlin-1d",
      built: i < n,
    }));

  it("says plainly when the pad is empty", () => {
    expect(screenSummary(list(0))).toContain("the launch pad is EMPTY");
  });
  it("lists what is placed and what is not", () => {
    const s = screenSummary(list(1));
    expect(s).toContain("1 of 3 parts are on the pad: stage 1 engines (Merlin 1D)");
    expect(s).toContain("Not built yet: stage 1 tank");
  });
  it("says when the whole rocket is built", () => {
    expect(screenSummary(list(3))).toContain("whole rocket is built");
  });
});
