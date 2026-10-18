"use client";
// Owner: P3. Grok Imagine flight video, top right. Starts when the screen launches ("assembly:launch", with a
// still of the stack on the pad), polls /api/video, then loops the clip. Click to zoom; Esc or click to close.
// One clip per build: launching the same rocket again replays it instead of paying for a new one.
import { useEffect, useRef, useState } from "react";
import type { ScreenFlight } from "@/lib/ai/videoPrompt";
import type { BuildState } from "@/types";

type Clip =
  | { state: "filming"; since: number }
  | { state: "ready"; url: string }
  | { state: "failed"; why?: "not_configured" };

const POLL_MS = 5000;
const GIVE_UP_MS = 6 * 60_000;
const key = (b: BuildState): string => JSON.stringify([b.missionId, b.payloadId, b.stages, b.livery.primary, b.livery.accent]);
const clips = new Map<string, Clip>(); // survives re-renders and re-launches within the page

export function FlightVideo() {
  const [clip, setClip] = useState<Clip | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const current = useRef<string | null>(null);

  useEffect(() => {
    const onLaunch = (e: Event) => {
      const { build, image, flight } = (e as CustomEvent<{ build: BuildState; image: string | null; flight?: ScreenFlight }>).detail;
      const k = key(build);
      current.current = k;
      const known = clips.get(k);
      if (known && known.state !== "failed") {
        setClip(known);
        return;
      }
      void film(k, build, image, flight);
    };
    const set = (k: string, c: Clip) => {
      clips.set(k, c);
      if (current.current === k) setClip(c);
    };
    const film = async (k: string, build: BuildState, image: string | null, flight?: ScreenFlight) => {
      set(k, { state: "filming", since: Date.now() });
      try {
        const res = await fetch("/api/video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ build, ...(image ? { image } : {}), ...(flight ? { flight } : {}) }),
        });
        const started = (await res.json()) as { id: string | null; reason?: string };
        if (!res.ok || !started.id) {
          return set(k, started.reason === "not_configured" ? { state: "failed", why: "not_configured" } : { state: "failed" });
        }
        const deadline = Date.now() + GIVE_UP_MS;
        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, POLL_MS));
          const poll = (await (await fetch(`/api/video?id=${encodeURIComponent(started.id)}`)).json()) as {
            status: string;
            videoUrl?: string;
          };
          if (poll.status === "done" && poll.videoUrl) return set(k, { state: "ready", url: poll.videoUrl });
          if (poll.status === "failed") return set(k, { state: "failed" });
        }
        set(k, { state: "failed" });
      } catch {
        set(k, { state: "failed" });
      }
    };
    addEventListener("assembly:launch", onLaunch);
    return () => removeEventListener("assembly:launch", onLaunch);
  }, []);

  // A build change (Options, another rocket) hides the window until the next launch.
  useEffect(() => {
    const onBuild = (e: Event) => {
      const { build } = (e as CustomEvent<{ build: BuildState }>).detail;
      if (current.current && key(build) !== current.current) {
        current.current = null;
        setClip(null);
        setZoomed(false);
      }
    };
    addEventListener("assembly:build", onBuild);
    return () => removeEventListener("assembly:build", onBuild);
  }, []);

  // The elapsed-seconds counter while filming.
  const since = clip?.state === "filming" ? clip.since : null;
  useEffect(() => {
    if (since === null) return;
    const update = () => setElapsed(Math.round((Date.now() - since) / 1000));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [since]);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [zoomed]);

  if (!clip) return null;

  return (
    <>
      <figure className="fixed right-6 top-16 z-20 m-0 w-[min(340px,calc(100vw-3rem))] overflow-hidden rounded-xl border border-white/10 bg-[#0b0d12]/85 shadow-2xl backdrop-blur">
        <figcaption className="flex items-center justify-between px-3 py-2 text-xs text-white/70">
          <span>Grok Imagine · your flight</span>
          {clip.state === "ready" ? <span className="text-white/45">click to zoom</span> : null}
        </figcaption>
        {clip.state === "filming" ? (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-black/40 text-sm text-white/80">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-[#5cc8ff]" aria-hidden />
            <span>Filming your flight… {elapsed} s</span>
          </div>
        ) : clip.state === "ready" ? (
          <button type="button" onClick={() => setZoomed(true)} className="block w-full cursor-zoom-in" aria-label="Zoom the flight video">
            <video src={clip.url} autoPlay muted loop playsInline className="block aspect-video w-full bg-black object-cover" />
          </button>
        ) : (
          <p className="m-0 px-3 pb-3 text-sm text-white/60">
            {clip.why === "not_configured"
              ? "Grok Imagine isn't set up here (no XAI_API_KEY on the server)."
              : "Couldn't film this flight right now."}
          </p>
        )}
        <p className="m-0 px-3 py-1.5 text-[11px] text-white/40">An artistic interpretation of this build. The physics decides the outcome.</p>
      </figure>

      {zoomed && clip.state === "ready" ? (
        <div
          role="dialog"
          aria-label="Flight video"
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/85 p-6"
        >
          <video
            src={clip.url}
            autoPlay
            loop
            controls
            playsInline
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-lg shadow-2xl"
          />
        </div>
      ) : null}
    </>
  );
}
