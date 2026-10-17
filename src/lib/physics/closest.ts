import type { ReferenceRocket } from "@/types";

export const rocketDistance = (
  buildMass_kg: number,
  buildThrust_kN: number,
  ref: ReferenceRocket,
): number => {
  const lnMass = Math.log(buildMass_kg / ref.liftoffMass_kg);
  const lnThrust = Math.log(buildThrust_kN / ref.liftoffThrust_kN);
  return Math.sqrt(lnMass * lnMass + lnThrust * lnThrust);
};

export const closestRocketId = (
  buildMass_kg: number,
  buildThrust_kN: number,
  refs: ReferenceRocket[],
): string => {
  if (buildMass_kg <= 0 || buildThrust_kN <= 0 || refs.length === 0) {
    return "";
  }
  let bestId = "";
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const ref of refs) {
    if (ref.liftoffMass_kg <= 0 || ref.liftoffThrust_kN <= 0) {
      continue;
    }
    const d = rocketDistance(buildMass_kg, buildThrust_kN, ref);
    if (d < bestDistance) {
      bestDistance = d;
      bestId = ref.id;
    }
  }
  return bestId;
};
