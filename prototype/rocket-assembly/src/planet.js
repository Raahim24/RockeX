// Planets, landing surfaces, ocean and touchdown dust.
//   createPlanet({ kind: "earth" | "moon" | "mars", radius_u, mode }) -> { object3d, update(t, camera?), setSunDir(v3), dispose() }
//     mode "photoreal" (default): NASA maps (src/assets/planets/SOURCES.md), day/night blend, ocean glint, bump
//     relief, a cloud sphere with cloud shadows, a single-scatter atmosphere shell; Earth 3 draws, Mars 2, Moon 1.
//   skyAt(altitude_m, sunDir, body) -> { zenith, horizon, stars }   sky colours for the background.
//   createTerrain({ body, size_u, seed, padRadius_u, sunDir }) -> { object3d, sun, heightAt(x, z), dispose() }
//     displaced ground with craters / dunes, instanced boulders, a shadow-casting sun; enableShadowCasting(group).
//   createOcean({ size_u }) -> { object3d, update(dt, { sky, sunDir }), setSky(sky), bob(t), dispose() }
//   createSkyDome({ radius_u }) -> { object3d, set(sky, sunDir), update(camera), dispose() }
// The rest of this header is the line-art mode, kept for the builder's twin compare (dark shaded bodies, warm
// key, peach rims and lines; everything procedural):
//   createPlanet({ ..., mode: "lineart" })
//     3 draws: the body (one ShaderMaterial: shading, surface, Earth's clouds), a peach graticule every 15°
//     (opacity 0.12, turns with the body), and a thin additive atmosphere shell (Earth, Mars; the Moon has none).
//     Slow self-rotation in update(t) (t in seconds); pass the camera too and the graticule fades as the globe
//     gets small on screen (15° lines would crowd into a cage). setSunDir(world direction) moves the terminator.
//     Built to read both huge (landing page, radius ~40 u filling the lower half of the frame) and small.
//   createSurfacePatch({ kind, radius_u }) -> { object3d, dispose() }
//     flat ground disc for the landing close-up with peach line-art (opacity 0.2, fog on): craters and rocks
//     on the Moon, dunes and rocks on Mars; receives shadows. Keep the middle (r < 0.12 R) clear for the lander.
//   createDustPuff() -> { object3d, fire({ position, radius }), update(dt), active(), dispose() }
//     a ring of additive dust blobs thrown out at touchdown over ~1 s (one Points draw).
//   createShadowDecal({ radius_u }) -> { object3d, update({ position, altitude_u, sunDir }), dispose() }
//     the lander's soft shadow on a surface patch: offset away from the sun by altitude, softer and fainter
//     as it climbs (1 draw). Earth also shows sparse warm city lights on its night side.
// Planet materials ignore fog so a distant globe is not swallowed by the per-frame fog band around the rocket.
import * as THREE from "three";
import { peachLineMaterial } from "./parts.js";
import { SCALE } from "./layout.js";
import { shipBob } from "./fx/launchfx.js";
import { atmosphereFor, lightingFor } from "./arrival.js";

const PEACH = new THREE.Color(1.0, 0.706, 0.541);
const SPIN = 0.015; // rad/s self-rotation
const DEFAULT_SUN = new THREE.Vector3(-0.45, 0.75, 0.5).normalize(); // matches the warm key (upper-left-front)

// Per kind: surface colours (linear) and atmosphere.
const KINDS = {
  earth: { define: "KIND_EARTH", base: [0.03, 0.045, 0.07], land: [0.08, 0.09, 0.08], atmo: [0.3, 0.5, 1.0], atmoGain: 0.4 },
  moon: { define: "KIND_MOON", base: [0.13, 0.13, 0.135], land: [0.085, 0.085, 0.09], atmo: null, atmoGain: 0 },
  mars: { define: "KIND_MARS", base: [0.2, 0.08, 0.04], land: [0.11, 0.05, 0.03], atmo: [0.9, 0.55, 0.35], atmoGain: 0.3 },
};

const NOISE = /* glsl */ `
  float hash3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vnoise(vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x), mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x), mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float fbm3(vec3 p) { float s = 0.0; float a = 0.5; for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = p * 2.03 + 11.7; a *= 0.5; } return s / 0.875; }
  // Cellular craters: bowl inside the radius, raised rim just outside (height in units of the body radius × k).
  float craters(vec3 p, float freq) {
    vec3 q = p * freq; vec3 i = floor(q); vec3 f = fract(q);
    float best = 8.0; float rnd = 0.0;
    for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
      vec3 g = vec3(float(x), float(y), float(z));
      vec3 o = vec3(hash3(i + g), hash3(i + g + 19.1), hash3(i + g + 47.3));
      vec3 r = g + o - f; float d = dot(r, r);
      if (d < best) { best = d; rnd = hash3(i + g + 71.7); }
    }
    float rad = 0.18 + 0.3 * rnd;
    float d = sqrt(best) / rad;
    float bowl = d < 1.0 ? (d * d - 1.0) * 0.6 : 0.0;
    float rim = exp(-pow((d - 1.0) / 0.14, 2.0)) * 0.35;
    return (bowl + rim) * step(0.35, rnd + 0.2);
  }
`;

