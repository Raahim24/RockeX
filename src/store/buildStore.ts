// Owner: P2. Single source of truth. Verdict is derived, never stored (spec §6).
import { create } from "zustand";
import type { BuildState, Livery, Suggestion, Verdict } from "@/types";

const DEFAULT_LIVERY: Livery = { primary: "#f5f5f5", accent: "#111111", stripe: true, patch: null };

// Phase 0: hardcoded placeholder. Phase 2 replaces with src/data/demo-build.json (P4 + P2).
const DEMO_BUILD: BuildState = {
  missionId: "moon-transfer",
  stages: [
    { engineId: "TODO(source)", engineCount: 9, tankId: "TODO(source)" },
    { engineId: "TODO(source)", engineCount: 1, tankId: "TODO(source)" },
  ],
  payloadId: "TODO(source)",
  livery: DEFAULT_LIVERY,
};

const EMPTY_BUILD: BuildState = { missionId: "", stages: [], payloadId: "", livery: DEFAULT_LIVERY };

interface BuildStore {
  build: BuildState;
  setMission: (id: string) => void;
  setStageEngine: (i: number, id: string) => void;
  setEngineCount: (i: number, n: number) => void;
  setStageTank: (i: number, id: string) => void;
  addStage: () => void;
  removeStage: (i: number) => void;
  setPayload: (id: string) => void;
  setLivery: (l: Livery) => void;
  applySuggestion: (s: Suggestion) => void;
  loadDemoBuild: () => void;
  reset: () => void;
}

const updateStage = (b: BuildState, i: number, patch: Partial<BuildState["stages"][number]>): BuildState => ({
  ...b,
  stages: b.stages.map((s, j) => (j === i ? { ...s, ...patch } : s)),
});

export const useBuildStore = create<BuildStore>((set) => ({
  build: DEMO_BUILD,
  setMission: (id) => set(({ build }) => ({ build: { ...build, missionId: id } })),
  setStageEngine: (i, id) => set(({ build }) => ({ build: updateStage(build, i, { engineId: id }) })),
  // TODO(P2, Phase 1): clamp to the engine-fit rule (spec §7).
  setEngineCount: (i, n) => set(({ build }) => ({ build: updateStage(build, i, { engineCount: n }) })),
  setStageTank: (i, id) => set(({ build }) => ({ build: updateStage(build, i, { tankId: id }) })),
  addStage: () => set(({ build }) => ({ build: { ...build, stages: [...build.stages, { engineId: "", engineCount: 1, tankId: "" }] } })),
  removeStage: (i) => set(({ build }) => ({ build: { ...build, stages: build.stages.filter((_, j) => j !== i) } })),
  setPayload: (id) => set(({ build }) => ({ build: { ...build, payloadId: id } })),
  setLivery: (l) => set(({ build }) => ({ build: { ...build, livery: l } })),
  // TODO(P2, Phase 1): ignore suggestions whose ids are not in src/data/.
  applySuggestion: () => {},
  loadDemoBuild: () => set({ build: DEMO_BUILD }),
  reset: () => set({ build: EMPTY_BUILD }),
}));

export const useBuild = (): BuildState => useBuildStore((s) => s.build);

// TODO(P2, Phase 1): derive from lib/physics (deltav, twr, feasibility, closest).
export const useVerdict = (): Verdict => {
  const build = useBuild();
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
    warnings: build.stages.length === 0 ? ["empty build"] : [],
  };
};
