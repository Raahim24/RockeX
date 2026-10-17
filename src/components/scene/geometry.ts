// Owner: P1. Pure layout math: turns a BuildState into stacked part positions (meters).
// Real dimensions come from src/data via the catalog. The FALLBACK values are visual
// placeholders used only while a part id is missing from the data. They are not specs.
import type { BuildState, Engine, Payload, Tank } from "@/types";

export interface PartCatalog {
  engines: Engine[];
  tanks: Tank[];
  payloads: Payload[];
}

export const FALLBACK = {
  stageDiameter_m: 4,
  stageHeights_m: [32, 12, 8, 6],
  payloadHeight_m: 5,
  payloadDiameterRatio: 0.7,
} as const;

export interface StageLayout {
  stageIndex: number;
  diameter_m: number;
  engineCount: number;
  engineY_m: number; // bottom of the engine bells
  engineHeight_m: number;
  bellRadius_m: number;
  enginePositions: [number, number][]; // x, z offsets
  interstage: { y_m: number; height_m: number; bottomDiameter_m: number; topDiameter_m: number } | null;
  tankY_m: number; // bottom of the tank
  tankHeight_m: number;
}

export interface StackLayout {
  stages: StageLayout[];
  payload: { y_m: number; height_m: number; diameter_m: number };
  fairing: { y_m: number; diameter_m: number; bodyHeight_m: number; noseHeight_m: number };
  totalHeight_m: number;
}

// Bell radius as a share of tank radius, chosen so a cluster of n never overlaps.
export function bellRadiusFactor(count: number): number {
  if (count <= 1) return 0.55;
  if (count <= 3) return 0.4;
  if (count <= 6) return 0.3;
  return 0.24;
}

// 1 = center. 2-6 = ring. 7-9 = ring plus one center engine (octaweb style).
export function clusterPositions(count: number, tankRadius_m: number, bellRadius_m: number): [number, number][] {
  if (count <= 1) return [[0, 0]];
  const ringCount = count >= 7 ? count - 1 : count;
  const ringRadius = tankRadius_m - bellRadius_m - tankRadius_m * 0.05;
  const ring: [number, number][] = Array.from({ length: ringCount }, (_, k) => {
    const a = (k / ringCount) * Math.PI * 2;
    return [Math.cos(a) * ringRadius, Math.sin(a) * ringRadius];
  });
  return ringCount < count ? [[0, 0], ...ring] : ring;
}

export function computeStackLayout(build: BuildState, catalog: PartCatalog): StackLayout {
  const stages: StageLayout[] = [];
  let y = 0;
  let prevDiameter: number | null = null;

  build.stages.forEach((stage, i) => {
    const tank = catalog.tanks.find((t) => t.id === stage.tankId);
    const engine = catalog.engines.find((e) => e.id === stage.engineId);
    const count = Math.max(1, Math.min(9, Math.round(stage.engineCount)));

    const diameter = tank?.diameter_m ?? FALLBACK.stageDiameter_m;
    const tankHeight = tank?.height_m ?? FALLBACK.stageHeights_m[Math.min(i, FALLBACK.stageHeights_m.length - 1)];
    const tankRadius = diameter / 2;
    const fitBell = tankRadius * bellRadiusFactor(count);
    const bellRadius = engine ? Math.min(engine.diameter_m / 2, fitBell) : fitBell;
    const engineHeight = bellRadius * 3.2;

    let interstage: StageLayout["interstage"] = null;
    let engineY = y;
    if (prevDiameter !== null) {
      // The interstage sits on the stage below and hides this stage's engines.
      const height = engineHeight + diameter * 0.1;
      interstage = { y_m: y, height_m: height, bottomDiameter_m: prevDiameter, topDiameter_m: diameter };
      engineY = y + diameter * 0.05;
      y += height;
    } else {
      y += engineHeight;
    }

    stages.push({
      stageIndex: i,
      diameter_m: diameter,
      engineCount: count,
      engineY_m: engineY,
      engineHeight_m: engineHeight,
      bellRadius_m: bellRadius,
      enginePositions: clusterPositions(count, tankRadius, bellRadius),
      interstage,
      tankY_m: y,
      tankHeight_m: tankHeight,
    });
    y += tankHeight;
    prevDiameter = diameter;
  });

  const topDiameter = prevDiameter ?? FALLBACK.stageDiameter_m;
  const payloadData = catalog.payloads.find((p) => p.id === build.payloadId);
  const payloadDiameter = payloadData?.diameter_m ?? topDiameter * FALLBACK.payloadDiameterRatio;
  const payloadHeight = payloadData?.height_m ?? FALLBACK.payloadHeight_m;

  const fairingDiameter = Math.max(topDiameter, payloadDiameter * 1.15);
  const bodyHeight = payloadHeight * 1.1;
  const noseHeight = fairingDiameter * 1.3;
  const fairing = { y_m: y, diameter_m: fairingDiameter, bodyHeight_m: bodyHeight, noseHeight_m: noseHeight };
  const payload = { y_m: y + payloadHeight * 0.05, height_m: payloadHeight, diameter_m: payloadDiameter };

  return { stages, payload, fairing, totalHeight_m: y + bodyHeight + noseHeight };
}