const bodyVertex = /* glsl */ `
  varying vec3 vObj;
  varying vec3 vNormalW;
  varying vec3 vWorldPos;
  void main() {
    vObj = normalize(position);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const bodyFragment = /* glsl */ `
  uniform vec3 uSunDir, uSunColor, uRim, uBase, uLand, uAmbient;
  uniform float uTime, uRadius;
  varying vec3 vObj;
  varying vec3 vNormalW;
  varying vec3 vWorldPos;
  ${NOISE}
  // Screen-space bump (three's perturbNormalArb): h is a height in world units.
  vec3 bump(vec3 N, float h) {
    vec3 dpx = dFdx(vWorldPos); vec3 dpy = dFdy(vWorldPos);
    float dhx = dFdx(h); float dhy = dFdy(h);
    vec3 r1 = cross(dpy, N); vec3 r2 = cross(N, dpx);
    float det = dot(dpx, r1);
    vec3 grad = sign(det) * (dhx * r1 + dhy * r2);
    return normalize(abs(det) * N - grad);
  }
  void main() {
    vec3 N0 = normalize(vNormalW);
    vec3 N = N0;
    vec3 L = normalize(uSunDir);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 albedo = uBase;
    float glint = 0.0;
    float clouds = 0.0;
    float land = 0.0;
  #ifdef KIND_EARTH
    float c = fbm3(vObj * 1.7 + 3.1);
    land = smoothstep(0.53, 0.57, c);
    albedo = mix(uBase, uLand, land);
    albedo += uRim * 0.05 * exp(-pow((c - 0.55) / 0.012, 2.0));              // faint warm coastline
    glint = (1.0 - land) * pow(max(dot(reflect(-L, N0), V), 0.0), 60.0) * 0.35; // ocean sun glint
    // Cloud band: noise drifting in longitude, strongest in the mid latitudes.
    float a = uTime * 0.01;
    vec3 cp = vec3(vObj.x * cos(a) - vObj.z * sin(a), vObj.y, vObj.x * sin(a) + vObj.z * cos(a));
    float band = smoothstep(0.75, 0.2, abs(vObj.y)) * smoothstep(0.0, 0.25, abs(vObj.y) + 0.05);
    clouds = smoothstep(0.58, 0.78, fbm3(cp * vec3(4.0, 9.0, 4.0) + 5.3)) * band * 0.3;
  #endif
  #ifdef KIND_MOON
    float maria = smoothstep(0.45, 0.62, fbm3(vObj * 1.6 + 7.0));
    albedo = mix(uBase, uLand, maria);
    float h = craters(vObj, 7.0) + 0.5 * craters(vObj + 3.3, 17.0);
    N = bump(N0, h * uRadius * 0.012);
    albedo *= 0.9 + 0.2 * vnoise(vObj * 40.0);
  #endif
  #ifdef KIND_MARS
    float dark = smoothstep(0.42, 0.66, fbm3(vObj * 2.0 + 1.7));
    albedo = mix(uBase, uLand, dark);
    float cap = smoothstep(0.82, 0.9, abs(vObj.y) + 0.04 * vnoise(vObj * 12.0));
    albedo = mix(albedo, vec3(0.32, 0.3, 0.3), cap);
    N = bump(N0, craters(vObj, 9.0) * uRadius * 0.006);
  #endif
    float ndl = dot(N, L);
    float diff = smoothstep(-0.04, 1.0, ndl);
    vec3 col = albedo * (uSunColor * diff * 1.25 + uAmbient);
    col = mix(col, vec3(0.55, 0.57, 0.6) * (uSunColor * diff * 1.5 + uAmbient * 2.0), clouds);
    col += uSunColor * glint * diff;
    float ndl0 = dot(N0, L);
    col += uRim * exp(-pow(ndl0 / 0.1, 2.0)) * 0.06;                                  // warm terminator
    float fres = pow(1.0 - clamp(dot(N0, V), 0.0, 1.0), 4.0);
    fres = pow(fres, 1.25);                                                              // narrow on huge globes
    col += uRim * fres * (0.1 + 0.9 * smoothstep(-0.25, 0.6, ndl0)) * 0.35;           // peach fresnel rim
  #ifdef KIND_EARTH
    // Night-side city lights: sparse warm dots on land, clustered by a population noise.
    float night = smoothstep(0.06, -0.2, ndl0);
    float pop = smoothstep(0.45, 0.72, fbm3(vObj * 5.0 + 9.0));
    float city = step(0.955, hash3(floor(vObj * 170.0))) * land * pop;
    col += vec3(1.0, 0.72, 0.42) * city * night * (1.0 - clouds) * 0.8;
  #endif
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const atmoFragment = /* glsl */ `
  uniform vec3 uSunDir, uColor;
  uniform float uGain;
  varying vec3 vNormalW;
  varying vec3 vWorldPos;
  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(cameraPosition - vWorldPos);
    float rim = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 3.0);
    float lit = smoothstep(-0.35, 0.6, dot(N, normalize(uSunDir)));
    gl_FragColor = vec4(uColor * rim * (0.15 + 0.85 * lit) * uGain, 1.0);
  }
`;

function graticule(radius) {
  const pos = [];
  const pt = (lat, lon) => [radius * Math.cos(lat) * Math.sin(lon), radius * Math.sin(lat), radius * Math.cos(lat) * Math.cos(lon)];
  const step = (15 * Math.PI) / 180;
  for (let lon = 0; lon < Math.PI * 2 - 1e-6; lon += step) {
    for (let i = 0; i < 48; i++) pos.push(...pt(-Math.PI / 2 + (i * Math.PI) / 48, lon), ...pt(-Math.PI / 2 + ((i + 1) * Math.PI) / 48, lon));
  }
  for (let lat = -Math.PI / 2 + step; lat < Math.PI / 2 - 1e-6; lat += step) {
    for (let i = 0; i < 96; i++) pos.push(...pt(lat, (i * Math.PI * 2) / 96), ...pt(lat, ((i + 1) * Math.PI * 2) / 96));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return geo;
}

// Line-art mode (procedural shading + peach graticule): kept for the builder's twin compare.
function createLineartPlanet({ kind = "earth", radius_u = 40 } = {}) {
  const k = KINDS[kind] ?? KINDS.earth;
  const R = Math.max(1e-3, radius_u);
  const sun = { value: DEFAULT_SUN.clone() };
  const time = { value: 0 };
  const object3d = new THREE.Group();
  object3d.name = `planet:${kind}`;

  const bodyMat = new THREE.ShaderMaterial({
    defines: { [k.define]: "" },
    uniforms: {
      uSunDir: sun,
      uTime: time,
      uRadius: { value: R },
      uSunColor: { value: new THREE.Color(1.0, 0.86, 0.72) },
      uRim: { value: PEACH.clone() },
      uBase: { value: new THREE.Color(...k.base) },
      uLand: { value: new THREE.Color(...k.land) },
      uAmbient: { value: new THREE.Color(0.012, 0.014, 0.02) },
    },
    vertexShader: bodyVertex,
    fragmentShader: bodyFragment,
    fog: false,
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(R, 128, 96), bodyMat);
  body.name = "planet-body";
  body.raycast = () => {};
  object3d.add(body);

  const gratMat = new THREE.LineBasicMaterial({ color: PEACH, transparent: true, opacity: 0.12, depthWrite: false, fog: false });
  const grat = new THREE.LineSegments(graticule(R * 1.003), gratMat);
  grat.name = "planet-graticule";
  grat.raycast = () => {};
  body.add(grat); // turns with the body

  let atmo = null;
  if (k.atmo) {
    const atmoMat = new THREE.ShaderMaterial({
      uniforms: { uSunDir: sun, uColor: { value: new THREE.Color(...k.atmo) }, uGain: { value: k.atmoGain } },
      vertexShader: bodyVertex,
      fragmentShader: atmoFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      fog: false,
    });
    atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.025, 96, 64), atmoMat);
    atmo.name = "planet-atmosphere";
    atmo.raycast = () => {};
    object3d.add(atmo);
  }

  const centre = new THREE.Vector3();
  return {
    object3d,
    radius_u: R,
    mode: "lineart",
    setScale(s = 1) {
      object3d.scale.setScalar(s);
      bodyMat.uniforms.uRadius.value = R * s;
    },
    update(t = 0, camera = null) {
      body.rotation.y = t * SPIN;
      time.value = t;
      if (camera) {
        // angular radius on screen: full graticule above ~0.12 rad, down to a quarter below ~0.02 rad
        const ang = R / Math.max(1e-6, camera.position.distanceTo(object3d.getWorldPosition(centre)));
        gratMat.opacity = 0.12 * THREE.MathUtils.clamp((ang - 0.02) / 0.1, 0.25, 1);
      }
    },
    setSunDir(v) {
      if (v && v.lengthSq() > 0) sun.value.copy(v).normalize();
    },
    dispose() {
      body.geometry.dispose();
      bodyMat.dispose();
      grat.geometry.dispose();
      gratMat.dispose();
      if (atmo) atmo.geometry.dispose(), atmo.material.dispose();
      object3d.removeFromParent();
    },
  };
}

// Seeded random in [0, 1).
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

export function createSurfacePatch({ kind = "moon", radius_u = 12, seed = 7 } = {}) {
  const R = Math.max(0.1, radius_u);
  const rand = rng(seed);
  const object3d = new THREE.Group();
  object3d.name = `surface:${kind}`;
  const groundColor = { moon: 0x1c1c1e, mars: 0x2a150c, earth: 0x15191d }[kind] ?? 0x1c1c1e;
  const groundMat = new THREE.MeshStandardMaterial({ color: groundColor, roughness: 1, metalness: 0, fog: true });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(R, 96).rotateX(-Math.PI / 2), groundMat);
  ground.receiveShadow = true;
  ground.name = "surface-ground";
  object3d.add(ground);

  const segs = [];
  const y = 0.003;
  const seg = (x0, z0, x1, z1) => segs.push(x0, y, z0, x1, y, z1);
  const clear = 0.12 * R; // keep the landing spot clear
  const place = (margin) => {
    for (let tries = 0; tries < 50; tries++) {
      const r = Math.sqrt(rand()) * (R - margin);
      const a = rand() * Math.PI * 2;
      if (r - margin > clear) return [Math.cos(a) * r, Math.sin(a) * r];
    }
    return null;
  };
  const ring = (cx, cz, r, n, from = 0, to = Math.PI * 2) => {
    for (let i = 0; i < n; i++) {
      const a0 = from + ((to - from) * i) / n;
      const a1 = from + ((to - from) * (i + 1)) / n;
      seg(cx + Math.cos(a0) * r, cz + Math.sin(a0) * r, cx + Math.cos(a1) * r, cz + Math.sin(a1) * r);
    }
  };
  const rocks = (count, smin, smax) => {
    for (let i = 0; i < count; i++) {
      const s = smin + (smax - smin) * rand() ** 2;
      const c = place(s);
      if (!c) continue;
      const n = 5;
      const a0 = rand() * Math.PI;
      const pts = Array.from({ length: n }, (_, j) => {
        const a = a0 + (j / n) * Math.PI * 2;
        const rr = s * (0.7 + 0.5 * rand());
        return [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr];
      });
      pts.forEach((p, j) => seg(...p, ...pts[(j + 1) % n]));
    }
  };
  if (kind === "moon") {
    for (let i = 0; i < 38; i++) {
      const s = R * (0.02 + 0.1 * rand() ** 2.2);
      const c = place(s);
      if (!c) continue;
      ring(c[0], c[1], s, 24); // rim
      const sh = Math.PI * 0.15 + rand() * 0.3; // inner shadow arc on the far side of the light
      ring(c[0] + s * 0.12, c[1] - s * 0.1, s * 0.78, 10, sh, sh + Math.PI * 0.9);
    }
    rocks(70, R * 0.004, R * 0.014);
  } else if (kind === "mars") {
    const spacing = R * 0.07;
    const freq = 2.6 / R;
    for (let z = -R; z <= R; z += spacing) {
      const phase = rand() * Math.PI * 2;
      const amp = spacing * (0.25 + 0.2 * rand());
      let prev = null;
      for (let i = 0; i <= 64; i++) {
        const x = -R + (2 * R * i) / 64;
        const zz = z + amp * Math.sin(x * freq + phase);
        const r = Math.hypot(x, zz);
        const ok = r < R * 0.97 && r > clear;
        if (ok && prev) seg(prev[0], prev[1], x, zz);
        prev = ok ? [x, zz] : null;
      }
    }
    rocks(45, R * 0.004, R * 0.012);
  } else {
    ring(0, 0, R * 0.5, 64);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(segs, 3));
  const lines = new THREE.LineSegments(geo, peachLineMaterial(0.2));
  lines.name = "surface-lines";
  lines.raycast = () => {};
  object3d.add(lines);
  return {
    object3d,
    radius_u: R,
    dispose() {
      ground.geometry.dispose();
      groundMat.dispose();
      geo.dispose();
      lines.material.dispose();
      object3d.removeFromParent();
    },
  };
}

const DUST_N = 28;
const DUST_SECONDS = 1.0;
const dustVertex = /* glsl */ `
  attribute float aAngle, aSpeed, aSize, aRise;
  uniform float uT, uRadius, uViewportH;
  varying float vAlpha;
  void main() {
    float e = 1.0 - pow(1.0 - uT, 3.0);                          // fast out, slow settle
    float d = uRadius * (0.25 + 1.35 * e * aSpeed);
    vec3 p = vec3(cos(aAngle) * d, aRise * uRadius * 0.35 * e, sin(aAngle) * d);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float size = uRadius * (0.35 + 0.9 * e) * aSize;
    gl_PointSize = size * projectionMatrix[1][1] * uViewportH * 0.5 / max(-mv.z, 1e-3);
    vAlpha = pow(1.0 - uT, 1.5) * smoothstep(0.0, 0.08, uT);
    gl_Position = projectionMatrix * mv;
  }
`;
const dustFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c) * 2.0;                                  // 0 centre .. 1 edge of the point sprite
    float g = (1.0 - smoothstep(0.0, 1.0, r)) * exp(-r * r * 2.0);
    gl_FragColor = vec4(uColor * g * vAlpha, 1.0);
  }
