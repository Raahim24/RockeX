"use client";
// Owner: P3. The image mission film, top right. Starts when the screen launches ("assembly:launch", with a
// still of the stack on the pad and the screen's own flight result), asks /api/storyboard for the scenes, then
// plays them as a slow Ken Burns slideshow with our captions. Click to zoom; Esc or click to close.
// One film per build: launching the same rocket again replays it instead of paying again.
import { useEffect, useRef, useState } from "react";
import type { ScreenFlight } from "@/lib/ai/videoPrompt";
import type { BuildState } from "@/types";

type Scene = { id: string; title: string; caption: string; imageUrl: string };
type Film = { state: "making" } | { state: "ready"; scenes: Scene[] } | { state: "failed"; why?: "not_configured" };

const SCENE_MS = 6000; // long enough to read a caption
const key = (b: BuildState): string => JSON.stringify([b.missionId, b.payloadId, b.stages, b.livery.primary, b.livery.accent]);
const films = new Map<string, Film>();

const KEN_BURNS = `
@keyframes sb-zoom-a { from { transform: scale(1.02) translate(0, 0) } to { transform: scale(1.14) translate(-2%, -1.5%) } }
@keyframes sb-zoom-b { from { transform: scale(1.14) translate(2%, 1%) } to { transform: scale(1.03) translate(0, 0) } }
@keyframes sb-fade { from { opacity: 0 } to { opacity: 1 } }
@media (prefers-reduced-motion: reduce) { .sb-img { animation: none !important } }
`;

function Slides({ scenes, index, big }: { scenes: Scene[]; index: number; big?: boolean }) {
  const s = scenes[index];
  return (
    <div className={`relative overflow-hidden bg-black ${big ? "aspect-video w-[min(92vw,1280px)] rounded-lg" : "aspect-video w-full"}`}>
      {/* key forces a fresh element, so the zoom and fade restart on every scene */}
      <img
        key={`${s.id}-${index}`}
        src={s.imageUrl}
        alt={s.caption}
        className="sb-img absolute inset-0 h-full w-full object-cover"
        style={{
          animation: `${index % 2 ? "sb-zoom-b" : "sb-zoom-a"} ${SCENE_MS + 600}ms ease-out both, sb-fade 700ms ease-out both`,
        }}
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-2 pt-8">
        <p className={`m-0 font-semibold uppercase tracking-wide text-[#5cc8ff] ${big ? "text-sm" : "text-[10px]"}`}>{s.title}</p>
        <p className={`m-0 leading-snug text-white ${big ? "text-lg" : "text-[13px]"}`}>{s.caption}</p>
        <div className="mt-1.5 flex gap-1" aria-hidden>
          {scenes.map((x, i) => (
            <span key={x.id} className={`h-0.5 flex-1 rounded ${i <= index ? "bg-[#5cc8ff]" : "bg-white/20"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FlightStoryboard() {
  const [film, setFilm] = useState<Film | null>(null);
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const current = useRef<string | null>(null);

  useEffect(() => {
    const set = (k: string, f: Film) => {
      films.set(k, f);
      if (current.current === k) {
        setFilm(f);
        setIndex(0);
      }
    };
    const make = async (k: string, build: BuildState, image: string | null, flight?: ScreenFlight) => {
      set(k, { state: "making" });
      try {
        const res = await fetch("/api/storyboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ build, ...(image ? { image } : {}), ...(flight ? { flight } : {}) }),
        });
        const body = (await res.json()) as { scenes?: Scene[]; reason?: string };
        if (res.ok && body.scenes?.length) set(k, { state: "ready", scenes: body.scenes });
        else set(k, body.reason === "not_configured" ? { state: "failed", why: "not_configured" } : { state: "failed" });
      } catch {
        set(k, { state: "failed" });
      }
    };
    const onLaunch = (e: Event) => {
      const { build, image, flight } = (e as CustomEvent<{ build: BuildState; image: string | null; flight?: ScreenFlight }>).detail;
      const k = key(build);
      current.current = k;
      const known = films.get(k);
      if (known && known.state !== "failed") {
        setFilm(known);
        setIndex(0);
        return;
      }
      void make(k, build, image, flight);
    };
    const onBuild = (e: Event) => {
      const { build } = (e as CustomEvent<{ build: BuildState }>).detail;
      if (current.current && key(build) !== current.current) {
        current.current = null;
        setFilm(null);
        setZoomed(false);
      }
    };
    addEventListener("assembly:launch", onLaunch);
    addEventListener("assembly:build", onBuild);
    return () => {
      removeEventListener("assembly:launch", onLaunch);
      removeEventListener("assembly:build", onBuild);
    };
  }, []);

  // Advance the slideshow; it loops.
  const count = film?.state === "ready" ? film.scenes.length : 0;
  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), SCENE_MS);
    return () => clearInterval(t);
  }, [count]);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [zoomed]);

  if (!film) return null;

  return (
    <>
      <style>{KEN_BURNS}</style>
      <figure className="fixed right-6 top-16 z-20 m-0 w-[min(360px,calc(100vw-3rem))] overflow-hidden rounded-xl border border-white/10 bg-[#0b0d12]/85 shadow-2xl backdrop-blur">
        <figcaption className="flex items-center justify-between px-3 py-2 text-xs text-white/70">
          <span>Grok Imagine · your mission story</span>
          {film.state === "ready" ? <span className="text-white/45">click to zoom</span> : null}
        </figcaption>
        {film.state === "making" ? (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-black/40 text-sm text-white/80">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-[#5cc8ff]" aria-hidden />
            <span>Picturing your mission…</span>
          </div>
        ) : film.state === "ready" ? (
          <button type="button" onClick={() => setZoomed(true)} className="block w-full cursor-zoom-in text-left" aria-label="Zoom the mission film">
            <Slides scenes={film.scenes} index={index} />
          </button>
        ) : (
          <p className="m-0 px-3 pb-3 text-sm text-white/60">
            {film.why === "not_configured" ? "Grok Imagine isn't set up here (no XAI_API_KEY on the server)." : "Couldn't picture this flight right now."}
          </p>
        )}
        <p className="m-0 px-3 py-1.5 text-[11px] text-white/40">Artistic interpretation. The physics decides the outcome; the numbers are ours.</p>
      </figure>

      {zoomed && film.state === "ready" ? (
        <div role="dialog" aria-label="Mission film" onClick={() => setZoomed(false)} className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/90 p-6">
          <Slides scenes={film.scenes} index={index} big />
        </div>
      ) : null}
    </>
  );
}
