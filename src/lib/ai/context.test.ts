import { loadCatalog } from "@/lib/physics/catalog";
import { evaluateBuild } from "@/lib/physics/feasibility";
import { DEMO_BUILD } from "@/store/buildStore";
import { describe, expect, it } from "vitest";
import { advisorContext } from "./context";
import { advisorCandidates, advisorUserPrompt } from "./prompts";

const catalog = loadCatalog();
const verdict = evaluateBuild(DEMO_BUILD, catalog);
const context = advisorContext(DEMO_BUILD, verdict, catalog).join("\n");

describe("advisorContext", () => {
  it("lists the real records of the parts on the rocket", () => {
    expect(context).toContain("Engine Merlin 1D: kerolox");
    expect(context).toContain("Engine RL10B-2: hydrolox");
    expect(context).toContain("Tank Falcon 9 Block 5 first-stage tank: kerolox");
  });

  it("gives the closest real rocket with its launch history and sourced facts", () => {
    expect(verdict.closestRocketId).toBe("falcon-9");
    expect(context).toContain("CLOSEST REAL ROCKET");
    expect(context).toMatch(/History: \d+ launches, \d+ failures/);
    expect(context).toContain("Fact: ");
  });

  it("gives the advisor only the rules this verdict involves", () => {
    expect(context).toContain("must be at least 1.2");
    expect(context).not.toContain("Vacuum-only engines");
    expect(context).not.toContain("at least 4 %");
  });

  it("gives the agent every rule, with the same constants the code uses", () => {
    const all = advisorContext(DEMO_BUILD, verdict, catalog, { allRules: true }).join("\n");
    expect(all).toContain("Vacuum-only engines");
    expect(all).toContain("floor(0.62 x (tank diameter / engine diameter)^2)");
    expect(all).toContain("at least 4 %");
  });

  it("states the dataset size from the data files", () => {
    expect(context).toMatch(/\d+ launch vehicles, [\d,]+ orbital launch attempts/);
  });

  it("is appended to the advisor prompt", () => {
    const prompt = advisorUserPrompt(DEMO_BUILD, verdict, catalog, advisorCandidates(DEMO_BUILD, verdict, catalog), [context]);
    expect(prompt).toContain("RULES (the physics code that decided the verdict):");
  });
});
