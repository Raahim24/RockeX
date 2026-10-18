// Owner: P3. POST { question, history, build, verdict } -> { message, action }. Talk to Grok about the rocket.
// Grok may return one change; ids are checked against the catalog and anything invalid is dropped (the
// message is kept). Always 200 with a usable message for a valid request.
import { AGENT_SYSTEM, agentUserPrompt, WELCOME_QUESTION } from "@/lib/ai/agent";
import { grokJson } from "@/lib/ai/grokClient";
import {
  AGENT_REPLY_JSON_SCHEMA,
  AgentReplySchema,
  AgentRequestSchema,
  asksForChange,
  capSentences,
  rejectionReason,
  sanitizeSuggestion,
  type AgentReply,
} from "@/lib/ai/schemas";
import { byId, loadCatalog } from "@/lib/physics/catalog";

const TIMEOUT_MS = 8000;
const TEMPERATURE = 0.4;
const FALLBACK: AgentReply = { message: "Mission control lost the line. Ask me again in a second.", action: null };
const WELCOME_FALLBACK: AgentReply = {
  message: "Hey, I'm Grok, your flight engineer. Let's build a rocket that actually makes it.",
  action: null,
};

const reply = (body: AgentReply, source: "grok" | "fallback"): Response =>
  Response.json(body, { headers: { "x-agent-source": source } });

export async function POST(req: Request): Promise<Response> {
  const parsed = AgentRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid AgentRequest" }, { status: 400 });
  }
  const { moment, history, build, verdict, screen } = parsed.data;
  const welcome = moment === "welcome";
  const question = welcome ? WELCOME_QUESTION : parsed.data.question;
  const catalog = loadCatalog();
  try {
    // Ask with some variety; if a check rejects the reply, ask once more with none and say what was wrong.
    const mission = byId(catalog.missions, build.missionId);
    let correction = "";
    for (const temperature of [TEMPERATURE, 0]) {
      const raw = await grokJson({
        system: AGENT_SYSTEM,
        user: agentUserPrompt(question, history, build, verdict, catalog, screen) + correction,
        schemaName: "agent_reply",
        schema: AGENT_REPLY_JSON_SCHEMA,
        timeoutMs: TIMEOUT_MS,
        temperature,
      });
      const grok = AgentReplySchema.parse(raw);
      const message = capSentences(grok.message);
      const reason = rejectionReason(message, verdict.warnings, mission);
      if (reason) {
        console.warn("[agent] rejected (%s):", reason, message);
        correction = `\nCORRECTION: your last reply was rejected because ${reason}. Rewrite it.`;
        continue;
      }
      // Grok may only change the rocket when the user asked for a change; ids are checked against the catalog.
      const action = !welcome && asksForChange(question) ? sanitizeSuggestion(grok.action, build, catalog) : null;
      return reply({ message, action }, "grok");
    }
    throw new Error("both replies failed the fact checks");
  } catch (err) {
    console.warn("[agent] fallback:", err instanceof Error ? err.message : err);
    return reply(welcome ? WELCOME_FALLBACK : FALLBACK, "fallback");
  }
}
