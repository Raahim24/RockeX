import { describe, expect, it } from "vitest";
import type { BuildState } from "@/types";
import { clusterPositions, computeStackLayout, FALLBACK } from "./geometry";

const livery = { primary: "#ffffff", accent: "#000000", stripe: false, patch: null };
const emptyCatalog = { engines: [], tanks: [], payloads: [] };

const twoStage: BuildState = {
  missionId: "m",
  stages: [
    { engineId: "a", engineCount: 9, tankId: "t1" },
    { engineId: "b", engineCount: 1, tankId: "t2" },
  ],
  payloadId: "p",
  livery,
};

describe("clusterPositions", () => {
  it("gives 1 center engine, 3 in a ring, and 9 as 8 ring plus center", () => {
    expect(clusterPositions(1, 2, 1)).toEqual([[0, 0]]);
    expect(clusterPositions(3, 2, 0.8)).toHaveLength(3);
    const nine = clusterPositions(9, 2, 0.5);
    expect(nine).toHaveLength(9);
    expect(nine[0]).toEqual([0, 0]);
  });

  it("never overlaps bells in a ring", () => {
    for (const n of [2, 3, 4, 5, 6, 7, 8, 9]) {
      const R = 2;
      const factor = n <= 3 ? 0.4 : n <= 6 ? 0.3 : 0.24;
      const r = R * factor;
      const pts = clusterPositions(n, R, r);
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++)
          expect(Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1])).toBeGreaterThanOrEqual(2 * r);
    }
  });
});

describe("computeStackLayout", () => {
  it("stacks parts by summed heights with no gaps", () => {
    const l = computeStackLayout(twoStage, emptyCatalog);
    const [s0, s1] = l.stages;
    expect(s0.engineY_m).toBe(0);
    expect(s0.tankY_m).toBeCloseTo(s0.engineHeight_m);
    expect(s1.interstage?.y_m).toBeCloseTo(s0.tankY_m + s0.tankHeight_m);
    expect(s1.tankY_m).toBeCloseTo(s1.interstage!.y_m + s1.interstage!.height_m);
    expect(l.fairing.y_m).toBeCloseTo(s1.tankY_m + s1.tankHeight_m);
    expect(l.totalHeight_m).toBeCloseTo(l.fairing.y_m + l.fairing.bodyHeight_m + l.fairing.noseHeight_m);
  });

  it("uses data dimensions when the ids exist", () => {
    const catalog = {
      engines: [],
      tanks: [{ id: "t1", name: "T", propellant: "kerolox" as const, diameter_m: 5, height_m: 40, propellantMass_kg: 1, dryMass_kg: 1, source: "x" }],
      payloads: [],
    };
    const l = computeStackLayout(twoStage, catalog);
    expect(l.stages[0].diameter_m).toBe(5);
    expect(l.stages[0].tankHeight_m).toBe(40);
    expect(l.stages[1].diameter_m).toBe(FALLBACK.stageDiameter_m);
  });

  it("handles an empty build without throwing", () => {
    const l = computeStackLayout({ ...twoStage, stages: [] }, emptyCatalog);
    expect(l.stages).toHaveLength(0);
    expect(l.totalHeight_m).toBeGreaterThan(0);
  });
});