`;

export function createDustPuff() {
  const angle = new Float32Array(DUST_N);
  const speed = new Float32Array(DUST_N);
  const size = new Float32Array(DUST_N);
  const rise = new Float32Array(DUST_N);
  const rand = rng(29);
  for (let i = 0; i < DUST_N; i++) {
    angle[i] = (i / DUST_N) * Math.PI * 2 + (rand() - 0.5) * 0.3;
    speed[i] = 0.7 + 0.6 * rand();
    size[i] = 0.6 + 0.8 * rand();
    rise[i] = 0.2 + 0.8 * rand();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(DUST_N * 3), 3));
  geo.setAttribute("aAngle", new THREE.BufferAttribute(angle, 1));
  geo.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geo.setAttribute("aRise", new THREE.BufferAttribute(rise, 1));
  const uniforms = { uT: { value: 0 }, uRadius: { value: 1 }, uViewportH: { value: 900 }, uColor: { value: new THREE.Color(0.3, 0.24, 0.18) } }; // dusty grey-brown
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: dustVertex, fragmentShader: dustFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false; // positions come from the shader
  points.raycast = () => {};
  points.name = "dust-puff";
  const buf = new THREE.Vector2();
  points.onBeforeRender = (renderer) => (uniforms.uViewportH.value = renderer.getDrawingBufferSize(buf).y);
  const object3d = new THREE.Group();
  object3d.name = "dust";
  object3d.add(points);
  object3d.visible = false;
  let t = 1;
  return {
    object3d,
    fire({ position, radius = 1 } = {}) {
      if (position) object3d.position.copy(position);
      uniforms.uRadius.value = Math.max(1e-3, radius);
      t = 0;
      uniforms.uT.value = 0;
      object3d.visible = true;
    },
    update(dt = 0) {
      if (!object3d.visible) return;
      t = Math.min(1, t + dt / DUST_SECONDS);
      uniforms.uT.value = t;
      if (t >= 1) object3d.visible = false;
    },
    active: () => object3d.visible,
    dispose() {
      geo.dispose();
      mat.dispose();
      object3d.removeFromParent();
    },
  };
}

// Soft lander shadow on a surface patch. position: the ground point under the lander (same frame as object3d);
// the shadow falls away from the sun (offset −sun.xz / sun.y × altitude) and widens and fades as it climbs.
export function createShadowDecal({ radius_u = 0.6 } = {}) {
  const r0 = Math.max(1e-3, radius_u);
  const uA = { value: 0 };
  const mat = new THREE.ShaderMaterial({
    uniforms: { uA },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `uniform float uA; varying vec2 vUv;
      void main() { float r = length(vUv - 0.5) * 2.0; gl_FragColor = vec4(0.0, 0.0, 0.0, uA * (1.0 - smoothstep(0.35, 1.0, r))); }`,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    fog: false,
  });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2), mat);
  mesh.name = "shadow-decal";
  mesh.raycast = () => {};
  const object3d = new THREE.Group();
  object3d.name = "shadow-decal";
  object3d.add(mesh);
  return {
    object3d,
    update({ position, altitude_u = 0, sunDir = DEFAULT_SUN } = {}) {
      const alt = Math.max(0, altitude_u);
      const sy = Math.max(0.15, sunDir.y);
      if (position) object3d.position.set(position.x - (sunDir.x / sy) * alt, position.y + 0.004, position.z - (sunDir.z / sy) * alt);
      const s = r0 * (1 + alt / (r0 * 8));
      mesh.scale.set(s, 1, s);
      uA.value = 0.6 / (1 + alt / (r0 * 6)) ** 2;
      object3d.visible = uA.value > 0.005;
    },
    dispose() {
      mesh.geometry.dispose();
      mat.dispose();
      object3d.removeFromParent();
    },
  };
}

// =====================================================================================================
// Photoreal planets (round 15): NASA maps (src/assets/planets, see SOURCES.md), day/night blend by the sun,
// ocean glint, bump relief, a cloud sphere with cloud shadows, and a single-scatter atmosphere shell.
// =====================================================================================================

// Static URLs so Vite and Next/Turbopack both bundle the files.
const MAP_URLS = {
  earth_day: new URL("./assets/planets/earth_day.jpg", import.meta.url).href,
  earth_night: new URL("./assets/planets/earth_night.jpg", import.meta.url).href,
  earth_clouds: new URL("./assets/planets/earth_clouds.jpg", import.meta.url).href,
  earth_bump: new URL("./assets/planets/earth_bump.jpg", import.meta.url).href,
  moon_color: new URL("./assets/planets/moon_color.jpg", import.meta.url).href,
  moon_disp: new URL("./assets/planets/moon_disp.jpg", import.meta.url).href,
  mars_color: new URL("./assets/planets/mars_color.jpg", import.meta.url).href,
  mars_bump: new URL("./assets/planets/mars_bump.jpg", import.meta.url).href,
};
export const PLANET_MAPS = MAP_URLS;
// The shared map textures by name (see MAP_URLS), e.g. for world.js; 1×1 placeholders outside a browser.
export const planetTexture = (name, opts) => planetMap(name, opts);

// Textures load once in the browser and are shared; outside a browser (node checks) a 1×1 placeholder stands in.
const texCache = new Map();
function planetMap(name, { srgb = true } = {}) {
  if (texCache.has(name)) return texCache.get(name);
  let tex;
  if (typeof document !== "undefined" && MAP_URLS[name]) {
    tex = new THREE.TextureLoader().load(MAP_URLS[name]);
    tex.anisotropy = 8;
  } else {
    tex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    tex.needsUpdate = true;
  }
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  texCache.set(name, tex);
  return tex;
}

// Per body: maps, relief (bump height in units of the radius), atmosphere (colour, scale height / radius,
// Mie forward-scatter share, gain), clouds.
const REAL = {
  earth: { color: "earth_day", bump: "earth_bump", night: "earth_night", clouds: "earth_clouds", relief: 0.004, ocean: 1, atmo: { color: [0.3, 0.52, 1.0], H: 0.014, mie: 0.25, gain: 1.4, haze: 0.55 } },
  moon: { color: "moon_color", bump: "moon_disp", relief: 0.006, ocean: 0, atmo: null },
  mars: { color: "mars_color", bump: "mars_bump", relief: 0.006, ocean: 0, atmo: { color: [0.85, 0.55, 0.32], H: 0.01, mie: 1.0, gain: 0.8, haze: 0.3 } },
};

const realVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const realBodyFragment = /* glsl */ `
  uniform sampler2D uColor, uBump, uNight, uClouds;
  uniform vec3 uSunDir, uSunColor, uAtmo;
  uniform float uRelief, uRadius, uOcean, uHasNight, uHasClouds, uCloudU, uHaze;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vWorldPos;
  vec3 bump(vec3 N, float h) {
    vec3 dpx = dFdx(vWorldPos); vec3 dpy = dFdy(vWorldPos);
    float dhx = dFdx(h); float dhy = dFdy(h);
    vec3 r1 = cross(dpy, N); vec3 r2 = cross(N, dpx);
    float det = dot(dpx, r1);
    return normalize(abs(det) * N - sign(det) * (dhx * r1 + dhy * r2));
  }
  void main() {
    vec3 N0 = normalize(vNormalW);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(uSunDir);
    vec3 albedo = texture2D(uColor, vUv).rgb;
    float h = texture2D(uBump, vUv).r;
    vec3 N = bump(N0, h * uRelief * uRadius);
    float ndl0 = dot(N0, L);
    float diff = max(dot(N, L), 0.0) * smoothstep(-0.05, 0.1, ndl0);
    // Cloud shadows: the cloud map sampled a little toward the sun (in the local east/north frame).
    float shade = 1.0;
    float cover = 0.0;
    if (uHasClouds > 0.5) {
      vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), N0) + vec3(1e-5));
      vec3 north = cross(N0, east);
      vec2 toSun = vec2(dot(L, east), dot(L, north));
      vec2 cuv = vec2(vUv.x + uCloudU, vUv.y);
      cover = texture2D(uClouds, cuv).r;
      shade = 1.0 - 0.45 * smoothstep(0.15, 0.9, texture2D(uClouds, cuv - toSun * 0.004).r);
    }
    vec3 col = albedo * uSunColor * diff * 1.35 * shade;
    // Ocean glint where the topography map is at sea level.
    float ocean = uOcean * (1.0 - smoothstep(0.004, 0.03, h));
    vec3 Hh = normalize(L + V);
    col += uSunColor * pow(max(dot(N0, Hh), 0.0), 220.0) * ocean * 0.5 * step(0.0, ndl0) * shade;
    // City lights on the night side, dimmed under clouds.
    float night = 1.0 - smoothstep(-0.18, 0.08, ndl0);
    col += texture2D(uNight, vUv).rgb * night * uHasNight * 1.6 * (1.0 - 0.7 * cover);
    // In-scattered haze toward the limb (the atmosphere seen against the disc).
    float fres = pow(1.0 - clamp(dot(N0, V), 0.0, 1.0), 2.2);
    float lit = smoothstep(-0.2, 0.45, ndl0);
    col = mix(col, uAtmo * lit * 1.1, fres * uHaze);
    col += uAtmo * lit * uHaze * 0.035;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const cloudFragment = /* glsl */ `
  uniform sampler2D uClouds;
  uniform vec3 uSunDir, uSunColor;
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    float a = smoothstep(0.1, 0.85, texture2D(uClouds, vUv).r);
    if (a < 0.01) discard;
    float ndl = dot(normalize(vNormalW), normalize(uSunDir));
    float lit = smoothstep(-0.12, 0.35, ndl);
    vec3 col = uSunColor * (0.004 + 0.996 * lit) * mix(vec3(1.0), vec3(1.0, 0.62, 0.42), exp(-pow(ndl / 0.14, 2.0)) * 0.6);
    gl_FragColor = vec4(col, a * 0.92);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
// Single-scatter limb: along each view ray, density at the ray's closest approach to the planet centre
// (exp falloff with scale height H), lit where that point sees the sun, Rayleigh phase plus a Mie forward peak.
const scatterFragment = /* glsl */ `
  uniform vec3 uCenter, uSunDir, uColor;
  uniform float uR, uH, uGain, uMie;
  varying vec3 vWorldPos;
  void main() {
    vec3 ro = cameraPosition;
    vec3 rd = normalize(vWorldPos - ro);
    float tc = dot(uCenter - ro, rd);
    vec3 pc = ro + rd * max(tc, 0.0);
    float b = length(pc - uCenter);
    float dens = exp(-max(b - uR, 0.0) / uH) * step(0.0, tc);
    vec3 up = normalize(pc - uCenter);
    vec3 L = normalize(uSunDir);
    float lit = smoothstep(-0.3, 0.35, dot(up, L));
    float mu = dot(rd, L);
    float phase = 0.75 * (1.0 + mu * mu) + uMie * 3.0 * pow(max(mu, 0.0), 10.0);
    gl_FragColor = vec4(uColor * dens * lit * phase * uGain, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function createPhotorealPlanet({ kind = "earth", radius_u = 40 } = {}) {
  const k = REAL[kind] ?? REAL.earth;
  const R = Math.max(1e-3, radius_u);
  const sun = { value: DEFAULT_SUN.clone() };
  const sunColor = { value: new THREE.Color(1.0, 0.96, 0.9) };
  const object3d = new THREE.Group();
  object3d.name = `planet:${kind}`;
  const black = planetMap("none");
  const bodyMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: planetMap(k.color) },
      uBump: { value: planetMap(k.bump, { srgb: false }) },
      uNight: { value: k.night ? planetMap(k.night) : black },
      uClouds: { value: k.clouds ? planetMap(k.clouds, { srgb: false }) : black },
      uSunDir: sun,
      uSunColor: sunColor,
      uAtmo: { value: new THREE.Color(...(k.atmo?.color ?? [0, 0, 0])) },
      uRelief: { value: k.relief },
      uRadius: { value: R },
      uOcean: { value: k.ocean },
      uHasNight: { value: k.night ? 1 : 0 },
      uHasClouds: { value: k.clouds ? 1 : 0 },
      uCloudU: { value: 0 },
      uHaze: { value: k.atmo?.haze ?? 0 },
    },
    vertexShader: realVertex,
    fragmentShader: realBodyFragment,
    fog: false,
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(R, 160, 120), bodyMat);
  body.name = "planet-body";
  body.raycast = () => {};
  object3d.add(body);

  let clouds = null;
  if (k.clouds) {
    clouds = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.008, 128, 96),
      new THREE.ShaderMaterial({ uniforms: { uClouds: bodyMat.uniforms.uClouds, uSunDir: sun, uSunColor: sunColor }, vertexShader: realVertex, fragmentShader: cloudFragment, transparent: true, depthWrite: false, fog: false }),
    );
    clouds.name = "planet-clouds";
    clouds.raycast = () => {};
    object3d.add(clouds);
  }
  let atmo = null;
  if (k.atmo) {
    const H = k.atmo.H * R;
    atmo = new THREE.Mesh(
      new THREE.SphereGeometry(R + 6 * H, 96, 64),
      new THREE.ShaderMaterial({
        uniforms: { uCenter: { value: new THREE.Vector3() }, uSunDir: sun, uColor: { value: new THREE.Color(...k.atmo.color) }, uR: { value: R }, uH: { value: H }, uGain: { value: k.atmo.gain }, uMie: { value: k.atmo.mie } },
        vertexShader: realVertex,
        fragmentShader: scatterFragment,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    );
    atmo.name = "planet-atmosphere";
    atmo.raycast = () => {};
    object3d.add(atmo);
  }
  const CLOUD_DRIFT = 0.004; // rad/s relative to the ground
  const H0 = k.atmo ? k.atmo.H * R : 0;
  return {
    object3d,
    radius_u: R,
    mode: "photoreal",
    // Uniform scale of the whole globe, keeping the shader lengths (relief, scattering radius and scale
    // height) in step; use this instead of object3d.scale.
    setScale(s = 1) {
      object3d.scale.setScalar(s);
      bodyMat.uniforms.uRadius.value = R * s;
      if (atmo) (atmo.material.uniforms.uR.value = R * s), (atmo.material.uniforms.uH.value = H0 * s);
    },
    update(t = 0) {
      body.rotation.y = t * SPIN;
      if (clouds) {
        clouds.rotation.y = t * (SPIN + CLOUD_DRIFT);
        bodyMat.uniforms.uCloudU.value = -((t * CLOUD_DRIFT) / (Math.PI * 2)); // cloud shadows follow the clouds
      }
      if (atmo) object3d.getWorldPosition(atmo.material.uniforms.uCenter.value);
    },
    setSunDir(v) {
      if (v && v.lengthSq() > 0) sun.value.copy(v).normalize();
    },
    dispose() {
      object3d.traverse((o) => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
      object3d.removeFromParent();
    },
  };
}

// Default look for createPlanet.
export const PLANET_DEFAULT_MODE = "photoreal";
// createPlanet({ kind, radius_u, mode }): mode "photoreal" (NASA maps, clouds, scattering) or "lineart"
// (procedural shading + graticule, for the builder's twin compare). Same API: { object3d, radius_u, mode,
// update(t), setSunDir(v3), setScale(s), dispose() }; setScale scales the globe and its shader lengths
// together. Draws: Earth 3 (body, clouds, atmosphere), Mars 2, Moon 1.
export function createPlanet({ kind = "earth", radius_u = 40, mode = PLANET_DEFAULT_MODE } = {}) {
  return mode === "lineart" ? createLineartPlanet({ kind, radius_u }) : createPhotorealPlanet({ kind, radius_u });
}

// Sky colours by altitude for the ascent / entry background: { zenith, horizon, stars (0..1 visibility) },
// linear THREE.Colors. Brightness follows the air density, exp(-h / scale height) with the scale height from
// atmosphereFor (arrival.js): Earth blue → black with a sunset tint near the horizon, Mars butterscotch with a
// blue sunset, the Moon black. sunDir: world direction to the sun (y up = local vertical). Colours are visual.
export function skyAt(altitude_m = 0, sunDir = DEFAULT_SUN, body = "earth") {
  const up = sunDir.y / Math.max(1e-6, sunDir.length());
  const day = smoothstep(-0.18, 0.2, up);
  const low = Math.exp(-((up / 0.14) ** 2)); // sun near the horizon
  const air = atmosphereFor(body);
  if (!air || air.none || !(air.scaleHeight_m > 0)) return { zenith: new THREE.Color(0, 0, 0), horizon: new THREE.Color(0, 0, 0), stars: 1 };
  const H = air.scaleHeight_m;
  const rho = Math.exp(-Math.max(0, altitude_m) / H);
  const z = rho ** 0.6 * day;
  const h = rho ** 0.35 * day;
  const zenith = body === "mars" ? new THREE.Color(0.42, 0.28, 0.16).multiplyScalar(z) : new THREE.Color(0.06, 0.2, 0.55).multiplyScalar(z);
  const horizon = body === "mars" ? new THREE.Color(0.7, 0.5, 0.32).multiplyScalar(h) : new THREE.Color(0.5, 0.66, 0.9).multiplyScalar(h);
  const tint = body === "mars" ? new THREE.Color(0.3, 0.45, 0.8) : new THREE.Color(1.0, 0.48, 0.2);
  horizon.lerp(tint.multiplyScalar(rho ** 0.3), low * 0.7);
  const lum = 0.2126 * zenith.r + 0.7152 * zenith.g + 0.0722 * zenith.b;
  return { zenith, horizon, stars: Math.max(0, 1 - lum * 6) };
}
// createSkyDome({ radius_u }) -> { object3d, set(sky, sunDir?), update(camera), dispose() }
// A camera-centred gradient dome (horizon → zenith from skyAt) with a soft aureole around the sun; drawn first,
// no depth write, no fog. Keep radius_u inside the camera far plane. Fade the star field with sky.stars. 1 draw.
export function createSkyDome({ radius_u = 1500 } = {}) {
  const uniforms = {
    uZenith: { value: new THREE.Color(0.06, 0.2, 0.55) },
    uHorizon: { value: new THREE.Color(0.5, 0.66, 0.9) },
    uSunDir: { value: DEFAULT_SUN.clone() },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uZenith, uHorizon, uSunDir;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float up = d.y;
        vec3 col = mix(uHorizon, uZenith, pow(clamp(up, 0.0, 1.0), 0.45));
        col *= mix(0.55, 1.0, smoothstep(-0.25, 0.0, up)); // below the horizon: darker (hidden by ground anyway)
        float mu = max(dot(d, normalize(uSunDir)), 0.0);
        col += uHorizon * (pow(mu, 12.0) * 0.6 + pow(mu, 600.0) * 4.0);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius_u, 48, 24), mat);
  mesh.name = "sky-dome";
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  mesh.raycast = () => {};
  const object3d = new THREE.Group();
  object3d.name = "sky-dome";
  object3d.add(mesh);
  return {
    object3d,
    set({ zenith, horizon } = {}, sunDir) {
      if (zenith) uniforms.uZenith.value.copy(zenith);
      if (horizon) uniforms.uHorizon.value.copy(horizon);
      if (sunDir && sunDir.lengthSq() > 0) uniforms.uSunDir.value.copy(sunDir).normalize();
    },
    update(camera) {
      if (camera) object3d.position.copy(camera.position);
    },
    dispose() {
      mesh.geometry.dispose();
      mat.dispose();
      object3d.removeFromParent();
    },
  };
}

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// Lets a part (e.g. the lander) cast real shadows for the landing close-up: every mesh casts.
export function enableShadowCasting(object3d) {
  object3d.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
}

// ---------- terrain ----------

function valueNoise2(seed) {
  const h = (x, y) => {
    let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 2147483629);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const noise = (x, y) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = h(ix, iy) + (h(ix + 1, iy) - h(ix, iy)) * sx;
    const b = h(ix, iy + 1) + (h(ix + 1, iy + 1) - h(ix, iy + 1)) * sx;
    return a + (b - a) * sy;
  };
  return (x, y, oct = 4) => {
    let s = 0;
    let a = 0.5;
    let n = 0;
    for (let o = 0; o < oct; o++) (s += a * noise(x, y)), (n += a), (x = x * 2.03 + 17.1), (y = y * 2.03 + 9.7), (a *= 0.5);
    return s / n;
  };
}

