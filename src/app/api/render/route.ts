// Owner: P3. POST RenderRequest -> RenderResponse. On any Grok failure returns the cached image.
import { grokImage } from "@/lib/ai/grokClient";
import { renderPrompt } from "@/lib/ai/prompts";
import { RenderRequestSchema } from "@/lib/ai/schemas";
import { loadCatalog } from "@/lib/physics/catalog";
import type { RenderResponse } from "@/types";

export const maxDuration = 60;

const TIMEOUT_MS = 55000;
const CACHED_IMAGE = "/fallback/render.jpg";

export async function POST(req: Request): Promise<Response> {
  const parsed = RenderRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid RenderRequest" }, { status: 400 });
  }
  const promptUsed = renderPrompt(parsed.data.build, loadCatalog());

  let body: RenderResponse;
  try {
    body = { imageUrl: await grokImage(promptUsed, TIMEOUT_MS), promptUsed, fallback: false };
  } catch (err) {
    console.warn("[render] fallback:", err instanceof Error ? err.message : err);
    body = { imageUrl: CACHED_IMAGE, promptUsed, fallback: true };
  }
  return Response.json(body);
}
