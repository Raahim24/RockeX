import { describe, expect, it } from "vitest";
import { loadCatalog } from "@/lib/physics/catalog";
import { evaluateBuild } from "@/lib/physics/feasibility";
import { applySuggestionToBuild } from "@/store/applySuggestion";
import { DEMO_BUILD, DEMO_FIX } from "@/store/buildStore";
import { deltaVWithoutStaging, leoOrbit, storyScenes } from "./storyboard";

const catalog = loadCatalog();
const fixed = DEMO_FIX ? applySuggestionToBuild(DEMO_BUILD, DEMO_FIX, catalog) : DEMO_BUILD;

describe("mission story: start, middle, end", () => {
  it("success: launch, in space, mission accomplished", () => {
    expect(storyScenes(fixed, catalog).map((s) => s.id)).toEqual(["liftoff", "space", "payoff"]);
  });
  it("shortfall ends with a lesson that points to Grok", () => {
    const scenes = storyScenes(DEMO_BUILD, catalog);
    expect(scenes.map((s) => s.id)).toEqual(["liftoff", "space", "lesson"]);
    expect(scenes[2].caption).toMatch(/0\.9 km\/s short of Moon transfer.*Ask Grok/);
  });
  it("the screen's flight result wins over the verdict", () => {
    expect(storyScenes(fixed, catalog, { outcome: "impact", boosterLands: false }).map((s) => s.id)).toEqual(["liftoff", "lesson"]);
  });
  it("every rocket chapter is edited from our 3D still; the payload ending is generated", () => {
    expect(storyScenes(fixed, catalog).map((s) => s.reference)).toEqual(["still", "still", null]);
  });
});

describe("captions use computed numbers only", () => {
  const v = evaluateBuild(fixed, catalog);
  const [launch, space, end] = storyScenes(fixed, catalog);
  it("launch compares push and weight from the verdict", () => {
    expect(launch.caption).toContain(Math.round(v.liftoffThrust_kN).toLocaleString("en-US"));
    expect(launch.caption).toContain(`${v.liftoffTWR.toFixed(2)}×`);
  });
  it("space shows the Δv gained by staging and the orbit speed", () => {
    const without = deltaVWithoutStaging(fixed, catalog);
    expect(without).toBeGreaterThan(0);
    expect(without).toBeLessThan(v.totalDeltaV_ms);
    expect(space.caption).toContain(`instead of ${(without / 1000).toFixed(1)}`);
    expect(space.caption).toContain(`${(leoOrbit().speed_ms / 1000).toFixed(1)} km/s`);
  });
  it("orbit speed and lap time come from Earth's gravity", () => {
    const o = leoOrbit();
    expect(o.speed_ms).toBeGreaterThan(7700);
    expect(o.speed_ms).toBeLessThan(7850);
    expect(Math.round(o.lap_min)).toBe(88);
  });
  it("the ending names the payload's job", () => {
    expect(end.caption).toMatch(/James Webb Space Telescope delivered to Moon transfer.*first galaxies/);
  });
});
