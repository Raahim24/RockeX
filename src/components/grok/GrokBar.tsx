"use client";
// Owner: P3. Grok as a voice, shown as an orb.
// - Tap the orb: live conversation (Grok Voice Agent). Just talk; talk over Grok to interrupt; tap again to end.
//   Grok can change the rocket with checked tools and reacts when a rocket finishes building.
// - Not live: Grok comments on each finished rocket out loud, and holding the orb asks one question
//   (speech to text -> /api/agent -> text to speech). This is also the fallback if live voice can't start.
// No text, except a caption when the voice itself fails. Apply fix and Render it appear only when useful.

import { advisorCandidates, describeSuggestion } from "@/lib/ai/prompts";
import type { AgentReply, AgentTurn } from "@/lib/ai/schemas";
import { loadCatalog } from "@/lib/physics/catalog";
import { useBuild, useBuildStore, useVerdict } from "@/store/buildStore";
import type { AdviseResponse } from "@/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLiveGrok } from "./useLiveGrok";
import { useSpeaker } from "./MicButton";
import { RenderButton } from "./RenderButton";
import { useRecorder } from "./useRecorder";
import { choosePicked, guideEvent, screenSummary, setGuideProgress, verdictReport, type BuildProgress } from "./voiceTools";

const UNAVAILABLE: AdviseResponse = { message: "Grok is unavailable right now.", suggestion: null };
const DIDNT_CATCH = "I didn't catch that. Hold the orb and try again.";
const NO_LIVE = "Live voice is unavailable right now. Hold me to ask a question instead.";
const REACT_DELAY_MS = 1200; // let a burst of edits settle before Grok weighs in
const REFRESH_DELAY_MS = 500;
const GUIDE_SETTLE_MS = 1500; // a part that is followed by another this fast is part of a Build all
const HOLD_MS = 350; // shorter than this is a tap, longer is a held question
const HISTORY_TURNS = 20; // the conversation memory kept until the page reloads (hold-to-ask sends the last 8)
const catalog = loadCatalog();

type Mode = "idle" | "live" | "paused" | "listening" | "thinking" | "speaking";

const hasUserActivation = (): boolean => navigator.userActivation?.hasBeenActive ?? true;

let onFirstGesture: (() => void) | null = null;
const sayOnFirstGesture = (say: () => void): void => {
  if (!onFirstGesture) {
    const run = (e: Event): void => {
      removeEventListener("pointerdown", run);
      removeEventListener("keydown", run);
      const fn = onFirstGesture;
      onFirstGesture = null;
      // Pressing the orb starts something fresh: drop the old line instead of saying both.
      if (!(e.target instanceof Element && e.target.closest(".grok-orb"))) fn?.();
    };
    addEventListener("pointerdown", run);
    addEventListener("keydown", run);
  }
  onFirstGesture = say; // only the latest line is said
};

const postJson = async <T,>(url: string, body: unknown): Promise<T | null> => {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
};

const transcribe = async (audio: Blob): Promise<string | null> => {
  try {
    const form = new FormData();
    form.append("audio", audio);
    const res = await fetch("/api/listen", { method: "POST", body: form });
    return res.ok ? ((await res.json()) as { text: string }).text : null;
  } catch {
    return null;
  }
};

