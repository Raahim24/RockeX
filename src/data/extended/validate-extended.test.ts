// Validation for the extended (not yet app-consumed) datasets in src/data/extended.
// Rules: unique kebab-case ids, every record carries a source URL, numbers are positive where present,
// nulls are allowed only in the *.pending.json files and in GCAT columns GCAT itself leaves empty.
import { describe, expect, it } from "vitest";
import demoCandidates from "./demo-build.candidates.json";
import enginesPending from "./engines.pending.json";
import gcatLaunchStats from "./gcat-launch-stats.json";
import gcatRockets from "./gcat-rockets.json";
import payloadsPending from "./payloads.pending.json";
import referenceRocketsExtended from "./reference-rockets.extended.json";
import stagesGcat from "./stages.gcat.json";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const URL_RE = /https?:\/\/[^\s)]+/;

type Row = Record<string, unknown>;

const uniqueKebabIds = (rows: Row[]): void => {
  const ids = rows.map((r) => r.id as string);
  expect(new Set(ids).size).toBe(ids.length);
  for (const id of ids) expect(id).toMatch(KEBAB);
};

const positiveOrNull = (value: unknown, label: string): void => {
  if (value === null || value === undefined) return;
  expect(typeof value, label).toBe("number");
  expect(value as number, label).toBeGreaterThan(0);
};

describe("reference-rockets.extended.json (U1 twin/roast candidates)", () => {
  it("has 15-20 rockets with launch history and sourced roast facts", () => {
    expect(referenceRocketsExtended.length).toBeGreaterThanOrEqual(15);
    expect(referenceRocketsExtended.length).toBeLessThanOrEqual(20);
    uniqueKebabIds(referenceRocketsExtended);
    for (const r of referenceRocketsExtended) {
      expect(r.source).toMatch(URL_RE);
      expect(r.liftoffMass_kg).toBeGreaterThan(0);
      expect(r.liftoffThrust_kN).toBeGreaterThan(0);
      expect(Number.isInteger(r.stages) && r.stages > 0).toBe(true);
      expect(Number.isInteger(r.launches) && r.launches >= 0).toBe(true);
      expect(Number.isInteger(r.failures) && r.failures >= 0 && r.failures <= r.launches).toBe(true);
      expect(r.firstLaunchYear).toBeGreaterThan(1950);
      expect(r.roastFacts.length).toBeGreaterThan(0);
      for (const fact of r.roastFacts) {
        expect(fact.text.length).toBeGreaterThan(10);
        expect(fact.source).toMatch(URL_RE);
      }
    }
  });
  it("marks the N1 as 4 launches / 4 failures", () => {
    const n1 = referenceRocketsExtended.find((r) => r.id === "n1");
    expect(n1?.launches).toBe(4);
    expect(n1?.failures).toBe(4);
  });
});

describe("stages.gcat.json (U3 historic stages, curated from GCAT)", () => {
  it("has 30-50 curated stages with SI numbers and GCAT sources", () => {
    expect(stagesGcat.length).toBeGreaterThanOrEqual(30);
    expect(stagesGcat.length).toBeLessThanOrEqual(50);
    uniqueKebabIds(stagesGcat);
    for (const s of stagesGcat) {
      expect(s.source).toContain("planet4589.org");
      expect(s.diameter_m).toBeGreaterThan(0);
      expect(s.length_m).toBeGreaterThan(0);
      expect(s.launchMass_kg).toBeGreaterThan(s.dryMass_kg);
      expect(s.propellantMass_kg).toBeCloseTo(s.launchMass_kg - s.dryMass_kg, 0);
      expect(s.thrust_kN).toBeGreaterThan(0);
      expect(s.engineCount).toBeGreaterThan(0);
      if (s.ispForApp_s === null) {
        // no trustworthy Isp in GCAT (e.g. SLS SRB, Super Heavy): the row must say why
        expect(s.flags.length, `${s.id} has no Isp and no flag`).toBeGreaterThan(0);
      } else {
        expect(s.ispForApp_s).toBeGreaterThan(150);
        expect(s.ispForApp_s).toBeLessThan(500);
      }
    }
  });
});

describe("pending records (nulls allowed, every gap flagged)", () => {
  it("engines.pending.json flags every missing value with _todo", () => {
    uniqueKebabIds(enginesPending);
    for (const e of enginesPending) {
      expect(e.source).toMatch(URL_RE);
      const gaps = ["thrustSL_kN", "thrustVac_kN", "ispSL_s", "ispVac_s", "mass_kg", "diameter_m"].filter((k) => (e as Row)[k] === null);
      if (gaps.length > 0) expect(e._todo).toMatch(/TODO/);
      for (const k of ["thrustVac_kN", "ispVac_s", "mass_kg", "diameter_m"]) positiveOrNull((e as Row)[k], `${e.id}.${k}`);
    }
  });
  it("payloads.pending.json records carry a TODO and a source", () => {
    uniqueKebabIds(payloadsPending);
    for (const p of payloadsPending) {
      expect(p.source).toMatch(URL_RE);
      expect(p.source).toMatch(/TODO/);
      expect(p.mass_kg).toBeGreaterThan(0);
    }
  });
});

describe("gcat-rockets.json (closest-rocket pool derived from GCAT lv.tsv + launch.tsv)", () => {
  it("has a few hundred orbital-class vehicles with mass and thrust", () => {
    expect(gcatRockets.length).toBeGreaterThan(300);
    uniqueKebabIds(gcatRockets);
    for (const r of gcatRockets) {
      expect(r.source).toContain("planet4589.org");
      expect(r.liftoffMass_kg).toBeGreaterThan(0);
      expect(r.liftoffThrust_kN).toBeGreaterThan(0);
      positiveOrNull(r.length_m, `${r.id}.length_m`);
      positiveOrNull(r.diameter_m, `${r.id}.diameter_m`);
      positiveOrNull(r.payloadLEO_kg, `${r.id}.payloadLEO_kg`);
      if (r.launches !== null) expect(r.failures as number).toBeLessThanOrEqual(r.launches);
    }
  });
  it("contains the Falcon 9 and Saturn V with sensible masses", () => {
    const f9 = gcatRockets.filter((r) => r.name === "Falcon 9");
    expect(f9.length).toBeGreaterThan(0);
    for (const r of f9) expect(r.liftoffMass_kg).toBeGreaterThan(300_000);
    const saturnV = gcatRockets.find((r) => r.name === "Saturn V" && r.variant === null);
    expect(saturnV?.liftoffMass_kg).toBeGreaterThan(2_500_000);
  });
});

describe("gcat-launch-stats.json (every orbital attempt per vehicle/variant)", () => {
  it("sums to thousands of orbital launches with consistent counts", () => {
    const total = gcatLaunchStats.reduce((sum, s) => sum + s.launches, 0);
    expect(total).toBeGreaterThan(6000);
    for (const s of gcatLaunchStats) {
      expect(s.successes + s.failures + s.unknown).toBe(s.launches);
      expect(s.firstYear).toBeLessThanOrEqual(s.lastYear);
      expect(s.firstYear).toBeGreaterThanOrEqual(1957);
    }
  });
});

describe("demo-build.candidates.json", () => {
  it("references only ids that exist in the live tables' id style", () => {
    for (const candidate of Object.values(demoCandidates)) {
      expect(candidate.red.stages.length).toBeGreaterThan(0);
      for (const stage of candidate.red.stages) {
        expect(stage.engineId).toMatch(KEBAB);
        expect(stage.tankId).toMatch(KEBAB);
        expect(stage.engineCount).toBeGreaterThan(0);
      }
    }
  });
});
