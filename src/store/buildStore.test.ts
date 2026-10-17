import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Catalog } from "@/lib/physics/catalog";
import type { BuildState, Engine, Tank } from "@/types";

const fixture = vi.hoisted(() => {
  const engine = (id: string, diameter_m: number): Engine => ({
    id,
    name: id,
    propellant: "kerolox",
    thrustSL_kN: 1000,
    thrustVac_kN: 1100,
    ispSL_s: 280,
    ispVac_s: 310,
    mass_kg: 500,
    diameter_m,
    source: "test fixture",
  });
  const tank = (id: string, diameter_m: number): Tank => ({
    id,
    name: id,
    propellant: "kerolox",
    diameter_m,
    height_m: 10,
    propellantMass_kg: 100000,
    dryMass_kg: 8000,
    source: "test fixture",
  });
  const catalog: Catalog = {
    engines: [engine("small", 0.92), engine("big", 2)],
    tanks: [tank("wide", 3.7), tank("narrow", 2)],
    payloads: [{ id: "sat", name: "sat", mass_kg: 1000, diameter_m: 2, height_m: 2 }],
    missions: [{ id: "leo", name: "LEO", destination: "LEO", requiredDeltaV_ms: 9300, source: "test fixture" }],
    referenceRockets: [],
  };
  return { catalog };
});

vi.mock("@/lib/physics/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/physics/catalog")>()),
  loadCatalog: () => fixture.catalog,
}));

const { DEMO_BUILD, useBuildStore } = await import("./buildStore");

const livery = { primary: "#fff", accent: "#000", stripe: false, patch: null };
const start: BuildState = {
  missionId: "leo",
  payloadId: "sat",
  livery,
  stages: [
    { engineId: "small", engineCount: 3, tankId: "wide" },
    { engineId: "small", engineCount: 1, tankId: "narrow" },
  ],
};

const store = () => useBuildStore.getState();
const stage = (i: number) => store().build.stages[i];

beforeEach(() => {
  useBuildStore.setState({ build: start });
});

describe("setEngineCount", () => {
  it("clamps to the tank fit (3.7 m tank + 0.92 m engine = 9)", () => {
    store().setEngineCount(0, 50);
    expect(stage(0).engineCount).toBe(9);
  });

  it("never goes below 1 and rounds fractional counts", () => {
    store().setEngineCount(0, 0);
    expect(stage(0).engineCount).toBe(1);
    store().setEngineCount(0, 2.6);
    expect(stage(0).engineCount).toBe(3);
  });

  it("ignores an out-of-range stage index", () => {
    store().setEngineCount(5, 4);
    expect(store().build).toEqual(start);
  });
});

describe("part swaps re-clamp the engine count", () => {
  it("setStageTank to a narrower tank lowers the count", () => {
    store().setEngineCount(0, 9);
    store().setStageTank(0, "narrow");
    expect(stage(0).tankId).toBe("narrow");
    expect(stage(0).engineCount).toBe(2); // floor(0.6 * (2 / 0.92)^2) = 2
  });

  it("setStageEngine to a wider engine lowers the count", () => {
    store().setEngineCount(0, 9);
    store().setStageEngine(0, "big");
    expect(stage(0).engineId).toBe("big");
    expect(stage(0).engineCount).toBe(2); // floor(0.6 * (3.7 / 2)^2) = 2
  });
});

describe("stages", () => {
  it("addStage appends an empty stage on top", () => {
    store().addStage();
    expect(store().build.stages).toHaveLength(3);
    expect(stage(2)).toEqual({ engineId: "", engineCount: 1, tankId: "" });
  });

  it("removeStage removes only that index", () => {
    store().removeStage(0);
    expect(store().build.stages).toEqual([start.stages[1]]);
  });
});

describe("simple setters", () => {
  it("set mission, payload and livery", () => {
    const newLivery = { primary: "#123456", accent: "#abcdef", stripe: true, patch: "moon" };
    store().setMission("moon-transfer");
    store().setPayload("other");
    store().setLivery(newLivery);
    expect(store().build.missionId).toBe("moon-transfer");
    expect(store().build.payloadId).toBe("other");
    expect(store().build.livery).toEqual(newLivery);
  });
});

describe("applySuggestion via the store", () => {
  it("ignores unknown ids", () => {
    store().applySuggestion({ type: "swap_tank", stageIndex: 0, tankId: "nope" });
    expect(store().build).toEqual(start);
  });

  it("applies a known swap", () => {
    store().applySuggestion({ type: "swap_engine", stageIndex: 1, engineId: "big" });
    expect(stage(1).engineId).toBe("big");
  });
});

describe("loadDemoBuild and reset", () => {
  it("loadDemoBuild restores the demo build", () => {
    store().loadDemoBuild();
    expect(store().build).toEqual(DEMO_BUILD);
  });

  it("reset empties the build", () => {
    store().reset();
    expect(store().build.stages).toEqual([]);
    expect(store().build.missionId).toBe("");
  });
});