// Grok's face: a glossy ball with two slanted pill eyes. --lvl (0..1, the live voice level) drives the talking
// bounce; data-mode sets the expression. The button, handlers and modes are unchanged.
const ORB_CSS = `
@keyframes grok-float { 0%,100% { translate: 0 0 } 50% { translate: 0 -4px } }
@keyframes grok-blink { 0%,90%,100% { scale: 1 1 } 94% { scale: 1 0.08 } }
@keyframes grok-look { 0%,100% { translate: -7% 0 } 50% { translate: 7% -3% } }
@keyframes grok-ring { from { transform: scale(1); opacity: .55 } to { transform: scale(1.7); opacity: 0 } }
.grok-orb { position: relative; width: 84px; height: 84px; border-radius: 9999px; cursor: pointer; border: 0; padding: 0;
  touch-action: none; user-select: none; -webkit-user-select: none;
  background: radial-gradient(circle at 34% 28%, #ffffff 0%, #f4f4f4 30%, #d6d6d6 62%, #9a9a9a 88%, #7d7d7d 100%);
  box-shadow: inset -7px -9px 16px rgba(0,0,0,.22), inset 4px 5px 10px rgba(255,255,255,.7), 0 10px 22px rgba(0,0,0,.5);
  transition: transform 80ms linear, box-shadow 200ms, filter 300ms;
  /* talking: a little hop and a squash-and-stretch that follows the voice */
  transform: translateY(calc(var(--lvl, 0) * -7px)) scale(calc(1 + var(--lvl, 0) * 0.06), calc(1 + var(--lvl, 0) * 0.14)); }
.grok-orb .grok-face { position: absolute; inset: 0; border-radius: 9999px; transition: transform 250ms ease; }
.grok-orb .grok-eye { position: absolute; width: 15%; height: 36%; border-radius: 9999px; background: #111;
  rotate: -32deg; transform-origin: center; transition: height 160ms ease, width 160ms ease;
  animation: grok-blink 4.6s ease-in-out infinite; }
.grok-orb .grok-eye.l { left: 35%; top: 33%; }
.grok-orb .grok-eye.r { left: 61%; top: 18%; animation-delay: 40ms; }
/* the eyes squint a little on loud syllables */
.grok-orb .grok-eyes { position: absolute; inset: 0; transform: scaleY(calc(1 - var(--lvl, 0) * 0.3)); transition: transform 80ms linear; }
.grok-orb::before, .grok-orb::after { content: ""; position: absolute; inset: 0; border-radius: 9999px; pointer-events: none;
  border: 2px solid rgba(255,255,255,.5); opacity: 0; }
.grok-orb[data-mode="idle"] { animation: grok-float 4s ease-in-out infinite; }
.grok-orb[data-mode="live"] { box-shadow: inset -7px -9px 16px rgba(0,0,0,.22), inset 4px 5px 10px rgba(255,255,255,.7),
  0 0 0 3px rgba(46,230,182,.6), 0 0 26px rgba(46,230,182,.35); }
.grok-orb[data-mode="listening"] { box-shadow: inset -7px -9px 16px rgba(0,0,0,.22), inset 4px 5px 10px rgba(255,255,255,.7),
  0 0 0 3px rgba(255,255,255,.65), 0 0 30px rgba(92,200,255,.55); }
.grok-orb[data-mode="listening"] .grok-face { transform: translate(3%, -4%) scale(1.08); }
.grok-orb[data-mode="listening"] .grok-eye { height: 40%; }
.grok-orb[data-mode="thinking"] .grok-face { animation: grok-look 1.6s ease-in-out infinite; }
.grok-orb[data-mode="speaking"]::before { animation: grok-ring 1.4s ease-out infinite; }
.grok-orb[data-mode="speaking"]::after { animation: grok-ring 1.4s ease-out .7s infinite; }
.grok-orb[data-mode="paused"] { filter: grayscale(1) brightness(.6); }
.grok-orb[data-mode="paused"] .grok-eye { height: 5%; animation: none; }
@media (prefers-reduced-motion: reduce) {
  .grok-orb, .grok-orb .grok-face, .grok-orb .grok-eye, .grok-orb::before, .grok-orb::after { animation: none !important; }
}
@keyframes grok-pop { from { opacity: 0; scale: .8 } to { opacity: 1; scale: 1 } }
@keyframes grok-drift { 0%,100% { translate: -50% 0 } 50% { translate: -50% -3px } }
/* A cartoon cloud centred over Grok's head: a soft body, puffs along its edges, and a trail of puffs down to the head.
   drop-shadow (not box-shadow) so the puffs share one shadow with the body. */
.grok-cloud { position: absolute; bottom: calc(100% + 40px); left: 50%; translate: -50% 0; width: max-content;
  min-width: 120px; max-width: min(320px, calc(100vw - 40px)); padding: 40px 58px 34px; color: #11131a;
  font-size: 14px; line-height: 1.4; font-weight: 500; text-align: center; transform-origin: 50% 130%;
  filter: drop-shadow(0 10px 16px rgba(0,0,0,.45)); animation: grok-pop 260ms cubic-bezier(.2,1.4,.4,1) both, grok-drift 3.2s ease-in-out .3s infinite; }
/* One smooth cloud outline, stretched to fit behind the text. */
.grok-cloud-shape { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.grok-cloud-shape path, .grok-cloud-trail::before, .grok-cloud-trail::after { fill: #f6f7fb; stroke: #b9bdc9; stroke-width: 1.5; }
.grok-cloud-text { position: relative; display: block; }
.grok-cloud-trail { position: absolute; left: 50%; top: calc(100% + 4px); width: 0; height: 0; pointer-events: none; }
.grok-cloud-trail::before, .grok-cloud-trail::after { content: ""; position: absolute; border-radius: 50%; background: #f6f7fb; border: 1.5px solid #b9bdc9; }
.grok-cloud-trail::before { width: 15px; height: 15px; left: -7px; top: 0; }
.grok-cloud-trail::after { width: 9px; height: 9px; left: -4px; top: 20px; }
/* Grok stays off the landing page and bounces up into its corner once the builder shows (body.landing goes). */
@keyframes grok-enter { 0% { opacity: 0; translate: 0 180px; scale: .4 } 50% { opacity: 1; translate: 0 -26px; scale: 1.06 }
  68% { translate: 0 8px; scale: .96 } 84% { translate: 0 -6px; scale: 1.02 } 100% { translate: 0 0; scale: 1 } }
.grok-dock { transform-origin: 50% 100%; animation: grok-enter 900ms cubic-bezier(.3,.7,.4,1) 250ms both; }
body.landing .grok-dock { animation: none; opacity: 0; pointer-events: none; }
@media (prefers-reduced-motion: reduce) { .grok-dock { animation: none; } }
@media (prefers-reduced-motion: reduce) { .grok-cloud { animation: none; } }
body .bar { left: auto; right: 24px; bottom: 24px; transform: none; flex-direction: column; width: 220px; }
body .bar > button { width: 100%; }
body .bar .rockets { left: auto; right: calc(100% + 8px); bottom: 0; }
.grok-panel { border: 1px solid rgba(255,255,255,.09); border-radius: 16px; background: rgba(28,30,38,.72); padding: 8px;
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
.grok-panel-button { width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13.5px;
  font-weight: 600; color: #f6f7fb; background: rgba(92,200,255,.16); border: 1px solid rgba(92,200,255,.35);
  border-radius: 10px; padding: 9px 16px; cursor: pointer; }
.grok-panel-button:hover { background: rgba(92,200,255,.26); }
.grok-panel-button.quiet { background: transparent; border-color: rgba(255,255,255,.12); color: #a9adb8; }
`;

