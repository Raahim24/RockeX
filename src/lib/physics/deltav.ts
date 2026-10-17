import type { Engine, Tank } from "@/types";

export const G0 = 9.80665;

export const stageMass_kg = (engine: Engine, engineCount: number, tank: Tank): number =>
  engineCount * engine.mass_kg + tank.dryMass_kg + tank.propellantMass_kg;

export const rocketEquationDeltaV_ms = (isp_s: number, startMass_kg: number, endMass_kg: number): number => {
  if (isp_s <= 0 || startMass_kg <= 0 || endMass_kg <= 0 || startMass_kg <= endMass_kg) {
    return 0;
  }
  return isp_s * G0 * Math.log(startMass_kg / endMass_kg);
};

export const ispForStage_s = (engine: Engine, stageIndex: number): number =>
  stageIndex === 0 ? engine.ispSL_s : engine.ispVac_s;
