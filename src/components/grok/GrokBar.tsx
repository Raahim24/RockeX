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

const ORB_CSS = `
@keyframes grok-spin { to { transform: rotate(360deg); } }
@keyframes grok-breathe { 0%,100% { transform: scale(0.94); opacity: .75 } 50% { transform: scale(1.04); opacity: 1 } }
.grok-orb { position: relative; width: 84px; height: 84px; border-radius: 9999px; cursor: pointer; border: 0; padding: 0;
  background: transparent; touch-action: none; user-select: none; -webkit-user-select: none;
  transition: transform 90ms linear, box-shadow 200ms; transform: scale(calc(1 + var(--lvl, 0) * 0.35)); }
.grok-orb::before, .grok-orb::after, .grok-orb span { content: ""; position: absolute; inset: 0; border-radius: 9999px; filter: blur(10px);
  mix-blend-mode: screen; }
.grok-orb::before { background: conic-gradient(from 0deg, #5cc8ff, #a35cff, #ff5ca8, #ffb020, #5cc8ff); animation: grok-spin var(--spin, 9s) linear infinite; }
.grok-orb::after { inset: 14%; background: conic-gradient(from 180deg, #2ee6b6, #5cc8ff, #a35cff, #2ee6b6); animation: grok-spin var(--spin2, 6s) linear infinite reverse; }
.grok-orb span { inset: 30%; background: radial-gradient(circle, #fff 0%, rgba(255,255,255,.2) 60%, transparent 70%); filter: blur(4px); }
.grok-orb[data-mode="idle"] { animation: grok-breathe 4s ease-in-out infinite; --spin: 14s; --spin2: 10s; }
.grok-orb[data-mode="live"] { --spin: 7s; --spin2: 5s; box-shadow: 0 0 0 2px rgba(46,230,182,.55), 0 0 28px rgba(46,230,182,.35); }
.grok-orb[data-mode="listening"] { --spin: 5s; --spin2: 4s; box-shadow: 0 0 0 3px rgba(255,255,255,.55), 0 0 36px rgba(255,92,168,.7); }
.grok-orb[data-mode="thinking"] { --spin: 1.4s; --spin2: 1s; }
.grok-orb[data-mode="paused"] { filter: grayscale(1) brightness(.55); --spin: 60s; --spin2: 60s; }
.grok-orb[data-mode="speaking"] { --spin: 3s; --spin2: 2.2s; }
@media (prefers-reduced-motion: reduce) { .grok-orb, .grok-orb::before, .grok-orb::after { animation: none !important; } }
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
        sayOnFirstGesture(() => stillCurrent() && void speaker.speak(text));
        return;
      }
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
  const onPress = (): void => {
    pressedAt.current = Date.now();
    if (live.live || live.connecting) return;
    speaker.speak(null); // stop Grok mid-sentence: the user wants the floor
    void recorder.start();
  };
  const onRelease = async (): Promise<void> => {
    if (!pressedAt.current) return;
    const held = Date.now() - pressedAt.current;
    pressedAt.current = 0;
    if (live.live || held < HOLD_MS) {
      recorder.cancel();
      void toggleLive();
      return;
    }
    welcomed.current = true;
    await converse(await recorder.stop());
  };

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
    if (!rocketReady || verdict.feasible) return null;
    const best = advisorCandidates(build, verdict, catalog)[0];
    return best?.verdict.feasible ? best.suggestion : null;
  }, [rocketReady, build, verdict]);
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
    idle: "Tap to talk to Grok live, or hold to ask one question",
    paused: "Grok is paused and not listening. Press Resume, or tap to end",
    live: "Grok is listening. Just talk, or tap to end",
    listening: "Grok is listening",
    thinking: "Grok is thinking",
    speaking: "Grok is speaking. Talk to interrupt",
  }[mode];

  return (
    <div className="flex flex-col items-end gap-3">
      <style>{ORB_CSS}</style>
      <div className="flex items-center gap-3">
        {suggestion && (
          <button
            type="button"
            onClick={() => applySuggestion(suggestion)}
            title={describeSuggestion(suggestion, catalog)}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black shadow-lg"
          >
            Apply fix
          </button>
        )}
        {live.live && (
          <button
            type="button"
            onClick={() => (live.paused ? live.resume() : live.pause())}
            aria-pressed={live.paused}
            title={live.paused ? "Resume: Grok listens and talks again" : "Pause: mic off, Grok stops listening"}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-neutral-950/85 px-3 py-2 text-sm font-semibold text-neutral-100 shadow-lg backdrop-blur hover:border-white/40"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              {live.paused ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h4v14H7zM13 5h4v14h-4z" />}
            </svg>
            {live.paused ? "Resume" : "Pause"}
          </button>
        )}
        <button
          ref={orbRef}
          type="button"
          className="grok-orb"
          data-mode={mode}
          onPointerDown={onPress}
          onPointerUp={() => void onRelease()}
          onPointerLeave={() => void onRelease()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), void toggleLive())}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={label}
          title={label}
        >
          <span />
        </button>
      </div>
      {live.live && live.paused && (
        <p className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-neutral-300 backdrop-blur">Paused · mic off</p>
      )}
      {!live.live && !live.connecting && (
        <p className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-neutral-200 backdrop-blur">
          {everLive ? "Tap to talk again" : "Tap to talk to Grok"}
        </p>
      )}
      {caption && (
        <p role="status" className="max-w-xs rounded-lg bg-black/70 px-3 py-2 text-right text-xs text-neutral-200">
          {caption}
        </p>
      )}
      {rocketReady && <RenderButton showButton={canRender} />}
    </div>
  );
}
