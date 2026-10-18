import { byId, type Catalog } from "@/lib/physics/catalog";
import { sanitizeEngineCount } from "@/lib/physics/feasibility";
import type { BuildState, Suggestion } from "@/types";

const updateStage = (b: BuildState, i: number, patch: Partial<BuildState["stages"][number]>): BuildState => ({
  ...b,
  stages: b.stages.map((s, j) => (j === i ? { ...s, ...patch } : s)),
});

// Ignores unknown ids. Engine counts are not cut to fit the tank; the verdict flags that with a reason.
export const applySuggestionToBuild = (
  build: BuildState,
  suggestion: Suggestion,
  catalog: Catalog,
): BuildState => {
  switch (suggestion.type) {
    case "swap_engine": {
      const engine = byId(catalog.engines, suggestion.engineId);
      if (!engine || !build.stages[suggestion.stageIndex]) {
        return build;
      }
      return updateStage(build, suggestion.stageIndex, { engineId: engine.id });
    }
    case "swap_tank": {
      const tank = byId(catalog.tanks, suggestion.tankId);
      if (!tank || !build.stages[suggestion.stageIndex]) {
        return build;
      }
      return updateStage(build, suggestion.stageIndex, { tankId: tank.id });
    }
    case "set_engine_count": {
      if (!build.stages[suggestion.stageIndex]) {
        return build;
      }
      return updateStage(build, suggestion.stageIndex, {
        engineCount: sanitizeEngineCount(suggestion.engineCount),
      });
    }
    case "add_stage": {
      const engine = byId(catalog.engines, suggestion.engineId);
      const tank = byId(catalog.tanks, suggestion.tankId);
      if (!engine || !tank) {
        return build;
      }
      return {
        ...build,
        stages: [...build.stages, { engineId: engine.id, tankId: tank.id, engineCount: 1 }],
      };
    }
  }
};
