"use client";
// Owner: P1. Procedural part meshes. Every size comes in as a prop from geometry.ts.
import { useMemo } from "react";
import { DoubleSide, Vector2 } from "three";
import type { Livery } from "@/types";
import type { StackLayout, StageLayout } from "./geometry";
import { ENGINE_INNER, ENGINE_METAL, StripeBand } from "./Livery";

const SEGMENTS = 48;

// Bell profile from throat (top) to exit (bottom), revolved around Y.
function useBellProfile(radius: number, height: number): Vector2[] {
  return useMemo(() => {
    const throat = radius * 0.32;
    const pts: Vector2[] = [];
    for (let k = 0; k <= 16; k++) {
      const t = k / 16; // 0 = exit, 1 = throat
      const r = throat + (radius - throat) * Math.pow(1 - t, 1.8);
      pts.push(new Vector2(r, t * height));
    }
    return pts;
  }, [radius, height]);
}

export function EngineBell({ radius, height }: { radius: number; height: number }) {
  const bellHeight = height * 0.72;
  const chamberHeight = height - bellHeight;
  const profile = useBellProfile(radius, bellHeight);
  return (
    <group>
      <mesh castShadow>
        <latheGeometry args={[profile, SEGMENTS]} />
        <meshStandardMaterial color={ENGINE_METAL} metalness={0.85} roughness={0.35} side={DoubleSide} />
      </mesh>
      <mesh position={[0, bellHeight + chamberHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[radius * 0.42, radius * 0.36, chamberHeight, 24]} />
        <meshStandardMaterial color={ENGINE_INNER} metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}

export function EngineCluster({ stage }: { stage: StageLayout }) {
  return (
    <group position={[0, stage.engineY_m, 0]}>
      {stage.enginePositions.map(([x, z], k) => (
        <group key={k} position={[x, 0, z]}>
          <EngineBell radius={stage.bellRadius_m} height={stage.engineHeight_m} />
        </group>
      ))}
      {/* Thrust plate that closes the bottom of the tank. */}
      <mesh position={[0, stage.engineHeight_m - stage.diameter_m * 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[stage.diameter_m / 2, stage.diameter_m / 2, stage.diameter_m * 0.04, SEGMENTS]} />
        <meshStandardMaterial color={ENGINE_INNER} metalness={0.5} roughness={0.6} />
      </mesh>
    </group>
  );
}

export function TankMesh({ stage, livery }: { stage: StageLayout; livery: Livery }) {
  const r = stage.diameter_m / 2;
  const centerY = stage.tankY_m + stage.tankHeight_m / 2;
  const stripeHeight = Math.min(stage.tankHeight_m * 0.08, stage.diameter_m * 0.5);
  return (
    <group>
      <mesh position={[0, centerY, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, stage.tankHeight_m, SEGMENTS]} />
        <meshStandardMaterial color={livery.primary} metalness={0.15} roughness={0.45} />
      </mesh>
      <StripeBand
        livery={livery}
        y_m={stage.tankY_m + stage.tankHeight_m * 0.82}
        diameter_m={stage.diameter_m}
        height_m={stripeHeight}
      />
    </group>
  );
}

export function InterstageMesh({ stage, livery }: { stage: StageLayout; livery: Livery }) {
  if (!stage.interstage) return null;
  const { y_m, height_m, bottomDiameter_m, topDiameter_m } = stage.interstage;
  return (
    <mesh position={[0, y_m + height_m / 2, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[topDiameter_m / 2, bottomDiameter_m / 2, height_m, SEGMENTS]} />
      <meshStandardMaterial color={livery.accent} metalness={0.3} roughness={0.55} />
    </mesh>
  );
}

export function PayloadMesh({ payload }: { payload: StackLayout["payload"] }) {
  const r = payload.diameter_m / 2;
  return (
    <group position={[0, payload.y_m, 0]}>
      <mesh position={[0, payload.height_m * 0.4, 0]}>
        <cylinderGeometry args={[r, r, payload.height_m * 0.8, 6]} />
        <meshStandardMaterial color="#c9a227" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, payload.height_m * 0.9, 0]}>
        <cylinderGeometry args={[r * 0.15, r * 0.6, payload.height_m * 0.2, 16]} />
        <meshStandardMaterial color="#d8d8d8" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

// Ogive nose cone plus cylindrical body. Slightly translucent so the payload reads through.
export function FairingMesh({ fairing, livery }: { fairing: StackLayout["fairing"]; livery: Livery }) {
  const r = fairing.diameter_m / 2;
  const nose = useMemo(() => {
    const pts: Vector2[] = [];
    for (let k = 0; k <= 24; k++) {
      const t = k / 24;
      pts.push(new Vector2(Math.max(r * Math.sqrt(1 - t * t), 0.001), t * fairing.noseHeight_m));
    }
    return pts;
  }, [r, fairing.noseHeight_m]);
  const material = (
    <meshPhysicalMaterial color={livery.primary} metalness={0.1} roughness={0.35} transparent opacity={0.55} side={DoubleSide} />
  );
  return (
    <group position={[0, fairing.y_m, 0]}>
      <mesh position={[0, fairing.bodyHeight_m / 2, 0]} castShadow>
        <cylinderGeometry args={[r, r, fairing.bodyHeight_m, SEGMENTS, 1, true]} />
        {material}
      </mesh>
      <mesh position={[0, fairing.bodyHeight_m, 0]} castShadow>
        <latheGeometry args={[nose, SEGMENTS]} />
        {material}
      </mesh>
    </group>
  );
}
