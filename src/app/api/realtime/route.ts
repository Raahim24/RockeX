// Owner: P3. POST { build, verdict, token? } -> { instructions, keyterms, model, voice, token?, expiresAt? }.
// Gives the browser what it needs for the live voice session: fresh instructions for the rocket on screen and,
// when asked, a short-lived token to open the WebSocket. 502 when no token can be made (UI falls back).
import { guard } from "@/lib/ai/guard";
import { grokRealtimeToken, REALTIME_MODEL, REALTIME_VOICE } from "@/lib/ai/grokClient";
import { LIVE_WELCOME, realtimeInstructions, realtimeKeyterms } from "@/lib/ai/realtime";
import { AdviseRequestSchema, AgentTurnSchema } from "@/lib/ai/schemas";
import { loadCatalog } from "@/lib/physics/catalog";
import { z } from "zod";

const TIMEOUT_MS = 8000;
const TOKEN_SECONDS = 300; // only needed to open the socket; the session itself lasts up to xAI's limit

const RealtimeRequestSchema = AdviseRequestSchema.extend({
  token: z.boolean().default(false),
  /** What is actually built on screen, in words (from the assembly screen). */
  screen: z.string().max(2000).default(""),
  /** The conversation so far on this page, so a new session continues it. */
  history: z.array(AgentTurnSchema).max(20).default([]),
});

export async function POST(req: Request): Promise<Response> {
  // Refreshes (instructions only) happen as the rocket changes; tokens cost money, so they get a tight budget.
  const wantsToken = req.headers.get("x-grok-token") === "1";
  const blocked = guard(req, wantsToken ? { bucket: "realtime-token", perMinute: 6, maxBytes: 64_000 } : { bucket: "realtime", perMinute: 120, maxBytes: 64_000 });
  if (blocked) return blocked;
  const parsed = RealtimeRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }
  const { build, verdict, token, screen, history } = parsed.data;
  const catalog = loadCatalog();
  const body = {
    instructions: realtimeInstructions(build, verdict, catalog, screen, history),
    keyterms: realtimeKeyterms(catalog),
    welcome: LIVE_WELCOME,
    model: REALTIME_MODEL,
    voice: REALTIME_VOICE,
  };
  if (!token) {
    return Response.json(body);
  }
  if (!wantsToken) {
    return Response.json({ error: "token requests must be marked" }, { status: 400 }); // keeps them on the tight budget
  }
  try {
    const { value, expiresAt } = await grokRealtimeToken(TOKEN_SECONDS, TIMEOUT_MS);
    return Response.json({ ...body, token: value, expiresAt }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.warn("[realtime] no token:", err instanceof Error ? err.message : err);
    return Response.json({ error: "live voice unavailable" }, { status: 502 });
  }
}
