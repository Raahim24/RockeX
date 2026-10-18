// Canonical demo: red, one swap, green. Uses the real catalog in src/data.
// Skipped until P4's demo parts exist and DEMO_FIX is set; then it runs automatically.
import { describe, expect, it } from "vitest";
import { byId, loadCatalog } from "@/lib/physics/catalog";
import { evaluateBuild } from "@/lib/physics/feasibility";
import { applySuggestionToBuild } from "./applySuggestion";
import { DEMO_BUILD, DEMO_FIX } from "./buildStore";

const catalog = loadCatalog();
const demoPartsExist =
  byId(catalog.missions, DEMO_BUILD.missionId) !== undefined &&
  byId(catalog.payloads, DEMO_BUILD.payloadId) !== undefined &&
  DEMO_BUILD.stages.every(
    (s) => byId(catalog.engines, s.engineId) !== undefined && byId(catalog.tanks, s.tankId) !== undefined,
  );

describe.skipIf(!demoPartsExist || DEMO_FIX === null)("canonical demo", () => {
  const red = evaluateBuild(DEMO_BUILD, catalog);
  const fixed = DEMO_FIX ? applySuggestionToBuild(DEMO_BUILD, DEMO_FIX, catalog) : DEMO_BUILD;
  const green = evaluateBuild(fixed, catalog);

  it("starts red only because of delta-v, with no blocking warnings", () => {
    expect(red.feasible).toBe(false);
    expect(red.deltaVOk).toBe(false);
    expect(red.marginDeltaV_ms).toBeLessThan(0);
    expect(red.twrOk).toBe(true);
    expect(red.warnings).toEqual([]);
  });

  it("the one documented swap actually changes the build", () => {
    expect(fixed).not.toEqual(DEMO_BUILD);
  });

  it("turns green after the swap", () => {
    expect(green.feasible).toBe(true);
    expect(green.marginDeltaV_ms).toBeGreaterThanOrEqual(0);
    expect(green.warnings).toEqual([]);
  });

  it("passes the TWR rule honestly before and after the swap", () => {
    expect(red.liftoffTWR).toBeGreaterThanOrEqual(1.15);
    expect(green.liftoffTWR).toBeGreaterThanOrEqual(1.15);
  });
});
