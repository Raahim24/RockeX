import { describe, expect, it } from "vitest";
import type { BuildState, Engine, Mission, Payload, ReferenceRocket, Tank } from "@/types";
import type { Catalog } from "./catalog";
import { closestRocketId } from "./closest";
import { evaluateBuild, maxEngineCount } from "./feasibility";

const livery = { primary: "#fff", accent: "#000", stripe: false, patch: null };

const engine = (partial: Partial<Engine> & Pick<Engine, "id">): Engine => ({
  name: partial.id,
  propellant: "kerolox",
  thrustSL_kN: 7000,
  thrustVac_kN: 8000,
  ispSL_s: 290,
  ispVac_s: 290,
  mass_kg: 0,
  diameter_m: 1,
  source: "test fixture",
  ...partial,
});

const tank = (partial: Partial<Tank> & Pick<Tank, "id">): Tank => ({
  name: partial.id,
  propellant: "kerolox",
  diameter_m: 3.66,
  height_m: 10,
  propellantMass_kg: 375000,
  dryMass_kg: 25000,
  source: "test fixture",
  ...partial,
});

const catalog = (overrides: Partial<Catalog> = {}): Catalog => ({
  engines: [],
  tanks: [],
  payloads: [],
  missions: [],
  referenceRockets: [],
  ...overrides,
});

const moon: Mission = {
  id: "moon-transfer",
  name: "Moon transfer",
  destination: "Moon",
  requiredDeltaV_ms: 12500,
  source: "test fixture",
};

const payload5t: Payload = { id: "p5t", name: "5 t", mass_kg: 5000, diameter_m: 4, height_m: 4 };

const demoCatalog: Catalog = catalog({
  missions: [moon],
  payloads: [payload5t],
  engines: [
    engine({ id: "s1-kerolox", ispSL_s: 290, ispVac_s: 290, thrustSL_kN: 7000 }),
    engine({
      id: "s2-kerolox",
      ispSL_s: 348,
      ispVac_s: 348,
      thrustSL_kN: 1000,
      thrustVac_kN: 1000,
    }),
    engine({
      id: "s2-hydrolox",
      propellant: "hydrolox",
      ispSL_s: 450,
      ispVac_s: 450,
      thrustSL_kN: 1000,
      thrustVac_kN: 1000,
    }),
  ],
  tanks: [
    tank({ id: "s1-wet400", propellantMass_kg: 375000, dryMass_kg: 25000 }),
    tank({ id: "s2-wet100", propellantMass_kg: 94000, dryMass_kg: 6000 }),
    tank({
      id: "s2-hydrolox",
      propellant: "hydrolox",
      propellantMass_kg: 92000,
      dryMass_kg: 8000,
    }),
  ],
});

const demoBuild = (stage2Engine: string, stage2Tank: string): BuildState => ({
  missionId: "moon-transfer",
  payloadId: "p5t",
  livery,
  stages: [
    { engineId: "s1-kerolox", engineCount: 1, tankId: "s1-wet400" },
    { engineId: stage2Engine, engineCount: 1, tankId: stage2Tank },
  ],
});

