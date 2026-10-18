// Owner: P3. Server-only advisor context: the part records, the closest real rocket with its history, the
// physics rules and the dataset size. Every fact and number comes from src/data or the physics code, so Grok
// can explain and joke without inventing anything. Kept out of prompts.ts because the client imports that.
import gcatLaunchStats from "@/data/extended/gcat-launch-stats.json";
import gcatRockets from "@/data/extended/gcat-rockets.json";
import extendedRockets from "@/data/extended/reference-rockets.extended.json";
import { byId, type Catalog } from "@/lib/physics/catalog";
import { physicsRulesText } from "@/lib/physics/feasibility";
import type { BuildState, Verdict } from "@/types";

interface RocketHistory {
  id: string;
  launches: number;
  failures: number;
  firstLaunchYear: number;
  roastFacts: { text: string }[];
}

const histories: RocketHistory[] = extendedRockets;
const num = (v: number): string => Math.round(v).toLocaleString("en-US");

const partLines = (build: BuildState, catalog: Catalog): string[] => {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const s of build.stages) {
    const e = byId(catalog.engines, s.engineId);
    if (e && !seen.has(e.id)) {
      seen.add(e.id);
      lines.push(
        `Engine ${e.name}: ${e.propellant}, thrust ${num(e.thrustSL_kN)} kN sea level / ${num(e.thrustVac_kN)} kN vacuum, Isp ${num(e.ispSL_s)} s / ${num(e.ispVac_s)} s, ${num(e.mass_kg)} kg, ${e.diameter_m} m wide`,
      );
    }
    const t = byId(catalog.tanks, s.tankId);
    if (t && !seen.has(t.id)) {
      seen.add(t.id);
      lines.push(
        `Tank ${t.name}: ${t.propellant}, ${num(t.propellantMass_kg)} kg propellant, ${num(t.dryMass_kg)} kg dry, ${t.diameter_m} m wide`,
      );
    }
  }
  return lines;
};

const closestLines = (verdict: Verdict, catalog: Catalog): string[] => {
  const ref = byId(catalog.referenceRockets, verdict.closestRocketId);
  if (!ref) return ["none"];
  const history = histories.find((h) => h.id === ref.id);
  return [
    `${ref.name}: liftoff ${num(ref.liftoffMass_kg / 1000)} t, ${num(ref.liftoffThrust_kN)} kN, ${ref.stages} stages`,
    ...(history
      ? [
          `History: ${history.launches} launches, ${history.failures} failures, first flew ${history.firstLaunchYear}`,
          ...history.roastFacts.map((f) => `Fact: ${f.text}`),
        ]
      : []),
  ];
};

const datasetLine = (catalog: Catalog): string => {
  const attempts = gcatLaunchStats.reduce((n, s) => n + s.launches, 0);
  return `Parts dataset: ${catalog.engines.length} real engines, ${catalog.tanks.length} real stages, every number sourced. Closest-rocket history from GCAT (J. McDowell): ${gcatRockets.length} launch vehicles, ${num(attempts)} orbital launch attempts.`;
};

/** `allRules`: the agent may be asked about any rule; the advisor only gets the ones this verdict involves. */
export const advisorContext = (
  build: BuildState,
  verdict: Verdict,
  catalog: Catalog,
  { allRules = false }: { allRules?: boolean } = {},
): string[] => [
  "PARTS (real records):",
  ...partLines(build, catalog),
  "CLOSEST REAL ROCKET (by liftoff mass and thrust):",
  ...closestLines(verdict, catalog),
  "RULES (the physics code that decided the verdict):",
  ...physicsRulesText(allRules ? undefined : verdict.warnings),
  `DATASET: ${datasetLine(catalog)}`,
];
