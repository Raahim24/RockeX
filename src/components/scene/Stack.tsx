"use client";
// Owner: P1. Reads the build from the store and renders the stacked rocket.
import { useMemo } from "react";
import { useBuild } from "@/store/buildStore";
import { catalog } from "./catalog";
import { computeStackLayout, type StackLayout } from "./geometry";
import { EngineCluster, FairingMesh, InterstageMesh, PayloadMesh, TankMesh } from "./PartMesh";

export function useStackLayout(): StackLayout {
  const build = useBuild();
  return useMemo(() => computeStackLayout(build, catalog), [build]);
}

export default function Stack({ layout }: { layout: StackLayout }) {
  const { livery } = useBuild();
  return (
    <group>
      {layout.stages.map((stage) => (
        <group key={stage.stageIndex}>
          <InterstageMesh stage={stage} livery={livery} />
          <EngineCluster stage={stage} />
          <TankMesh stage={stage} livery={livery} />
        </group>
      ))}
      <PayloadMesh payload={layout.payload} />
      <FairingMesh fairing={layout.fairing} livery={livery} />
    </group>
  );
}