interface Props {
  /** The whole rocket is on screen. Grok reacts and Apply/Render appear only then. Defaults to true. */
  rocketReady?: boolean;
  /** The parts in build order and which are placed, from the screen; drives the guided build. */
  progress?: BuildProgress;
}

const NO_PARTS: BuildProgress = [];

export function GrokBar({ rocketReady = true, progress = NO_PARTS }: Props) {
  const build = useBuild();
  const verdict = useVerdict();
  const applySuggestion = useBuildStore((s) => s.applySuggestion);
  const speaker = useSpeaker();
  const recorder = useRecorder();
  const toolChanged = useRef(false); // the last change came from Grok's own tool call: don't narrate it twice
  const history = useRef<AgentTurn[]>([]); // one conversation for live talk and hold-to-ask, until the page reloads
  const remember = useCallback((turn: AgentTurn): void => {
    history.current = [...history.current, turn].slice(-HISTORY_TURNS);
  }, []);
  const live = useLiveGrok({
    onToolChange: useCallback(() => {
      toolChanged.current = true;
    }, []),
    memory: history,
    onTurn: remember,
  });
  const [thinking, setThinking] = useState(false);
  const [caption, setCaption] = useState<string | null>(null);
  // The line Grok is saying out loud when not live (live mode streams its own transcript: live.subtitle).
  const [said, setSaid] = useState<string | null>(null);
  const [everLive, setEverLive] = useState(false);
  const latest = useRef("");
  const busy = useRef(false); // a spoken turn is in progress: reactions wait
  const pressedAt = useRef(0);
  const orbRef = useRef<HTMLButtonElement | null>(null);
  const welcomed = useRef(false);
  const now = useRef({ build, verdict, progress }); // latest rocket and screen for listeners registered once
  useEffect(() => {
    now.current = { build, verdict, progress };
  }, [build, verdict, progress]);

  const buildKey = JSON.stringify(build);
  const screen = screenSummary(progress); // what is actually on the pad, for every Grok request
  const screenRef = useRef(screen);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);
  const mode: Mode = live.connecting
    ? "thinking"
    : live.live
      ? live.paused
        ? "paused"
        : live.speaking
        ? "speaking"
        : live.hearing
          ? "listening"
          : "live"
      : recorder.listening
        ? "listening"
        : speaker.speaking
          ? "speaking"
          : thinking
            ? "thinking"
            : "idle";
  const speakingRef = useRef(false);
  useEffect(() => {
    speakingRef.current = speaker.speaking || recorder.listening;
  }, [speaker.speaking, recorder.listening]);


  // Say a line out loud (not live); if the voice fails, show it as a caption instead.
  const say = useCallback(
    async (text: string, stillCurrent: () => boolean): Promise<void> => {
      if (!hasUserActivation()) {
        // Browsers block audio until the first click or key press: say it then instead of failing now.
        sayOnFirstGesture(() => {
          if (!stillCurrent()) return;
          setSaid(text);
          void speaker.speak(text).then((ok) => !ok && stillCurrent() && setCaption(text));
        });
        return;
      }
      setSaid(text);
      if (!(await speaker.speak(text)) && stillCurrent()) setCaption(text);
    },
    [speaker],
  );

  // Not live: ask Grok about the finished rocket and say the answer out loud.
  const react = useCallback(async (): Promise<void> => {
    const askedFor = JSON.stringify(build);
    latest.current = askedFor;
    setThinking(true);
    setCaption(null);
    const advice = (await postJson<AdviseResponse>("/api/advise", { build, verdict })) ?? UNAVAILABLE;
    if (latest.current !== askedFor) return; // the build moved on; a newer reaction is coming
    setThinking(false);
    remember({ role: "grok", text: advice.message });
    await say(advice.message, () => latest.current === askedFor);
  }, [build, verdict, say, remember]);

  // Live: keep Grok's picture of the rocket current.
  useEffect(() => {
    if (!live.live) return;
    const id = window.setTimeout(() => live.refresh(verdict, screen), REFRESH_DELAY_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildKey, screen, live.live]);

  // Guided build (live): each time a part lands, Grok explains it and offers the next slot's options.
  const placedCount = progress.filter((p) => p.built).length;
  const prevPlaced = useRef(placedCount);
  useEffect(() => {
    const before = prevPlaced.current;
    prevPlaced.current = placedCount;
    if (placedCount > before) toolChanged.current = false; // a placed part is news: the final verdict must be heard
    if (!live.live || placedCount <= before || placedCount === progress.length) return; // complete: verdict event
    // Wait a moment: during Build all parts land in quick succession, and Grok should only talk about the result.
    const id = window.setTimeout(() => {
      const justPlaced = [...progress].reverse().find((p) => p.built) ?? null;
      const event = guideEvent(progress, justPlaced);
      if (event) live.notify(event);
    }, GUIDE_SETTLE_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placedCount, live.live]);

  // A rocket finished building: Grok reacts (live: as an event in the conversation; otherwise via the advisor).
  useEffect(() => {
    if (build.stages.length === 0 || !rocketReady) return;
    if (live.live) {
      if (toolChanged.current) {
        toolChanged.current = false; // Grok already talked about its own change
        return;
      }
      const report = verdictReport();
      live.notify(
        `(Event: the rocket on screen is now fully built. VERDICT: ${JSON.stringify(report.verdict)}. FIX: ${report.fix ? JSON.stringify(report.fix) : "none"}.)`,
      );
      return;
    }
    let id = 0;
    const attempt = (): void => {
      if (busy.current || speakingRef.current) {
        id = window.setTimeout(attempt, 400);
        return;
      }
      void react();
    };
    id = window.setTimeout(attempt, REACT_DELAY_MS);
    return () => clearTimeout(id);
    // Only a new build (or the rocket finishing its assembly) should trigger a reaction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildKey, rocketReady]);

  // Not live: the first click anywhere gets a short spoken welcome that explains how to start.
  const welcome = useCallback(async (): Promise<void> => {
    if (welcomed.current) return;
    welcomed.current = true;
    busy.current = true;
    setThinking(true);
    try {
      const answer = await postJson<AgentReply>("/api/agent", {
        moment: "welcome",
        history: [],
        screen: screenRef.current,
        build: now.current.build,
        verdict: now.current.verdict,
      });
      setThinking(false);
      const line = answer?.message ?? "Hey, I'm Grok, your flight engineer. Let's build a rocket that actually makes it.";
      remember({ role: "grok", text: line });
      await say(line, () => true);
    } finally {
      setThinking(false);
      busy.current = false;
    }
  }, [say, remember]);

  useEffect(() => {
    const first = (e: Event): void => {
      if (e.target instanceof Element && e.target.closest(".grok-orb")) return; // the orb press goes live instead
      removeEventListener("pointerdown", first);
      removeEventListener("keydown", first);
      void welcome();
    };
    addEventListener("pointerdown", first);
    addEventListener("keydown", first);
    return () => {
      removeEventListener("pointerdown", first);
      removeEventListener("keydown", first);
    };
  }, [welcome]);

  // Not live: one held question -> Grok's answer out loud, and the change they asked for, if any.
  const converse = async (audio: Blob | null): Promise<void> => {
    busy.current = true;
    setThinking(true);
    setCaption(null);
    try {
      const question = audio ? await transcribe(audio) : null;
      if (!question) {
        setThinking(false);
        await say(DIDNT_CATCH, () => true);
        return;
      }
      const answer = await postJson<AgentReply>("/api/agent", { question, history: history.current.slice(-8), screen, build, verdict });
      setThinking(false);
      remember({ role: "user", text: question });
      if (!answer) {
        await say("Mission control lost the line. Ask me again in a second.", () => true);
        return;
      }
      remember({ role: "grok", text: answer.message });
      const speaking = say(answer.message, () => true);
      if (answer.action) applySuggestion(answer.action); // the rocket changes while Grok talks
      await speaking;
    } finally {
      setThinking(false);
      busy.current = false;
    }
  };

  // Tap: start or end the live conversation. Hold (not live): ask one question.
  // First-time help: a hint while options are on screen.
  const [optionsHint, setOptionsHint] = useState(false);
  useEffect(() => {
    const command = (e: Event): void => {
      const cmd = (e as CustomEvent<{ cmd: string }>).detail?.cmd;
      if (cmd === "show_options") setOptionsHint(true);
      if (cmd === "hide_options" || cmd === "reset") setOptionsHint(false);
    };
    addEventListener("assembly:command", command);
    return () => removeEventListener("assembly:command", command);
  }, []);
  const placedNow = progress.filter((p) => p.built).length;
  const [hintFor, setHintFor] = useState(placedNow);
  if (hintFor !== placedNow) {
    setHintFor(placedNow); // a part landed: its options (and the hint) are gone
    setOptionsHint(false);
  }

  const toggleLive = async (): Promise<void> => {
    if (live.live) {
      live.stop();
      return;
    }
    speaker.speak(null);
    setCaption(null);
    welcomed.current = true;
    if (await live.start(verdict, screen)) {
      setEverLive(true);
    } else {
      setCaption(NO_LIVE);
    }
  };
  const [tapHint, setTapHint] = useState(false);
  const onPress = (): void => {
    pressedAt.current = Date.now();
    if (live.connecting) return;
    if (live.live) {
      live.talkStart(); // live: hold the orb to talk
      return;
    }
    speaker.speak(null); // stop Grok mid-sentence: the user wants the floor
    void recorder.start();
  };
  const onRelease = async (): Promise<void> => {
    if (!pressedAt.current) return;
    const held = Date.now() - pressedAt.current;
    pressedAt.current = 0;
    if (live.live) {
      live.talkEnd();
      if (held < HOLD_MS) setTapHint(true); // a tap does nothing but remind them how to talk
      return;
    }
    if (held < HOLD_MS) {
      recorder.cancel();
      void toggleLive();
      return;
    }
    welcomed.current = true;
    await converse(await recorder.stop());
  };

  // Space belongs to Grok: the first press starts the conversation, then hold Space to talk.
  const liveOn = live.live;
  const { talkStart, talkEnd } = live;
  const startRef = useRef(toggleLive);
  useEffect(() => {
    startRef.current = toggleLive;
  });
  useEffect(() => {
    if (liveOn) return;
    const start = (e: KeyboardEvent): void => {
      if (e.code !== "Space" || e.repeat || (e.target instanceof Element && e.target.closest("input, textarea, select"))) return;
      e.preventDefault();
      e.stopImmediatePropagation(); // not the assembly screen's explode
      void startRef.current();
    };
    addEventListener("keydown", start, true);
    return () => removeEventListener("keydown", start, true);
  }, [liveOn]);
  useEffect(() => {
    if (!liveOn) return;
    const typing = (e: KeyboardEvent): boolean => e.target instanceof Element && Boolean(e.target.closest("input, textarea, select"));
    const down = (e: KeyboardEvent): void => {
      if (e.code !== "Space" || typing(e)) return;
      e.preventDefault();
      e.stopImmediatePropagation(); // keep the assembly screen's Space (explode) out of it
      if (!e.repeat) talkStart();
    };
    const up = (e: KeyboardEvent): void => {
      if (e.code !== "Space" || typing(e)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      talkEnd();
    };
    addEventListener("keydown", down, true);
    addEventListener("keyup", up, true);
    addEventListener("blur", talkEnd); // switching windows mid-hold must not leave the mic on
    return () => {
      removeEventListener("keydown", down, true);
      removeEventListener("keyup", up, true);
      removeEventListener("blur", talkEnd);
    };
  }, [liveOn, talkStart, talkEnd]);
  useEffect(() => {
    if (!tapHint) return;
    const id = window.setTimeout(() => setTapHint(false), 2500);
    return () => clearTimeout(id);
  }, [tapHint]);

  // Drive the orb's size from whichever voice is active.
  const levels = [speaker.level, recorder.level, live.level];
  useEffect(() => {
    let id = 0;
    const tick = (): void => {
      const lvl = Math.max(...levels.map((l) => l.current ?? 0));
      orbRef.current?.style.setProperty("--lvl", String(lvl));
      id = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(id);
    // The level refs are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Buttons only when they are useful: the code's fix for this failing rocket, a render of a finished working one.
  const suggestion = useMemo(() => {
    if (!rocketReady || verdict.feasible || live.live) return null; // live: Grok coaches with hints instead
    const best = advisorCandidates(build, verdict, catalog)[0];
    return best?.verdict.feasible ? best.suggestion : null;
  }, [rocketReady, build, verdict, live.live]);
  const canRender = rocketReady && verdict.feasible;

  // What a screen action ended in (launch outcome, twin found): Grok reacts to what actually happened.
  useEffect(() => {
    const reported = (e: Event): void => {
      const { kind, text } = (e as CustomEvent<{ kind: string; text: string }>).detail;
      live.notify(`(Event: ${kind} result on screen: "${text}". React in character and explain it in plain words.)`);
    };
    addEventListener("assembly:report", reported);
    return () => removeEventListener("assembly:report", reported);
  }, [live]);

  // Guided build: Grok shows options as real parts on the screen (show_options); a tap on one picks it.
  useEffect(() => {
    setGuideProgress(progress);
  }, [progress]);
  useEffect(() => {
    const picked = (e: Event): void => {
      const pick = (e as CustomEvent<{ partId: string; recordId: string; engineCount?: number }>).detail;
      const part = now.current.progress.find((p) => p.id === pick.partId);
      if (part) choosePicked(part, pick);
    };
    addEventListener("assembly:option-picked", picked);
    return () => removeEventListener("assembly:option-picked", picked);
  }, []);

  const label = {
    idle: "Press Space (or tap here) to talk to Grok",
    paused: "Grok is paused and not listening. Press Resume, or tap to end",
    live: "Hold Space or this orb to talk to Grok",
    listening: "Listening… let go to send",
    thinking: "Grok is thinking",
    speaking: "Grok is speaking. Hold Space to jump in",
  }[mode];

  // The speech bubble: what Grok is saying right now (live transcript as it streams, or the spoken line), or a
  // caption when the voice failed. It stays up a few seconds after Grok stops, then fades.
  const talking = live.live ? live.speaking : speaker.speaking;
  const spoken = (live.live ? live.subtitle : said)?.trim() || "";
  const current = caption || (talking && spoken ? spoken : null);
  // The last line, kept for a moment after Grok stops so the bubble doesn't vanish mid-read.
  const [linger, setLinger] = useState<string | null>(null);
  useEffect(() => {
    const t = current ? setTimeout(() => setLinger(current), 0) : setTimeout(() => setLinger(null), 3500);
    return () => clearTimeout(t);
  }, [current]);
  const bubble = current ?? linger;

  const [barHeight, setBarHeight] = useState(0);
  useEffect(() => {
    const bar = document.querySelector(".bar");
    if (!bar) return;
    const ro = new ResizeObserver(() => setBarHeight(bar.getBoundingClientRect().height));
    ro.observe(bar);
    return () => ro.disconnect();
  }, []);


  const chip = "rounded-full px-3 py-1 text-xs font-medium backdrop-blur";

  return (
    <>
      <style>{ORB_CSS}</style>
      {/* Nothing on the pad yet: Explode and Reset would do nothing, so they stay out of sight until a part lands. */}
      {placedCount === 0 && <style>{"body .bar #btn-explode, body .bar #btn-reset { display: none; }"}</style>}

      {/* Grok at the bottom left: a cloud with what it says over its head, what to do written under it. */}
      <div className="grok-dock fixed bottom-5 left-20 z-10 flex flex-col items-center gap-1.5">
        {bubble && (
          <div key={bubble.slice(0, 24)} role="status" aria-live="polite" className="grok-cloud">
            <svg className="grok-cloud-shape" viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden>
              <path vectorEffect="non-scaling-stroke" d="M40 100C20 102 6 90 12 76C0 66 8 46 28 48C28 28 48 18 66 26C76 6 114 2 126 22C142 10 170 16 172 40C194 42 202 66 188 80C196 98 176 110 160 102C150 116 124 116 114 104C102 118 72 118 64 104C56 110 44 108 40 100Z" />
            </svg>
            <span className="grok-cloud-text">{bubble.length > 220 ? `…${bubble.slice(-220)}` : bubble}</span>
            <span className="grok-cloud-trail" aria-hidden />
          </div>
        )}
        <button
          ref={orbRef}
          type="button"
          className="grok-orb"
          data-mode={mode}
          onPointerDown={onPress}
          onPointerUp={() => void onRelease()}
          onPointerLeave={() => void onRelease()}
          onKeyDown={(e) => !live.live && e.key === "Enter" && (e.preventDefault(), void toggleLive())}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={label}
          title={label}
        >
          <span className="grok-face" aria-hidden>
            <span className="grok-eyes">
              <span className="grok-eye l" />
              <span className="grok-eye r" />
            </span>
          </span>
        </button>
        {live.live && !live.paused && (
          <p
            className={`${chip} ${
              live.hearing ? "bg-pink-500/80 text-white" : tapHint ? "bg-white/25 text-white" : "bg-white/10 text-neutral-200"
            }`}
          >
            {live.hearing ? "🎙️ Listening… let go to send" : live.speaking ? "Hold Space to jump in" : "Hold Space to talk"}
          </p>
        )}
        {live.live && live.paused && <p className={`${chip} bg-white/10 text-neutral-300`}>Paused · mic off</p>}
        {!live.live && (
          <p className={`${chip} bg-white/10 text-neutral-200`}>
            {live.connecting ? "Connecting to Grok…" : everLive ? "Press Space to talk again" : "Press Space to talk to Grok"}
          </p>
        )}
      </div>
      {optionsHint && live.live ? (
        <div className="fixed bottom-40 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5">
          <p className={`${chip} bg-white/10 text-neutral-200`}>👈 Tap a part on the left, or hold Space and say it</p>
        </div>
      ) : null}

      {/* All the buttons together on the right: Grok's group, sitting right on top of the screen's control bar. */}
      <div
        className="fixed right-6 z-10 flex w-[220px] flex-col items-stretch gap-2"
        style={{ bottom: 24 + barHeight + 8 }}
      >
        {(live.live || suggestion || rocketReady) && (
          <div className="grok-panel flex flex-col gap-2">
            {live.live && (
              <button
                type="button"
                onClick={() => (live.paused ? live.resume() : live.pause())}
                aria-pressed={live.paused}
                title={live.paused ? "Resume: Grok listens and talks again" : "Pause: mic off, Grok stops listening"}
                className="grok-panel-button"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                  {live.paused ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h4v14H7zM13 5h4v14h-4z" />}
                </svg>
                {live.paused ? "Resume Grok" : "Pause Grok"}
              </button>
            )}
            {live.live && (
              <button
                type="button"
                onClick={() => live.stop()}
                title="End the conversation (Grok remembers it until you reload)"
                className="grok-panel-button quiet"
              >
                End conversation
              </button>
            )}
            {suggestion && (
              <button
                type="button"
                onClick={() => applySuggestion(suggestion)}
                title={describeSuggestion(suggestion, catalog)}
                className="grok-panel-button"
              >
                Apply fix
              </button>
            )}
            {rocketReady && <RenderButton showButton={canRender} />}
          </div>
        )}
      </div>
    </>
  );
}
