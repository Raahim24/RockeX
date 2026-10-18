// Owner: P3. "Your Mission Story": POST { build, image?, flight? } -> { scenes: [{ id, title, caption, imageUrl }] }.
// Chapters and captions come from code (storyboard.ts). The pad chapter is edited from our own 3D still so it
// shows this exact rocket; the rest are generated on the cheapest image model. All scenes run in parallel.
// A scene that fails is left out; if every scene fails the reply is { scenes: [], fallback: true, reason }.
import { grokStill, grokStillEdit } from "@/lib/ai/grokClient";
import { BuildStateSchema } from "@/lib/ai/schemas";
import { storyScenes } from "@/lib/ai/storyboard";
import { loadCatalog } from "@/lib/physics/catalog";
import { z } from "zod";

export const maxDuration = 60;

const TIMEOUT_MS = 50000;
const MAX_IMAGE_CHARS = 3_000_000;

const StoryboardRequestSchema = z.object({
  build: BuildStateSchema,
  image: z.string().startsWith("data:image/").max(MAX_IMAGE_CHARS).optional(),
  flight: z.object({ outcome: z.enum(["orbit", "shortfall", "impact"]), boosterLands: z.boolean() }).optional(),
});

type Reply = { scenes: { id: string; title: string; caption: string; imageUrl: string }[]; fallback?: true; reason?: string };

// One storyboard per build and flight, per server instance: launching the same rocket again is free.
const made = new Map<string, Reply>();

export async function POST(req: Request): Promise<Response> {
  const parsed = StoryboardRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid storyboard request" }, { status: 400 });
  }
  const { build, image, flight } = parsed.data;
  const key = JSON.stringify([build.missionId, build.payloadId, build.stages, build.livery.primary, build.livery.accent, flight ?? null]);
  const cached = made.get(key);
  if (cached) return Response.json(cached);

  const scenes = storyScenes(build, loadCatalog(), flight);
  const errors: string[] = [];
  const results = await Promise.all(
    scenes.map(async (s) => {
      try {
        const imageUrl = s.fromStill && image ? await grokStillEdit(s.prompt, image, TIMEOUT_MS) : await grokStill(s.prompt, TIMEOUT_MS);
        return { id: s.id, title: s.title, caption: s.caption, imageUrl };
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
        return null;
      }
    }),
  );
  const ok = results.filter((r): r is NonNullable<typeof r> => r !== null);
  if (errors.length) console.warn("[storyboard]", errors.length, "scene(s) failed:", errors[0]);
  if (ok.length === 0) {
    const reason = errors.some((e) => e.includes("XAI_API_KEY is not set")) ? "not_configured" : "unavailable";
    return Response.json({ scenes: [], fallback: true, reason } satisfies Reply);
  }
  const reply: Reply = { scenes: ok };
  if (ok.length === scenes.length) made.set(key, reply);
  return Response.json(reply);
}
