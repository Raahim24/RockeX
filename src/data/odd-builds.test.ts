// Owner: P4. Phase 3 odd-build sweep: every engine on every tank, 1 and 9 engines, with and without an upper
// stage, for every mission and payload (18,480 builds), plus hand-picked edge cases. It checks the physics never
// throws or returns impossible numbers for builds the UI can create. Findings are in docs/qa/odd-builds.md.
import { describe, expect, it } from "vitest";
import { loadCatalog } from "@/lib/physics/catalog";
import { evaluateBuild, isVacuumOnly } from "@/lib/physics/feasibility";
import type { BuildState, StageBuild } from "@/types";

const catalog = loadCatalog();
const livery = { primary: "#ffffff", accent: "#000000", stripe: false, patch: null };
const build = (stages: StageBuild[], missionId = "leo", payloadId = ""): BuildState => ({ missionId, payloadId, livery, stages });
const stage = (engineId: string, tankId: string, engineCount = 1): StageBuild => ({ engineId, engineCount, tankId });

function* sweep() {
  const upper = stage("rl10c-1", "centaur-iii-tank");
  for (const m of [...catalog.missions.map((x) => x.id), ""])
    for (const p of [...catalog.payloads.map((x) => x.id), ""])
      for (const e of catalog.engines)
        for (const t of catalog.tanks)
          for (const n of [1, 9])
            for (const withUpper of [false, true]) {
              const stages = [stage(e.id, t.id, n), ...(withUpper ? [upper] : [])];
              yield { b: build(stages, m, p), boosterThrusts: !isVacuumOnly(e) };
            }
}

describe("odd-build sweep", () => {
  it("never throws and never returns impossible numbers", () => {
    let count = 0;
    for (const { b, boosterThrusts } of sweep()) {
      count++;
      const v = evaluateBuild(b, catalog);
      const numbers = [v.totalDeltaV_ms, v.requiredDeltaV_ms, v.marginDeltaV_ms, v.liftoffTWR, v.totalMass_kg, v.liftoffThrust_kN];
      for (const s of v.stages) numbers.push(s.deltaV_ms, s.startMass_kg, s.endMass_kg, s.ispUsed_s);
      expect(numbers.every(Number.isFinite), JSON.stringify(b.stages)).toBe(true);
      expect(v.totalDeltaV_ms).toBeGreaterThanOrEqual(0);
      expect(v.totalMass_kg).toBeGreaterThan(0);
      if (v.feasible) {
        expect(v.deltaVOk && v.twrOk).toBe(true);
        expect(v.liftoffTWR).toBeGreaterThanOrEqual(1.15);
      }
      // A booster with sea-level thrust always gets a real closest rocket.
      if (boosterThrusts) expect(catalog.referenceRockets.some((r) => r.id === v.closestRocketId)).toBe(true);
    }
    // missions (+ none) x payloads (+ none) x engines x tanks x 2 counts x 2 (with/without upper): grows with the data
    const expected = (catalog.missions.length + 1) * (catalog.payloads.length + 1) * catalog.engines.length * catalog.tanks.length * 2 * 2;
    expect(count).toBe(expected);
  });

  it("a vacuum engine on the booster is never feasible", () => {
    const v = evaluateBuild(build([stage("rl10c-1", "centaur-iii-tank")]), catalog);
    expect(v.feasible).toBe(false);
    expect(v.warnings).toContain("vacuum-only engine on stage 0");
  });
});

describe("odd-build edge cases", () => {
  it("empty build and unknown ids are infeasible, finite and do not throw", () => {
    for (const b of [build([]), build([stage("no-engine", "no-tank")], "no-mission", "no-payload")]) {
      const v = evaluateBuild(b, catalog);
      expect(v.feasible).toBe(false);
      expect(Number.isFinite(v.totalDeltaV_ms)).toBe(true);
    }
  });

  it("four stages evaluate", () => {
    const v = evaluateBuild(
      build(
        [
          stage("merlin-1d", "falcon9-s1-tank", 9),
          stage("rl10b-2", "dcss-5m-tank"),
          stage("rl10c-1", "centaur-iii-tank"),
          stage("rl10c-1", "centaur-iii-tank"),
        ],
        "mars-transfer",
        "hubble",
      ),
      catalog,
    );
    expect(v.stages).toHaveLength(4);
    expect(v.warnings).toEqual([]);
  });

  it("a real Saturn V stack clears the LEO requirement with margin and matches Saturn V (spec sanity test)", () => {
    const v = evaluateBuild(
      build([stage("f-1", "saturn-v-s-ic-tank", 5), stage("j-2", "saturn-v-s-ii-tank", 5), stage("j-2", "saturn-v-s-ivb-tank", 1)]),
      catalog,
    );
    expect(v.deltaVOk).toBe(true);
    expect(v.marginDeltaV_ms).toBeGreaterThan(1000);
    expect(v.closestRocketId).toBe("saturn-v");
  });

  // Known issues reported to P2 (docs/qa/odd-builds.md). Flip to real tests once fixed.
  it.todo("engine counts outside 1..9 (0, 50, NaN) are rejected by evaluateBuild itself, not only by the store");
  it.todo("a real Saturn V first stage (5 x F-1) is buildable: the engine-fit rule allows only 4");
  it.todo("real Falcon 9 and Shuttle tanks pass the tank sanity rule: the 4 % floor blocks them");
});
