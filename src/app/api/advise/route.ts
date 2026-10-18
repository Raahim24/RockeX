// Owner: P3. POST AdviseRequest -> AdviseResponse. Always 200 with a usable message for a valid request.
import { advisorContext } from "@/lib/ai/context";
import { grokJson } from "@/lib/ai/grokClient";
import {
  ADVISOR_SYSTEM,
  advisorCandidates,
  advisorUserPrompt,
  fallbackAdvice,
  sameSuggestion,
} from "@/lib/ai/prompts";
import {
  ADVISE_REPLY_JSON_SCHEMA,
  AdviseReplySchema,
  AdviseRequestSchema,
  capSentences,
  rejectionReason,
  sanitizeSuggestion,
} from "@/lib/ai/schemas";
import { byId, loadCatalog } from "@/lib/physics/catalog";
import type { AdviseResponse } from "@/types";

const TIMEOUT_MS = 8000;
// Wording varies between replies (the fix itself is picked by code), so repeated roasts stay fresh.
const TEMPERATURE = 0.4;

const reply = (body: AdviseResponse, source: "grok" | "fallback"): Response =>
  Response.json(body, { headers: { "x-advise-source": source } });

export async function POST(req: Request): Promise<Response> {
  const parsed = AdviseRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid AdviseRequest" }, { status: 400 });
  }
  const { build, verdict } = parsed.data;
  const catalog = loadCatalog();
  const candidates = advisorCandidates(build, verdict, catalog);

  try {
    // Ask with some variety; if a check rejects the reply, ask once more with none and say what was wrong.
    const mission = byId(catalog.missions, build.missionId);
    let correction = "";
    for (const temperature of [TEMPERATURE, 0]) {
      const raw = await grokJson({
        system: ADVISOR_SYSTEM,
        user: advisorUserPrompt(build, verdict, catalog, candidates, advisorContext(build, verdict, catalog)) + correction,
        schemaName: "advise_reply",
        schema: ADVISE_REPLY_JSON_SCHEMA,
        timeoutMs: TIMEOUT_MS,
        temperature,
      });
      const grok = AdviseReplySchema.parse(raw);
      if (grok.suggestion) {
        const valid = sanitizeSuggestion(grok.suggestion, build, catalog);
        if (!valid || !candidates.some((c) => sameSuggestion(c.suggestion, valid))) {
          throw new Error(`suggestion not in candidates: ${JSON.stringify(grok.suggestion)}`);
        }
      }
      const message = capSentences(grok.message);
      const reason = rejectionReason(message, verdict.warnings, mission);
      if (reason) {
        console.warn("[advise] rejected (%s):", reason, message);
        correction = `\nCORRECTION: your last reply was rejected because ${reason}. Rewrite it.`;
        continue;
      }
      return reply({ message, suggestion: grok.suggestion }, "grok");
    }
    throw new Error("both replies failed the fact checks");
  } catch (err) {
    console.warn("[advise] fallback:", err instanceof Error ? err.message : err);
    return reply(fallbackAdvice(verdict, candidates, catalog), "fallback");
  }
}
