// Owner: P3. POST AdviseRequest -> AdviseResponse. Always 200 with a usable message for a valid request.
import { grokJson } from "@/lib/ai/grokClient";
import { ADVISOR_SYSTEM, advisorUserPrompt, fallbackAdvice } from "@/lib/ai/prompts";
import {
  ADVISE_REPLY_JSON_SCHEMA,
  AdviseReplySchema,
  AdviseRequestSchema,
  capSentences,
  sanitizeSuggestion,
} from "@/lib/ai/schemas";
import { loadCatalog } from "@/lib/physics/catalog";
import type { AdviseResponse } from "@/types";

const TIMEOUT_MS = 8000;

const reply = (body: AdviseResponse, source: "grok" | "fallback"): Response =>
  Response.json(body, { headers: { "x-advise-source": source } });

export async function POST(req: Request): Promise<Response> {
  const parsed = AdviseRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid AdviseRequest" }, { status: 400 });
  }
  const { build, verdict } = parsed.data;
  const catalog = loadCatalog();

  try {
    const raw = await grokJson({
      system: ADVISOR_SYSTEM,
      user: advisorUserPrompt(build, verdict, catalog),
      schemaName: "advise_reply",
      schema: ADVISE_REPLY_JSON_SCHEMA,
      timeoutMs: TIMEOUT_MS,
    });
    const grok = AdviseReplySchema.parse(raw);
    return reply(
      {
        message: capSentences(grok.message),
        suggestion: sanitizeSuggestion(grok.suggestion, build, catalog),
      },
      "grok",
    );
  } catch (err) {
    console.warn("[advise] fallback:", err instanceof Error ? err.message : err);
    return reply(fallbackAdvice(verdict), "fallback");
  }
}
