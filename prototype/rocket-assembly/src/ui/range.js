// The range line: hazards.js's launch call as one HUD line, with its factors one click away.
//   mountRange({ host, assessment, onOpen? }) -> { update(assessment), setPhase(phase), dispose() }
//     host: the HUD element (ensureShell's .hud). phase: "pad" | "countdown" | "flight" | "result".
//     onOpen(): called when the factors popover opens.
//   buildLine(assessment, phase = "pad") -> plain text ("" when the phase shows nothing)
//   narrationFor(assessment) -> one or two plain sentences for the result card / assembly:report
// Line: "Range: GO · wind 5 m/s · Kp 2 · debris clear · est."; a scrub: "Range: NO-GO · lightning 9 nm · est." (+n when
// more rules fail), in the warning colour; est. because the sky is simulated. Flight: "Range: GO" (or the scrub line);
// result: nothing unless scrubbed.
// The line is a button (click, Enter or Space): a popover lists every factor (factorsFor in hazards.js) with its
// simulated value, the limit, the verdict and the rule's source (new tab). Esc or a click outside closes it.
// Layout: inside the HUD on desktop. The HUD is hidden at ≤ 760 px (style.css), so there the line docks under the
// title on its own; at ≤ 420 px the popover is a full-width bottom sheet. CSS is injected once (<style data-range>),
// classes are prefixed rng-, colours are style.css's tokens. Keys typed on the line or in the popover do not reach
// the demo's shortcuts (Space would explode the stack).
// All DOM work goes through el(); buildLine, narrationFor and factorsFor are pure (scripts/check-range.mjs).
import { factorsFor, hazards } from "../hazards.js";
import * as f from "./format.js";

const NB = "\u00a0";
const MS_PER_KT = hazards._units.ms_per_kt.value;
const PHASES = new Set(["pad", "countdown", "flight", "result"]);
const DOCK_MQ = "(max-width: 760px)"; // style.css hides .hud below this width
const VERDICT = { go: "GO", watch: "watch", "no-go": "NO-GO" };

const ms = (kt, digits = 0) => `${f.num(kt * MS_PER_KT, digits)}${NB}m/s`;
const debrisWatched = (a) => a.cautions.some((x) => x.id === "debris");

// The first blocker in a few words; the wind in m/s like the rest of the HUD.
function reason(a) {
  const b = a.blockers[0];
  const short = b.id === "surface-wind" ? `wind ${ms(a.conditions.windSurface_kt)}` : b.hud.replace(/(\d) (kt|nm|kV\/m)/, `$1${NB}$2`);
  return a.blockers.length > 1 ? `${short} +${a.blockers.length - 1}` : short;
}

// { status: "GO" | "NO-GO", rest } or null when this phase shows nothing.
function lineParts(a, phase = "pad") {
  if (!a) return null;
  if (!a.go) return { status: "NO-GO", rest: `${reason(a)} · est.` };
  if (phase === "result") return null;
  if (phase === "flight") return { status: "GO", rest: "" };
  const c = a.conditions;
  return { status: "GO", rest: [`wind ${ms(c.windSurface_kt)}`, `Kp ${c.kp}`, `debris ${debrisWatched(a) ? "watch" : "clear"}`, "est."].join(" · ") };
}

export function buildLine(a, phase = "pad") {
  const p = lineParts(a, phase);
  return p ? `Range: ${p.status}${p.rest ? ` · ${p.rest}` : ""}` : "";
}

export function narrationFor(a) {
  if (!a) return "";
  const c = a.conditions;
  const sim = "(simulated conditions, est.)";
  if (!a.go) {
    const b = a.blockers[0];
    const more = a.blockers.length - 1;
    const what = b.text.charAt(0).toLowerCase() + b.text.slice(1);
    return `Range was NO-GO ${sim}: ${what}. The launch was scrubbed${more ? `, and ${more} more rule${more === 1 ? " was" : "s were"} broken` : ""}.`;
  }
  const rule = `${c.windRuleName ?? "Falcon 9"} limit${c.windRuleStandIn ? " (borrowed, est.)" : ""}`;
  const pc = a.cautions.find((x) => x.id === "debris");
  const debris = pc ? `a close approach watched at Pc ${pc.value.toExponential(0).replace("e+", "e")}, under the FAA limit` : "no close approach inside the window";
  const first = `Range was GO ${sim}: winds ${ms(c.windSurface_kt)} against the ${ms(c.windLimit_kt, 1)} ${rule}, Kp ${c.kp}, ${debris}.`;
  const watch = a.cautions.filter((x) => x.id !== "debris" && x.id !== "orbit-drag").map((x) => x.text.charAt(0).toLowerCase() + x.text.slice(1));
  return watch.length ? `${first} Watched: ${watch.slice(0, 2).join("; ")}.` : first;
}

