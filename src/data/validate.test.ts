// Owner: P4. Data validation: run with `npm test`. Types are checked at compile time by index.ts;
// this checks the values: every record sourced, ids unique, numbers physically sane.
import { describe, expect, it } from "vitest";
import { engines, missions, payloads, referenceRockets, tanks } from "./index";
import payloadsJson from "./payloads.json";

const tables = { engines, tanks, payloads: payloadsJson, missions, referenceRockets } as const;

const hasSourceUrl = (source: unknown): boolean => typeof source === "string" && /https?:\/\/\S+/.test(source);

const positive = (n: number): boolean => Number.isFinite(n) && n > 0;

describe("every table", () => {
  for (const [name, rows] of Object.entries(tables)) {
    it(`${name}: non-empty, unique ids, every record has a source URL and no TODO`, () => {
      expect(rows.length).toBeGreaterThan(0);
      const ids = rows.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const r of rows) {
        expect(r.id, "id").toMatch(/^[a-z0-9-]+$/);
        expect(r.name.trim(), `${r.id} name`).not.toBe("");
        expect(hasSourceUrl(r.source), `${r.id} source`).toBe(true);
        expect(r.source, `${r.id} source`).not.toMatch(/TODO/);
      }
    });
  }
});

describe("engines", () => {
  it("have positive vacuum performance, mass and diameter", () => {
    for (const e of engines) {
      for (const [field, value] of Object.entries({
        thrustVac_kN: e.thrustVac_kN,
        ispVac_s: e.ispVac_s,
        mass_kg: e.mass_kg,
        diameter_m: e.diameter_m,
      })) {
        expect(positive(value), `${e.id} ${field}`).toBe(true);
      }
    }
  });

  it("are either vacuum-only (both sea-level fields 0) or rated at sea level (both positive)", () => {
    for (const e of engines) {
      const vacuumOnly = e.thrustSL_kN === 0 && e.ispSL_s === 0;
      const seaLevel = positive(e.thrustSL_kN) && positive(e.ispSL_s);
      expect(vacuumOnly || seaLevel, e.id).toBe(true);
    }
  });

  it("never perform better at sea level than in vacuum", () => {
    for (const e of engines) {
      expect(e.thrustSL_kN, e.id).toBeLessThanOrEqual(e.thrustVac_kN);
      expect(e.ispSL_s, e.id).toBeLessThanOrEqual(e.ispVac_s);
    }
  });
});

describe("tanks", () => {
  it("have positive dimensions and masses, with dry mass below propellant mass", () => {
    for (const t of tanks) {
      for (const [field, value] of Object.entries({
        diameter_m: t.diameter_m,
        height_m: t.height_m,
        propellantMass_kg: t.propellantMass_kg,
        dryMass_kg: t.dryMass_kg,
      })) {
        expect(positive(value), `${t.id} ${field}`).toBe(true);
      }
      expect(t.dryMass_kg, t.id).toBeLessThan(t.propellantMass_kg);
    }
  });

  it("each have at least one engine with the same propellant", () => {
    for (const t of tanks) {
      expect(engines.some((e) => e.propellant === t.propellant), t.id).toBe(true);
    }
  });
});

describe("payloads, missions, reference rockets", () => {
  it("payloads have positive mass and size", () => {
    for (const p of payloads) {
      expect(positive(p.mass_kg) && positive(p.diameter_m) && positive(p.height_m), p.id).toBe(true);
    }
  });

  // LEO orbital speed is 7.8 km/s before losses: https://en.wikipedia.org/w/index.php?title=Delta-v_budget&oldid=1362285519
  it("missions need more delta-v than reaching orbit takes without losses", () => {
    for (const m of missions) {
      expect(Number.isInteger(m.requiredDeltaV_ms), m.id).toBe(true);
      expect(m.requiredDeltaV_ms, m.id).toBeGreaterThan(7800);
    }
  });

  it("reference rockets have positive figures and a whole number of stages", () => {
    for (const r of referenceRockets) {
      expect(positive(r.liftoffMass_kg) && positive(r.liftoffThrust_kN) && positive(r.payloadLEO_kg), r.id).toBe(true);
      expect(Number.isInteger(r.stages) && r.stages >= 1, r.id).toBe(true);
    }
  });
});
