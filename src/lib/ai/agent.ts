// Owner: P3. Talk to Grok: prompt for answering the user's spoken question about the rocket, in character,
// with the same data and physics context as the advisor. Grok may make one change, but only when asked;
// the physics code then judges the new rocket. Server-only (imports the context).
import { byId, type Catalog } from "@/lib/physics/catalog";
import type { BuildState, Verdict } from "@/types";
import { advisorContext } from "./context";
import { advisorUserPrompt, GROK_PERSONA, JSON_REPLY_FORMAT } from "./prompts";
import type { AgentTurn } from "./schemas";

export const AGENT_SYSTEM = [
  GROK_PERSONA,
  JSON_REPLY_FORMAT,
  "SCREEN says what is actually built on the pad right now; trust it. If the pad is empty or half built, talk about the rocket as a plan, never as if it already stands there, and do not call it GO or NO-GO until it is fully built.",
  "The user is talking to you out loud about the rocket on screen. Answer what they actually asked, simply and in character. Use the RULES to explain why the physics says yes or no, and PARTS or CLOSEST REAL ROCKET for cool real facts. If they ask about something unrelated, answer in one playful line and steer back to the rocket.",
  "action: only when the user asks you to change the rocket, return exactly one change using ids from ENGINE IDS and TANK IDS (stageIndex is 0-based, 0 = bottom stage) that actually differs from the current rocket; otherwise null. If they ask for something impossible, still make the change when it is a valid id and let the physics judge it. Never claim the result of a change; the physics code will judge it after.",
].join(" ");

// The first thing the user hears. Code decides the moment; Grok writes the words from the real mission data.
export const WELCOME_QUESTION =
  "(The user just opened the app and tapped you. Exactly 2 sentences. Sentence 1: say hi as Grok, their flight engineer, and name the mission and payload from MISSION and PAYLOAD using those exact names, with hype. Sentence 2: tell them to press Build all to stack the rocket and to tap you any time to talk. Talk to them like a fellow engineer; never call them kid. action must be null.)";

const idLines = (catalog: Catalog): string[] => [
  `ENGINE IDS: ${catalog.engines.map((e) => `${e.id} (${e.name}, ${e.propellant})`).join("; ")}`,
  `TANK IDS: ${catalog.tanks.map((t) => `${t.id} (${t.name}, ${t.propellant})`).join("; ")}`,
];

export const agentUserPrompt = (
  question: string,
  history: AgentTurn[],
  build: BuildState,
  verdict: Verdict,
  catalog: Catalog,
  screen = "",
): string => {
  const mission = byId(catalog.missions, build.missionId);
  return [
    screen || "SCREEN: unknown.",
    "ROCKET PLAN (the full rocket once every part is placed):",
    advisorUserPrompt(build, verdict, catalog, [], advisorContext(build, verdict, catalog, { allRules: true })),
    ...idLines(catalog),
    `MISSION ID: ${mission?.id ?? build.missionId}`,
    "CONVERSATION SO FAR:",
    ...(history.length ? history.map((t) => `${t.role === "user" ? "User" : "Grok"}: ${t.text}`) : ["(none)"]),
    `USER JUST SAID: ${question}`,
  ].join("\n");
};
