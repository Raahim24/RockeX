// Parachute (round 22): a disk-gap-band canopy (the Mars landers' kind; it reads as a parachute on Earth too) for
// the Mars landing and any return that uses one. Visual model: every proportion and rate est.
//   createParachute({ diameter_m = 20, color = 0xff7a2a, gores = 16 })
//     -> { object3d, setDeploy(k), setLoad(speed_ms), update(dt), deploy, dispose() }
// object3d's origin is the attach point (the confluence on top of the payload); the canopy stands up +y from it.
// setDeploy(k), k 0 → 1: packed in its bag (k 0) → pulled out to a long streamer on taut lines (~0.3) → inflating
// (~0.3–0.75) → a full canopy with a small overshoot (1). setLoad(speed_ms): airspeed; fast = taut and full, with
// a quick breathing pulse; slow = softer, swinging more. update(dt) runs the sway (the canopy swings about the
// attach point) and the breathing. Gores alternate color / white; the apex vent and the gap between disk and band
// are open. Two draws: the canopy (vertex colours, both sides) and its suspension lines. No lights.
import * as THREE from "three";
import { SCALE } from "./layout.js";

const RINGS = 12; // apex → skirt
const GAP = [7, 8]; // the ring span left open between disk and band (rings 7–8)

export function createParachute({ diameter_m = 20, color = 0xff7a2a, gores = 16 } = {}) {
  const D = Math.max(0.5, diameter_m) * SCALE;
  const N = Math.max(8, Math.round(gores));
  const Rs = 0.35 * D; // inflated skirt radius (a canopy inflates to ~70 % of its nominal diameter)
  const Hd = 0.5 * Rs; // dome height above the skirt
  const Hl = 1.6 * D; // suspension line length (attach point → skirt)
  const COLS = N * 2; // two columns per gore, so the scallop between gores bulges
  const nV = (RINGS + 1) * COLS;
  const pos = new Float32Array(nV * 3);
  const col = new Float32Array(nV * 3);
  const main = new THREE.Color(color);
  const white = new THREE.Color(0.95, 0.94, 0.9);
  for (let r = 0; r <= RINGS; r++) {
    for (let c = 0; c < COLS; c++) {
      const g = Math.floor(c / 2);
      const k = (r * COLS + c) * 3;
      const cc = g % 2 ? white : main;
      col[k] = cc.r;
      col[k + 1] = cc.g;
      col[k + 2] = cc.b;
    }
  }
  const idx = [];
  for (let r = 0; r < RINGS; r++) {
    if (r >= GAP[0] && r < GAP[1]) continue; // the gap
    for (let c = 0; c < COLS; c++) {
      const a = r * COLS + c;
      const b = r * COLS + ((c + 1) % COLS);
      idx.push(a, a + COLS, b, b, a + COLS, b + COLS);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  const canopy = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.85, metalness: 0 }));
  canopy.name = "parachute-canopy";
  canopy.frustumCulled = false; // reshaped every frame
  canopy.castShadow = true;
  // lines: attach point → each gore seam on the skirt
  const lpos = new Float32Array(N * 2 * 3);
  const lgeo = new THREE.BufferGeometry();
  lgeo.setAttribute("position", new THREE.BufferAttribute(lpos, 3));
  const lines = new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({ color: 0xd8d4c8, transparent: true, opacity: 0.8 }));
  lines.name = "parachute-lines";
  lines.frustumCulled = false;
  const swing = new THREE.Group(); // swings about the attach point
  swing.add(canopy, lines);
  const object3d = new THREE.Group();
  object3d.name = "parachute";
  object3d.add(swing);
  for (const o of [canopy, lines]) o.raycast = () => {};

  let deploy = 0;
  let speed = 60;
  let time = 0;
  const ease = (x) => x * x * (3 - 2 * x);
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  // the shape at deploy k (+ breathing b): fills pos and lpos
  function shape(k, b) {
    const tension = THREE.MathUtils.smoothstep(speed, 5, 60);
    const full = 0.8 + 0.2 * tension; // a slow canopy sags a little
    const s1 = ease(clamp01(k / 0.3)); // packed → stretched
    const s2 = ease(clamp01((k - 0.3) / 0.45)); // stretched → inflated
    const over = k > 0.75 ? 1 + 0.08 * Math.sin(Math.PI * clamp01((k - 0.75) / 0.25)) : 1; // overshoot, back to 1 at k 1
    const skirtY = THREE.MathUtils.lerp(0.06 * D, Hl, s1) - 0.12 * Hl * s2 * (1 - tension); // slack lines sag
    for (let r = 0; r <= RINGS; r++) {
      const f = r / RINGS; // 0 apex … 1 skirt
      // stretched: a narrow streamer from the skirt up ~0.9 D; inflated: the dome
      const rS = 0.025 * D * (0.4 + f);
      const yS = skirtY + 0.9 * D * s1 * (1 - f);
      const ang = f * Math.PI * 0.5;
      const rF = Rs * Math.sin(Math.max(ang, 0.12)) * full * over * b;
      const yF = skirtY + Hd * Math.cos(ang) * (0.8 + 0.2 * full);
      const rr = THREE.MathUtils.lerp(rS, rF, s2);
      const yy = THREE.MathUtils.lerp(yS, yF, s2);
      for (let c = 0; c < COLS; c++) {
        const a = (c / COLS) * Math.PI * 2;
        const scallop = c % 2 ? 1 + 0.06 * s2 : 1; // the cloth bulges between the seams
        const i = (r * COLS + c) * 3;
        pos[i] = Math.cos(a) * rr * scallop;
        pos[i + 1] = yy + (c % 2 ? 0.015 * D * s2 : 0);
        pos[i + 2] = Math.sin(a) * rr * scallop;
      }
    }
    for (let g = 0; g < N; g++) {
      const i = (RINGS * COLS + g * 2) * 3; // the seam column on the skirt
      lpos.set([0, 0, 0, pos[i], pos[i + 1], pos[i + 2]], g * 6);
    }
    geo.attributes.position.needsUpdate = true;
    lgeo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    lines.visible = k > 0.02;
  }
  function apply() {
    const tension = THREE.MathUtils.smoothstep(speed, 5, 60);
    const open = ease(clamp01((deploy - 0.3) / 0.45));
    // breathing: quick and small when taut (supersonic-like flutter), slower and deeper when slack
    const b = 1 + open * (0.02 + 0.03 * (1 - tension)) * Math.sin(time * (2.5 + 4 * tension) * Math.PI * 2);
    shape(deploy, b);
    // sway about the attach point: more when slow, none while packed
    const amp = open * THREE.MathUtils.degToRad(2 + 7 * (1 - tension));
    swing.rotation.set(amp * Math.sin(time * 0.9), 0, amp * 0.7 * Math.sin(time * 0.7 + 1.3));
  }
  apply();
  return {
    object3d,
    get deploy() {
      return deploy;
    },
    setDeploy(k) {
      deploy = clamp01(Number(k) || 0);
      apply();
    },
    setLoad(speed_ms) {
      speed = Math.max(0, Number(speed_ms) || 0);
      apply();
    },
    update(dt = 0) {
      time += dt;
      apply();
    },
    dispose() {
      geo.dispose();
      lgeo.dispose();
      canopy.material.dispose();
      lines.material.dispose();
      object3d.removeFromParent();
    },
  };
}
