import { describe, expect, it } from "vitest";
import type { Catalog } from "@/lib/physics/catalog";
import type { BuildState, Engine, Tank } from "@/types";
import { applySuggestionToBuild } from "./applySuggestion";

const livery = { primary: "#fff", accent: "#000", stripe: false, patch: null };

const merlin: Engine = {
  id: "merlin-1d",
  name: "Merlin",
  propellant: "kerolox",
  thrustSL_kN: 845,
  thrustVac_kN: 914,
  ispSL_s: 282,
  ispVac_s: 311,
  mass_kg: 470,
  diameter_m: 0.945,
  source: "test fixture",
};

const tank: Tank = {
  id: "tank-3.66",
  name: "3.66 m",
  propellant: "kerolox",
  diameter_m: 3.66,
  height_m: 20,
  propellantMass_kg: 100000,
  dryMass_kg: 5000,
  source: "test fixture",
};

const catalog: Catalog = {
  engines: [merlin],
  tanks: [tank],
  payloads: [],
  missions: [],
  referenceRockets: [],
};

const build: BuildState = {
  missionId: "moon-transfer",
  payloadId: "p",
  livery,
  stages: [{ engineId: "merlin-1d", engineCount: 1, tankId: "tank-3.66" }],
};

describe("applySuggestionToBuild", () => {
  it("ignores suggestions whose ids are not in the catalog", () => {
    expect(
      applySuggestionToBuild(build, { type: "swap_engine", stageIndex: 0, engineId: "no-such-engine" }, catalog),
    ).toEqual(build);
    expect(
      applySuggestionToBuild(build, { type: "swap_tank", stageIndex: 0, tankId: "no-such-tank" }, catalog),
    ).toEqual(build);
    expect(
      applySuggestionToBuild(
        build,
        { type: "add_stage", engineId: "no-such-engine", tankId: "tank-3.66" },
        catalog,
      ),
    ).toEqual(build);
    expect(
      applySuggestionToBuild(
        build,
        { type: "add_stage", engineId: "merlin-1d", tankId: "no-such-tank" },
        catalog,
      ),
    ).toEqual(build);
  });

  it("applies a suggestion when ids exist", () => {
    const next = applySuggestionToBuild(
      build,
      { type: "set_engine_count", stageIndex: 0, engineCount: 9 },
      catalog,
    );
    expect(next.stages[0]?.engineCount).toBe(9);
  });
});