// Tileable detail maps (regolith/sand): albedo variation (sRGB) and a normal map from the same height noise.
const detailCache = new Map();
function detailMaps(body) {
  if (detailCache.has(body)) return detailCache.get(body);
  const N = 512;
  const P = 6; // lattice cells per tile at the coarsest octave
  // Value noise with a period of p cells, so the tile wraps seamlessly.
  const tile = (u, v, p, s) => {
    const x = u * p;
    const y = v * p;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const g = (i, j) => {
      let n = Math.imul(((ix + i) % p + p) % p, 374761393) ^ Math.imul(((iy + j) % p + p) % p, 668265263) ^ Math.imul(s, 2147483629);
      n = Math.imul(n ^ (n >>> 13), 1274126177);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    const a = g(0, 0) + (g(1, 0) - g(0, 0)) * sx;
    const b = g(0, 1) + (g(1, 1) - g(0, 1)) * sx;
    return a + (b - a) * sy;
  };
  // Height: fbm from 0.7 m blobs to 2 cm grain, pocked by small wrapped craters; Mars adds wind ripples.
  const mars = body === "mars";
  const height = new Float32Array(N * N);
  const pits = [];
  for (let i = 0; i < (mars ? 2 : 26); i++) pits.push([tile(i * 0.37, 0.11, 64, 50 + i), tile(0.23, i * 0.29, 64, 90 + i), 0.006 + 0.05 * tile(i * 0.13, i * 0.07, 64, 7) ** 3]);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const u = x / N;
      const v = y / N;
      let hh = 0;
      for (let o = 0, a = 0.5, p = P; o < 6; o++, a *= 0.55, p *= 2) hh += a * tile(u, v, p, 13 + o);
      for (const [pu, pv, pr] of pits) {
        const du = Math.abs(u - pu) % 1;
        const dv = Math.abs(v - pv) % 1;
        const d = Math.hypot(Math.min(du, 1 - du), Math.min(dv, 1 - dv)) / pr;
        if (d < 1) hh += -0.35 * (1 - d * d);
        else if (d < 1.6) hh += 0.08 * Math.exp(-(((d - 1) / 0.2) ** 2));
      }
      if (mars) hh += 0.045 * Math.sin(Math.PI * 2 * (u * 9 + v * 3 + 0.35 * tile(u, v, 4, 31))) * smoothstep(0.35, 0.75, tile(u, v, 3, 41)); // patchy wind ripples
      height[y * N + x] = hh;
    }
  }
  const alb = new Uint8Array(N * N * 4);
  const nrm = new Uint8Array(N * N * 4);
  const at = (x, y) => height[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const hh = at(x, y);
      const u = x / N;
      const v = y / N;
      const grain = tile(u, v, 128, 99) - 0.5;
      const fleck = tile(u, v, 256, 77);
      const spot = fleck > 0.93 ? 0.18 : fleck < 0.05 ? -0.14 : 0; // bright and dark grains
      const g = Math.round(255 * Math.min(1, Math.max(0, 0.8 + 0.22 * (hh - 0.5) + 0.16 * grain + spot)));
      alb.set([g, g, g, 255], (y * N + x) * 4);
      const dx = (at(x + 1, y) - at(x - 1, y)) * 10;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 10;
      const l = Math.hypot(dx, dy, 1);
      nrm.set([Math.round(((-dx / l) * 0.5 + 0.5) * 255), Math.round(((-dy / l) * 0.5 + 0.5) * 255), Math.round(((1 / l) * 0.5 + 0.5) * 255), 255], (y * N + x) * 4);
    }
  }
  const mk = (data, srgb) => {
    const t = new THREE.DataTexture(data, N, N);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  };
  const out = { albedo: mk(alb, true), normal: mk(nrm, false) };
  detailCache.set(body, out);
  return out;
}

