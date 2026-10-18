import { resetGuard } from "@/lib/ai/guard";
import { POST as realtime } from "@/app/api/realtime/route";
import { loadCatalog } from "@/lib/physics/catalog";
import { evaluateBuild } from "@/lib/physics/feasibility";
import { DEMO_BUILD, useBuildStore } from "@/store/buildStore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { choosePicked, guideEvent, runVoiceTool, screenSummary, setGuideProgress, slotOptions, VOICE_TOOLS, type BuildProgress } from "./voiceTools";

// Requests as the app's own page sends them (the AI routes refuse anything else).
const SAME_SITE = { origin: "http://test", host: "test" };

beforeEach(() => {
  resetGuard();
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

  it("swaps an engine and its count as one change", () => {
    const seen: number[] = [];
    const unsub = useBuildStore.subscribe(({ build }) => seen.push(build.stages[0].engineCount));
    const out = runVoiceTool("swap_engine", JSON.stringify({ stageIndex: 0, engineId: "f-1", engineCount: 1 }));
    unsub();
    expect(out.ok).toBe(true);
    expect(seen).toEqual([1]); // one update, never 9 x F-1 in between
    expect(useBuildStore.getState().build.stages[0]).toMatchObject({ engineId: "f-1", engineCount: 1 });
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
  const post = (token: boolean, origin = "http://test"): Request =>
    new Request("http://test/api/realtime", {
      method: "POST",
      headers: { origin, host: "test", ...(token ? { "x-grok-token": "1" } : {}) },
      body: JSON.stringify({ build: DEMO_BUILD, verdict, token }),
    });

  it("gives instructions that explain the screen and list valid ids", async () => {
    const body = (await (await realtime(post(false))).json()) as { instructions: string; keyterms: string[] };
    expect(body.instructions).toContain("NO-GO");
    expect(body.instructions).toContain("ENGINE IDS: ");
    expect(body.instructions).toContain("Moon transfer");
    expect(body.keyterms).toContain("RL10C-1");
  });

  it("carries the conversation so far, so a new session continues it", async () => {
    const req = new Request("http://test/api/realtime", {
      method: "POST",
      headers: SAME_SITE,
      body: JSON.stringify({ build: DEMO_BUILD, verdict, history: [{ role: "user", text: "I want to go to Mars" }, { role: "grok", text: "Mars it is!" }] }),
    });
    const body = (await (await realtime(req)).json()) as { instructions: string };
    expect(body.instructions).toContain("CONVERSATION SO FAR");
    expect(body.instructions).toContain("User: I want to go to Mars");
  });

  it("refuses to make tokens for other sites", async () => {
    vi.stubEnv("XAI_API_KEY", "test-key");
    expect((await realtime(post(true, "https://evil.example"))).status).toBe(403);
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

  it("offers every engine for the bottom stage in a neutral order, current marked, broken ones explained", () => {
    const options = slotOptions(DEMO_BUILD, parts(0)[0], Infinity);
    expect(options).toHaveLength(loadCatalog().engines.length);
    expect(options.find((o) => o.current)).toMatchObject({ id: "merlin-1d", finishedRocket: { feasible: false, margin_ms: -905 } });
    const vacuumOnly = loadCatalog().engines.filter((e) => e.thrustSL_kN <= 0).map((e) => e.id);
    // vacuum-only engines are offered on stage 1 too, marked as not working there, so kids learn why
    expect(options.filter((o) => vacuumOnly.includes(o.id)).every((o) => !o.works && Boolean(o.problem))).toBe(true);
    expect(options.find((o) => o.id === "merlin-1d-vac")?.problem).toBe("can't work at sea level"); // same fuel, so that's the reason
  });

  it("orders options like a parts catalog, never best first", () => {
    const tanks = slotOptions(DEMO_BUILD, parts(1)[1], Infinity);
    const fuel = tanks.map((o) => loadCatalog().tanks.find((t) => t.id === o.id)!.propellantMass_kg);
    expect(fuel).toEqual([...fuel].sort((a, b) => a - b));
    expect(tanks.every((o) => o.trait.includes("t of fuel"))).toBe(true);
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

describe("show_options tool", () => {
  const progress: BuildProgress = [
    { id: "s0-engines", kind: "engines", stageIndex: 0, recordId: "merlin-1d", built: true },
    { id: "s0-tank", kind: "tank", stageIndex: 0, recordId: "falcon9-s1-tank", built: false },
  ];

  it("shows every option on screen with what the part is, not whether it wins", () => {
    setGuideProgress(progress);
    const out = runVoiceTool("show_options", "{}");
    expect(out).toMatchObject({ ok: true, part: "stage 1 tank" });
    expect((out.shown as unknown[]).length).toBe(loadCatalog().tanks.length);
    const sent = (dispatchEvent as unknown as { mock: { calls: [CustomEvent][] } }).mock.calls.at(-1)![0];
    expect(sent.detail).toMatchObject({ cmd: "show_options", partId: "s0-tank" });
    const current = sent.detail.options.find((o: { recordId: string }) => o.recordId === "falcon9-s1-tank");
    expect(current.effect).toBe("kerolox · 410 t of fuel · current");
    expect(sent.detail.options.some((o: { effect: string }) => /GO|WON'T/.test(o.effect))).toBe(false);
  });

  it("lets Grok pick which options to show, including ones that won't work, with the reason", () => {
    setGuideProgress(progress);
    const some = runVoiceTool("show_options", JSON.stringify({ ids: ["atlas-v-ccb-tank", "centaur-iii-tank"] }));
    const shown = some.shown as { id: string; works: boolean; problem?: string }[];
    expect(shown.map((o) => o.id).sort()).toEqual(["atlas-v-ccb-tank", "centaur-iii-tank"]);
    expect(shown.find((o) => o.id === "centaur-iii-tank")).toMatchObject({ works: false, problem: "wrong fuel for this tank" });
    expect(shown.find((o) => o.id === "atlas-v-ccb-tank")).toMatchObject({ works: true });
  });


  it("puts the options Grok names first, so what it talks about is on the first page", () => {
    setGuideProgress(progress);
    const tanks = loadCatalog().tanks.map((t) => t.id);
    const named = tanks.slice(-2).reverse(); // two from the end of the catalog order
    runVoiceTool("show_options", JSON.stringify({ ids: named }));
    const sent = (dispatchEvent as unknown as { mock: { calls: [CustomEvent][] } }).mock.calls.at(-1)![0];
    const order = sent.detail.options.map((o: { recordId: string }) => o.recordId);
    expect(order.slice(0, 2)).toEqual(named);
    expect(order[2]).toBe("falcon9-s1-tank"); // then the part already chosen
    expect(order).toHaveLength(tanks.length); // and still every option, a page further on
  });

  it("labels engines with fuel, push and efficiency in words, and flags rule breakers", () => {
    setGuideProgress([{ id: "s0-engines", kind: "engines", stageIndex: 0, recordId: "merlin-1d", built: false }]);
    runVoiceTool("show_options", "{}");
    const sent = (dispatchEvent as unknown as { mock: { calls: [CustomEvent][] } }).mock.calls.at(-1)![0];
    const shown: { recordId: string; name: string; effect: string; warn?: string; more: string }[] = sent.detail.options;
    expect(shown.every((o) => /^\w+ · [\d,]+ kN push( each)? · (efficient|average|thirsty)/.test(o.effect))).toBe(true);
    expect(shown.every((o) => o.name && /^fuel efficiency \(Isp\) \d+ s · weighs [\d.,]+ (kg|t)( each)? · [\d.]+ m wide$/.test(o.more))).toBe(true);
    const broken = slotOptions(DEMO_BUILD, { id: "s0-engines", kind: "engines", stageIndex: 0, recordId: "merlin-1d", built: false }, Infinity).filter((o) => !o.works);
    expect(broken.length).toBeGreaterThan(0);
    for (const o of broken) expect(shown.find((s) => s.recordId === o.id)?.warn).toBe(o.problem);
  });

  it("says so when there is nothing to choose", () => {
    setGuideProgress(progress.map((p) => ({ ...p, built: true })));
    expect(runVoiceTool("show_options", "{}").ok).toBe(false);
  });
});

describe("full control of the build", () => {
  const progress: BuildProgress = [
    { id: "s0-engines", kind: "engines", stageIndex: 0, recordId: "merlin-1d", built: true },
    { id: "s0-tank", kind: "tank", stageIndex: 0, recordId: "falcon9-s1-tank", built: true },
    { id: "s0-interstage", kind: "interstage", stageIndex: 0, recordId: null, built: false },
  ];
  const lastCommand = () => (dispatchEvent as unknown as { mock: { calls: [CustomEvent][] } }).mock.calls.at(-1)![0].detail;

  it("takes parts off and puts them back by part id", () => {
    setGuideProgress(progress);
    expect(runVoiceTool("remove_parts", JSON.stringify({ partId: "s0-engines" })).ok).toBe(true);
    expect(lastCommand()).toEqual({ cmd: "remove_parts", partId: "s0-engines" });
    expect(runVoiceTool("place_parts", "{}").ok).toBe(true);
    expect(lastCommand()).toEqual({ cmd: "place_parts", partId: undefined });
    expect(runVoiceTool("remove_parts", JSON.stringify({ partId: "nope" })).ok).toBe(false);
  });

  it("only inspects parts that are on the rocket", () => {
    setGuideProgress(progress);
    expect(runVoiceTool("inspect_part", JSON.stringify({ partId: "s0-tank" })).ok).toBe(true);
    expect(runVoiceTool("inspect_part", JSON.stringify({ partId: "s0-interstage" })).ok).toBe(false);
  });

  it("shows choices for a part already on the rocket, to go back and swap it", () => {
    setGuideProgress(progress);
    const out = runVoiceTool("show_options", JSON.stringify({ partId: "s0-tank" }));
    expect(out).toMatchObject({ ok: true, alreadyOnRocket: true, part: "stage 1 tank" });
    expect(lastCommand()).toMatchObject({ cmd: "show_options", partId: "s0-tank", built: true });
  });

  it("swaps a placed part in place when it is picked, without placing another", () => {
    setGuideProgress(progress);
    choosePicked(progress[1], { recordId: "atlas-v-ccb-tank" });
    expect(useBuildStore.getState().build.stages[0].tankId).toBe("atlas-v-ccb-tank");
    const sent = (dispatchEvent as unknown as { mock: { calls: [CustomEvent][] } }).mock.calls.map(([e]) => e.detail?.cmd);
    expect(sent).not.toContain("build_next");
  });

  it("tells Grok the part ids on screen", () => {
    expect(screenSummary(progress)).toContain("stage 1 tank (Falcon 9 Block 5 first-stage tank) [s0-tank]");
  });
});

describe("options blame only the part that causes a problem (Falcon 9 to the Moon)", () => {
  const falcon9ToMoon = {
    ...DEMO_BUILD,
    missionId: "moon-transfer",
    payloadId: "goes-r",
    stages: [
      { engineId: "merlin-1d", engineCount: 9, tankId: "falcon9-s1-tank" },
      { engineId: "merlin-1d-vac", engineCount: 1, tankId: "falcon9-s2-tank" },
    ],
  };
  const stage2Engines: BuildProgress[number] = { id: "s1-engines", kind: "engines", stageIndex: 1, recordId: "merlin-1d-vac", built: false };

  it("does not mark the real Falcon 9 upper-stage engine as won't fly", () => {
    const merlinVac = slotOptions(falcon9ToMoon, stage2Engines, Infinity).find((o) => o.id === "merlin-1d-vac");
    expect(merlinVac).toMatchObject({ current: true, works: true });
  });

  it("keeps outcomes out of show_options; peek_outcomes has them and the fix elsewhere", () => {
    useBuildStore.setState({ build: falcon9ToMoon });
    setGuideProgress([
      { id: "s0-engines", kind: "engines", stageIndex: 0, recordId: "merlin-1d", built: true },
      { id: "s0-tank", kind: "tank", stageIndex: 0, recordId: "falcon9-s1-tank", built: true },
      stage2Engines,
    ]);
    expect(runVoiceTool("show_options", "{}").shown).not.toContainEqual(expect.objectContaining({ finishedRocket: expect.anything() }));
    const peek = runVoiceTool("peek_outcomes", "{}");
    expect(peek.anyChoiceHereReachesGo).toBe(false);
    expect(peek.fix).toMatchObject({ resultMargin_ms: expect.any(Number) });
  });
});
