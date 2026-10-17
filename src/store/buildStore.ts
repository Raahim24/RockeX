// Owner: P2. Single source of truth. Verdict is derived, never stored (spec §6).
import { byId, loadCatalog } from "@/lib/physics/catalog";
import { clampEngineCount, evaluateBuild } from "@/lib/physics/feasibility";
import type { BuildState, Livery, Suggestion, Verdict } from "@/types";
import { create } from "zustand";
import { applySuggestionToBuild } from "./applySuggestion";

const DEFAULT_LIVERY: Livery = { primary: "#f5f5f5", accent: "#111111", stripe: true, patch: null };

// Canonical demo (P2 + P4): red, ~905 m/s short. TWR 1.64: a real Falcon 9 first stage with its 9 Merlins.
export const DEMO_BUILD: BuildState = {
  missionId: "moon-transfer",
  stages: [
    { engineId: "merlin-1d", engineCount: 9, tankId: "falcon9-s1-tank" },
    { engineId: "rl10b-2", engineCount: 1, tankId: "dcss-5m-tank" },
  ],
  payloadId: "jwst",
  livery: DEFAULT_LIVERY,
};

// The one documented swap that turns the demo green; also the advisor's built-in fallback. Must be a single Suggestion.
export const DEMO_FIX: Suggestion | null = { type: "add_stage", engineId: "rl10c-1", tankId: "centaur-iii-tank" };

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

const catalogFor = () => loadCatalog();

export const useBuildStore = create<BuildStore>((set) => ({
  build: DEMO_BUILD,
  setMission: (id) => set(({ build }) => ({ build: { ...build, missionId: id } })),
  setStageEngine: (i, id) =>
    set(({ build }) => {
      const catalog = catalogFor();
      const stage = build.stages[i];
      if (!stage) {
        return { build };
      }
      const engine = byId(catalog.engines, id);
      const tank = byId(catalog.tanks, stage.tankId);
      return {
        build: updateStage(build, i, {
          engineId: id,
          engineCount: clampEngineCount(stage.engineCount, tank, engine),
        }),
      };
    }),
  setEngineCount: (i, n) =>
    set(({ build }) => {
      const catalog = catalogFor();
      const stage = build.stages[i];
      if (!stage) {
        return { build };
      }
      const engine = byId(catalog.engines, stage.engineId);
      const tank = byId(catalog.tanks, stage.tankId);
      return { build: updateStage(build, i, { engineCount: clampEngineCount(n, tank, engine) }) };
    }),
  setStageTank: (i, id) =>
    set(({ build }) => {
      const catalog = catalogFor();
      const stage = build.stages[i];
      if (!stage) {
        return { build };
      }
      const tank = byId(catalog.tanks, id);
      const engine = byId(catalog.engines, stage.engineId);
      return {
        build: updateStage(build, i, {
          tankId: id,
          engineCount: clampEngineCount(stage.engineCount, tank, engine),
        }),
      };
    }),
  addStage: () =>
    set(({ build }) => ({
      build: { ...build, stages: [...build.stages, { engineId: "", engineCount: 1, tankId: "" }] },
    })),
  removeStage: (i) =>
    set(({ build }) => ({ build: { ...build, stages: build.stages.filter((_, j) => j !== i) } })),
  setPayload: (id) => set(({ build }) => ({ build: { ...build, payloadId: id } })),
  setLivery: (l) => set(({ build }) => ({ build: { ...build, livery: l } })),
  applySuggestion: (s) =>
    set(({ build }) => ({ build: applySuggestionToBuild(build, s, catalogFor()) })),
  loadDemoBuild: () => set({ build: DEMO_BUILD }),
  reset: () => set({ build: EMPTY_BUILD }),
}));

export const useBuild = (): BuildState => useBuildStore((s) => s.build);

export const useVerdict = (): Verdict => {
  const build = useBuild();
  return evaluateBuild(build, catalogFor());
};
