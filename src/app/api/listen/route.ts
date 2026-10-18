// Owner: P3. POST multipart { audio } -> { text } via Grok speech to text. On failure 502; the UI asks again.
import { grokTranscribe } from "@/lib/ai/grokClient";

const TIMEOUT_MS = 8000;
const MAX_BYTES = 2_000_000; // a held-orb question is a few seconds; this is ~1 minute of compressed audio

// Browsers record WebM, Ogg or MP4. xAI auto-detects the container; WebM is Matroska, which it lists as MKV.
const filenameFor = (type: string): string =>
  type.includes("ogg") ? "speech.ogg" : type.includes("mp4") ? "speech.mp4" : type.includes("wav") ? "speech.wav" : "speech.mkv";

export async function POST(req: Request): Promise<Response> {
  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0 || audio.size > MAX_BYTES) {
    return Response.json({ error: "invalid audio" }, { status: 400 });
  }
  try {
    const text = await grokTranscribe(audio, filenameFor(audio.type), TIMEOUT_MS);
    return Response.json({ text: text.slice(0, 300) });
  } catch (err) {
    console.warn("[listen] failed:", err instanceof Error ? err.message : err);
    return Response.json({ error: "speech to text unavailable" }, { status: 502 });
  }
}
