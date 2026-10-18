// Owner: P3. Grok Imagine flight video.
//   POST { build, image?, flight? } -> { id, outcome, promptUsed, withImage } or { id: null, fallback: true } on any failure.
//   GET  ?id=...           -> { status: "pending" } | { status: "done", videoUrl } | { status: "failed" }
// The outcome comes from code: the screen's own ascent sim when sent (`flight`), else the build's verdict.
// `image` is a still of the stack on the pad, used as the first frame so the clip shows this exact rocket.
import { grokVideoStart, grokVideoStatus, VIDEO_MODEL, VIDEO_SECONDS } from "@/lib/ai/grokClient";
import { BuildStateSchema } from "@/lib/ai/schemas";
import { flightVideoPlan } from "@/lib/ai/videoPrompt";
import { loadCatalog } from "@/lib/physics/catalog";
import { z } from "zod";

export const maxDuration = 30;

const START_TIMEOUT_MS = 20000;
const POLL_TIMEOUT_MS = 8000;
const MAX_IMAGE_CHARS = 3_000_000; // a 960x540 JPEG data URL is ~100 KB; reject anything absurd

const VideoRequestSchema = z.object({
  build: BuildStateSchema,
  image: z.string().startsWith("data:image/").max(MAX_IMAGE_CHARS).optional(),
  // The screen's own ascent result, so the clip tells the same story as the 3D launch.
  flight: z.object({ outcome: z.enum(["orbit", "shortfall", "impact"]), boosterLands: z.boolean() }).optional(),
});

// One clip per build, per server instance, so repeat launches of the same rocket never pay twice.
const started = new Map<string, { id: string; outcome: string; promptUsed: string; withImage: boolean }>();
const clipKey = (b: z.infer<typeof BuildStateSchema>, flight: unknown): string =>
  JSON.stringify([VIDEO_MODEL, VIDEO_SECONDS, b.missionId, b.payloadId, b.stages, b.livery.primary, b.livery.accent, flight ?? null]);

const notConfigured = (err: unknown): boolean => err instanceof Error && err.message.includes("XAI_API_KEY is not set");

export async function POST(req: Request): Promise<Response> {
  const parsed = VideoRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid video request" }, { status: 400 });
  }
  const { build, image, flight } = parsed.data;
  const key = clipKey(build, flight);
  const cached = started.get(key);
  if (cached) return Response.json(cached);

  const { outcome, prompt } = flightVideoPlan(build, loadCatalog(), flight, VIDEO_SECONDS);
  try {
    let withImage = Boolean(image);
    let id: string;
    try {
      id = await grokVideoStart({ prompt, image, timeoutMs: START_TIMEOUT_MS });
    } catch (err) {
      if (!image || notConfigured(err)) throw err;
      // The first frame is a bonus: if xAI rejects it, film from the prompt alone.
      console.warn("[video] retry without start image:", err instanceof Error ? err.message : err);
      withImage = false;
      id = await grokVideoStart({ prompt, timeoutMs: START_TIMEOUT_MS });
    }
    const body = { id, outcome, promptUsed: prompt, withImage };
    started.set(key, body);
    return Response.json(body);
  } catch (err) {
    console.warn("[video] fallback:", err instanceof Error ? err.message : err);
    return Response.json({ id: null, outcome, promptUsed: prompt, fallback: true, reason: notConfigured(err) ? "not_configured" : "unavailable" });
  }
}

export async function GET(req: Request): Promise<Response> {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^[\w-]{1,128}$/.test(id)) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }
  try {
    const s = await grokVideoStatus(id, POLL_TIMEOUT_MS);
    return Response.json(s.status === "done" ? { status: "done", videoUrl: s.url } : { status: s.status });
  } catch (err) {
    console.warn("[video] poll failed:", err instanceof Error ? err.message : err);
    return Response.json({ status: "failed" });
  }
}
