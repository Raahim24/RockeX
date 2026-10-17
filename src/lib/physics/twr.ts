import type { Engine } from "@/types";
import { G0 } from "./deltav";

export const liftoffTWR = (engine: Engine, engineCount: number, startMass_kg: number): number => {
  if (startMass_kg <= 0) {
    return 0;
  }
  return (engineCount * engine.thrustSL_kN * 1000) / (startMass_kg * G0);
};

export const liftoffThrust_kN = (engine: Engine, engineCount: number): number =>
  engineCount * engine.thrustSL_kN;
