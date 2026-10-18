// Owner: P3. POST { build, verdict, token? } -> { instructions, keyterms, model, voice, token?, expiresAt? }.
// Gives the browser what it needs for the live voice session: fresh instructions for the rocket on screen and,
// when asked, a short-lived token to open the WebSocket. 502 when no token can be made (UI falls back).
import { grokRealtimeToken, REALTIME_MODEL, REALTIME_VOICE } from "@/lib/ai/grokClient";
import { LIVE_WELCOME, realtimeInstructions, realtimeKeyterms } from "@/lib/ai/realtime";
import { AdviseRequestSchema } from "@/lib/ai/schemas";
import { loadCatalog } from "@/lib/physics/catalog";
import { z } from "zod";

const TIMEOUT_MS = 8000;
const TOKEN_SECONDS = 300; // only needed to open the socket; the session itself lasts up to xAI's limit

const RealtimeRequestSchema = AdviseRequestSchema.extend({
  token: z.boolean().default(false),
  /** What is actually built on screen, in words (from the assembly screen). */
  screen: z.string().max(2000).default(""),
});

// Tokens cost money: only pages served by this app may ask for one (browsers always send Origin on POST).
const sameOrigin = (req: Request): boolean => {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return origin !== null && host !== null && new URL(origin).host === host;
};

export async function POST(req: Request): Promise<Response> {
  const parsed = RealtimeRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }
  const { build, verdict, token, screen } = parsed.data;
  const catalog = loadCatalog();
  const body = {
    instructions: realtimeInstructions(build, verdict, catalog, screen),
    keyterms: realtimeKeyterms(catalog),
    welcome: LIVE_WELCOME,
    model: REALTIME_MODEL,
    voice: REALTIME_VOICE,
  };
  if (!token) {
    return Response.json(body);
  }
  if (!sameOrigin(req)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const { value, expiresAt } = await grokRealtimeToken(TOKEN_SECONDS, TIMEOUT_MS);
    return Response.json({ ...body, token: value, expiresAt }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.warn("[realtime] no token:", err instanceof Error ? err.message : err);
    return Response.json({ error: "live voice unavailable" }, { status: 502 });
  }
}