describe("evaluateBuild", () => {
  it("matches the canonical moon-transfer example within 50 m/s", () => {
    const red = evaluateBuild(demoBuild("s2-kerolox", "s2-wet100"), demoCatalog);
    expect(red.totalDeltaV_ms).toBeGreaterThanOrEqual(11560 - 50);
    expect(red.totalDeltaV_ms).toBeLessThanOrEqual(11560 + 50);
    expect(red.marginDeltaV_ms).toBeLessThan(0);
    expect(red.deltaVOk).toBe(false);
    expect(red.feasible).toBe(false);

    const green = evaluateBuild(demoBuild("s2-hydrolox", "s2-hydrolox"), demoCatalog);
    expect(green.totalDeltaV_ms).toBeGreaterThanOrEqual(13080 - 50);
    expect(green.totalDeltaV_ms).toBeLessThanOrEqual(13080 + 50);
    expect(green.marginDeltaV_ms).toBeGreaterThan(0);
    expect(green.deltaVOk).toBe(true);
    expect(green.twrOk).toBe(true);
    expect(green.feasible).toBe(true);
  });

  it("returns infeasible for an empty build without throwing", () => {
    const empty: BuildState = { missionId: "", payloadId: "", stages: [], livery };
    expect(() => evaluateBuild(empty, catalog())).not.toThrow();
    const verdict = evaluateBuild(empty, catalog());
    expect(verdict.feasible).toBe(false);
    expect(verdict.warnings).toContain("empty build");
  });

  it("returns a finite verdict for one stage and zero payload", () => {
    const oneStage: BuildState = {
      missionId: "moon-transfer",
      payloadId: "",
      livery,
      stages: [{ engineId: "s1-kerolox", engineCount: 1, tankId: "s1-wet400" }],
    };
    const verdict = evaluateBuild(oneStage, demoCatalog);
    expect(Number.isFinite(verdict.totalDeltaV_ms)).toBe(true);
    expect(Number.isFinite(verdict.liftoffTWR)).toBe(true);
    expect(Number.isFinite(verdict.totalMass_kg)).toBe(true);
    expect(verdict.stages).toHaveLength(1);
  });

  it("blocks when engine and tank propellant differ", () => {
    const mismatch: BuildState = {
      missionId: "moon-transfer",
      payloadId: "p5t",
      livery,
      stages: [{ engineId: "s1-kerolox", engineCount: 1, tankId: "s2-hydrolox" }],
    };
    const verdict = evaluateBuild(mismatch, demoCatalog);
    expect(verdict.feasible).toBe(false);
    expect(verdict.warnings).toContain("engine and tank propellant differ");
  });

  it("sets twrOk false and a blocking warning when TWR is 0.9", () => {
    const twrCatalog = catalog({
      missions: [moon],
      engines: [engine({ id: "weak", thrustSL_kN: 88.25985, ispSL_s: 300, ispVac_s: 300 })],
      tanks: [tank({ id: "small", propellantMass_kg: 9000, dryMass_kg: 400 })],
      payloads: [{ id: "p600", name: "600 kg", mass_kg: 600, diameter_m: 1, height_m: 1 }],
    });
    const build: BuildState = {
      missionId: "moon-transfer",
      payloadId: "p600",
      livery,
      stages: [{ engineId: "weak", engineCount: 1, tankId: "small" }],
    };
    const verdict = evaluateBuild(build, twrCatalog);
    expect(verdict.liftoffTWR).toBeCloseTo(0.9, 2);
    expect(verdict.twrOk).toBe(false);
    expect(verdict.feasible).toBe(false);
    expect(verdict.warnings).toContain("liftoff TWR below 1.0");
  });

  it("picks Falcon 9 for a Falcon-9-sized build", () => {
    const refs: ReferenceRocket[] = [
      {
        id: "falcon-9",
        name: "Falcon 9",
        liftoffMass_kg: 549000,
        liftoffThrust_kN: 7600,
        payloadLEO_kg: 1,
        stages: 2,
        source: "test fixture",
      },
      {
        id: "n1",
        name: "N1",
        liftoffMass_kg: 2750000,
        liftoffThrust_kN: 45000,
        payloadLEO_kg: 1,
        stages: 5,
        source: "test fixture",
      },
    ];
    expect(closestRocketId(549000, 7600, refs)).toBe("falcon-9");

    const f9Catalog = catalog({
      missions: [moon],
      referenceRockets: refs,
      engines: [engine({ id: "f9e", thrustSL_kN: 7600, mass_kg: 0 })],
      tanks: [tank({ id: "f9t", propellantMass_kg: 500000, dryMass_kg: 49000 })],
    });
    const build: BuildState = {
      missionId: "moon-transfer",
      payloadId: "",
      livery,
      stages: [{ engineId: "f9e", engineCount: 1, tankId: "f9t" }],
    };
    expect(evaluateBuild(build, f9Catalog).closestRocketId).toBe("falcon-9");
  });
});

describe("maxEngineCount", () => {
  it("allows 9 engines on a 3.66 m tank with a Merlin-sized engine", () => {
    expect(maxEngineCount(3.66, 0.945)).toBe(9);
  });
});
