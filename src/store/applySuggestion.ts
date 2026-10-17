import { byId, type Catalog } from "@/lib/physics/catalog";
import { clampEngineCount } from "@/lib/physics/feasibility";
import type { BuildState, Suggestion } from "@/types";

const updateStage = (b: BuildState, i: number, patch: Partial<BuildState["stages"][number]>): BuildState => ({
  ...b,
  stages: b.stages.map((s, j) => (j === i ? { ...s, ...patch } : s)),
});

export const applySuggestionToBuild = (
  build: BuildState,
  suggestion: Suggestion,
  catalog: Catalog,
): BuildState => {
  switch (suggestion.type) {
    case "swap_engine": {
      const engine = byId(catalog.engines, suggestion.engineId);
      const stage = build.stages[suggestion.stageIndex];
      if (!engine || !stage) {
        return build;
      }
      const tank = byId(catalog.tanks, stage.tankId);
      return updateStage(build, suggestion.stageIndex, {
        engineId: engine.id,
        engineCount: clampEngineCount(stage.engineCount, tank, engine),
      });
    }
    case "swap_tank": {
      const tank = byId(catalog.tanks, suggestion.tankId);
      const stage = build.stages[suggestion.stageIndex];
      if (!tank || !stage) {
        return build;
      }
      const engine = byId(catalog.engines, stage.engineId);
      return updateStage(build, suggestion.stageIndex, {
        tankId: tank.id,
        engineCount: clampEngineCount(stage.engineCount, tank, engine),
      });
    }
    case "set_engine_count": {
      const stage = build.stages[suggestion.stageIndex];
      if (!stage) {
        return build;
      }
      const engine = byId(catalog.engines, stage.engineId);
      const tank = byId(catalog.tanks, stage.tankId);
      return updateStage(build, suggestion.stageIndex, {
        engineCount: clampEngineCount(suggestion.engineCount, tank, engine),
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
        stages: [
          ...build.stages,
          {
            engineId: engine.id,
            tankId: tank.id,
            engineCount: clampEngineCount(1, tank, engine),
          },
        ],
      };
    }
  }
};
