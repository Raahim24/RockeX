"use client";
// Owner: P1. Livery colors and the accent stripe band. Phase 2 adds the picker UI.
import type { Livery } from "@/types";

export const ENGINE_METAL = "#3a3a3c";
export const ENGINE_INNER = "#1b1b1d";

interface StripeProps {
  livery: Livery;
  y_m: number; // center of the band
  diameter_m: number;
  height_m: number;
}

// A thin accent band wrapped just outside a tank.
export function StripeBand({ livery, y_m, diameter_m, height_m }: StripeProps) {
  if (!livery.stripe) return null;
  const r = diameter_m / 2 + diameter_m * 0.004;
  return (
    <mesh position={[0, y_m, 0]} castShadow>
      <cylinderGeometry args={[r, r, height_m, 64, 1, true]} />
      <meshStandardMaterial color={livery.accent} metalness={0.2} roughness={0.5} />
    </mesh>
  );
}