// createTerrain({ body: "moon" | "mars", size_u, seed, padRadius_u, sunDir, tint, sunLight = true })
//   -> { object3d, sun (null with sunLight: false), sunDir (site frame, unit), heightAt(x, z), padRadius_u,
//        prewarm(renderer), dispose() }
// sunLight: false leaves out the DirectionalLight (adding a light recompiles every material): aim the scene's
// own key light along sunDir instead; the baked self-shadowing uses sunDir either way. prewarm(renderer)
// uploads the detail textures ahead of the first frame that shows the ground. Build ~80–100 ms (+ ~150 ms the
// first time per body for the detail maps): create it before the descent needs it, hidden.
// A displaced grid of 240 × 240 segments up to ~3 km across: uniform on small patches; on large ones warped so
// the central 300 m (the landing zone) is dense (~2.5 m) and the cells grow smoothly outward. Relief: rolling
// noise at three scales, craters in three size bands (0.6–4 m in the landing zone, 4–25 m out to ~600 m, 25 m
// up to a fifth of the patch everywhere; bowls with raised rims and bright fresh ejecta, power-law sizes, kept off
// the landing spot) on the Moon; dunes and soft sand-filled craters on Mars; a flat landing spot of padRadius_u;
// heights and detail fade out at the edge so the patch meets the far planet. Large-scale albedo in vertex
// colours; the regolith / sand detail map (albedo + normal) at 4 m and 60 m with anti-tiling (hash-picked
// offset and rotation variants blended over a low-frequency index) and ±8 % low-frequency albedo, so no repeat
// reads at any altitude. Terrain self-shadowing is baked per vertex (sunVis, marched toward the sun) and scales
// the direct light of every directional light on the ground; the shadow map carries the lander and boulders.
// Boulders (on crater rims and scattered) and pebbles (around the landing spot) are two InstancedMeshes of
// faceted low-poly rocks (PBR). `sun` is a shadow-casting DirectionalLight aimed at the landing spot, already
// inside object3d; its direction defaults to lightingFor(body).sunDir (site frame: +x east, +y up, +z south).
// For the lander's own shadow call enableShadowCasting(landerGroup). Draws: ground, boulders, pebbles = 3.
export function createTerrain({ body = "moon", size_u = 60, seed = 7, padRadius_u = 2, sunDir = new THREE.Vector3(...lightingFor(body).sunDir), tint: tintIn = null, sunLight = true } = {}) {
  const mars = body === "mars";
  const S = size_u;
  const half = S / 2;
  const rand = rng(seed);
  const fbm = valueNoise2(seed);
  const m = (metres) => metres * SCALE;
  const zone = Math.min(half, m(150)); // landing-zone half-width (dense grid, small craters)

  // ---- the grid: uniform on small patches; on large ones x' = half · w(t), dense in the landing zone ----
  const SEG = 240;
  const T0 = 0.5; // the inner half of the segments covers the landing zone
  const warped = zone < T0 * half;
  const c1 = warped ? ((zone / T0) * (1 - T0)) / (half - zone) : 1; // slope match at the joint (≤ 1 here)
  const w = (t) => {
    const a = Math.abs(t);
    if (!warped) return t * half;
    if (a <= T0) return (t * zone) / T0;
    const u = (a - T0) / (1 - T0);
    return Math.sign(t) * (zone + (half - zone) * (c1 * u + (1 - c1) * u * u));
  };
  const winv = (x) => {
    const a = Math.abs(x);
    if (!warped) return x / half;
    if (a <= zone) return (x * T0) / zone;
    const X = Math.min(1, (a - zone) / (half - zone));
    const u = c1 >= 1 ? X : (-c1 + Math.sqrt(c1 * c1 + 4 * (1 - c1) * X)) / (2 * (1 - c1));
    return Math.sign(x) * (T0 + u * (1 - T0));
  };
  // grid spacing (units) at |x| = a, and at a point (the coarser axis)
  const dw = (a) => {
    if (!warped) return S / SEG;
    const t = Math.abs(winv(a));
    if (t <= T0) return ((zone / T0) * 2) / SEG;
    const u = (t - T0) / (1 - T0);
    return (((half - zone) / (1 - T0)) * (c1 + 2 * (1 - c1) * u) * 2) / SEG;
  };
  const spacing = (x, z) => Math.max(dw(x), dw(z));


  // ---- craters: three bands, counts from a density (per square unit of area) over each band's extent ----
  // Profile (d = distance / radius): floor −depth at the centre rising as d^k to the rim crest at d = 1, then an
  // ejecta skirt falling as d^-3 to 0 at d = 2. Radii follow N(>r) ∝ r^-2 inside each band. Visual ratios.
  const craters = [];
  const perKm2 = (n) => n / (m(1000) * m(1000));
  const bands = mars
    ? [
        { r0: 0.6, r1: 4, ext: zone * 1.4, dens: perKm2(700) },
        { r0: 4, r1: 25, ext: m(600), dens: perKm2(160) },
        { r0: 25, r1: 160, ext: half, dens: perKm2(4) },
      ]
    : [
        { r0: 0.6, r1: 4, ext: zone * 1.4, dens: perKm2(4000) },
        { r0: 4, r1: 25, ext: m(600), dens: perKm2(700) },
        { r0: 25, r1: 220, ext: half, dens: perKm2(14) },
      ];
  for (const bd of bands) {
    const ext = Math.min(bd.ext, half * 1.05);
    const r1 = Math.min(m(bd.r1), 0.2 * S);
    const r0 = m(bd.r0);
    if (r1 <= r0) continue;
    const n = Math.min(2500, Math.round(bd.dens * (2 * ext) ** 2));
    for (let i = 0; i < n; i++) {
      const r = r0 / Math.sqrt(1 - rand() * (1 - (r0 / r1) ** 2));
      const x = (rand() - 0.5) * 2 * ext;
      const z = (rand() - 0.5) * 2 * ext;
      if (r > m(25) && Math.hypot(x, z) < zone + 0.6 * r) continue; // big ones stay out of the landing zone
      if (r < 1.3 * spacing(x, z)) continue; // the grid there could not carry it (it would alias into a blob)
      const fresh = rand() ** (mars ? 1.6 : 0.8); // 1 fresh … 0 degraded (Mars: mostly sand-filled)
      craters.push({ x, z, r, fresh, depth: r * (mars ? 0.2 : 0.32) * (0.3 + 0.7 * fresh), rim: r * (mars ? 0.04 : 0.07) * (0.25 + 0.75 * fresh), k: 1.5 + 1.3 * fresh });
    }
  }
  // spatial grid: each crater listed in every cell its 2.5 r reach overlaps
  const CELL = Math.max(m(20), S / 120);
  const cells = new Map();
  const key = (i, j) => i * 100003 + j;
  for (const c of craters) {
    const reach = 2.5 * c.r;
    for (let i = Math.floor((c.x - reach) / CELL); i <= Math.floor((c.x + reach) / CELL); i++) {
      for (let j = Math.floor((c.z - reach) / CELL); j <= Math.floor((c.z + reach) / CELL); j++) {
        const k = key(i, j);
        let list = cells.get(k);
        if (!list) cells.set(k, (list = []));
        list.push(c);
      }
    }
  }
  const windA = 0.6;
  const wx = Math.cos(windA);
  const wz = Math.sin(windA);
  const edgeFade = (x, z) => 1 - smoothstep(0.8 * half, 0.98 * half, Math.max(Math.abs(x), Math.abs(z)));
  // Height and an albedo factor at (x, z); heightAt is the public half.
  const sample = (x, z) => {
    const r = Math.hypot(x, z);
    const fine = 1 - smoothstep(m(250), m(450), r); // features the far, coarser grid cannot carry fade out
    let h = (fbm(x / m(420) + 31, z / m(420) - 17, 3) - 0.5) * m(mars ? 14 : 9) + (fbm(x / m(45), z / m(45), 3) - 0.5) * m(mars ? 2.2 : 1.2) + (fbm(x / m(7) + 7, z / m(7) - 3, 3) - 0.5) * m(mars ? 0.35 : 0.3) * fine;
    let a = 0;
    for (const c of cells.get(key(Math.floor(x / CELL), Math.floor(z / CELL))) ?? []) {
      const dx = x - c.x;
      const dz = z - c.z;
      const lim = c.r * 2.5;
      if (dx > lim || dx < -lim || dz > lim || dz < -lim) continue;
      const d = Math.hypot(dx, dz) / c.r;
      if (d < 1) h += -c.depth + (c.depth + c.rim) * d ** c.k;
      else if (d < 2) h += c.rim * ((d ** -3 - 0.125) / 0.875);
      if (d < 2.5) a += c.fresh ** 2 * (d < 1 ? 0.12 : 0.28 * Math.exp(-(((d - 1) / 0.7) ** 2))); // bright fresh ejecta
    }
    if (mars) {
      const along = x * wx + z * wz;
      const dune = Math.sin(along / m(9) + 2.2 * fbm(x / m(60), z / m(60), 2)) * 0.5 + 0.5;
      h += m(1.1) * dune ** 3 * (0.5 + fbm(x / m(25) + 3, z / m(25), 2)) * fine;
      const big = Math.sin(along / m(48) + 1.6 * fbm(x / m(300), z / m(300), 2)) * 0.5 + 0.5; // large dunes
      h += m(3.5) * big ** 2 * fbm(x / m(200) - 5, z / m(200) + 2, 2);
    }
    const flat = smoothstep(padRadius_u, padRadius_u * 1.7, r); // flat landing spot
    return [h * flat * edgeFade(x, z), Math.min(a, 0.35)];
  };
  const heightAt = (x, z) => sample(x, z)[0];

  const geo = new THREE.PlaneGeometry(S, S, SEG, SEG).rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const uvA = geo.attributes.uv;
  const col = new Float32Array(pos.count * 3);
  const hs = new Float32Array(pos.count);
  const tint = tintIn ?? (mars ? [0.62, 0.36, 0.22] : [0.56, 0.55, 0.53]); // tint: linear rgb, e.g. world.surfaceColourAt
  const kMean = mars ? 0.75 : 0.68;
  for (let i = 0; i < pos.count; i++) {
    const x = w(pos.getX(i) / half);
    const z = w(pos.getZ(i) / half);
    const [h, bright] = sample(x, z);
    pos.setXYZ(i, x, h, z);
    hs[i] = h;
    uvA.setXY(i, x / S + 0.5, 0.5 - z / S); // u along +x, v along −z (the tangent frame of the detail normals)
    const big = fbm(x / m(70) + 11, z / m(70) - 5, 3);
    const k = kMean + 0.4 * (big - 0.5) * (mars ? 1.2 : 1.4) + bright * (mars ? 0.4 : 1);
    const kk = kMean + (k - kMean) * edgeFade(x, z); // the edge settles to the tint, like the far map
    col.set([tint[0] * kk, tint[1] * kk, tint[2] * kk], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();

  // ---- baked self-shadowing: march from each vertex toward the sun over the height grid (soft edges) ----
  const sd = sunDir.clone().normalize();
  const sunVis = new Float32Array(pos.count).fill(1);
  const horiz = Math.hypot(sd.x, sd.z);
  const tanEl = sd.y / Math.max(horiz, 1e-6);
  const N1 = SEG + 1;
  const hAt = (x, z) => {
    const fx = ((winv(x) + 1) / 2) * SEG;
    const fz = ((winv(z) + 1) / 2) * SEG; // row index grows with z (PlaneGeometry rows run −z → +z here)
    const ix = Math.min(SEG - 1, Math.max(0, Math.floor(fx)));
    const iz = Math.min(SEG - 1, Math.max(0, Math.floor(fz)));
    const ax = Math.min(1, Math.max(0, fx - ix));
    const az = Math.min(1, Math.max(0, fz - iz));
    const a = hs[iz * N1 + ix] + (hs[iz * N1 + ix + 1] - hs[iz * N1 + ix]) * ax;
    const b = hs[(iz + 1) * N1 + ix] + (hs[(iz + 1) * N1 + ix + 1] - hs[(iz + 1) * N1 + ix]) * ax;
    return a + (b - a) * az;
  };
  if (sd.y > 0 && sd.y < 0.97 && horiz > 1e-6) {
    const dx = sd.x / horiz;
    const dz = sd.z / horiz;
    const maxD = Math.min(S, m(900));
    for (let i = 0; i < pos.count; i++) {
      const x0 = pos.getX(i);
      const z0 = pos.getZ(i);
      const h0 = hs[i] + m(0.05);
      const pen0 = spacing(x0, z0);
      let vis = 1;
      for (let d = m(0.6); d < maxD; d *= 1.18) {
        const x = x0 + dx * d;
        const z = z0 + dz * d;
        if (Math.abs(x) > half || Math.abs(z) > half) break;
        const excess = hAt(x, z) - (h0 + d * tanEl);
        vis = Math.min(vis, 1 - excess / (0.03 * d + Math.max(m(0.3), 0.7 * pen0))); // penumbra: distance, grid
        if (vis <= 0) break;
      }
      sunVis[i] = Math.min(1, Math.max(0, vis));
    }
  }
  geo.setAttribute("sunVis", new THREE.BufferAttribute(sunVis, 1));

  // ---- the ground material: anti-tiled two-scale detail, low-frequency albedo, baked sun visibility ----
  const det = detailMaps(body);
  const albedo = det.albedo.clone();
  albedo.needsUpdate = true;
  const normal = det.normal.clone();
  normal.needsUpdate = true;
  const groundMat = new THREE.MeshStandardMaterial({ vertexColors: true, map: albedo, normalMap: normal, normalScale: new THREE.Vector2(1.6, 1.6), roughness: 0.97, metalness: 0 });
  const tu = { uFine: { value: m(4) }, uCoarse: { value: m(60) }, uLow: { value: m(220) }, uHalf: { value: half } };
  groundMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, tu);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float sunVis;\nvarying float vSunVis;\nvarying vec3 vTerrP;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvSunVis = sunVis;\nvTerrP = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        /* glsl */ `
        uniform float uFine, uCoarse, uLow, uHalf;
        varying float vSunVis;
        varying vec3 vTerrP;
        float tH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float tN(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(tH(i), tH(i + vec2(1.0, 0.0)), f.x), mix(tH(i + vec2(0.0, 1.0)), tH(i + vec2(1.0, 1.0)), f.x), f.y);
        }
        mat2 tRot(float a) { float c = cos(a); float s = sin(a); return mat2(c, s, -s, c); }
        // two hash-picked variants of the tile (offset + rotation), blended over a low-frequency index
        void tVar(vec2 uv, out vec2 a, out vec2 b, out float ra, out float rb, out float wgt) {
          float k = tN(uv * 0.13) * 6.0;
          float ia = floor(k);
          wgt = smoothstep(0.3, 0.7, fract(k));
          ra = tH(vec2(ia, 1.7)) * 6.2831853;
          rb = tH(vec2(ia + 1.0, 1.7)) * 6.2831853;
          a = tRot(ra) * uv + vec2(tH(vec2(ia, 3.1)), tH(vec2(ia, 5.3))) * 11.0;
          b = tRot(rb) * uv + vec2(tH(vec2(ia + 1.0, 3.1)), tH(vec2(ia + 1.0, 5.3))) * 11.0;
        }
        vec3 tAlb(vec2 uv) {
          vec2 a; vec2 b; float ra; float rb; float wgt;
          tVar(uv, a, b, ra, rb, wgt);
          vec2 dx = dFdx(uv); vec2 dy = dFdy(uv);
          return mix(textureGrad(map, a, tRot(ra) * dx, tRot(ra) * dy).rgb, textureGrad(map, b, tRot(rb) * dx, tRot(rb) * dy).rgb, wgt);
        }
        vec3 tNrm(vec2 uv) {
          vec2 a; vec2 b; float ra; float rb; float wgt;
          tVar(uv, a, b, ra, rb, wgt);
          vec2 dx = dFdx(uv); vec2 dy = dFdy(uv);
          vec3 na = textureGrad(normalMap, a, tRot(ra) * dx, tRot(ra) * dy).xyz * 2.0 - 1.0;
          vec3 nb = textureGrad(normalMap, b, tRot(rb) * dx, tRot(rb) * dy).xyz * 2.0 - 1.0;
          // back from the variants' rotated texture frames; the mip-averaged slopes stay un-normalized (flatter
          // far away, as they should) and fade out once a tile spans under a few pixels
          vec2 xy = mix(tRot(-ra) * na.xy, tRot(-rb) * nb.xy, wgt);
          float tilesPerPx = max(length(dx), length(dy));
          return vec3(xy * (1.0 - smoothstep(0.08, 0.35, tilesPerPx)), 1.0);
        }
        float tEdge() { return smoothstep(0.8 * uHalf, 0.98 * uHalf, max(abs(vTerrP.x), abs(vTerrP.z))); }
        vec4 terrAlbedo() {
          vec2 p = vec2(vTerrP.x, -vTerrP.z);
          vec3 f = tAlb(p / uFine);
          vec3 c = tAlb(p / uCoarse + 17.0);
          float low = 1.0 + 0.12 * (tN(p / uLow) - 0.5) + 0.04 * (tN(p / (uLow * 0.37) + 5.0) - 0.5);   // ±8 %
          vec3 a = f * (0.45 + 0.55 * c / 0.8) * low;
          return vec4(mix(a, vec3(0.8), 0.7 * tEdge()), 1.0);
        }
        vec3 terrNormal() {
          vec2 p = vec2(vTerrP.x, -vTerrP.z);
          vec3 nf = tNrm(p / uFine);
          vec3 nc = tNrm(p / uCoarse + 17.0);
          // a normal map's slopes are per tile: stretched 15× the coarse layer's must flatten by the same factor,
          // or whole 10–30 m fields tilt away from a low sun and go black
          vec3 n = normalize(vec3(nf.xy + (uFine / uCoarse) * nc.xy, 1.0));
          n.xy *= 1.0 - 0.7 * tEdge();
          return n;
        }
        void main() {`,
      )
      // (onBeforeCompile sees the #include lines, not the chunks: replace the includes themselves)
      .replace("#include <map_fragment>", "diffuseColor *= terrAlbedo();")
      .replace("#include <normal_fragment_maps>", "vec3 mapN = terrNormal();\nmapN.xy *= normalScale;\nnormal = normalize( tbn * mapN );")
      .replace("#include <lights_fragment_begin>", THREE.ShaderChunk.lights_fragment_begin.replace("getDirectionalLightInfo( directionalLight, directLight );", "getDirectionalLightInfo( directionalLight, directLight );\n\t\tdirectLight.color *= vSunVis;"));
  };
  groundMat.customProgramCacheKey = () => "terrain-antitile-v3";
  const ground = new THREE.Mesh(geo, groundMat);
  ground.name = "terrain-ground";
  ground.receiveShadow = true;
  ground.castShadow = false; // its own shadows are baked (sunVis); the shadow map carries the lander and boulders
  ground.raycast = () => {};

  // Rocks: faceted, half buried, power-law sizes, none on the landing spot. Boulders (cast shadows) mostly
  // around the landing zone and as ejecta blocks on fresh crater rims; pebbles (no shadow casting) near the spot.
  const rockGeo = (detail) => {
    const g = new THREE.IcosahedronGeometry(1, detail); // non-indexed: per-face normals, faceted
    const rp = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < rp.count; i++) {
      v.fromBufferAttribute(rp, i);
      v.multiplyScalar(0.8 + 0.4 * fbm(v.x * 2 + 5, v.z * 2 + v.y * 3, 2));
      rp.setXYZ(i, v.x, v.y * 0.75, v.z);
    }
    g.computeVertexNormals();
    return g;
  };
  const rockColor = mars ? 0x6b3a22 : 0x77777a;
  const mtx = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const p = new THREE.Vector3();
  const e = new THREE.Euler();
  const scatter = (mesh, n, pick, size, sink) => {
    let placed = 0;
    for (let i = 0; i < n * 4 && placed < n; i++) {
      const [x, z] = pick();
      if (Math.hypot(x, z) < padRadius_u * 1.5 || Math.abs(x) > half * 0.8 || Math.abs(z) > half * 0.8) continue;
      const s = size();
      sc.set(s * (0.8 + 0.5 * rand()), s * (0.6 + 0.4 * rand()), s * (0.8 + 0.5 * rand()));
      q.setFromEuler(e.set(rand() * 6.3, rand() * 6.3, rand() * 6.3));
      p.set(x, heightAt(x, z) + sc.y * sink, z);
      mesh.setMatrixAt(placed++, mtx.compose(p, q, sc));
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.raycast = () => {};
    return mesh;
  };
  const rimBlocks = craters.filter((c) => c.fresh > 0.5 && c.r > m(2) && Math.hypot(c.x, c.z) < m(700));
  const NB = mars ? 380 : 520;
  const spread = Math.min(half, zone * 1.6);
  const rocks = scatter(
    new THREE.InstancedMesh(rockGeo(1), new THREE.MeshStandardMaterial({ color: rockColor, roughness: 0.92, metalness: 0, flatShading: true }), NB),
    NB,
    () => {
      if (rimBlocks.length && rand() < 0.45) {
        const c = rimBlocks[Math.floor(rand() * rimBlocks.length)];
        const a = rand() * Math.PI * 2;
        const d = c.r * (0.95 + 0.6 * rand() ** 2);
        return [c.x + Math.cos(a) * d, c.z + Math.sin(a) * d];
      }
      return [(rand() - 0.5) * 2 * spread, (rand() - 0.5) * 2 * spread];
    },
    () => m(0.15) + m(mars ? 1.4 : 1.8) * rand() ** 4,
    0.1,
  );
  rocks.name = "terrain-boulders";
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  const NP = 2600;
  const near = Math.min(half, padRadius_u * 9);
  const pebbles = scatter(
    new THREE.InstancedMesh(rockGeo(0), new THREE.MeshStandardMaterial({ color: rockColor, roughness: 0.95, metalness: 0, flatShading: true }), NP),
    NP,
    () => {
      const a = rand() * Math.PI * 2;
      const r = near * Math.sqrt(rand());
      return [Math.cos(a) * r, Math.sin(a) * r];
    },
    () => m(0.03) + m(0.14) * rand() ** 2,
    0,
  );
  pebbles.name = "terrain-pebbles";
  pebbles.receiveShadow = true;

  let sun = null;
  const object3d = new THREE.Group();
  object3d.name = `terrain:${body}`;
  object3d.add(ground, rocks, pebbles);
  if (sunLight) {
    sun = new THREE.DirectionalLight(mars ? 0xffe2c4 : 0xfff3e6, mars ? 2.2 : 2.8);
    sun.position.copy(sd).multiplyScalar(Math.min(S * 0.6, m(400)));
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    // the shadow map covers the landing zone (lander, boulders); the terrain's own shadows are baked everywhere
    const sb = Math.max(padRadius_u * 5, Math.min(S * 0.25, m(80)));
    Object.assign(sun.shadow.camera, { left: -sb, right: sb, top: sb, bottom: -sb, near: 0.1, far: Math.min(S * 0.6, m(400)) * 2 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    sun.target.position.set(0, 0, 0);
    object3d.add(sun, sun.target); // the sun moves with the terrain
  }
  return {
    object3d,
    sun,
    sunDir: sd.clone(),
    heightAt,
    padRadius_u,
    craters: craters.length,
    prewarm(renderer) {
      for (const t of [albedo, normal]) renderer?.initTexture?.(t);
    },
    // mean albedo per unit tint (vertex colour × detail), for matching the far layer's brightness (world.js)
    albedoMean: kMean * 0.8,
    // scales the vertex colours: one factor, or per channel ([r, g, b] / a THREE.Color)
    scaleAlbedo(f = 1) {
      const k = typeof f === "number" ? [f, f, f] : f.isColor ? [f.r, f.g, f.b] : f;
      const c = geo.attributes.color;
      for (let i = 0; i < c.array.length; i++) c.array[i] *= k[i % 3];
      c.needsUpdate = true;
    },
    dispose() {
      object3d.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        o.material?.dispose();
      });
      albedo.dispose();
      normal.dispose();
      object3d.removeFromParent();
    },
  };
}

