// Owner: P3. Zod schemas for AI route input and Grok output, plus the id check.
import type { Catalog } from "@/lib/physics/catalog";
import type {
  AdviseRequest,
  AdviseResponse,
  BuildState,
  RenderRequest,
  Suggestion,
  Verdict,
  VoiceRequest,
} from "@/types";
import { z } from "zod";

const MAX_ENGINES = 9;

// Every field is capped so a request can't be used to push huge text into prompts or logs.
const id = z.string().max(64);
const LiverySchema = z.object({
  primary: z.string().max(32),
  accent: z.string().max(32),
  stripe: z.boolean(),
  patch: z.string().max(64).nullable(),
});

const StageBuildSchema = z.object({
  engineId: id,
  engineCount: z.number(),
  tankId: id,
});

const BuildStateSchema = z.object({
  missionId: id,
  stages: z.array(StageBuildSchema).max(10),
  payloadId: id,
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
  stages: z.array(StageResultSchema).max(10),
  totalDeltaV_ms: z.number(),
  requiredDeltaV_ms: z.number(),
  marginDeltaV_ms: z.number(),
  liftoffTWR: z.number(),
  deltaVOk: z.boolean(),
  twrOk: z.boolean(),
  feasible: z.boolean(),
  totalMass_kg: z.number(),
  liftoffThrust_kN: z.number(),
  closestRocketId: id,
  warnings: z.array(z.string().max(200)).max(40),
}) satisfies z.ZodType<Verdict>;

export const AdviseRequestSchema = z.object({
  build: BuildStateSchema,
  verdict: VerdictSchema,
}) satisfies z.ZodType<AdviseRequest>;

export const RenderRequestSchema = z.object({
  build: BuildStateSchema,
  verdict: VerdictSchema,
}) satisfies z.ZodType<RenderRequest>;

export const VoiceRequestSchema = z.object({
  text: z.string().trim().min(1).max(300),
}) satisfies z.ZodType<VoiceRequest>;

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

// Talk to Grok (/api/agent). Not part of the frozen contract: only this route and the Grok panel use it.
export const AgentTurnSchema = z.object({
  role: z.enum(["user", "grok"]),
  text: z.string().max(300),
});
export type AgentTurn = z.infer<typeof AgentTurnSchema>;

export const AgentRequestSchema = z
  .object({
    /** "welcome": the user just arrived; Grok greets and explains how to start. "question": they asked something. */
    moment: z.enum(["welcome", "question"]).default("question"),
    question: z.string().trim().max(300).default(""),
    history: z.array(AgentTurnSchema).max(8),
    /** What is actually built on screen, in words (from the assembly screen). */
    screen: z.string().max(2000).default(""),
    build: BuildStateSchema,
    verdict: VerdictSchema,
  })
  .refine((r) => r.moment === "welcome" || r.question.length > 0, { message: "question is required" });
export type AgentRequest = z.infer<typeof AgentRequestSchema>;

export const AgentReplySchema = z.object({
  message: z.string().min(1).max(300),
  action: SuggestionSchema.nullable(),
});
export type AgentReply = z.infer<typeof AgentReplySchema>;

export const AGENT_REPLY_JSON_SCHEMA: Record<string, unknown> = (() => {
  const schema: Record<string, unknown> = { ...z.toJSONSchema(AgentReplySchema) };
  delete schema.$schema;
  return schema;
})();

// Claims Grok tends to make up: a rule problem the verdict does not have. Each pattern only counts as made up
// when no warning contains the matching key. Used to reject a reply and ask again.
const RULE_CLAIMS: { pattern: RegExp; warning: string }[] = [
  {
    pattern: /vacuum[- ]only|can'?t light|cannot light|won'?t light|on the pad anyway|(zero|no) sea[- ]level thrust|can'?t (sit|go|be|ride) on stage (1|one)/i,
    warning: "vacuum-only",
  },
  { pattern: /propellants? (don'?t|do not) match|wrong (fuel|propellant)/i, warning: "propellant" },
  { pattern: /(don'?t|do not|doesn'?t) fit|too many engines/i, warning: "don't fit" },
  { pattern: /dry mass/i, warning: "dry mass" },
];

/** True when the message claims a rule problem that is not in the verdict's warnings. */
export const claimsMissingRule = (message: string, warnings: string[]): boolean =>
  RULE_CLAIMS.some(({ pattern, warning }) => pattern.test(message) && !warnings.some((w) => w.includes(warning)));

/** True when the user asked for a change to the rocket (only then may Grok make one). */
export const asksForChange = (question: string): boolean =>
  /\b(add|swap|change|use|make|put|replace|remove|try|give|set|switch|upgrade|bolt|stick|slap|fix)\b/i.test(question);

// Words that only fit one mission. Grok tends to upgrade "Moon transfer" to "lunar orbit" and the like.
const MISSION_WORDS: Record<string, RegExp> = {
  "lunar-orbit": /lunar orbit|orbit(ing)? (around )?the moon/i,
  "mars-transfer": /\bmars\b/i,
  gto: /geostationary|\bGTO\b/i,
  "earth-escape": /escape velocity|escap(e|ing) earth/i,
};

/** True when the message names another mission's destination than the one being flown. */
export const mentionsOtherMission = (message: string, missionId: string): boolean =>
  Object.entries(MISSION_WORDS).some(([id, pattern]) => id !== missionId && pattern.test(message));

// Language that isn't okay in an app for young people (whole words, any case).
const NOT_FOR_KIDS = /\b(fuck\w*|shit\w*|bitch\w*|bastard|asshole|dick|cunt|piss\w*|slut|whore|retard\w*|damn)\b/i;

/** True when a reply uses language that isn't okay for young users. */
export const notForKids = (message: string): boolean => NOT_FOR_KIDS.test(message);

/** Why a reply must be rewritten, in words Grok can act on; null when it passes the checks. */
export const rejectionReason = (
  message: string,
  warnings: string[],
  mission: { id: string; name: string; destination: string } | undefined,
): string | null => {
  if (notForKids(message)) {
    return "it used language that is not okay for young users; keep it clean";
  }
  if (claimsMissingRule(message, warnings)) {
    return "it claimed a rule problem that is not in the verdict's Warnings";
  }
  if (mission && mentionsOtherMission(message, mission.id)) {
    return `it named a destination this mission does not go to. The mission is ${mission.name}: ${mission.destination}. Say only that, in plain words`;
  }
  return null;
};
