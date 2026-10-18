import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadCatalog } from "@/lib/physics/catalog";
import { evaluateBuild } from "@/lib/physics/feasibility";
import { applySuggestionToBuild } from "@/store/applySuggestion";
import { DEMO_BUILD, DEMO_FIX } from "@/store/buildStore";
import type { BuildState } from "@/types";
import { flightOutcome, flightVideoPlan } from "./videoPrompt";

const catalog = loadCatalog();
const fixed = DEMO_FIX ? applySuggestionToBuild(DEMO_BUILD, DEMO_FIX, catalog) : DEMO_BUILD;

describe("flight outcome comes from the verdict", () => {
  it("demo build is short, the fixed demo succeeds, an empty build never lifts off", () => {
    expect(flightOutcome(evaluateBuild(DEMO_BUILD, catalog))).toBe("shortfall");
    expect(flightOutcome(evaluateBuild(fixed, catalog))).toBe("success");
    expect(flightOutcome(evaluateBuild({ ...DEMO_BUILD, stages: [] }, catalog))).toBe("no_liftoff");
  });

  it("a booster that can't lift its own weight never lifts off", () => {
    const heavy: BuildState = { ...DEMO_BUILD, stages: [{ ...DEMO_BUILD.stages[0], engineCount: 1 }, ...DEMO_BUILD.stages.slice(1)] };
    expect(flightOutcome(evaluateBuild(heavy, catalog))).toBe("no_liftoff");
  });
});

describe("flight video prompt", () => {
  it("describes only what a camera can see, keeps the first-frame rocket, and lands a Falcon-type booster", () => {
    const { prompt, outcome } = flightVideoPlan(fixed, catalog);
    expect(outcome).toBe("success");
    expect(prompt).toContain("The rocket from the first frame, kept exactly as it is");
    expect(prompt).toContain("a cluster of 9 engines");
    expect(prompt).toContain("night launch");
    expect(prompt).toContain("landing pad");
    expect(prompt).not.toMatch(/Merlin|RL10|James Webb|Moon/); // names a video model can't show
    expect(prompt).toMatch(/No text, no captions, no logos, no watermarks/);
  });

  it("splits the two shots over the clip length", () => {
    expect(flightVideoPlan(fixed, catalog, undefined, 8).prompt).toMatch(/Shot 1, 0 to 4 seconds.*Shot 2, 4 to 8 seconds/);
    expect(flightVideoPlan(fixed, catalog, undefined, 12).prompt).toMatch(/Shot 1, 0 to 6 seconds.*Shot 2, 6 to 12 seconds/);
  });

  it("only lands boosters that really land", () => {
    const atlas: BuildState = { ...DEMO_BUILD, stages: [{ engineId: "rd-180", engineCount: 1, tankId: "atlas-v-ccb-tank" }] };
    expect(flightVideoPlan(atlas, catalog).prompt).not.toContain("landing pad");
  });

  it("is deterministic", () => {
    expect(flightVideoPlan(DEMO_BUILD, catalog)).toEqual(flightVideoPlan(DEMO_BUILD, catalog));
  });
});

describe("/api/video", () => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  const post = (body: unknown) => new Request("http://x/api/video", { method: "POST", body: JSON.stringify(body) });
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    process.env.XAI_API_KEY = "test-key";
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.XAI_API_KEY;
  });

  it("starts one job per build and reuses it on the next launch", async () => {
    fetchMock.mockResolvedValue(json({ request_id: "req-1" }));
    const { POST } = await import("@/app/api/video/route");
    const a = await (await POST(post({ build: DEMO_BUILD, image: "data:image/jpeg;base64,AAAA" }))).json();
    const b = await (await POST(post({ build: DEMO_BUILD }))).json();
    expect(a).toMatchObject({ id: "req-1", outcome: "shortfall", withImage: true });
    expect(b.id).toBe("req-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent).toMatchObject({ model: "grok-imagine-video-1.5-lite", duration: 8, image: { url: "data:image/jpeg;base64,AAAA" } });
  });

  it("retries without the start image if xAI rejects it", async () => {
    fetchMock.mockResolvedValueOnce(json({ error: "bad image" }, 400)).mockResolvedValueOnce(json({ request_id: "req-2" }));
    const { POST } = await import("@/app/api/video/route");
    const r = await (await POST(post({ build: fixed, image: "data:image/jpeg;base64,AAAA" }))).json();
    expect(r).toMatchObject({ id: "req-2", withImage: false });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).image).toBeUndefined();
  });

  it("falls back instead of failing when Grok is unavailable, and doesn't retry without a key", async () => {
    delete process.env.XAI_API_KEY;
    const { POST } = await import("@/app/api/video/route");
    const res = await POST(post({ build: DEMO_BUILD, image: "data:image/jpeg;base64,AAAA" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: null, fallback: true, reason: "not_configured" });
  });

  it("maps xAI job states and rejects bad ids", async () => {
    const { GET } = await import("@/app/api/video/route");
    fetchMock.mockResolvedValueOnce(json({ status: "pending" }));
    expect(await (await GET(new Request("http://x/api/video?id=req-1"))).json()).toEqual({ status: "pending" });
    fetchMock.mockResolvedValueOnce(json({ status: "done", video: { url: "https://vidgen.x.ai/a.mp4" } }));
    expect(await (await GET(new Request("http://x/api/video?id=req-1"))).json()).toEqual({ status: "done", videoUrl: "https://vidgen.x.ai/a.mp4" });
    fetchMock.mockResolvedValueOnce(json({ status: "expired" }));
    expect(await (await GET(new Request("http://x/api/video?id=req-1"))).json()).toEqual({ status: "failed" });
    expect((await GET(new Request("http://x/api/video?id=../etc"))).status).toBe(400);
  });
});

describe("the video follows the screen's own flight", () => {
  it("uses the screen's outcome and booster return over the verdict", () => {
    const f9: BuildState = {
      ...DEMO_BUILD,
      stages: [
        { engineId: "merlin-1d", engineCount: 9, tankId: "falcon9-s1-tank" },
        { engineId: "merlin-1d-vac", engineCount: 1, tankId: "falcon9-s2-tank" },
      ],
    };
    // The real Falcon 9 breaks only the 4 % app rule: it still flies.
    expect(flightOutcome(evaluateBuild(f9, catalog))).not.toBe("no_liftoff");
    const orbit = flightVideoPlan(f9, catalog, { outcome: "orbit", boosterLands: true });
    expect(orbit.outcome).toBe("success");
    expect(orbit.prompt).toContain("landing pad");
    const impact = flightVideoPlan(f9, catalog, { outcome: "impact", boosterLands: false });
    expect(impact.outcome).toBe("impact");
    expect(impact.prompt).toContain("falls back toward the ground");
    expect(impact.prompt).not.toContain("landing pad");
  });
});