// ---------- DOM ----------
// el("div", { class: "rng-row", "aria-label": "…", text: "…", onclick: fn }, child, …)
function el(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "hidden") e.hidden = true;
    else if (k === "text") e.textContent = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? "" : String(v));
  }
  for (const kid of kids) if (kid != null && kid !== false) e.append(kid);
  return e;
}

const CSS = `
.rng { margin-top: 4px; }
.rng[hidden], .rng-pop[hidden] { display: none; }
.rng-line { font: inherit; font-family: var(--mono); font-size: 12px; line-height: 1.5; color: var(--text-2); text-align: inherit;
  background: none; border: 0; border-bottom: 1px dotted rgba(255, 255, 255, 0.28); border-radius: 0; padding: 0; margin: 0;
  cursor: pointer; pointer-events: auto; text-shadow: inherit; }
.rng-line:hover, .rng-line:focus-visible, .rng-line[aria-expanded="true"] { border-bottom-color: var(--select); outline: none; }
.rng-go { color: var(--go); font-weight: 600; }
.rng-nogo { color: var(--nogo); font-weight: 600; }
.rng-key { color: var(--text-2); }
.rng-dock { position: fixed; top: 50px; left: 16px; right: 16px; z-index: 4; text-align: left;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7); transition: opacity 600ms ease; }
body.landing .rng-dock, body.landing .rng-pop { opacity: 0; pointer-events: none; }
body.bright-sky .rng-dock { background: rgba(6, 8, 12, 0.42); box-shadow: 0 0 0 6px rgba(6, 8, 12, 0.42); border-radius: 8px; }
.rng-pop { position: fixed; z-index: 30; width: 380px; max-width: calc(100vw - 32px); max-height: min(70vh, 560px); overflow-y: auto;
  overscroll-behavior: contain; padding: 12px 14px; border: 1px solid rgba(255, 176, 32, 0.32); border-radius: 14px;
  background: var(--surface); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); color: var(--text);
  font-family: var(--font); font-size: 12px; text-align: left; }
.rng-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin: 0 0 8px; }
.rng-title { font-size: 13px; font-weight: 600; }
.rng-close { font: inherit; font-size: 16px; line-height: 1; color: var(--text-2); background: none; border: 0; padding: 2px 4px; cursor: pointer; }
.rng-close:hover, .rng-close:focus-visible { color: var(--text); outline: none; }
.rng-rows { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
.rng-row { display: grid; grid-template-columns: 1fr auto; gap: 1px 10px; padding: 6px 8px; border-left: 2px solid rgba(255, 176, 32, 0.5);
  border-radius: 0 6px 6px 0; background: rgba(255, 255, 255, 0.035); line-height: 1.45; color: var(--text-2); }
.rng-row.rng-v-go { border-left-color: rgba(46, 230, 182, 0.55); }
.rng-row.rng-v-no-go { border-left-color: var(--nogo); }
.rng-name { color: var(--text); font-weight: 600; }
.rng-verdict { justify-self: end; font-family: var(--mono); font-size: 11px; }
.rng-v-go .rng-verdict { color: var(--go); }
.rng-v-watch .rng-verdict { color: var(--select); }
.rng-v-no-go .rng-verdict { color: var(--nogo); }
.rng-val, .rng-lim, .rng-src { grid-column: 1 / -1; font-size: 11.5px; }
.rng-val { color: var(--text); font-family: var(--mono); font-size: 11px; }
.rng-src a { color: var(--holo); text-decoration: none; }
.rng-src a:hover, .rng-src a:focus-visible { text-decoration: underline; outline: none; }
.rng-foot { margin: 8px 0 0; color: var(--text-2); font-size: 11px; line-height: 1.45; }
@media (max-width: 420px) {
  .rng-pop { left: 0 !important; right: 0 !important; top: auto !important; bottom: 0 !important; width: auto; max-width: none;
    max-height: 72vh; border-radius: 14px 14px 0 0; border-width: 1px 0 0; }
}
`;
let styleRefs = 0;
let styleEl = null;

