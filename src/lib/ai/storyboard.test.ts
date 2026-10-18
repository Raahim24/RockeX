import { describe, expect, it } from "vitest";
import { loadCatalog } from "@/lib/physics/catalog";
import { evaluateBuild } from "@/lib/physics/feasibility";
import { applySuggestionToBuild } from "@/store/applySuggestion";
import { DEMO_BUILD, DEMO_FIX } from "@/store/buildStore";
import { deltaVWithoutStaging, leoOrbit, storyScenes } from "./storyboard";

const catalog = loadCatalog();
const fixed = DEMO_FIX ? applySuggestionToBuild(DEMO_BUILD, DEMO_FIX, catalog) : DEMO_BUILD;

describe("mission story chapters follow the flight", () => {
  it("success: pad, liftoff, staging, space, payoff", () => {
    expect(storyScenes(fixed, catalog).map((s) => s.id)).toEqual(["pad", "liftoff", "staging", "space", "payoff"]);
  });
  it("shortfall ends with a lesson that points to Grok", () => {
    const scenes = storyScenes(DEMO_BUILD, catalog);
    expect(scenes.map((s) => s.id)).toEqual(["pad", "liftoff", "staging", "space", "lesson"]);
    expect(scenes[4].caption).toMatch(/0\.9 km\/s short of Moon transfer.*Ask Grok/);
  });
  it("the screen's flight result wins over the verdict", () => {
    expect(storyScenes(fixed, catalog, { outcome: "impact", boosterLands: false }).map((s) => s.id)).toEqual(["pad", "liftoff", "lesson"]);
  });
  it("only the pad chapter is edited from our 3D still", () => {
    expect(storyScenes(fixed, catalog).filter((s) => s.fromStill).map((s) => s.id)).toEqual(["pad"]);
  });
});

describe("captions use computed numbers only", () => {
  const v = evaluateBuild(fixed, catalog);
  const scenes = storyScenes(fixed, catalog);
  it("liftoff compares push and weight from the verdict", () => {
    expect(scenes[1].caption).toContain(Math.round(v.liftoffThrust_kN).toLocaleString("en-US"));
    expect(scenes[1].caption).toContain(`${v.liftoffTWR.toFixed(2)}×`);
  });
  it("staging shows the Δv gained by dropping empty stages", () => {
    const without = deltaVWithoutStaging(fixed, catalog);
    expect(without).toBeGreaterThan(0);
    expect(without).toBeLessThan(v.totalDeltaV_ms);
    expect(scenes[2].caption).toContain(`${(without / 1000).toFixed(1)} km/s without staging`);
  });
  it("orbit speed and lap time come from Earth's gravity", () => {
    const o = leoOrbit();
    expect(o.speed_ms).toBeGreaterThan(7700);
    expect(o.speed_ms).toBeLessThan(7850);
    expect(Math.round(o.lap_min)).toBe(88);
  });
  it("the payoff names the payload's job", () => {
    expect(scenes[4].caption).toMatch(/James Webb Space Telescope delivered to Moon transfer.*first galaxies/);
  });
});
