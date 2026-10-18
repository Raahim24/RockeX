// Flight twin (round 23, performance): the built stack as a few merged meshes for flight. The builder's parts
// draw one mesh per piece plus edge lines and instanced rivets (Saturn V ~1,000 draws, CPU-bound); the twin
// merges each part's static pieces into one geometry per material (vertex colours and UVs kept, the same
// painted materials with their soot / frost / bell-glow uniforms recomputed in the part's frame), merges its edge
// lines, drops the rivets, and keeps apart what moves on its own:
//   - deployables and their followers (legs, grid fins, panels): cloned pieces, applyDeploy works on them;
//   - the fairing halves (by their explode direction), the escape tower, the payload adapter, the lander pieces:
//     each merged into its own group, so the director can drop, hide or fly them off.
//   createFlightTwin(parts, { stages }) -> {
//     group,                      // add it where the parts' groups live (same parent); hide the builder stack
//     stageGroups[],              // by stage index; each holds its parts' twin groups (identity transform)
//     payloadGroup, boosterGroup, // the payload/fairing parts; side boosters (null: no preset has any)
//     fairingHalves: [+x, −x],    // groups inside the fairing's twin (null without a fairing)
//     partGroup(part | id),       // the twin group standing in for a part (same local transform as part.group)
//     parts: Map(id → { group, pieces, escapeTower, adapter, lander, fairingHalves }),
//     deployables(part | id),     // that part's twin deployables (applyDeploy(piece, k) as for the builder's)
//     pieceFor(builderPiece),     // the twin piece standing in for a builder deployable
//     applyDeploy(piece, k),      // passthrough (a builder or twin piece: maps builder → twin)
//     setBellGlow(part | id, throttle), setLanderVisible(part | id, on),
//     draws(),                    // visible draw calls (for checks)
//     dispose()                   // merged geometries and the twin's own materials; shared ones are left alone
//   }
//   prewarmAll(renderer, scene, camera, { extras }) compiles every material in the scene and in extras
// (objects or { object3d | group }), lit by the scene's lights, even hidden ones: call it once on the landing page.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { applyDeploy as applyDeployPiece } from "./parts.js";

function cloneMat(src) {
  const m = src.clone();
  if (src.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile) {
    m.onBeforeCompile = src.onBeforeCompile;
    m.customProgramCacheKey = src.customProgramCacheKey;
  }
  return m;
}
const tex = (t) => t?.uuid ?? "-";
// Materials that can share one draw: everything the program and its uniforms depend on, except the base colour
// (baked into the vertex colours: it multiplies them and the map anyway), roughness / metalness to a tenth, and
// the per-piece soot / frost / glow positions (recomputed per merged mesh in the part's frame).
const tenth = (v) => (v === undefined ? "-" : (Math.round(v * 10) / 10).toFixed(1));
function matKey(m) {
  return [
    m.type,
    m.emissive?.getHexString(),
    m.emissiveIntensity,
    tenth(m.roughness),
    tenth(m.metalness),
    tex(m.map),
    tex(m.bumpMap),
    m.bumpScale,
    tex(m.roughnessMap),
    tex(m.normalMap),
    tex(m.metalnessMap),
    tex(m.alphaMap),
    m.side,
    m.transparent,
    m.opacity,
    tenth(m.clearcoat),
    tenth(m.clearcoatRoughness),
    m.anisotropy,
    m.envMapIntensity,
    m.polygonOffset,
    m.flatShading,
    m.depthWrite,
    m.fog,
    m.customProgramCacheKey?.() ?? "",
    m.soot ? `s${m.soot.value.z}` : "",
    m.frost ? `f${m.frost.value.y.toFixed(5)},${m.frost.value.z},${m.frost.value.w.toFixed(5)}` : "",
    m.glow ? "glow" : "",
  ].join("|");
}
const lineKey = (m) => [m.type, m.depthTest, m.fog].join("|"); // colour and opacity go into RGBA vertex colours

// A geometry in the part's frame with exactly position, normal, uv and color (its vertex colours × the
// material's base colour), indexed.
function prep(geo, matrix, base) {
  const out = new THREE.BufferGeometry();
  const n = geo.attributes.position.count;
  const f32 = (attr) => {
    const a = new Float32Array(attr.count * attr.itemSize);
    for (let i = 0; i < attr.count; i++) for (let k = 0; k < attr.itemSize; k++) a[i * attr.itemSize + k] = attr.getComponent(i, k);
    return new THREE.BufferAttribute(a, attr.itemSize);
  };
  out.setAttribute("position", f32(geo.attributes.position));
  if (geo.attributes.normal) out.setAttribute("normal", f32(geo.attributes.normal));
  out.setAttribute("uv", geo.attributes.uv ? f32(geo.attributes.uv) : new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  const c = geo.attributes.color;
  const col = c && c.itemSize >= 3 && base.vertexColors ? f32(c) : null;
  const rgb = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    rgb[i * 3] = base.color.r * (col ? col.array[i * col.itemSize] : 1);
    rgb[i * 3 + 1] = base.color.g * (col ? col.array[i * col.itemSize + 1] : 1);
    rgb[i * 3 + 2] = base.color.b * (col ? col.array[i * col.itemSize + 2] : 1);
  }
  out.setAttribute("color", new THREE.BufferAttribute(rgb, 3));
  if (geo.index) out.setIndex(Array.from(geo.index.array));
  else out.setIndex([...Array(n).keys()]);
  if (!geo.attributes.normal) out.computeVertexNormals();
  out.applyMatrix4(matrix);
  return out;
}
function prepLines(geo, matrix, mat) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", g.attributes.position.clone());
  const n = g.attributes.position.count;
  const rgba = new Float32Array(n * 4);
  const a = mat.transparent ? mat.opacity : 1;
  for (let i = 0; i < n; i++) rgba.set([mat.color.r, mat.color.g, mat.color.b, a], i * 4);
  out.setAttribute("color", new THREE.BufferAttribute(rgba, 4));
  out.applyMatrix4(matrix);
  return out;
}

