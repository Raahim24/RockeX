// Owner: P3. "Your Mission Story": POST { build, image?, flight? } -> { scenes: [{ id, title, caption, imageUrl }] }.
// Chapters and captions come from code (storyboard.ts). Chapter 1 turns our own 3D still into a photo of this
// exact rocket; every other chapter that shows the rocket is edited from that photo so it stays identical.
// A scene that fails is left out; if every scene fails the reply is { scenes: [], fallback: true, reason }.
import { grokStill, grokStillEdit } from "@/lib/ai/grokClient";
import { BuildStateSchema } from "@/lib/ai/schemas";
import { storyScenes, type StoryScene } from "@/lib/ai/storyboard";
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
  const render = async (s: StoryScene, ref: string | undefined) => {
    try {
      const imageUrl = ref ? await grokStillEdit(s.prompt, ref, TIMEOUT_MS) : await grokStill(s.prompt, TIMEOUT_MS);
      return { id: s.id, title: s.title, caption: s.caption, imageUrl };
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      return null;
    }
  };
  // 1. Chapter 1 from our 3D still. 2. Every rocket chapter edited from that photo, so the rocket stays identical
  // (falling back to the 3D still if chapter 1 failed); scenes without the rocket are plain generations.
  const first = scenes.filter((s) => s.reference === "still");
  const firstDone = await Promise.all(first.map((s) => render(s, image)));
  const padPhoto = firstDone.find((r) => r?.id === "pad")?.imageUrl ?? image;
  const restDone = await Promise.all(
    scenes.filter((s) => s.reference !== "still").map((s) => render(s, s.reference === "pad" ? padPhoto : undefined)),
  );
  const byId = new Map([...firstDone, ...restDone].filter((r) => r !== null).map((r) => [r.id, r]));
  const results = scenes.map((s) => byId.get(s.id) ?? null);
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
