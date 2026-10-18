// Option shelf: when Grok offers choices for the next part, the real parts (the same models the rocket is built
// from) float in a column at the left of the view, turning slowly, each with a small label. Clicking one picks
// it; when that part is then built, its preview flies from the shelf onto its slot on the rocket.
//   createOptionShelf({ camera, scene, root, canvas, catalog, onPick }) ->
//     { show({ build, partId, options, built }), clear(), flyIn(part) -> Promise, has(partId, recordId), update(dt), busy,
//       partId, forBuilt }   (built: the options are swaps for a part already on the rocket)
//   options: [{ recordId, engineCount?, title, effect }]   (all of them; shown PAGE at a time with ‹ ›)
import * as THREE from "three";
import { buildManifest } from "./layout.js";
import { createMaterials, createPart } from "./parts.js";

const DIST = 3; // view-space distance of the shelf
const FIT = 0.4; // each preview fits in this share of the visible half-height
const FLY_S = 0.9;
const PAGE = 4; // parts on the shelf at once

// The build with one option swapped into the slot, so the manifest gives that option's exact part spec.
function withOption(build, partId, o) {
  const next = { ...build, stages: build.stages.map((s) => ({ ...s })) };
  const m = /^s(\d+)-(engines|tank)$/.exec(partId);
  if (m) {
    const stage = next.stages[Number(m[1])];
    if (m[2] === "engines") Object.assign(stage, { engineId: o.recordId, engineCount: o.engineCount ?? stage.engineCount });
    else stage.tankId = o.recordId;
  } else if (partId === "payload") next.payloadId = o.recordId;
  return next;
}

