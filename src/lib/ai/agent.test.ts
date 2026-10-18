import { POST as agent } from "@/app/api/agent/route";
import { POST as listen } from "@/app/api/listen/route";
import { loadCatalog } from "@/lib/physics/catalog";
import { evaluateBuild } from "@/lib/physics/feasibility";
import { DEMO_BUILD } from "@/store/buildStore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { agentUserPrompt } from "./agent";
import { asksForChange, claimsMissingRule, mentionsOtherMission, type AgentReply } from "./schemas";

const catalog = loadCatalog();
const verdict = evaluateBuild(DEMO_BUILD, catalog);
const ask = (question: string, history: unknown[] = []): Request =>
  new Request("http://test/api/agent", {
    method: "POST",
    body: JSON.stringify({ question, history, build: DEMO_BUILD, verdict }),
  });

const grokReplies = (json: unknown): void => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({ output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(json) }] }] }),
    ),
  );
};

beforeEach(() => {
  vi.stubEnv("XAI_API_KEY", "test-key");
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("agent prompt", () => {
  it("carries the question, the conversation, valid ids and the physics context", () => {
    const prompt = agentUserPrompt(
      "why is it red?",
      [{ role: "grok", text: "Bold choice." }],
      DEMO_BUILD,
      verdict,
      catalog,
    );
    expect(prompt).toContain("USER JUST SAID: why is it red?");
    expect(prompt).toContain("Grok: Bold choice.");
    expect(prompt).toContain("ENGINE IDS: ");
    expect(prompt).toContain("rl10c-1 (RL10C-1, hydrolox)");
    expect(prompt).toContain("RULES (the physics code that decided the verdict):");
  });
});

describe("/api/agent", () => {
  it("returns Grok's answer and a valid change", async () => {
    const action = { type: "add_stage", engineId: "rl10c-1", tankId: "centaur-iii-tank" };
    grokReplies({ message: "Bolting on a Centaur. Hold my coffee.", action });
    const res = await agent(ask("add a centaur stage"));
    expect(res.headers.get("x-agent-source")).toBe("grok");
    expect(await res.json()).toEqual({ message: "Bolting on a Centaur. Hold my coffee.", action });
  });

  it("drops a change with a made-up id but keeps the answer", async () => {
    grokReplies({ message: "One Raptor coming up.", action: { type: "swap_engine", stageIndex: 0, engineId: "raptor-99" } });
    const body = (await (await agent(ask("use a raptor"))).json()) as AgentReply;
    expect(body).toEqual({ message: "One Raptor coming up.", action: null });
  });

  it("falls back with a spoken line when Grok is down", async () => {
    vi.stubEnv("XAI_API_KEY", "");
    const res = await agent(ask("hello?"));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-agent-source")).toBe("fallback");
    expect(((await res.json()) as AgentReply).action).toBeNull();
  });

  it("rejects an empty question", async () => {
    expect((await agent(ask("   "))).status).toBe(400);
  });
});

describe("/api/listen", () => {
  const withAudio = (blob: Blob): Request => {
    const form = new FormData();
    form.append("audio", blob);
    return new Request("http://test/api/listen", { method: "POST", body: form });
  };

  it("returns Grok's transcript and sends the audio as the last form field", async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const fields = [...(init.body as FormData).keys()];
      expect(fields.at(-1)).toBe("file");
      return Response.json({ text: " why is my rocket red " });
    });
    vi.stubGlobal("fetch", fetchMock);
    const res = await listen(withAudio(new Blob([new Uint8Array(100)], { type: "audio/webm" })));
    expect(await res.json()).toEqual({ text: "why is my rocket red" });
    expect(String(fetchMock.mock.calls[0][0])).toContain("/stt");
  });

  it("rejects a request without audio", async () => {
    expect((await listen(new Request("http://test/api/listen", { method: "POST", body: new FormData() }))).status).toBe(400);
  });

  it("returns 502 when speech to text is unavailable", async () => {
    vi.stubEnv("XAI_API_KEY", "");
    expect((await listen(withAudio(new Blob([new Uint8Array(100)], { type: "audio/ogg" })))).status).toBe(502);
  });
});

describe("reply checks", () => {
  it("flags a rule problem the verdict does not have, but not one it does", () => {
    expect(claimsMissingRule("The vacuum-only RL10 can't light on stage 1.", [])).toBe(true);
    expect(claimsMissingRule("The vacuum-only RL10 can't light on stage 1.", ["vacuum-only engine on stage 0"])).toBe(false);
    expect(claimsMissingRule("You are 905 m/s short of the Moon.", [])).toBe(false);
    expect(claimsMissingRule("The RL10B-2 can't sit on stage 1 because it has zero sea-level thrust.", [])).toBe(true);
  });

  it("flags another mission's destination, but not the one being flown", () => {
    expect(mentionsOtherMission("An epic ride to lunar orbit!", "moon-transfer")).toBe(true);
    expect(mentionsOtherMission("An epic ride to lunar orbit!", "lunar-orbit")).toBe(false);
    expect(mentionsOtherMission("Welcome to the Moon transfer mission!", "moon-transfer")).toBe(false);
  });

  it("only treats requests as permission to change the rocket", () => {
    expect(asksForChange("add a centaur stage")).toBe(true);
    expect(asksForChange("make it seven engines")).toBe(true);
    expect(asksForChange("why is my rocket red")).toBe(false);
  });

  it("ignores a change Grok makes when the user only asked a question", async () => {
    grokReplies({ message: "Bigger tank, problem solved.", action: { type: "swap_tank", stageIndex: 0, tankId: "saturn-v-s-ic-tank" } });
    const body = (await (await agent(ask("why is my rocket red?"))).json()) as AgentReply;
    expect(body.action).toBeNull();
  });

  it("falls back instead of repeating a made-up rule claim", async () => {
    grokReplies({ message: "The RL10 can't light on stage 1.", action: null });
    const res = await agent(ask("why is my rocket red?"));
    expect(res.headers.get("x-agent-source")).toBe("fallback");
  });
});

describe("welcome", () => {
  const welcome = (): Request =>
    new Request("http://test/api/agent", {
      method: "POST",
      body: JSON.stringify({ moment: "welcome", history: [], build: DEMO_BUILD, verdict }),
    });

  it("needs no question and never changes the rocket", async () => {
    grokReplies({ message: "Hey, I'm Grok! Press Build all.", action: { type: "add_stage", engineId: "rl10c-1", tankId: "centaur-iii-tank" } });
    expect(await (await agent(welcome())).json()).toEqual({ message: "Hey, I'm Grok! Press Build all.", action: null });
  });

  it("still greets briefly when Grok is down", async () => {
    vi.stubEnv("XAI_API_KEY", "");
    const body = (await (await agent(welcome())).json()) as AgentReply;
    expect(body.message).toContain("Grok");
    expect(body.message.split(/(?<=[.!?])\s+/).length).toBeLessThanOrEqual(2);
  });
});
