import type { BuildState, Engine, StageResult, Tank, Verdict } from "@/types";
import type { Catalog } from "./catalog";
import { byId } from "./catalog";
import { closestRocketId } from "./closest";
import { ispForStage_s, rocketEquationDeltaV_ms, stageMass_kg } from "./deltav";
import { liftoffThrust_kN, liftoffTWR } from "./twr";

const TWR_OK = 1.2;
const TWR_BLOCKING = 1.0;
const DRY_MASS_MIN_FRACTION = 0.04;
const MAX_ENGINE_COUNT = 9;
// Spec: tune so a 3.66 m tank + Merlin = 9. 0.62 also fits the real Saturn V S-IC's 5 F-1s (0.6 allowed 4).
const ENGINE_FIT_FACTOR = 0.62;

export const maxEngineCount = (tankDiameter_m: number, engineDiameter_m: number): number => {
  if (engineDiameter_m <= 0 || tankDiameter_m <= 0) {
    return 1;
  }
  const fit = Math.floor(ENGINE_FIT_FACTOR * (tankDiameter_m / engineDiameter_m) ** 2);
  return Math.max(1, Math.min(MAX_ENGINE_COUNT, fit));
};

// Cleans nonsense input only (NaN, fractions, < 1, > 9). Too many engines for the tank is left in the build,
// so the verdict can block it with a reason the advisor explains.
export const sanitizeEngineCount = (n: number): number => {
  const rounded = Number.isFinite(n) ? Math.round(n) : 1;
  return Math.max(1, Math.min(MAX_ENGINE_COUNT, rounded));
};

const isValidEngineCount = (n: number): boolean => Number.isInteger(n) && n >= 1 && n <= MAX_ENGINE_COUNT;

export const tooManyEnginesWarning = (count: number, engine: Engine, tank: Tank, fit: number): string =>
  `${count} ${engine.name} engines don't fit a ${tank.diameter_m} m wide ${tank.name}: max ${fit}`;

export const isVacuumOnly = (engine: Engine): boolean => engine.thrustSL_kN <= 0 || engine.ispSL_s <= 0;

export const evaluateBuild = (build: BuildState, catalog: Catalog): Verdict => {
  const warnings: string[] = [];
  const blocking = new Set<string>();
  const addBlocking = (message: string): void => {
    warnings.push(message);
    blocking.add(message);
  };

  if (build.stages.length === 0) {
    addBlocking("empty build");
    return {
      stages: [],
      totalDeltaV_ms: 0,
      requiredDeltaV_ms: 0,
      marginDeltaV_ms: 0,
      liftoffTWR: 0,
      deltaVOk: false,
      twrOk: false,
      feasible: false,
      totalMass_kg: 0,
      liftoffThrust_kN: 0,
      closestRocketId: "",
      warnings,
    };
  }

  const mission = build.missionId ? byId(catalog.missions, build.missionId) : undefined;
  if (build.missionId && !mission) {
    addBlocking(`unknown mission id: ${build.missionId}`);
  }

  const payload = build.payloadId ? byId(catalog.payloads, build.payloadId) : undefined;
  if (build.payloadId && !payload) {
    addBlocking(`unknown payload id: ${build.payloadId}`);
  }
  const payloadMass_kg = payload?.mass_kg ?? 0;

  const resolved = build.stages.map((stage, stageIndex) => {
    const engine = stage.engineId ? byId(catalog.engines, stage.engineId) : undefined;
    const tank = stage.tankId ? byId(catalog.tanks, stage.tankId) : undefined;
    if (!stage.engineId || !engine) {
      addBlocking(`unknown engine id: ${stage.engineId || stageIndex}`);
    }
    if (!stage.tankId || !tank) {
      addBlocking(`unknown tank id: ${stage.tankId || stageIndex}`);
    }
    if (engine && tank && engine.propellant !== tank.propellant) {
      addBlocking("engine and tank propellant differ");
    }
    if (engine && tank && tank.dryMass_kg < DRY_MASS_MIN_FRACTION * tank.propellantMass_kg) {
      addBlocking("tank dry mass below 4 percent of propellant");
    }
    if (stageIndex === 0 && engine && isVacuumOnly(engine)) {
      addBlocking("vacuum-only engine on stage 0");
    }
    const countValid = isValidEngineCount(stage.engineCount);
    if (!countValid) {
      addBlocking(`stage ${stageIndex + 1} engine count must be a whole number from 1 to ${MAX_ENGINE_COUNT}`);
    } else if (engine && tank) {
      const fit = maxEngineCount(tank.diameter_m, engine.diameter_m);
      if (stage.engineCount > fit) {
        addBlocking(tooManyEnginesWarning(stage.engineCount, engine, tank, fit));
      }
    }
    const engineCount = countValid ? stage.engineCount : 0;
    const mass_kg = engine && tank ? stageMass_kg(engine, engineCount, tank) : 0;
    return { engine, tank, mass_kg, engineCount };
  });

  const masses = resolved.map((r) => r.mass_kg);
  const totalMass_kg = masses.reduce((sum, m) => sum + m, 0) + payloadMass_kg;

  const stageResults: StageResult[] = resolved.map((r, i) => {
    const startMass_kg = masses.slice(i).reduce((sum, m) => sum + m, 0) + payloadMass_kg;
    const propellantMass_kg = r.tank?.propellantMass_kg ?? 0;
    const endMass_kg = startMass_kg - propellantMass_kg;
    const ispUsed_s = r.engine ? ispForStage_s(r.engine, i) : 0;
    const deltaV_ms = rocketEquationDeltaV_ms(ispUsed_s, startMass_kg, endMass_kg);
    return { stageIndex: i, ispUsed_s, startMass_kg, endMass_kg, deltaV_ms };
  });

  const totalDeltaV_ms = stageResults.reduce((sum, s) => sum + s.deltaV_ms, 0);
  const requiredDeltaV_ms = mission?.requiredDeltaV_ms ?? 0;
  const marginDeltaV_ms = totalDeltaV_ms - requiredDeltaV_ms;
  const deltaVOk = Boolean(mission) && marginDeltaV_ms >= 0;

  const first = resolved[0];
  const startMass0 = stageResults[0]?.startMass_kg ?? 0;
  const thrust_kN = first?.engine ? liftoffThrust_kN(first.engine, first.engineCount) : 0;
  const twr = first?.engine ? liftoffTWR(first.engine, first.engineCount, startMass0) : 0;
  const twrOk = twr >= TWR_OK;
  if (twr < TWR_BLOCKING) {
    addBlocking("liftoff TWR below 1.0");
  } else if (!twrOk) {
    warnings.push("liftoff TWR below 1.2");
  }

  const closestId = closestRocketId(totalMass_kg, thrust_kN, catalog.referenceRockets);
  const feasible = deltaVOk && twrOk && blocking.size === 0;

  return {
    stages: stageResults,
    totalDeltaV_ms,
    requiredDeltaV_ms,
    marginDeltaV_ms,
    liftoffTWR: twr,
    deltaVOk,
    twrOk,
    feasible,
    totalMass_kg,
    liftoffThrust_kN: thrust_kN,
    closestRocketId: closestId,
    warnings,
  };
};