export function createOptionShelf({ camera, scene, root, canvas, catalog, onPick }) {
  const mats = createMaterials(); // its own materials: no fog, untouched by the rocket's opacity toggles
  const labels = document.createElement("div");
  labels.className = "option-shelf"; // the app keeps Grok's speech cloud clear of it
  labels.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:5";
  document.body.append(labels);
  const ray = new THREE.Raycaster();
  let items = [];
  let partId = null;
  let forBuilt = false; // shown for a part already on the rocket (a swap) rather than the next one
  let flying = null;
  let pressed = null;

  function dispose(item) {
    scene.remove(item.holder);
    item.label.remove();
  }

  // All options are kept; the shelf shows one page of PAGE at a time, with ‹ › to flip through the rest.
  let all = [];
  let page = 0;
  let shownBuild = null;
  const nav = document.createElement("div");
  nav.style.cssText =
    "position:absolute;display:none;gap:6px;align-items:center;pointer-events:auto;transform:translate(-50%,0);" +
    "font:600 12px/1 Inter,system-ui,sans-serif;color:#a9adb8";
  const navButton = (text, step) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = text;
    b.style.cssText =
      "cursor:pointer;border:1px solid rgba(255,255,255,.18);background:rgba(11,13,18,.82);color:#f6f7fb;border-radius:999px;" +
      "width:28px;height:28px;font:700 14px/1 Inter,system-ui,sans-serif;backdrop-filter:blur(6px)";
    b.addEventListener("click", () => flip(step));
    return b;
  };
  const pageText = document.createElement("span");
  nav.append(navButton("‹", -1), pageText, navButton("›", 1));
  labels.append(nav);
  const pages = () => Math.max(1, Math.ceil(all.length / PAGE));

  function clearItems() {
    items.forEach(dispose);
    items = [];
  }

  function clear() {
    clearItems();
    all = [];
    partId = null;
    nav.style.display = "none";
  }

  function show({ build, partId: id, options, built = false }) {
    clear();
    partId = id;
    forBuilt = built;
    shownBuild = build;
    all = options;
    page = 0;
    renderPage();
  }

  function flip(step) {
    if (flying || pages() < 2) return;
    page = (page + step + pages()) % pages();
    renderPage();
  }

  function renderPage() {
    clearItems();
    const start = page * PAGE;
    items = all.slice(start, start + PAGE).map((o, k) => {
      const i = start + k;
      const spec = buildManifest(withOption(shownBuild, partId, o), catalog).find((s) => s.id === partId);
      const part = createPart({ ...spec, slotY: 0 }, mats);
      part.group.traverse((obj) => {
        if (obj.material) [].concat(obj.material).forEach((m) => (m.fog = false));
      });
      const box = new THREE.Box3().setFromObject(part.group);
      const size = box.getSize(new THREE.Vector3());
      part.group.position.y = -(box.min.y + size.y / 2); // centre it on the holder
      const holder = new THREE.Group();
      holder.add(part.group);
      holder.userData = { size: Math.max(size.x, size.y, size.z) || 1, index: k, spin: k * 1.3 };
      scene.add(holder);
      const label = document.createElement("button");
      label.type = "button";
      label.style.cssText =
        "position:absolute;transform:translate(-50%,0);pointer-events:auto;cursor:pointer;border:1px solid rgba(255,255,255,.14);" +
        "background:rgba(11,13,18,.82);color:#f6f7fb;border-radius:10px;padding:4px 10px;font:600 12px/1.3 Inter,system-ui,sans-serif;" +
        "text-align:center;white-space:nowrap;backdrop-filter:blur(6px)";
      label.innerHTML = `<span style="opacity:.6">${i + 1}</span> ${o.title}<br><span style="font-weight:500;color:#a9adb8">${o.effect}</span>`;
      const item = { option: o, part, holder, label };
      label.addEventListener("click", () => pick(item));
      labels.append(label);
      return item;
    });
    pageText.textContent = `${page + 1} / ${pages()}`;
    nav.style.display = pages() > 1 ? "flex" : "none";
  }

  function pick(item) {
    if (flying) return;
    onPick?.({ partId, ...item.option });
  }

  // Click a preview in the scene (before the rocket's own part selector sees the click).
  const hit = (e) => {
    if (items.length === 0) return null;
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    const hits = ray.intersectObjects(items.map((it) => it.holder), true);
    if (!hits.length) return null;
    let obj = hits[0].object;
    while (obj && !items.some((it) => it.holder === obj)) obj = obj.parent;
    return items.find((it) => it.holder === obj) ?? null;
  };
  canvas.addEventListener(
    "pointerdown",
    (e) => {
      pressed = hit(e);
      if (pressed) e.stopImmediatePropagation();
    },
    true,
  );
  canvas.addEventListener(
    "pointerup",
    (e) => {
      if (pressed && hit(e) === pressed) {
        e.stopImmediatePropagation();
        pick(pressed);
      }
      pressed = null;
    },
    true,
  );

  const has = (id, recordId) => partId === id && items.some((it) => it.option.recordId === recordId);

  // The chosen preview flies from the shelf to its slot and grows to real size; the rest fade away.
  function flyIn(part) {
    const item = items.find((it) => it.option.recordId === part.record?.id);
    if (!item) return Promise.resolve();
    items.filter((it) => it !== item).forEach(dispose);
    item.label.remove();
    items = [];
    all = [];
    partId = null;
    nav.style.display = "none";
    const from = item.holder.position.clone();
    const fromScale = item.holder.scale.x;
    const to = root.localToWorld(new THREE.Vector3(0, part.slotY + part.height / 2, 0));
    return new Promise((resolve) => {
      flying = { item, from, to, fromScale, t: 0, resolve };
    });
  }

  function update(dt) {
    const h = DIST * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const w = h * camera.aspect;
    const n = items.length;
    items.forEach((it, i) => {
      const y = n === 1 ? 0 : h * 0.55 * (1 - (2 * i) / (n - 1));
      const local = new THREE.Vector3(-w * 0.62, y * 0.9, -DIST);
      it.holder.position.copy(camera.localToWorld(local));
      it.holder.scale.setScalar((FIT * h) / it.holder.userData.size / Math.max(1, n / 3));
      it.holder.userData.spin += dt * 0.6;
      it.holder.rotation.set(0, it.holder.userData.spin, 0);
      // label just under the preview, in screen pixels
      const below = it.holder.position.clone().add(new THREE.Vector3(0, -(FIT * h) * 0.55, 0)).project(camera);
      it.label.style.left = `${((below.x + 1) / 2) * innerWidth}px`;
      it.label.style.top = `${((1 - below.y) / 2) * innerHeight}px`;
    });
    if (items.length && nav.style.display !== "none") {
      const last = items[items.length - 1].holder.position.clone().add(new THREE.Vector3(0, -(FIT * h) * 1.05, 0)).project(camera);
      nav.style.left = `${((last.x + 1) / 2) * innerWidth}px`;
      nav.style.top = `${((1 - last.y) / 2) * innerHeight}px`;
    }
    if (flying) {
      flying.t = Math.min(1, flying.t + dt / FLY_S);
      const k = flying.t < 0.5 ? 2 * flying.t * flying.t : 1 - (-2 * flying.t + 2) ** 2 / 2; // ease in-out
      flying.item.holder.position.lerpVectors(flying.from, flying.to, k);
      flying.item.holder.scale.setScalar(THREE.MathUtils.lerp(flying.fromScale, 1, k));
      if (flying.t >= 1) {
        dispose(flying.item);
        const done = flying.resolve;
        flying = null;
        done();
      }
    }
  }

  return {
    show,
    clear,
    flyIn,
    has,
    update,
    get partId() {
      return partId;
    },
    get forBuilt() {
      return forBuilt;
    },
    get busy() {
      return Boolean(flying);
    },
  };
}