export function createFlightTwin(parts, { stages = null } = {}) {
  const group = new THREE.Group();
  group.name = "flight-twin";
  const stageGroups = [];
  const payloadGroup = new THREE.Group();
  payloadGroup.name = "twin-payload";
  group.add(payloadGroup);
  const boosterGroup = null;
  const own = { geos: [], mats: [] }; // what dispose frees
  const byId = new Map();
  const twinOf = new Map(); // builder piece → twin piece
  let fairingHalves = null;
  const inv = new THREE.Matrix4();
  const rel = new THREE.Matrix4();

  const stageOf = (part) => (Number.isInteger(part.stageIndex) ? part.stageIndex : null);
  for (const part of parts) {
    if (!part?.group) continue;
    part.group.updateMatrixWorld(true);
    inv.copy(part.group.matrixWorld).invert();
    const tg = new THREE.Group();
    tg.name = `twin:${part.id}`;
    tg.position.copy(part.group.position);
    tg.quaternion.copy(part.group.quaternion);
    tg.scale.copy(part.group.scale);
    tg.visible = part.group.visible;
    const entry = { group: tg, pieces: [], escapeTower: null, adapter: null, lander: null, fairingHalves: null, bells: [] };
    byId.set(part.id, entry);
    const si = stageOf(part);
    if (si === null || part.kind === "payload" || part.kind === "fairing") payloadGroup.add(tg);
    else {
      if (!stageGroups[si]) {
        stageGroups[si] = new THREE.Group();
        stageGroups[si].name = `twin-stage-${si}`;
        group.add(stageGroups[si]);
      }
      stageGroups[si].add(tg);
    }
    // buckets: category → material key → [{ geo, matrix, mat, mesh }]; lines likewise
    const buckets = new Map();
    const lineBuckets = new Map();
    const put = (map, cat, key, item) => {
      if (!map.has(cat)) map.set(cat, new Map());
      const m = map.get(cat);
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(item);
    };
    const shown = (o) => o.visible && o.layers.isEnabled(0);
    for (const p of part.pieces) {
      const mesh = p.mesh;
      if (!shown(mesh)) continue;
      if (p.deploy || p.follow) {
        // moves on its own: a clone (shared geometry and material, children with it)
        const clone = mesh.clone();
        tg.add(clone);
        const tp = { mesh: clone, rest: p.rest, deploy: p.deploy, follow: p.follow, engine: p.engine, kind: p.kind };
        entry.pieces.push(tp);
        twinOf.set(p, tp);
        continue;
      }
      const ud = mesh.userData;
      let cat = "static";
      if (part.kind === "fairing" && p.explode?.dir && Math.abs(p.explode.dir.x) >= 0.3) cat = p.explode.dir.x > 0 ? "fairing+" : "fairing-";
      else if (ud.escapeTower) cat = "escapeTower";
      else if (ud.adapter) cat = "adapter";
      else if (ud.lander) cat = "lander";
      mesh.updateMatrixWorld(true);
      const walk = (o) => {
        if (!shown(o)) return;
        rel.multiplyMatrices(inv, o.matrixWorld);
        if (o.isInstancedMesh) return; // rivets and other instanced details: dropped (sub-pixel in flight)
        if (o.isLineSegments || o.isLine) put(lineBuckets, cat, lineKey(o.material), { geo: o.geometry, matrix: rel.clone(), mat: o.material });
        else if (o.isMesh && o.material && !Array.isArray(o.material)) put(buckets, cat, matKey(o.material), { geo: o.geometry, matrix: rel.clone(), mat: o.material, mesh: o });
        for (const c of o.children) walk(c);
      };
      walk(mesh);
    }
    // followers: point at the twin leaders
    for (const tp of entry.pieces) {
      if (!tp.follow) continue;
      const leader = twinOf.get(tp.follow.leader);
      tp.follow = { ...tp.follow, leader };
      if (leader) (leader.followers ??= []).push(tp);
    }
    const sub = {};
    const holder = (cat) => {
      if (cat === "static") return tg;
      if (!sub[cat]) {
        sub[cat] = new THREE.Group();
        sub[cat].name = `twin:${part.id}:${cat}`;
        tg.add(sub[cat]);
      }
      return sub[cat];
    };
    for (const [cat, keyed] of buckets) {
      for (const items of keyed.values()) {
        const m0 = items[0].mat;
        const geo = mergeGeometries(items.map((it) => prep(it.geo, it.matrix, it.mat)));
        if (!geo) continue;
        geo.computeBoundingBox();
        geo.computeBoundingSphere();
        const mat = cloneMat(m0);
        mat.color.setRGB(1, 1, 1);
        mat.vertexColors = true;
        // soot / frost / glow in the part's frame (the merged geometry's frame)
        if (m0.soot) {
          let lo = Infinity;
          let hi = -Infinity;
          const heights = new Set();
          for (const it of items) {
            const y = it.matrix.elements[13];
            lo = Math.min(lo, it.mat.soot.value.x + y);
            hi = Math.max(hi, it.geo.boundingBox ? it.geo.boundingBox.max.y + y : lo);
            heights.add(it.mat.soot.value.y.toFixed(4));
          }
          const h = heights.size === 1 ? m0.soot.value.y : Math.max(hi - lo, 1e-3);
          mat.soot = { value: new THREE.Vector4(lo, h, m0.soot.value.z, 0) };
        }
        if (m0.frost) mat.frost = { value: m0.frost.value.clone().setX(m0.frost.value.x + items[0].matrix.elements[13]) };
        if (m0.glow) {
          mat.glow = { value: new THREE.Vector4(geo.boundingBox.min.y, geo.boundingBox.max.y, 0, 0) };
          entry.bells.push(mat.glow);
        }
        const mesh = new THREE.Mesh(geo, mat);
        mesh.name = `twin:${part.id}:${cat}`;
        mesh.castShadow = items.some((it) => it.mesh.castShadow);
        mesh.receiveShadow = items.some((it) => it.mesh.receiveShadow);
        mesh.onBeforeRender = items[0].mesh.onBeforeRender; // the frost clock
        mesh.raycast = () => {};
        holder(cat).add(mesh);
        own.geos.push(geo);
        own.mats.push(mat);
      }
    }
    for (const [cat, keyed] of lineBuckets) {
      for (const items of keyed.values()) {
        const geo = mergeGeometries(items.map((it) => prepLines(it.geo, it.matrix, it.mat)));
        if (!geo) continue;
        geo.computeBoundingSphere();
        const m0 = items[0].mat;
        const lmat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, depthTest: m0.depthTest, fog: m0.fog });
        own.mats.push(lmat);
        const lines = new THREE.LineSegments(geo, lmat);
        lines.name = `twin:${part.id}:${cat}:lines`;
        lines.raycast = () => {};
        holder(cat).add(lines);
        own.geos.push(geo);
      }
    }
    entry.escapeTower = sub.escapeTower ?? null;
    entry.adapter = sub.adapter ?? null;
    entry.lander = sub.lander ?? null;
    if (sub["fairing+"] || sub["fairing-"]) {
      entry.fairingHalves = [sub["fairing+"] ?? null, sub["fairing-"] ?? null];
      fairingHalves = entry.fairingHalves;
    }
  }
  const get = (p) => byId.get(typeof p === "string" ? p : p?.id);
  let draws = 0;
  return {
    group,
    stageGroups,
    payloadGroup,
    boosterGroup,
    fairingHalves,
    parts: byId,
    stages,
    partGroup: (p) => get(p)?.group ?? null,
    deployables: (p) => (get(p)?.pieces ?? []).filter((tp) => tp.deploy).sort((a, b) => a.deploy.order - b.deploy.order),
    pieceFor: (piece) => twinOf.get(piece) ?? null,
    applyDeploy(piece, k) {
      const tp = twinOf.get(piece) ?? piece;
      if (tp?.deploy) applyDeployPiece(tp, k);
    },
    setBellGlow(p, throttle = 0) {
      const v = Math.min(1, Math.max(0, Number(throttle) || 0));
      for (const g of get(p)?.bells ?? []) g.value.z = v;
    },
    setLanderVisible(p, on) {
      const l = get(p)?.lander;
      if (l) l.visible = !!on;
    },
    draws() {
      draws = 0;
      group.traverseVisible((o) => (o.isMesh || o.isLine || o.isPoints) && draws++);
      return draws;
    },
    dispose() {
      for (const g of own.geos) g.dispose();
      for (const m of own.mats) m.dispose();
      group.removeFromParent();
    },
  };
}

export function prewarmAll(renderer, scene, camera, { extras = [] } = {}) {
  if (!renderer?.compile) return 0;
  renderer.compile(scene, camera);
  let n = 1;
  for (const e of extras) {
    const o = e?.isObject3D ? e : (e?.object3d ?? e?.group ?? null);
    if (!o?.isObject3D || o === scene) continue;
    renderer.compile(o, camera, scene); // the scene's lights, so the programs match the ones used in flight
    n++;
  }
  return n;
}