// ---------- ocean ----------

// A ground disc out to the horizon: a centre vertex and 56 rings of 96, radii from 2 m growing geometrically to
// radius_u (dense near the middle). planetR_u > 0 bends it down with the planet's curvature (y −= r² / 2R) so its
// rim meets the far layer's horizon; 0 leaves it flat (the ocean bends in its shader instead).
export function horizonDisc(radius_u, planetR_u = 0) {
  const RINGS = 56;
  const SEGS = 96;
  const r0 = 2 * SCALE;
  const pos = [0, 0, 0];
  const nrm = [0, 1, 0];
  const uv = [0.5, 0.5];
  for (let k = 0; k < RINGS; k++) {
    const r = r0 * (radius_u / r0) ** (k / (RINGS - 1));
    const drop = planetR_u > 0 ? (r * r) / (2 * planetR_u) : 0;
    const tilt = planetR_u > 0 ? r / planetR_u : 0;
    for (let j = 0; j < SEGS; j++) {
      const a = (j / SEGS) * Math.PI * 2;
      pos.push(Math.cos(a) * r, -drop, Math.sin(a) * r);
      nrm.push(Math.cos(a) * tilt, 1, Math.sin(a) * tilt);
      uv.push(0.5 + (Math.cos(a) * r) / (2 * radius_u), 0.5 - (Math.sin(a) * r) / (2 * radius_u));
    }
  }
  const idx = [];
  for (let j = 0; j < SEGS; j++) idx.push(0, 1 + ((j + 1) % SEGS), 1 + j);
  for (let k = 0; k < RINGS - 1; k++) {
    for (let j = 0; j < SEGS; j++) {
      const a = 1 + k * SEGS + j;
      const b = 1 + k * SEGS + ((j + 1) % SEGS);
      idx.push(a, b, a + SEGS, b, b + SEGS, a + SEGS);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}

// createOcean({ size_u, sunDir, radius_u?, planetR_u? }) -> { object3d, update(dt, { sky?, sunDir? }),
//   setSky({ zenith, horizon }), setHull({ position, length_u, width_u, yaw } | null), bob(t), dispose() }
// One surface: a square plane of size_u, or with radius_u a disc out to the horizon (rings spaced
// geometrically from the centre, curving down with the planet's radius planetR_u, so it meets the far layer's
// horizon with no gap; keep the camera's far plane beyond the horizon distance). Normals from scrolling noise
// layers (calmer with distance to avoid shimmer), Fresnel reflection of
// the sky colours (skyAt), a tight sun-glint path, a deep-water body colour, foam where the swell meets the
// drone ship's hull (setHull), scene fog. bob(t) gives the ship's heave and roll: put the ship at
// y = ship.freeboard_u + bob.y (deck above the water) with rotation (bob.rx, yaw, bob.rz). 1 draw.
export function createOcean({ size_u = 4000, sunDir = DEFAULT_SUN, radius_u = 0, planetR_u = 6371000 * SCALE } = {}) {
  const uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      uTime: { value: 0 },
      uZenith: { value: new THREE.Color(0.06, 0.2, 0.55) },
      uHorizon: { value: new THREE.Color(0.5, 0.66, 0.9) },
      uSunDir: { value: sunDir.clone().normalize() },
      uSunColor: { value: new THREE.Color(1.0, 0.94, 0.86) },
      uDeep: { value: new THREE.Color(0.004, 0.018, 0.03) },
      uWave: { value: 1 / (2 * SCALE) }, // noise frequency: ~2 m features
      uHull: { value: new THREE.Vector4(0, 0, 0, 0) }, // centre x, z, half length, half width (0: no hull)
      uHullYaw: { value: 0 },
      uFoamW: { value: 3 * SCALE }, // foam band width outside the hull (visual)
      uCurve: { value: radius_u > 0 ? 1 / (2 * planetR_u) : 0 }, // drop = r² / 2R
    },
  ]);
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      uniform float uCurve;
      varying vec3 vWorldPos;
      void main() {
        vec3 p = position;
        p.y -= dot(p.xz, p.xz) * uCurve;   // the planet's curvature (0 for the flat square)
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWorldPos = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform float uTime, uWave, uHullYaw, uFoamW;
      uniform vec3 uZenith, uHorizon, uSunDir, uSunColor, uDeep;
      uniform vec4 uHull;
      varying vec3 vWorldPos;
      float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n2(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      float waves(vec2 p) {
        float a = n2(p * 0.35 + uTime * vec2(0.08, 0.05)) * 0.6 + n2(p * 0.9 - uTime * vec2(0.05, 0.11)) * 0.3;
        return a + n2(p * 2.3 + uTime * vec2(0.13, -0.07)) * 0.1;
      }
      void main() {
        vec3 V = normalize(cameraPosition - vWorldPos);
        float dist = length(cameraPosition - vWorldPos);
        vec2 p = vWorldPos.xz * uWave;
        float e = 0.08;
        float hC = waves(p);
        float k = 0.55 / (1.0 + dist * 0.004 / uWave);          // calmer with distance (no shimmer)
        vec3 N = normalize(vec3(-(waves(p + vec2(e, 0.0)) - hC) / e * k, 1.0, -(waves(p + vec2(0.0, e)) - hC) / e * k));
        float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 Rf = reflect(-V, N);
        Rf.y = abs(Rf.y);
        vec3 L = normalize(uSunDir);
        vec3 sky = mix(uHorizon, uZenith, pow(clamp(Rf.y, 0.0, 1.0), 0.5));
        // Body colour: deep water, lifted a little on crests facing the sun (light through the wave).
        vec3 body = uDeep + vec3(0.0, 0.035, 0.04) * smoothstep(0.45, 0.8, hC) * max(L.y, 0.0);
        vec3 col = mix(body, sky, fres);
        float sd = max(dot(Rf, L), 0.0);
        col += uSunColor * (pow(sd, 900.0) * 9.0 + pow(sd, 60.0) * 0.08) * smoothstep(-0.05, 0.1, L.y);
        // Foam where the swell breaks on the hull: a noisy band just outside its rectangle.
        if (uHull.z > 0.0) {
          vec2 d = vWorldPos.xz - uHull.xy;
          float c = cos(uHullYaw), s = sin(uHullYaw);
          d = vec2(c * d.x - s * d.y, s * d.x + c * d.y);
          vec2 q = abs(d) - uHull.zw;
          float sdf = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
          float band = 1.0 - smoothstep(0.0, uFoamW, sdf);
          float n = waves(p * 3.1 + 11.0);
          float foam = band * smoothstep(0.35 + 0.45 * (1.0 - band), 0.75, n + 0.25 * band);
          col = mix(col, vec3(0.8, 0.84, 0.86) * (0.35 + 0.65 * max(L.y, 0.0)), foam * 0.85);
        }
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
    fog: true,
  });
  const geo = radius_u > 0 ? horizonDisc(radius_u) : new THREE.PlaneGeometry(size_u, size_u).rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = radius_u <= 0;
  mesh.name = "ocean";
  mesh.receiveShadow = false;
  mesh.raycast = () => {};
  const object3d = new THREE.Group();
  object3d.name = "ocean";
  object3d.add(mesh);
  const setSky = ({ zenith, horizon } = {}) => {
    if (zenith) uniforms.uZenith.value.copy(zenith);
    if (horizon) uniforms.uHorizon.value.copy(horizon);
  };
  return {
    object3d,
    setSky,
    setHull(h) {
      if (!h) return uniforms.uHull.value.set(0, 0, 0, 0);
      uniforms.uHull.value.set(h.position?.x ?? 0, h.position?.z ?? 0, h.length_u / 2, h.width_u / 2);
      uniforms.uHullYaw.value = h.yaw ?? 0;
      uniforms.uFoamW.value = 0.04 * h.length_u; // visual
    },
    bob: (t) => shipBob(t),
    update(dt = 0, { sky, sunDir: s } = {}) {
      uniforms.uTime.value += dt;
      if (sky) setSky(sky);
      if (s) uniforms.uSunDir.value.copy(s).normalize();
    },
    dispose() {
      mesh.geometry.dispose();
      mat.dispose();
      object3d.removeFromParent();
    },
  };
}
