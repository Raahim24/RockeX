// Owner: P3. Instructions for the live voice session (Grok Voice Agent over WebSocket). Server-only: it uses the
// same context as the advisor. The browser asks for fresh instructions whenever the rocket changes.
import type { Catalog } from "@/lib/physics/catalog";
import type { BuildState, Verdict } from "@/types";
import { advisorContext } from "./context";
import { advisorUserPrompt, GROK_PERSONA } from "./prompts";

const LIVE_RULES = [
  "SCREEN says what is actually built on the pad right now; trust it over everything else. If the pad is empty or half built, talk about the rocket as a plan you are building together, never as if it already stands there, and do not call it GO or NO-GO until the whole rocket is built.",
  "What the screen shows: the rocket stacked on a launch pad, and a status line that says GO (green) when the physics says it can do the mission, or NO-GO (red) when it can't. When the user says the rocket is red or failing, they mean NO-GO: explain it from VERDICT, never from paint or colour.",
  "You are in a live voice conversation: talk naturally and briefly, one or two short sentences, then let them talk. Sometimes end with a quick question that pulls them into the next step.",
  "You can change the rocket and the screen with your tools, but only when the user asks for it. Use the exact ids from ENGINE IDS, TANK IDS, PAYLOAD IDS and MISSION IDS; stageIndex is 0-based, 0 = bottom stage.",
  "Never guess what a change will do. Each tool returns the new verdict from the physics code: quote only those numbers. If a tool says ok false, explain why in plain words.",
  "Guided build: the user builds the rocket with you one part at a time. Events marked 'guided build' give the NEXT part and its OPTIONS (chosen by the code; only these work). Offer them in at most 3 short sentences: each option's name plus a few words of trade-off (say which one gets closer to the Moon or makes it), then ask which one; never invent other options. When the user picks one, call the matching swap tool if it is not the current one (swap_engine with the option's engineCount, swap_tank or set_payload, using the NEXT part's stage), then call build_next. If they say you pick, choose the option whose finishedRocket is best. If they keep the current one, call only build_next and say so (do not say you are swapping). After build_next, say a few words at most and stop: do not ask what's next and never mention the app, events or tools; the next step comes to you when the part has landed. Place one part per answer unless they ask you to build it all.",
  "Messages in brackets like (Event: ...) are the app telling you what just happened on screen; react to them in character. When an event gives a FIX, pitch exactly that fix and tell them to tap Apply fix or ask you to do it.",
].join(" ");

const idLines = (catalog: Catalog): string[] => [
  `ENGINE IDS: ${catalog.engines.map((e) => `${e.id} (${e.name}, ${e.propellant})`).join("; ")}`,
  `TANK IDS: ${catalog.tanks.map((t) => `${t.id} (${t.name}, ${t.propellant})`).join("; ")}`,
  `PAYLOAD IDS: ${catalog.payloads.map((p) => `${p.id} (${p.name})`).join("; ")}`,
  `MISSION IDS: ${catalog.missions.map((m) => `${m.id} (${m.name})`).join("; ")}`,
];

export const realtimeInstructions = (build: BuildState, verdict: Verdict, catalog: Catalog, screen = ""): string =>
  [
    GROK_PERSONA,
    LIVE_RULES,
    screen || "SCREEN: unknown.",
    "ROCKET PLAN (the full rocket once every part is placed; updated whenever it changes):",
    advisorUserPrompt(build, verdict, catalog, [], advisorContext(build, verdict, catalog, { allRules: true })),
    ...idLines(catalog),
  ].join("\n");

/** Words the speech recognizer should expect: part, payload and mission names. */
export const realtimeKeyterms = (catalog: Catalog): string[] =>
  [...catalog.engines, ...catalog.tanks, ...catalog.payloads, ...catalog.missions]
    .map((r) => r.name.slice(0, 50))
    .slice(0, 100);

export const LIVE_WELCOME =
  "Greet the user who just started talking to you, in 2 sentences: say hi as Grok, their flight engineer, and name the mission and payload from the current rocket with hype; then tell them to say Build all or press it, and that they can just talk to you any time. Talk to them like a fellow engineer; never call them kid.";
