// Owner: P3. POST VoiceRequest -> MP3 audio body. On failure 502; the UI then shows text only.
import { grokSpeech } from "@/lib/ai/grokClient";
import { capSentences, VoiceRequestSchema } from "@/lib/ai/schemas";

const TIMEOUT_MS = 8000;

export async function POST(req: Request): Promise<Response> {
  const parsed = VoiceRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid VoiceRequest" }, { status: 400 });
  }
  try {
    const audio = await grokSpeech(capSentences(parsed.data.text), TIMEOUT_MS);
    return new Response(audio, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  } catch (err) {
    console.warn("[voice] failed:", err instanceof Error ? err.message : err);
    return Response.json({ error: "voice unavailable" }, { status: 502 });
  }
}