export function mountRange({ host, assessment = null, onOpen = null } = {}) {
  if (!styleRefs++) {
    styleEl = el("style", { "data-range": true, text: CSS });
    document.head.append(styleEl);
  }
  let a = assessment;
  let phase = "pad";
  const wrap = el("div", { class: "rng" });
  const line = el("button", { class: "rng-line", type: "button", "aria-haspopup": "dialog", "aria-expanded": "false" });
  wrap.append(line);
  const pop = el("div", { class: "rng-pop", role: "dialog", "aria-label": "Range factors", hidden: true });
  document.body.append(pop);

  // Where the line lives: in the HUD, or docked on its own where the HUD is hidden.
  const mq = globalThis.matchMedia?.(DOCK_MQ) ?? null;
  function place() {
    const dock = Boolean(mq?.matches) || !host;
    wrap.classList.toggle("rng-dock", dock);
    const parent = dock ? document.body : host;
    if (wrap.parentNode !== parent) parent.append(wrap);
  }
  place();
  mq?.addEventListener?.("change", place);

  function renderLine() {
    const p = lineParts(a, phase);
    wrap.hidden = !p;
    if (!p) {
      if (!pop.hidden) close();
      line.replaceChildren();
      return;
    }
    line.replaceChildren(el("span", { class: "rng-key", text: "Range: " }), el("strong", { class: p.status === "GO" ? "rng-go" : "rng-nogo", text: p.status }), p.rest ? ` · ${p.rest}` : "");
    line.setAttribute("aria-label", `${buildLine(a, phase)}. Show the range factors`);
  }

  let closeBtn = null;
  function renderPop() {
    const rows = factorsFor(a).map((r) => {
      const src = f.source(r.source);
      return el(
        "li",
        { class: `rng-row rng-v-${r.verdict}` },
        el("span", { class: "rng-name", text: r.name }),
        el("span", { class: "rng-verdict", text: VERDICT[r.verdict] }),
        el("span", { class: "rng-val", text: r.value }),
        el("span", { class: "rng-lim", text: `limit: ${r.limit}` }),
        src?.url ? el("span", { class: "rng-src" }, el("a", { href: src.url, target: "_blank", rel: "noopener noreferrer", title: r.rule ?? null, text: src.host ?? "source" })) : null,
      );
    });
    const status = a.go ? "GO" : "NO-GO";
    pop.replaceChildren(
      el("div", { class: "rng-head" }, el("span", { class: "rng-title" }, "Range ", el("strong", { class: a.go ? "rng-go" : "rng-nogo", text: status })), (closeBtn = el("button", { class: "rng-close", type: "button", "aria-label": "Close", text: "×", onclick: () => close() }))),
      el("ul", { class: "rng-rows" }, ...rows),
      el("p", { class: "rng-foot", text: `Simulated conditions (est.), judged against the real rules linked above; not a forecast. ${a.window?.line ?? ""}`.trim() }),
    );
  }

  function position() {
    if (typeof line.getBoundingClientRect !== "function") return;
    const r = line.getBoundingClientRect();
    const vw = globalThis.innerWidth ?? 0;
    pop.style.top = `${Math.round(r.bottom + 8)}px`;
    if (wrap.classList.contains("rng-dock")) {
      pop.style.left = `${Math.max(16, Math.round(r.left))}px`;
      pop.style.right = "auto";
    } else {
      pop.style.right = `${Math.max(16, Math.round(vw - r.right))}px`;
      pop.style.left = "auto";
    }
  }

  function open() {
    if (!a || wrap.hidden) return;
    renderPop();
    pop.hidden = false;
    position();
    line.setAttribute("aria-expanded", "true");
    closeBtn?.focus?.();
    onOpen?.();
  }
  function close() {
    if (pop.hidden) return;
    const hadFocus = pop.contains(document.activeElement);
    pop.hidden = true;
    line.setAttribute("aria-expanded", "false");
    if (hadFocus) line.focus?.();
  }
  const toggle = () => (pop.hidden ? open() : close());

  // Keys on the line or inside the popover stay here (the demo's window listener would explode on Space, etc.);
  // Esc is caught on the way down so it closes the popover and nothing else.
  const keepKeys = (e) => e.stopPropagation();
  const onEsc = (e) => {
    if (e.key !== "Escape" || pop.hidden) return;
    e.stopImmediatePropagation();
    e.preventDefault?.();
    close();
  };
  const onOutside = (e) => {
    if (!pop.hidden && !pop.contains(e.target) && !line.contains(e.target)) close();
  };
  const onResize = () => !pop.hidden && position();
  line.addEventListener("click", toggle);
  line.addEventListener("keydown", keepKeys);
  pop.addEventListener("keydown", keepKeys);
  addEventListener("keydown", onEsc, true);
  addEventListener("pointerdown", onOutside, true);
  addEventListener("resize", onResize);

  renderLine();

  return {
    update(next) {
      a = next ?? null;
      renderLine();
      if (!pop.hidden && a) renderPop();
    },
    setPhase(next) {
      if (!PHASES.has(next)) return;
      phase = next;
      renderLine();
    },
    dispose() {
      close();
      removeEventListener("keydown", onEsc, true);
      removeEventListener("pointerdown", onOutside, true);
      removeEventListener("resize", onResize);
      mq?.removeEventListener?.("change", place);
      wrap.remove();
      pop.remove();
      if (!--styleRefs) {
        styleEl?.remove();
        styleEl = null;
      }
    },
  };
}
