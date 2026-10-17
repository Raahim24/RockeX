// Owner: P3. Zod schemas for AI route input and Grok output, plus the id check.
import type { Catalog } from "@/lib/physics/catalog";
import type { AdviseRequest, AdviseResponse, BuildState, RenderRequest, Suggestion, Verdict } from "@/types";
import { z } from "zod";

const MAX_ENGINES = 9;

const LiverySchema = z.object({
  primary: z.string(),
  accent: z.string(),
  stripe: z.boolean(),
  patch: z.string().nullable(),
});

const StageBuildSchema = z.object({
  engineId: z.string(),
  engineCount: z.number(),
  tankId: z.string(),
});

const BuildStateSchema = z.object({
  missionId: z.string(),
  stages: z.array(StageBuildSchema),
  payloadId: z.string(),
  livery: LiverySchema,
}) satisfies z.ZodType<BuildState>;

const StageResultSchema = z.object({
  stageIndex: z.number(),
  ispUsed_s: z.number(),
  startMass_kg: z.number(),
  endMass_kg: z.number(),
  deltaV_ms: z.number(),
});

const VerdictSchema = z.object({
  stages: z.array(StageResultSchema),
  totalDeltaV_ms: z.number(),
  requiredDeltaV_ms: z.number(),
  marginDeltaV_ms: z.number(),
  liftoffTWR: z.number(),
  deltaVOk: z.boolean(),
  twrOk: z.boolean(),
  feasible: z.boolean(),
  totalMass_kg: z.number(),
  liftoffThrust_kN: z.number(),
  closestRocketId: z.string(),
  warnings: z.array(z.string()),
}) satisfies z.ZodType<Verdict>;

export const AdviseRequestSchema = z.object({
  build: BuildStateSchema,
  verdict: VerdictSchema,
}) satisfies z.ZodType<AdviseRequest>;

export const RenderRequestSchema = z.object({
  build: BuildStateSchema,
  verdict: VerdictSchema,
}) satisfies z.ZodType<RenderRequest>;

const StageIndex = z.number().int().min(0).max(MAX_ENGINES);

export const SuggestionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("swap_engine"), stageIndex: StageIndex, engineId: z.string() }),
  z.object({
    type: z.literal("set_engine_count"),
    stageIndex: StageIndex,
    engineCount: z.number().int().min(1).max(MAX_ENGINES),
  }),
  z.object({ type: z.literal("swap_tank"), stageIndex: StageIndex, tankId: z.string() }),
  z.object({ type: z.literal("add_stage"), engineId: z.string(), tankId: z.string() }),
]) satisfies z.ZodType<Suggestion>;

export const AdviseReplySchema = z.object({
  message: z.string().min(1).max(300),
  suggestion: SuggestionSchema.nullable(),
}) satisfies z.ZodType<AdviseResponse>;

/** JSON Schema sent to Grok as the strict output format. */
export const ADVISE_REPLY_JSON_SCHEMA: Record<string, unknown> = (() => {
  const schema: Record<string, unknown> = { ...z.toJSONSchema(AdviseReplySchema) };
  delete schema.$schema;
  return schema;
})();

const hasId = (items: { id: string }[], id: string): boolean => items.some((item) => item.id === id);

/** Returns the suggestion only if every id and index refers to something real; otherwise null. */
export const sanitizeSuggestion = (
  suggestion: Suggestion | null,
  build: BuildState,
  catalog: Catalog,
): Suggestion | null => {
  if (!suggestion) {
    return null;
  }
  const stageExists = "stageIndex" in suggestion && suggestion.stageIndex < build.stages.length;
  switch (suggestion.type) {
    case "swap_engine":
      return stageExists && hasId(catalog.engines, suggestion.engineId) ? suggestion : null;
    case "swap_tank":
      return stageExists && hasId(catalog.tanks, suggestion.tankId) ? suggestion : null;
    case "set_engine_count":
      return stageExists ? suggestion : null;
    case "add_stage":
      return hasId(catalog.engines, suggestion.engineId) && hasId(catalog.tanks, suggestion.tankId)
        ? suggestion
        : null;
  }
};

/** Keeps at most the first two sentences. Splits only on punctuation followed by whitespace, so "1.4" survives. */
export const capSentences = (text: string, max = 2): string =>
  text
    .trim()
    .split(/(?<=[.!?])\s+/)
    .slice(0, max)
    .join(" ");
