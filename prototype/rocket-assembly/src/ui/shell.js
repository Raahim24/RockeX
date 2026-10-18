// The page shell, made robust: the demo runs inside a fixed host page (the team app's React AssemblyStage, or
// index.html in dev) whose markup may lag behind the demo. ensureShell() finds every element the demo uses,
// creates whatever is missing in the expected place, rewrites the hint line from KEYS so it always lists the
// current keys, and returns the elements. Nothing else in the demo looks elements up by id.
//   ensureShell() -> { canvas, brand, hint, detail, hud, hudText, bar, btnRockets, rocketsEl, btnBuildAll,
//                      btnExplode, btnReset, btnStory }
// The site makes no sound: a host page's Sound button (#btn-sound) is removed, never created.

// The shortcut legend under the title (a compact grid): [key(s), what it does]. Compare and the save card are
// gone from the page (the user's call); their code stays for the team app's bridge commands.
const KEYS = [
  [["Space"], "explode"],
  [["B"], "build"],
  [["L"], "launch"],
  [["R"], "reset"],
  [["[", "]"], "rocket"],
  [["P"], "story"],
  [["X"], "opacity"],
  [["N"], "day/night"],
  [["W"], "weather"],
  [["Esc"], "close"],
];

const LOGO_URL = new URL("../assets/brand/rockex-wordmark.png", import.meta.url).href;

function make(tag, { id, className, attrs = {}, text } = {}) {
  const el = document.createElement(tag);
  if (id) el.id = id;
  if (className) el.className = className;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text != null) el.textContent = text;
  return el;
}

export function ensureShell() {
  const body = document.body;
  const canvas = document.getElementById("scene") ?? body.insertBefore(make("canvas", { id: "scene", attrs: { "aria-label": "3D rocket assembly" } }), body.firstChild);

  let brand = document.querySelector("header.brand");
  if (!brand) {
    brand = make("header", { className: "brand" });
    canvas.after(brand);
  }
  // ROCKEX wordmark (white on black): drawn as a luminance mask over white, so its black is transparent on any
  // backdrop, the day scrim included (a screen blend left a dark box there).
  const title = brand.querySelector("h1") ?? brand.insertBefore(make("h1"), brand.firstChild);
  const logo = make("span", { className: "brand-logo", attrs: { role: "img", "aria-label": "ROCKEX" } });
  logo.style.setProperty("--logo", `url("${LOGO_URL}")`);
  title.replaceChildren(logo);
  document.title = "ROCKEX";
  const hint = brand.querySelector("p") ?? brand.appendChild(make("p"));
  hint.className = "keys";
  hint.replaceChildren(
    ...KEYS.map(([keys, label]) => {
      const item = make("span");
      item.append(...keys.flatMap((k, i) => [i ? " " : "", make("kbd", { text: k })]), ` ${label}`);
      return item;
    }),
  );

  let detail = document.getElementById("detail");
  if (!detail) {
    detail = make("aside", { id: "detail", className: "detail", attrs: { "aria-live": "polite" } });
    brand.after(detail);
  }

  let hud = document.getElementById("hud");
  if (!hud) {
    hud = make("div", { id: "hud", className: "hud" });
    detail.after(hud);
  }
  const hudText = document.getElementById("hud-text") ?? hud.appendChild(make("span", { id: "hud-text", text: "Pad ready" }));

  let bar = document.querySelector("footer.bar");
  if (!bar) {
    bar = make("footer", { className: "bar" });
    body.appendChild(bar);
  }
  const button = (id, label, className, attrs) => document.getElementById(id) ?? make("button", { id, className, text: label, attrs: { type: "button", ...attrs } });
  const btnBuildAll = button("btn-build-all", "Build all");
  const btnExplode = button("btn-explode", "Explode", undefined, { disabled: "" });
  const btnReset = button("btn-reset", "Reset", "quiet");
  const btnStory = button("btn-story", "Story", "quiet"); // the guided demo (key P)
  document.getElementById("btn-sound")?.remove();
  for (const b of [btnBuildAll, btnExplode, btnReset, btnStory]) if (!b.isConnected) bar.appendChild(b);
  const btnRockets = button("btn-rockets", "Rockets", "quiet", { "aria-expanded": "false", "aria-controls": "rockets" });
  if (!btnRockets.isConnected) bar.insertBefore(btnRockets, btnBuildAll);
  let rocketsEl = document.getElementById("rockets");
  if (!rocketsEl) {
    rocketsEl = make("div", { id: "rockets", className: "rockets", attrs: { "aria-label": "Pre-made rockets" } });
    rocketsEl.hidden = true;
    btnRockets.after(rocketsEl);
  }

  return { canvas, brand, hint, detail, hud, hudText, bar, btnRockets, rocketsEl, btnBuildAll, btnExplode, btnReset, btnStory };
}
