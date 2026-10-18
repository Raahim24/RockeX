// One continuous flight: launch -> space -> (transfer) -> land, as a single timeline. Pure: no DOM; all est.
//   flightTimeline(build, catalog, opts?) -> {
//     outcome, kind, endState, bodies, bodyPosAt(body, t_sim), segments, events, stageDrops, sampleAt(t_screen),
//     screenToSim(t), simToScreen(t), surfaceFrame, totalScreen_s, totalSim_s, arrival, booster, entry, est }
//   opts: { ascent (a simulateAscent result to reuse), totalScreen_s (scales every segment's share),
//           calibrate (false: fly the ascent uncalibrated, see below),
//           boosterInset (Earth missions: the main track stays with the upper stage through a 10 s release beat
//           and the booster's final descent runs alongside it on f.booster's own clock, for a picture-in-picture;
//           default false: the sequential story, release then a cut to the booster) }
//   booster (successful Earth missions, else null): the first stage's final descent into the tower catch on its
//     own clock, either way: { start_screen (main screen time it starts: the cut to it, or with boosterInset the
//     release beat's start), duration_s, end_screen, inset, sampleAt(t_local 0..duration_s) -> a sampleAt-shaped
//     state + t_local, beats [{ type, t_local, t_screen, t_vehicle }] (landing-burn-start, touchdown), mode,
//     relocated, events (ascent.js booster events, its own time), shift, onScreenFrom_t }
//   entry (Mars landings, else null): arrival.js descentTimeline's entry { aeroshell_m, canopy_m, chuteOpen,
//     chuteRelease, ballisticCoeff_kgm2, speedAt10km_ms } (aeroshell 1.6 x, canopy 6 x the payload diameter:
//     model choices)
//   A blocked build gives { blocked: true, outcome: "blocked", reason, endState, est } and nothing else.
//   sampleAt(t_screen) -> { t_sim, t_screen, body ("earth" | "moon" | "mars" | "space"), segment, phase,
//     stageIndex (null once only the spacecraft flies), pos_km (body-centred; "space" = Earth-centred), pos_eci_km,
//     vel_kms (relative to the body), vel_eci_kms, dest_eci_km, speed_ms, alt_km, axis (unit nose / thrust axis),
//     pitch_deg (0 = straight up), yaw_deg (0 = north, 90 = east), throttle, burn, mass_kg, chute, heat, dust,
//     alpha_deg (a lost flight's tumble), brokenUp }; finite everywhere, before 0 and after the end (the last point
//     is held: after an impact the vehicle stays on the surface).
//   Failure beats in events (each with t_sim and t_screen), for the failure kit and the director:
//     "pad-abort"       { twr }                                          blocked, or held down on the pad
//     "depleted"        { stageIndex, altitude_m, v_ms }                 the last stage burns out short of orbit, or
//                                                                         the departure burn runs dry (also dv_ms)
//     "tumble-start"    { stageIndex, q_Pa, altitude_m, v_ms }            unpowered, the air starts to turn it
//     "breakup"         { stageIndex, altitude_m, v_ms, q_Pa, alpha_deg, qAlpha_Pa_deg, limit_Pa_deg, note }
//     "impact"          { surface, v_ms, downrange_km, lat_deg, lon_deg }
//     "transfer-failed" { shortBy_ms, apogee_km }                         at the dry burn (or the Moon flyby)
//   tumble / breakup are model choices (est.): tumble once q >= 500 Pa after burnout, angle of attack 0 -> 90 deg
//   over 5 s, breakup when q x alpha > 150 kPa x deg (not a sourced vehicle limit).
//   kind: the mission's destination ("earth" | "moon" | "mars", arrival.js).
//   endState: { type, line (ready to show), text (= line) , ... }; type:
//     "landed" (body; Earth missions bring the stage home, a story ending: line "Stage brought home (story) · est.",
//     story: true, missionLine, landing { site, ... }) | "in-orbit-of" (body)
//     | "lost" (impact { downrange_km, surface: "sea" | "ground" }; shortBy_ms, budget_ms, orbitShortBy_ms,
//     orbitBudget_ms when the verdict found it short of the LEO share) | "transfer-failed" (body, shortBy_ms,
//     apogee_km (null if it escapes Earth), perigee_km, period_s) | "aborted" (blocked, or never left the pad).
//   stageDrops: [{ type: "sep" | "fairing" | "les-jettison" | "payload-release" | "spacecraft-sep", stageIndex, t_sim, t_screen,
//     dropAway: { dir_body, dir_eci, speed_ms, duration_s } }] (fairing: one half; the other mirrors x). Each
//     names a part layout.js's manifest builds (part: "stage" | "fairing" | "payload" | "escape-tower"); a part the
//     build does not have gets no drop and no event (an exposed payload has no fairing; only the capsule archetype
//     with a sourced les_height_m draws an escape tower).
// Built on ascent.js (the ascent itself) and arrival.js (success / landing rules, the powered descents). Nothing
// here adds physics beyond those and the cited constants; the stitching below is model choices:
// - Frame: Earth-centred, km, z = Earth's axis, x toward longitude 0; Earth's rotation ignored. Launch site 28.5 N,
//   80.6 W (Cape Canaveral) launching due east, so the ascent's 2-D plane is the plane of the site's up and east
//   directions, and everything after stays in that plane (the Moon's orbit is drawn in it too).
// - The flight is the build's consequence, and the verdict decides (round 21): ascent.js calibrates its trajectory
//   to the verdict and the mission table (summary.calibration, est.). A GO build gets its mission. A NO-GO build
//   with less than the LEO share (9,400 m/s) runs dry below orbital speed and falls: "lost", its line naming the
//   shortfall ("Lost · Δv 2,043 m/s short of the 9,400 m/s LEO budget; burn ran dry short of orbit (est.)").
//   One with the LEO share but short of its mission reaches the parking orbit and its departure burn runs dry
//   short by exactly the verdict's shortfall: "transfer-failed" (below). opts.calibrate = false flies the build
//   uncalibrated. Never in orbit (ascent.js "impact" / suborbital "shortfall"): the ascent samples run
//   through the fall and re-entry (heat) to the ground: "lost" (or "aborted" if it never left the pad).
// - Beyond LEO: a third of a circular parking orbit, then the departure burn, flown: the upper stage's own vacuum
//   thrust and mass flow (engines.json), prograde, RK4 under Earth's gravity, until it has given the mission's
//   departure delta-v (missions.json: mission - leo; for lunar-orbit, moon-transfer - leo, the rest being the
//   insertion) or its propellant is gone ("depleted": burn time from the remaining delta-v at that mass
//   flow). The orbit after cutoff comes from vis-viva (apogee, perigee, period).
// - Earth missions end with the stage landing back on Earth (round 20): LEO releases the payload and times the
//   de-orbit to touch down on the pad; Earth escape does the same, the spacecraft leaving on its own escape burn
//   (an event, not flown); GTO coasts the stage out to the transfer orbit's apogee, de-orbits there and comes
//   down on a drone ship 600 km down the launch track, its departure timed for that (the parking-orbit coast
//   is chosen so; "return timed to the recovery zone" in landing.modelled). landing carries lat_deg / lon_deg and
//   downrange_km from the Cape. See returnPlan / landHome.
// - Moon: the coast under Earth's gravity (RK4) out to the Moon's mean distance; orbit insertion (impulsive) into a
//   circular 15 km orbit; a quarter orbit; arrival.js's powered descent; touchdown ("landed"), or "in-orbit-of"
//   for orbiters. The Moon is placed where the coast reaches it and moves on a circle at its revolution period.
// - Mars: a straight-line cruise along the cutoff velocity, scaled to 2,000,000 km (the real cruise takes months;
//   NOT to scale), its speed easing from the cutoff speed to the hyperbolic excess speed and up to arrival.js's
//   5.5 km/s entry speed; aeroshell entry, parachute and powered descent ("landed"), or a 300 km circular orbit
//   (model choice) after an impulsive insertion ("in-orbit-of").
// - Short of the mission ("transfer-failed", with the shortfall, apogee and period): the burn runs dry; a bound
//   orbit is flown once around, out to its apogee and back toward Earth (its perigee stays near the parking
//   orbit), while the destination stays where a full burn would have met it (Moon) or 2,000,000 km away (Mars).
//   A lunar-orbit build short only of the insertion crosses the Moon's orbit 500 km past the Moon (model choice;
//   the Moon's gravity is not modelled) and flies on. A Mars build that escapes Earth too slowly stops short down
//   the line in proportion to its hyperbolic excess speed: adrift.
// - Round 22 ("no spinning around the orbit"): the flight is a straight story. Every coast (the Earth orbit after
//   the payload release, the parking orbit, the departure burn between its ignition and cutoff, transfers, failed
//   coasts, the de-orbit coast) is a skip segment: no ramps, real time only in its windows (ignition, cutoff and
//   separation, insertion), elsewhere a cut announced by a "time-skip" event { t_sim, to_t_sim, t_screen,
//   to_t_screen, segment }; segments[].skip marks them. Earth coasts take at most 0.5 s on screen and the vehicle
//   is seen moving at most ~10 deg around Earth between SECO and entry; a Moon / Mars transfer is a 2.6 s cruise.
//   The sim is unchanged. Also: "chute-deploy" (Mars) and "landing-burn-start" events; breakup.pieces 2-3.
// - Round 27d (user: "after launch Saturn V keeps changing the image 2-3 times; make it once"): after the climb a
//   flight has at most ONE cut. Every skip after the ascent, with everything between, is one 0.5 s "cruise" skip
//   (one "time-skip" event): Moon / Mars from SECO straight to PDI / the entry interface (or into the orbit), the
//   parking orbit, departure burn, transfer and insertion inside it (their events kept, at the cut's screen time).
//   A failed transfer cuts to 2 s before its failing beat (the burn running dry, the Moon passing by) and ends
//   1.5 s after it, in real time; the orbit it is left on is endState (apogee_km, perigee_km). Earth missions have
//   no skip: the coast to the payload release is drawn (a time-lapse), then the one story cut to the booster
//   (none with opts.boosterInset).
// - Insertion burns are impulsive: throttle reads 1 for the 2 s around them, and `burn` names them, as a visual
//   cue only. Between burns the vehicle turns smoothly (over the last quarter of each coast) to the attitude the
//   next phase starts with, so the axis never jumps at a coast's end.
// - Spent stages have no flight of their own: each separation gives a detach time and a 2 s drop-away (2 m/s,
//   backward and slightly sideways in the vehicle's body frame) so the director can let them fall out of frame.
// - Screen time: real time (rate 1 screen s per sim s) inside windows around ignition and liftoff (the first 1.5 s),
//   fairing, MECO/separation/upper-stage ignition, SECO, payload release, each burn, chute opening and the last 3 s
//   before touchdown, and around every segment boundary. Leaving a window, the log of the sim speed grows with a
//   slope eased in from 0 (round 27) to e^6 per screen second (e^14 in space; e^1.65, under 3 % a frame, for every
//   ramp in the first 10 s: the climb off the pad) until it meets the segment's base rate (soft minimum); each
//   segment's base rate is solved so the segment gets its share of the total (Earth ~35 s, Moon ~55 s, Mars ~65 s).
//   The time rate is C2 everywhere outside the cuts.
// Constants: Earth GM as in ascent.js (WGS 84); radii, GM, the Moon's 0.3844 x 10^6 km semimajor axis and its
// 27.3217-day revolution period, Earth's sidereal day and equatorial radius (for GEO) from NASA's planetary fact sheets
// (https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html, .../marsfact.html, .../earthfact.html).
import { simulateAscent, returnFromSpace, boosterStory } from "./ascent.js";
import { arrivalTimeline, descentTimeline, lightingFor, atmosphereFor } from "./arrival.js";
import { G0, evaluateBuild } from "./physics.js";
import { buildManifest } from "./layout.js";

export { lightingFor, atmosphereFor };

const MU = { earth: 398600.4418, moon: 4900, mars: 42828 }; // km^3/s^2 (moon 0.00490, mars 0.042828 x 10^6)
const R = { earth: 6371.0, moon: 1737.4, mars: 3389.5 }; // km
const MOON_DIST = 384400; // km (semimajor axis)
const MOON_PERIOD_DAYS = 27.3217;
const MOON_PERIOD_S = MOON_PERIOD_DAYS * 86400;
const LUNAR_ORBIT_ALT = 15; // km: arrival.js starts the powered descent from a 15 km circular orbit
const MARS_LINE_KM = 2e6; // scaled cruise length (model choice)
const MARS_ENTRY_ALT = 120; // km (arrival.js)
const MARS_ENTRY_GAMMA = -10; // deg (arrival.js)
const MARS_ENTRY_SPEED = 5.5; // km/s (arrival.js)
const MARS_ORBIT_ALT = 300; // km, orbiters (model choice)
const ESCAPE_SHOW_KM = 1e5; // escape coast shown out to this distance (model choice)
const DEORBIT_PERIGEE_ALT = 50; // km: the de-orbit burn aims the perigee this low (model choice)
const ENTRY_INTERFACE_ALT = 120; // km: where the Kepler coast hands over to the booster model (model choice)
const MODELLED_DEORBIT = 0.1; // km/s: the retro assumed when no propellant is left (Head 1's brief, est.)
const TUMBLE_Q_PA = 500; // Pa: an unpowered, uncontrolled vehicle starts to tumble once the air grips it (model choice)
const TUMBLE_RAMP_S = 5; // s: its angle of attack grows from 0 to 90 deg over this (model choice)
const QALPHA_LIMIT = 150e3; // Pa x deg: breakup when q x alpha passes this (model choice, est.; not a sourced limit)
const LES_AFTER_IGNITION_S = 30; // s: launch escape tower jettison after the first upper-stage ignition (model choice, est.)
const DRONE_SHIP_KM = 600; // km down the launch track from the Cape: where a GTO stage's return is timed to (model choice)
const PAYLOAD_OFF = [0.05, 1, 0]; // drop-away of a payload leaving a stage that comes home: forward off the nose
const FLYBY_ALT = 500; // km: a lunar-orbit build short of insertion crosses the Moon's orbit this far off (model choice)
// GEO from the Earth fact sheet: "Sidereal rotation period (hrs) 23.9345", "Equatorial radius (km) 6378.137"
const R_EQ = 6378.137;
const GEO_R = Math.cbrt(398600.4418 * ((23.9345 * 3600) / (2 * Math.PI)) ** 2); // km from Earth's centre (35,786 km up)
const EASE_S = 86400; // Mars cruise: speed eases over the first and the last day (model choice)
const SITE = { lat: 28.5, lon: -80.6 };
const LAMBDA = 6; // 1/s: sim speed = 1 + LAMBDA * (sim seconds since the window), once the ramp's ease is over
// Round 27 (user feedback 7: out of real time at liftoff it "suddenly goes up, like 30 fps to 60 fps"): every ramp
// out of (or into) a real-time window eases in; the log of the sim speed grows with a slope that rises from 0 to
// its lambda over RAMP_EASE_S (C2), instead of at lambda from the first frame. Ramps that touch the first
// FIRST_GENTLE_S of the flight are GENTLE: at most ~2.8 % rate change per frame (e^(1.65/60)), eased over 1 s.
const RAMP_EASE_S = 0.25;
const GENTLE = { k: 1.65, E: 1 };
const FIRST_GENTLE_S = 10; // s on screen from T0
const LIFTOFF_REAL_S = 1.5; // s of real time from T0 before the climb's ramp starts
// Round 27c (user: "why is the Saturn thing flipping the whole time"): outside the climb nothing on screen turns
// faster than ~20 deg per 5 s. Arcs that turn more are cuts (the lunar quarter orbit before the descent), and a
// landing's drawn attitude slews toward the modelled one at most SLEW_DEG_S per screen second (in the frame of
// the local vertical and the ground track): a rate limit (est.), not a modelled attitude control system.
const SLEW_DEG_S = 3.4;
// Round 27d (user: "after launch Saturn V keeps changing the image 2-3 times; make it once"): after the climb a
// flight has at most one cut. A failed transfer cuts to FAIL_LEAD_S before the beat where it fails and ends
// FAIL_TAIL_S after it, all in real time (its fate after that is the result text).
const FAIL_LEAD_S = 2;
const FAIL_TAIL_S = 1.5;
// Beats in space ramp faster (sim speed e^14 per screen second, about 26 % per frame), so the coasts stay short on
// screen (Earth missions: everything after the ascent within 20 s; a transfer within 4 s) and nothing is seen
// going round; the ascent and the descents keep the gentle ramp. Screen time only: the sim is unchanged.
const LAMBDA_SPACE = 14;
// ("reentry" counts: most of it is high, thin air; the landing burn keeps the gentle ramp)
const SPACE_SEGMENTS = new Set(["cruise", "payload-release", "orbit", "orbit-coast", "parking-orbit", "departure-burn", "transfer", "coast", "lunar-orbit", "mars-orbit", "escape", "deorbit-burn", "deorbit-coast", "reentry"]);
const SOFT_P = 4; // soft-minimum exponent between the window ramps and the base rate
const DROP = { speed_ms: 2, duration_s: 2 }; // model choice
const BURN_CUE_S = 1;
const TURN_FRACTION = 0.25; // a coast turns to the next attitude over its last quarter
const SHARE = {
  // round 25: the ascent ~16 s on screen (staging and fairing in near real time, so the parts drift off in frame)
  booster: { ascent: 16, "orbit-coast": 0.3, "payload-release": 3.5, "booster-descent": 10 }, // ~30-34: rocket, release, catch
  boosterInset: { ascent: 16, "orbit-coast": 0.3, "payload-release": 10 }, // the release beat as long as the booster's descent beside it
  // round 22: every coast is a skip (a cut) of at most 0.5 s; what is shown is the story's beats
  // (round 27d: the skipped stretch after the climb is one "cruise" skip, 0.5 s on screen, wherever it is)
  earth: { ascent: 16, orbit: 2.6, cruise: 0.5, reentry: 6, landing: 4.5 }, // ~37 (LEO, then home)
  gto: { ascent: 16, cruise: 0.5, reentry: 5.5, landing: 4 }, // ~34
  // (round 27c: the lunar orbit before the descent is a cut: the insertion burn in real time, then straight to PDI)
  moon: { ascent: 16, cruise: 0.5, braking: 10, approach: 7, vertical: 11.1 }, // ~48-52
  "moon-orbit": { ascent: 16, cruise: 0.5, "lunar-orbit": 5 }, // ~27
  mars: { ascent: 16, cruise: 0.5, entry: 12, parachute: 8.5, approach: 8.5, vertical: 10.1 }, // ~59-63
  "mars-orbit": { ascent: 16, cruise: 0.5, "mars-orbit": 5 }, // ~27
  // a failed transfer: the climb, the cut, the failing beat in real time (FAIL_LEAD_S + FAIL_TAIL_S)
  failed: { ascent: 16, cruise: 0.5, "parking-orbit": 2, "departure-burn": 2, transfer: 2, coast: 1.5 }, // ~20-25
  lost: { ascent: 35 },
};
const FAILED_ASCENT_S = 35; // a flight that never reaches orbit is all ascent
// The real-time windows and the ramps out of them set a floor per segment (about 3.1-3.4 s for the parking orbit,
// 1.8-2.1 s for the departure burn, 3.3 s for a transfer, 2.1 s for a lunar orbit ending in a descent, 5 s for the
// vertical descent, 16-20 s for an ascent); the shares sit above it.

// ---------- vector helpers ----------
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (v) => mul(v, 1 / (len(v) || 1));
const lerp = (a, b, u) => a + (b - a) * u;
const r3 = (v) => v.map((x) => Math.round(x * 1000) / 1000);
const num = (v) => Math.round(v).toLocaleString("en-US");
const r6 = (v) => v.map((x) => Math.round(x * 1e6) / 1e6); // velocities: km/s to the mm/s (a coast frame spans minutes)
const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
const smooth = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const rad = Math.PI / 180;

// Local frame on a body: up, east, north (north toward +z; every body shares Earth's axis here).
export function surfaceFrame(body, pos_km) {
  const up = unit(pos_km);
  let east = cross([0, 0, 1], up);
  if (len(east) < 1e-9) east = [0, 1, 0];
  east = unit(east);
  return { up, east, north: cross(up, east) };
}
export const altitude = (body, pos_km) => len(pos_km) - (R[body] ?? R.earth);
// Latitude / longitude of an Earth-centred position (no rotation: the frame is Earth-fixed at launch).
const latLon = (p) => ({ lat_deg: round((Math.asin(p[2] / len(p)) * 180) / Math.PI, 3), lon_deg: round((Math.atan2(p[1], p[0]) * 180) / Math.PI, 3) });

// ---------- the flight plane ----------
const U_SITE = [Math.cos(SITE.lat * rad) * Math.cos(SITE.lon * rad), Math.cos(SITE.lat * rad) * Math.sin(SITE.lon * rad), Math.sin(SITE.lat * rad)];
const E_SITE = unit([-Math.sin(SITE.lon * rad), Math.cos(SITE.lon * rad), 0]);
const H_PLANE = unit(cross(U_SITE, E_SITE)); // orbit normal of an eastward launch
const rHat = (th) => add(mul(U_SITE, Math.cos(th)), mul(E_SITE, Math.sin(th)));
const tHat = (th) => add(mul(U_SITE, -Math.sin(th)), mul(E_SITE, Math.cos(th)));
const planeAngle = (v) => Math.atan2(dot(v, E_SITE), dot(v, U_SITE));
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
// Turn axis a toward b by u (0..1) about the plane normal (every axis of the flight lies in the plane).
const turn = (a, b, u) => (u <= 0 ? a : u >= 1 ? b : rHat(planeAngle(a) + wrap(planeAngle(b) - planeAngle(a)) * u));

// ---------- interpolation over a time-sorted array ----------
function bracket(arr, t, key) {
  let lo = 0;
  let hi = arr.length - 1;
  if (t <= arr[0][key]) return [0, 0, 0];
  if (t >= arr[hi][key]) return [hi, hi, 0];
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (arr[mid][key] <= t) lo = mid;
    else hi = mid;
  }
  const a = arr[lo][key];
  const b = arr[hi][key];
  return [lo, hi, b > a ? (t - a) / (b - a) : 0];
}

// ---------- two-body coast (RK4, step 0.4 % of r / v) with cubic Hermite interpolation ----------
function coast(p0, v0, mu, done, tMax) {
  const acc = (p) => mul(p, -mu / len(p) ** 3);
  const step = (p, v, h) => {
    const a1 = acc(p);
    const p2 = add(p, mul(v, h / 2));
    const v2 = add(v, mul(a1, h / 2));
    const a2 = acc(p2);
    const p3 = add(p, mul(v2, h / 2));
    const v3 = add(v, mul(a2, h / 2));
    const a3 = acc(p3);
    const p4 = add(p, mul(v3, h));
    const v4 = add(v, mul(a3, h));
    const a4 = acc(p4);
    return [add(p, mul(add(add(v, mul(v2, 2)), add(mul(v3, 2), v4)), h / 6)), add(v, mul(add(add(a1, mul(a2, 2)), add(mul(a3, 2), a4)), h / 6))];
  };
  const out = [{ t: 0, p: p0, v: v0 }];
  let p = p0;
  let v = v0;
  let t = 0;
  while (t < tMax) {
    const h = Math.min((0.004 * len(p)) / len(v), 600);
    let [pn, vn] = step(p, v, h);
    if (done(pn, vn, t + h)) {
      let lo = 0;
      let hi = h;
      for (let k = 0; k < 50; k++) {
        const m = (lo + hi) / 2;
        const [pm, vm] = step(p, v, m);
        if (done(pm, vm, t + m)) hi = m;
        else lo = m;
      }
      [pn, vn] = step(p, v, hi);
      out.push({ t: t + hi, p: pn, v: vn });
      return out;
    }
    p = pn;
    v = vn;
    t += h;
    out.push({ t, p, v });
  }
  return out;
}
function hermite(arc, t) {
  const [i, j, s] = bracket(arc, t, "t");
  const a = arc[i];
  const b = arc[j];
  const h = b.t - a.t;
  if (i === j || h <= 0) return { p: a.p, v: a.v };
  const s2 = s * s;
  const s3 = s2 * s;
  const p = add(add(mul(a.p, 2 * s3 - 3 * s2 + 1), mul(a.v, h * (s3 - 2 * s2 + s))), add(mul(b.p, -2 * s3 + 3 * s2), mul(b.v, h * (s3 - s2))));
  const v = add(add(mul(sub(a.p, b.p), (6 * s2 - 6 * s) / h), mul(a.v, 3 * s2 - 4 * s + 1)), mul(b.v, 3 * s2 - 2 * s));
  return { p, v };
}

// A prograde (sign 1) or retrograde (-1) burn under Earth's gravity (RK4, steps of at most 1 s): thrust F_N, mass
// flow mdot, for T seconds.
function burnArc(p0, v0, m0, F_N, mdot, T, sign = 1) {
  const f = (p, v, m) => [v, add(mul(p, -MU.earth / len(p) ** 3), mul(unit(v), (sign * F_N) / m / 1000))];
  const n = Math.max(1, Math.ceil(T));
  const h = T / n;
  const out = [{ t: 0, p: p0, v: v0, m: m0 }];
  let p = p0;
  let v = v0;
  for (let i = 0; i < n; i++) {
    const m = m0 - mdot * h * i;
    const [k1p, k1v] = f(p, v, m);
    const [k2p, k2v] = f(add(p, mul(k1p, h / 2)), add(v, mul(k1v, h / 2)), m - (mdot * h) / 2);
    const [k3p, k3v] = f(add(p, mul(k2p, h / 2)), add(v, mul(k2v, h / 2)), m - (mdot * h) / 2);
    const [k4p, k4v] = f(add(p, mul(k3p, h)), add(v, mul(k3v, h)), m - mdot * h);
    p = add(p, mul(add(add(k1p, mul(k2p, 2)), add(mul(k3p, 2), k4p)), h / 6));
    v = add(v, mul(add(add(k1v, mul(k2v, 2)), add(mul(k3v, 2), k4v)), h / 6));
    out.push({ t: h * (i + 1), p, v, m: m - mdot * h });
  }
  return out;
}
// Orbit from a state (vis-viva): bound or not, apogee / perigee radius, period, hyperbolic excess speed.
function elements(p, v, mu) {
  const energy = dot(v, v) / 2 - mu / len(p);
  const h = len(cross(p, v));
  const e = Math.sqrt(Math.max(0, 1 + (2 * energy * h * h) / (mu * mu)));
  const bound = energy < 0;
  const a = bound ? -mu / (2 * energy) : Infinity;
  return { bound, e, apogee: bound ? a * (1 + e) : Infinity, perigee: (h * h) / (mu * (1 + e)), period: bound ? 2 * Math.PI * Math.sqrt(a ** 3 / mu) : Infinity, vInf: bound ? 0 : Math.sqrt(2 * energy) };
}

// ---------- screen-time map ----------
// A window ramp: from a window's edge the sim speed v starts at 1 and ln v grows with slope k * smoothstep(tau / E)
// per screen second tau (cubic smoothstep, so v is C2), then at k. Tabulated once per (k, E) as sim distance from
// the edge -> speed (as if the clock followed this ramp alone). A number is a lambda eased over RAMP_EASE_S.
const RAMPS = new Map();
function rampOf(spec) {
  const { k, E } = typeof spec === "number" ? { k: spec, E: RAMP_EASE_S } : spec;
  const key = `${k}/${E}`;
  if (RAMPS.has(key)) return RAMPS.get(key);
  const lnv = (tau) => (tau >= E ? k * (tau - E / 2) : k * E * ((tau / E) ** 3 - (tau / E) ** 4 / 2));
  const N = 600;
  const T = [0];
  const D = [0];
  const V = [1];
  for (let i = 1; i <= N && E > 0; i++) {
    const t0 = (E * (i - 1)) / N;
    const t1 = (E * i) / N;
    D.push(D[i - 1] + ((t1 - t0) / 6) * (Math.exp(lnv(t0)) + 4 * Math.exp(lnv((t0 + t1) / 2)) + Math.exp(lnv(t1))));
    T.push(t1);
    V.push(Math.exp(lnv(t1)));
  }
  const dE = D.at(-1);
  const vE = V.at(-1);
  const lerpIn = (xs, ys, x) => {
    let lo = 0;
    let hi = xs.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (xs[mid] <= x) lo = mid;
      else hi = mid;
    }
    return ys[lo] + ((ys[hi] - ys[lo]) * (x - xs[lo])) / (xs[hi] - xs[lo]);
  };
  const r = {
    k,
    E,
    speed: (x) => (x <= 0 ? 1 : x >= dE ? vE + k * (x - dE) : lerpIn(D, V, x)), // at sim distance x from the edge
    dist: (tau) => (tau <= 0 ? 0 : tau >= E ? dE + (vE * Math.exp(k * (tau - E)) - vE) / k : lerpIn(T, D, tau)), // tau s after it
  };
  RAMPS.set(key, r);
  return r;
}
const gentler = (r1, r2) => (r1.k < r2.k || (r1.k === r2.k && r1.E >= r2.E) ? r1 : r2);

// segs: [{ t0, t1, budget }] (contiguous), windows: [[a, b, ramp before, ramp after]] sim seconds, rate 1 inside.
// Outside the windows the sim speed is a soft minimum of the segment's base speed and the windows' ramps, taken on
// (speed - 1) so it is exactly 1 inside a window and stays C2: v = 1 + ((V - 1)^-p + sum (v_j - 1)^-p)^(-1/p). Its
// log changes per screen second by a weighted mean (weights <= 1) of the ramps' slopes, never more than the
// steepest ramp near it.
function buildClock(segs, windows) {
  const T0 = segs[0].t0;
  const T1 = segs.at(-1).t1;
  // [a, b, ramp before, ramp after]: merged windows keep the gentler ramp on each side
  const win = windows
    .map(([a, b, lb = LAMBDA, la = lb]) => [Math.max(T0, a), Math.min(T1, b), rampOf(lb), rampOf(la)])
    .filter(([a, b]) => b >= a)
    .sort((x, y) => x[0] - y[0])
    .reduce((m, w) => {
      const last = m.at(-1);
      if (last && w[0] <= last[1]) {
        last[1] = Math.max(last[1], w[1]);
        last[2] = gentler(last[2], w[2]);
        last[3] = gentler(last[3], w[3]);
      } else m.push([...w]);
      return m;
    }, []);
  const pts = [T0, T1];
  for (const s of segs) for (let i = 0; i <= 1500; i++) pts.push(s.t0 + ((s.t1 - s.t0) * i) / 1500);
  for (const [a, b, rb, ra] of win) {
    for (let t = a; t < b; t += 0.05) pts.push(t);
    pts.push(b, a - 1e-3, b + 1e-3); // a cut (skip segment) changes the rate within a millisecond of the edge
    // along each ramp, a point every 1/300 s of its own screen time
    for (let i = 1; i < 6000; i++) {
      const db = rb.dist(i / 300);
      const da = ra.dist(i / 300);
      if (a - db < T0 && b + da > T1) break;
      pts.push(a - db, b + da);
    }
  }
  const grid = Float64Array.from(pts.filter((t) => t >= T0 && t <= T1)).sort();
  const sim = grid.filter((t, i) => i === 0 || t - grid[i - 1] > 1e-9);
  const n = sim.length;
  // the nearest windows' ramps at each point (sum of (v_j - 1)^-p; Infinity inside a window), and its segment
  const inv = new Float64Array(n);
  const seg = new Int32Array(n);
  let w = 0;
  let k = 0;
  for (let i = 0; i < n; i++) {
    const t = sim[i];
    while (w < win.length - 1 && win[w + 1][0] <= t) w++;
    let acc = 0;
    for (const j of [w - 1, w, w + 1]) {
      const x = win[j];
      if (!x) continue;
      // (a tolerance: a segment's own grid point can land a rounding error outside the window it starts)
      if (t >= x[0] - 1e-7 && t <= x[1] + 1e-7) {
        acc = Infinity;
        break;
      }
      acc += ((t < x[0] ? x[2].speed(x[0] - t) : x[3].speed(t - x[1])) - 1) ** -SOFT_P;
    }
    inv[i] = acc;
    while (k < segs.length - 1 && t > segs[k].t1) k++;
    seg[i] = k;
  }
  // rate = screen seconds per sim second (rb: the segment's base rate, 1 / its base speed). A skip segment (a coast,
  // round 22): no ramps; real time inside its windows, its base rate (a cut) elsewhere
  const rateAt = (i, rb) => {
    if (segs[seg[i]].skip) return inv[i] === Infinity ? 1 : rb;
    const above = 1 / rb - 1;
    return 1 / (1 + ((above > 0 ? above ** -SOFT_P : Infinity) + inv[i]) ** (-1 / SOFT_P));
  };
  // one base rate per segment, by bisection on its log
  const base = segs.map((s, j) => {
    let i0 = -1;
    let i1 = -1;
    for (let i = 0; i < n - 1; i++) {
      if (sim[i] < s.t0 - 1e-9 || sim[i + 1] > s.t1 + 1e-9) continue;
      if (i0 < 0) i0 = i;
      i1 = i;
    }
    const screenOf = (rb) => {
      let acc = 0;
      let left = rateAt(i0, rb);
      for (let i = i0; i <= i1; i++) {
        const right = rateAt(i + 1, rb);
        acc += ((left + right) / 2) * (sim[i + 1] - sim[i]);
        left = right;
      }
      return acc;
    };
    let lo = Math.log(1e-9);
    let hi = 0;
    if (i0 < 0 || screenOf(Math.exp(lo)) >= s.budget) return Math.exp(lo);
    if (screenOf(1) <= s.budget) return 1;
    for (let it = 0; it < 40; it++) {
      const m = (lo + hi) / 2;
      if (screenOf(Math.exp(m)) < s.budget) lo = m;
      else hi = m;
    }
    return Math.exp((lo + hi) / 2);
  });
  const rate = Float64Array.from({ length: n }, (_, i) => rateAt(i, base[seg[i]]));
  const screen = new Float64Array(n);
  for (let i = 1; i < n; i++) screen[i] = screen[i - 1] + ((rate[i] + rate[i - 1]) / 2) * (sim[i] - sim[i - 1]);
  // rate is linear inside each cell, so screen time is quadratic in sim time there (exact both ways)
  const cell = (xs, x) => {
    let lo = 0;
    let hi = xs.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (xs[mid] <= x) lo = mid;
      else hi = mid;
    }
    return lo;
  };
  const simToScreen = (t) => {
    if (t <= sim[0]) return 0;
    if (t >= sim[n - 1]) return screen[n - 1];
    const i = cell(sim, t);
    const x = t - sim[i];
    const kk = (rate[i + 1] - rate[i]) / (sim[i + 1] - sim[i]);
    return screen[i] + rate[i] * x + (kk * x * x) / 2;
  };
  const screenToSim = (s) => {
    if (s <= 0) return sim[0];
    if (s >= screen[n - 1]) return sim[n - 1];
    const i = cell(screen, s);
    const c = s - screen[i];
    const kk = (rate[i + 1] - rate[i]) / (sim[i + 1] - sim[i]);
    const x = (2 * c) / (rate[i] + Math.sqrt(Math.max(0, rate[i] * rate[i] + 2 * kk * c)));
    return Math.min(sim[i + 1], sim[i] + x);
  };
  // the cuts: skip-segment time outside every window, as [t0, t1] sim intervals (over a second long)
  const skips = [];
  for (const sg of segs.filter((x) => x.skip)) {
    let a = sg.t0;
    for (const [w0, w1] of win) {
      if (w1 <= a || w0 >= sg.t1) continue;
      if (w0 > a) skips.push([a, w0]);
      a = Math.max(a, w1);
    }
    if (sg.t1 > a) skips.push([a, sg.t1]);
  }
  return { simToScreen, screenToSim, total: screen[n - 1], base, windows: win, skips: skips.filter(([a, b]) => b - a > 1) };
}

// ---------- the timeline ----------
export function flightTimeline(build, catalog, opts = {}) {
  const ascent = opts.ascent ?? simulateAscent(build, catalog, opts.calibrate === false ? { calibrate: false } : {});
  const s = ascent.summary;
  if (s.outcome === "blocked") {
    // not flown: the pad-abort beat and a still rocket on the pad (sampleAt holds the pad point)
    const line = `Pad abort · ${s.reason}`;
    const twr = round(evaluateBuild(build, catalog).liftoffTWR ?? 0, 3);
    const pad = mul(U_SITE, R.earth);
    const still = {
      t_sim: 0, t_screen: 0, body: "earth", segment: "pad", phase: "pad", stageIndex: 0, pos_km: r3(pad), pos_eci_km: r3(pad), vel_kms: [0, 0, 0], vel_eci_kms: [0, 0, 0], dest_eci_km: null,
      speed_ms: 0, alt_km: 0, axis: r3(U_SITE), pitch_deg: 0, yaw_deg: 90, throttle: 0, burn: null, mass_kg: null, chute: 0, heat: 0, dust: 0, alpha_deg: 0, brokenUp: false,
    };
    return {
      blocked: true, outcome: "blocked", reason: s.reason, kind: arrivalTimeline(build, catalog, s).body, endState: { type: "aborted", line, text: line, twr },
      events: [{ type: "pad-abort", t_sim: 0, t_screen: 0, body: "earth", twr, reason: s.reason }], segments: [], stageDrops: [], bodies: { earth: { radius_km: R.earth, pos_km: [0, 0, 0] } },
      sampleAt: (t) => ({ ...still, t_screen: Math.max(0, Number.isFinite(t) ? t : 0) }), screenToSim: () => 0, simToScreen: () => 0, totalScreen_s: 0, totalSim_s: 0, est: true,
    };
  }
  const arrival = arrivalTimeline(build, catalog, s);
  const payload = catalog.payloads.find((p) => p.id === build.payloadId) ?? null;
  const mission = catalog.missions.find((m) => m.id === build.missionId);
  const leo = catalog.missions.find((m) => m.id === "leo");
  const inc = (id) => {
    const m = catalog.missions.find((x) => x.id === id);
    return m && leo ? Math.max(0, m.requiredDeltaV_ms - leo.requiredDeltaV_ms) / 1000 : 0; // km/s beyond LEO
  };
  const need = mission ? inc(mission.id) : 0;
  // the departure burn's part of it: all of it, except lunar orbit's insertion (lunar-orbit = moon-transfer + LOI)
  const departure = mission?.id === "lunar-orbit" ? inc("moon-transfer") : need;
  const AS = ascent.samples;
  const AE = ascent.events;
  const inOrbit = s.remainingDeltaV_ms != null;
  // failure beats of a flight that never reaches orbit (model choices, est.): after the last stage burns out, the
  // unpowered vehicle has no attitude control; once the air grips it (q >= TUMBLE_Q_PA) it starts to tumble, its
  // angle of attack growing to 90 deg over TUMBLE_RAMP_S, and it breaks up when q x alpha passes QALPHA_LIMIT
  const burnout = !inOrbit ? AE.find((e) => e.type === "seco") : null;
  const tumbleS = burnout ? AS.find((x) => x.t >= burnout.t && x.q_Pa >= TUMBLE_Q_PA) : null;
  const alphaAt = (t) => (tumbleS && t >= tumbleS.t ? Math.min(90, (90 * (t - tumbleS.t)) / TUMBLE_RAMP_S) : 0);
  const breakS = tumbleS ? AS.find((x) => x.t >= tumbleS.t && x.q_Pa * alphaAt(x.t) >= QALPHA_LIMIT) : null;
  const kind = arrival.body; // the mission's destination

  const pieces = []; // { name, body, t0, t1, fn(t) -> state, coast }
  const events = [];
  const windows = [];
  const stageDrops = [];
  const ev = (type, t, extra = {}) => events.push({ type, t_sim: round(t, 3), ...extra });
  const win = (a, b, lam = LAMBDA, lamAfter = lam) => windows.push([a, b, lam, lamAfter]);
  const winSpace = (a, b) => win(a, b, LAMBDA_SPACE); // beats in space: the clock leaves them faster
  const burnCue = (t, burns) => {
    for (const [tb, name] of burns) if (Math.abs(t - tb) <= BURN_CUE_S) return name;
    return null;
  };

  // ---- ascent (ascent.js samples in the launch plane)
  const ascentState = (t) => {
    const [i, j, u] = bracket(AS, t, "t");
    const a = AS[i];
    const b = AS[j];
    const alt = Math.max(0, lerp(a.alt_m, b.alt_m, u) / 1000); // held at the surface after an impact
    const th = lerp(a.downrange_m, b.downrange_m, u) / 1000 / R.earth;
    const gam = lerp(a.gamma_deg, b.gamma_deg, u) * rad;
    const v = lerp(a.vel_ms, b.vel_ms, u) / 1000;
    const vel = add(mul(tHat(th), v * Math.cos(gam)), mul(rHat(th), v * Math.sin(gam)));
    return {
      body: "earth",
      pos: mul(rHat(th), R.earth + alt),
      vel,
      axis: v > 0.001 ? unit(vel) : rHat(th),
      throttle: lerp(a.throttle, b.throttle, u),
      stageIndex: a.stage,
      mass_kg: lerp(a.mass_kg, b.mass_kg, u),
      heat: lerp(a.heat ?? 0, b.heat ?? 0, u),
      alpha_deg: alphaAt(t),
      brokenUp: Boolean(breakS && t >= breakS.t),
      phase: "ascent",
    };
  };
  const tEndAscent = AS.at(-1).t;
  // the parts the scene really has (layout.js, as parts.js builds them): a drop or a jettison only for those
  const manifest = buildManifest(build, catalog);
  const payPart = manifest.find((p) => p.kind === "payload");
  const stageCount = new Set(manifest.filter((p) => p.stageIndex != null).map((p) => p.stageIndex)).size;
  const parts = new Set([
    ...(stageCount ? ["stage"] : []),
    ...(payPart ? ["payload"] : []),
    ...(manifest.some((p) => p.kind === "fairing") ? ["fairing"] : []),
    // parts.js draws the tower (pieces tagged userData.escapeTower) in the capsule archetype only
    ...(payPart?.geom?.archetype === "capsule" && payPart.geom.lesH_m > 0 ? ["escape-tower"] : []),
  ]);
  const hasLes = parts.has("escape-tower");
  const lastA = AS.at(-1);
  // where a lost flight comes down: within 1 km of the pad "ground", else "sea" (the Cape launches east over the
  // Atlantic; there is no coastline data, so a far impact is called sea too: a default for the director, est.)
  const impact = { downrange_km: round(lastA.downrange_m / 1000, 1), ...latLon(rHat(lastA.downrange_m / 1000 / R.earth)), surface: lastA.downrange_m >= 1000 ? "sea" : "ground" };
  pieces.push({ name: "ascent", body: "earth", t0: 0, t1: tEndAscent, fn: ascentState });
  const liftoff = AE.find((e) => e.type === "liftoff");
  // real time for the first ~1.5 s, then the climb's gentle ramp (round 27; held down: the whole 3 s)
  if (liftoff) win(0, Math.max(LIFTOFF_REAL_S, liftoff.t + 0.5), LAMBDA, GENTLE);
  else win(0, 3);
  for (const e of AE) {
    if (e.t > tEndAscent + 1e-6) continue;
    if (!liftoff && e.type === "impact") continue; // held down: a pad abort, not a crash
    if (e.type === "fairing" && !parts.has("fairing")) continue; // an exposed payload (Apollo) has no fairing
    ev(e.type, e.t, { body: "earth", stage: e.stage, ...(e.type === "impact" ? { ...impact, v_ms: Math.round(lastA.vel_ms) } : {}) });
    if (e.type === "impact") win(e.t - 2, e.t);
    // (max-q has no real-time window since round 27: a dip to real time inside the climb's gentle ramp would cost
    // ~5 s of screen; the director's vapour collar is a real-time effect anyway)
    if (e.type === "fairing") {
      win(e.t - 0.5, e.t + 1.5); // the fairing halves drift off in near real time (>= 1.5 s, round 25)
      stageDrops.push(dropAway("fairing", e.stage, e.t, ascentState(e.t), [1, 0.2, 0], { part: "fairing", halves: 2, note: "the other half mirrors x" }));
    }
    if (e.type === "meco") win(e.t - 0.3, e.t + 2.8); // MECO, separation (+1 s), upper-stage ignition (+2 s): >= 1.5 s each side of the sep
    if (e.type === "sep") stageDrops.push(dropAway("sep", e.stage, e.t, ascentState(e.t), undefined, { part: "stage" }));
    // a payload drawn with a launch escape tower (parts above: Apollo) jettisons it after the first
    // upper-stage ignition; the data has no jettison time, so it is LES_AFTER_IGNITION_S later (model choice, est.)
    if (e.type === "ignition2" && hasLes && !events.some((x) => x.type === "les-jettison")) {
      const tL = e.t + LES_AFTER_IGNITION_S;
      if (tL < tEndAscent) {
        ev("les-jettison", tL, { body: "earth", stage: e.stage, payload: payload.id, note: "est.: 30 s after the first upper-stage ignition (no sourced time in the data)" });
        win(tL - 0.5, tL + 1.0); // in real time, like a separation
        stageDrops.push(dropAway("les-jettison", e.stage, tL, ascentState(tL), [0.25, 1, 0], { part: "escape-tower" }));
      }
    }
    if (e.type === "seco") win(e.t - 0.5, e.t + 0.1); // the coast after it is a cut (round 22)
  }

  const bodies = { earth: { radius_km: R.earth, pos_km: [0, 0, 0] } };
  let bodyPos = (body) => (body === "earth" ? [0, 0, 0] : null);
  let endState;
  let shareKey = "lost";
  let upperStory = null;
  const upperEvents = [];
  const storyCuts = []; // story times where the vehicle on screen changes (round 24): a cut
  let boosterTrack = null;
  let marsEntry = null; // arrival.js's entry (aeroshell, parachute) on a Mars landing
  // the vehicle that lands at the Moon / Mars (round 23: the upper stage with the payload on top)
  let landerStage = null;
  let landerMass = payload?.mass_kg ?? null;
  let landerThrust_N = 0;
  const payloadName = (payload?.name ?? "the payload").replace(/\s*\([^)]*\)\s*$/, "");
  const landerRecord = () => ({ vehicle: "upper stage + payload", stageIndex: landerStage, mass_kg: landerMass == null ? null : Math.round(landerMass), thrust_kN: Math.round(landerThrust_N / 1000), modelled: ["the upper stage lands with the payload on top (user order)", "throttle from the descent profile at the stage's thrust"] });
  const upper = AS.at(-1).stage;
  const fullMass = AS.at(-1).mass_kg;
  const payloadMass = payload?.mass_kg ?? fullMass;
  const shortBy = Math.round(arrival.shortBy_ms ?? 0);
  const end = (type, line, extra = {}) => ({ type, line, text: line, ...extra });

  if (!inOrbit) {
    // never in orbit: the ascent samples already run through the fall (re-entry heating in `heat`) to the ground
    const twr = round(evaluateBuild(build, catalog).liftoffTWR ?? 0, 3);
    if (!liftoff) {
      endState = end("aborted", "Pad abort · thrust never beat weight; the hold-downs stayed shut (est.)", { twr });
      ev("pad-abort", tEndAscent, { body: "earth", twr });
    } else {
      if (burnout) ev("depleted", burnout.t, { body: "earth", stageIndex: burnout.stage, altitude_m: burnout.alt_m, v_ms: Math.round(burnout.vel_ms) });
      if (tumbleS) {
        ev("tumble-start", tumbleS.t, { body: "earth", stageIndex: tumbleS.stage, q_Pa: Math.round(tumbleS.q_Pa), altitude_m: Math.round(tumbleS.alt_m), v_ms: Math.round(tumbleS.vel_ms) });
        win(tumbleS.t - 0.5, tumbleS.t + 1);
      }
      if (breakS) {
        ev("breakup", breakS.t, {
          body: "earth",
          stageIndex: breakS.stage,
          altitude_m: Math.round(breakS.alt_m),
          v_ms: Math.round(breakS.vel_ms),
          q_Pa: Math.round(breakS.q_Pa),
          alpha_deg: round(alphaAt(breakS.t), 1),
          qAlpha_Pa_deg: Math.round(breakS.q_Pa * alphaAt(breakS.t)),
          limit_Pa_deg: QALPHA_LIMIT,
          // what it breaks into: the stages still attached plus the payload, 2 or 3 pieces (never more)
          pieces: Math.max(2, Math.min(3, build.stages.length - breakS.stage + (payload ? 1 : 0))),
          note: "breakup threshold on q x alpha is a model choice (est.), not a sourced vehicle limit",
        });
        win(breakS.t - 0.5, breakS.t + 1.5);
      }
      const how = s.outcome === "shortfall" ? "Reached space but not orbital speed" : "Never reached orbital speed";
      // the verdict found it short (calibrated ascent, ascent.js): say by how much, against which budget
      // the verdict found it short of the LEO share (calibrated ascent, ascent.js): say by how much
      const cal = s.calibration;
      const short = cal?.orbitShortBy_ms > 0 ? { shortBy_ms: cal.shortBy_ms, budget_ms: cal.missionDeltaV_ms, orbitShortBy_ms: cal.orbitShortBy_ms, orbitBudget_ms: cal.leoDeltaV_ms } : null;
      const against = short && (short.budget_ms === short.orbitBudget_ms ? `${num(short.orbitBudget_ms)} m/s LEO budget` : `${num(short.orbitBudget_ms)} m/s needed to reach orbit`);
      endState = short
        ? end("lost", `Lost · Δv ${num(short.orbitShortBy_ms)} m/s short of the ${against}; burn ran dry short of orbit (est.)`, { impact, ...short })
        : end("lost", `Lost · ${how}; fell back and came down ${impact.surface === "sea" ? `${num(impact.downrange_km)} km downrange` : "near the pad"} (est.)`, { impact });
    }
    ev("end", tEndAscent, { body: "earth" });
  } else {
    // circular orbit at the SECO radius, in the launch plane
    const endA = ascentState(tEndAscent);
    const th0 = planeAngle(endA.pos);
    const r0 = len(endA.pos);
    const vc = Math.sqrt(MU.earth / r0);
    const om = vc / r0;
    const period = (2 * Math.PI) / om;
    const thAt = (t) => th0 + om * (t - tEndAscent);
    const orbitState = (tRelease) => (t) => ({
      body: "earth",
      pos: mul(rHat(thAt(t)), r0),
      vel: mul(tHat(thAt(t)), vc),
      axis: tHat(thAt(t)),
      throttle: 0,
      stageIndex: t < tRelease ? upper : null,
      mass_kg: t < tRelease ? fullMass : payloadMass,
      phase: "orbit",
    });

    // the upper stage: vacuum thrust and mass flow (engines.json), its propellant left at SECO (from the
    // remaining delta-v, rocket equation) and its mass without the payload
    const stg = build.stages[upper];
    const eng = catalog.engines.find((e) => e.id === stg?.engineId);
    const F = (stg?.engineCount ?? 0) * (eng?.thrustVac_kN ?? 0) * 1000; // N
    const ve = (eng?.ispVac_s ?? 0) * G0; // m/s
    const mdot = ve > 0 ? F / ve : 0;
    const propSeco = ve > 0 ? fullMass * (1 - Math.exp(-s.remainingDeltaV_ms / ve)) : 0;
    const stageOnly = fullMass - (payload?.mass_kg ?? 0);
    // Earth missions follow the stage home: after the payload leaves, the vehicle in view is the stage
    const stageOrbit = (tRelease) => (t) => ({ ...orbitState(Infinity)(t), stageIndex: upper, mass_kg: t < tRelease ? fullMass : stageOnly });

    // ---- the rocket comes home (round 20): a retrograde de-orbit burn to a 50 km perigee, paid from the
    // propellant left (else a modelled 100 m/s, est.); a Kepler coast to the 120 km entry interface; then the
    // booster model (ascent.js returnFromSpace): entry burn, landing burn, touchdown.
    function returnPlan(tD, pD, vD, mStage, propLeft) {
      const v0 = len(vD);
      const perigeeAfter = (dv) => elements(pD, mul(vD, 1 - dv / v0), MU.earth).perigee;
      let lo = 0;
      let hi = v0;
      for (let k = 0; k < 60; k++) {
        const m = (lo + hi) / 2;
        if (perigeeAfter(m) > R.earth + DEORBIT_PERIGEE_ALT) lo = m;
        else hi = m;
      }
      const need = hi;
      const avail = ve > 0 && propLeft > 0 && mStage > propLeft ? (ve / 1000) * Math.log(mStage / (mStage - propLeft)) : 0;
      const modelled = avail < need;
      const dvB = modelled ? Math.max(MODELLED_DEORBIT, need) : need;
      const used = modelled ? 0 : mStage * (1 - Math.exp(-(dvB * 1000) / ve));
      const T = Math.max(1e-3, modelled ? (dvB * 1000 * mStage) / Math.max(1, F) : used / mdot);
      const burn = burnArc(pD, vD, mStage, F, modelled ? 0 : mdot, T, -1).map((x) => ({ ...x, t: x.t + tD }));
      const tB = burn.at(-1).t;
      const down = coast(burn.at(-1).p, burn.at(-1).v, MU.earth, (p) => len(p) <= R.earth + ENTRY_INTERFACE_ALT, 2 * 86400).map((x) => ({ ...x, t: x.t + tB }));
      const pE = down.at(-1).p;
      const vE = down.at(-1).v;
      const thE = planeAngle(pE);
      const ret = returnFromSpace(build, catalog, upper, { x: 0, y: len(pE) * 1000, vx: dot(vE, tHat(thE)) * 1000, vy: dot(vE, rHat(thE)) * 1000 }, propLeft - used);
      const ahead = (((thE - planeAngle(pD)) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); // entry point past the de-orbit point
      return { tD, need, modelled, dvB, burn, tB, down, tE: down.at(-1).t, thE, ret, mStage: mStage - used, thLand: ahead + ret.landingX_m / 1000 / R.earth };
    }
    // the plan's pieces, events and ending
    function landHome(plan, site, missionLine) {
      const { burn, down, ret, tE, thE } = plan;
      pieces.push({
        name: "deorbit-burn",
        body: "earth",
        t0: plan.tD,
        t1: plan.tB,
        fn: (t) => {
          const { p, v } = hermite(burn, t);
          const [i, j, u] = bracket(burn, t, "t");
          return { body: "earth", pos: p, vel: v, axis: mul(unit(v), -1), throttle: 1, burn: "deorbit", stageIndex: upper, mass_kg: lerp(burn[i].m, burn[j].m, u), phase: "deorbit-burn" };
        },
      });
      ev("deorbit-burn", plan.tD, { body: "earth", stage: upper, dv_ms: Math.round(plan.dvB * 1000), modelled: plan.modelled });
      // the burn's start and end, kept inside the burn (a short burn must not spill into the coasts beside it)
      winSpace(plan.tD - 0.1, Math.min(plan.tB, plan.tD + 0.5));
      winSpace(Math.max(plan.tD, plan.tB - 0.5), plan.tB + 0.1);
      pieces.push({
        name: "deorbit-coast",
        body: "earth",
        t0: plan.tB,
        t1: tE,
        fn: (t) => {
          const { p, v } = hermite(down, t);
          return { body: "earth", pos: p, vel: v, axis: mul(unit(v), -1), throttle: 0, stageIndex: upper, mass_kg: plan.mStage, phase: "deorbit-coast" };
        },
        coast: true,
        skip: true,
      });
      ev("entry-interface", tE, { body: "earth", alt_km: ENTRY_INTERFACE_ALT });
      // booster samples (2-D, from the entry point) -> Earth-centred states; velocity from the track
      const RS = ret.samples.map((x) => ({ ...x, t: x.t + tE }));
      const posAt = (t) => {
        const [i, j, u] = bracket(RS, t, "t");
        const th = thE + lerp(RS[i].x_m, RS[j].x_m, u) / 1000 / R.earth;
        return { pos: mul(rHat(th), R.earth + lerp(RS[i].alt_m, RS[j].alt_m, u) / 1000), a: RS[i], b: RS[j], u };
      };
      const evAt = (type) => ret.events.find((e) => e.type === type);
      const tLand = tE + (evAt("landing-burn")?.t ?? ret.samples.at(-1).t);
      const tDown = RS.at(-1).t;
      const homeState = (t) => {
        const { pos, a, b, u } = posAt(t);
        const t1 = Math.max(tE, t - 0.5);
        const t2 = Math.min(tDown, t + 0.5);
        const vel = t2 > t1 ? mul(sub(posAt(t2).pos, posAt(t1).pos), 1 / (t2 - t1)) : [0, 0, 0];
        const throttle = lerp(a.throttle, b.throttle, u);
        // engines first through the air (nose against the flow); upright once it has nearly stopped
        const axis = len(vel) > 0.0005 ? mul(unit(vel), -1) : unit(pos);
        return { body: "earth", pos, vel, axis, throttle, burn: throttle > 0 ? (t < tLand ? "entry" : "landing") : null, stageIndex: upper, mass_kg: plan.mStage, heat: lerp(a.heat, b.heat, u), phase: t >= tDown ? "touchdown" : t < tLand ? "reentry" : "landing" };
      };
      pieces.push({ name: "reentry", body: "earth", t0: tE, t1: tLand, fn: homeState });
      pieces.push({ name: "landing", body: "earth", t0: tLand, t1: tDown, fn: homeState });
      for (const e of ret.events) {
        const type = { entry: "entry-burn", lost: "touchdown" }[e.type] ?? e.type;
        if (type === "landing-burn") ev("landing-burn-start", tE + e.t, { body: "earth", stage: upper });
        ev(type, tE + e.t, { body: "earth", stage: upper, ...(e.phase ? { phase: e.phase } : {}), ...(type === "touchdown" ? { site, speed_ms: round(ret.touchdownSpeed_ms, 2) } : {}) });
        if (type === "entry-burn") winSpace(tE + e.t - 0.5, tE + e.t + 0.5);
        if (type === "landing-burn") win(tE + e.t - 0.5, tE + e.t + 0.5);
      }
      win(tDown - 2, tDown); // the last 2 s of an Earth landing in real time
      const thPad = wrap(thE + ret.landingX_m / 1000 / R.earth); // the touchdown's angle from the Cape, along the track
      const legs = Boolean(catalog.visuals?.tanks?.[stg?.tankId]?.features?.includes("landing-legs"));
      const touch = posAt(tDown).pos;
      const landing = {
        site,
        downrange_km: round(Math.abs(thPad) * R.earth, 1), // from the Cape, along the launch track
        ...latLon(touch),
        pos_eci_km: r3(touch),
        touchdown_ms: round(ret.touchdownSpeed_ms, 2),
        legs,
        touchdown: legs ? "legs" : "propulsive",
        deorbit_ms: Math.round(plan.dvB * 1000),
        modelled: ["return timed to the recovery zone", ...(plan.modelled ? ["de-orbit delta-v"] : []), ...ret.modelled],
      };
      // the stage coming home is the round-20 story ending (real upper stages are not recovered): said so in words
      endState = end("landed", "Stage brought home (story) · est.", { body: "earth", missionLine, landing, story: true });
      ev("end", tDown, { body: "earth" });
    }

    // Earth escape that makes it: the spacecraft leaves the parking orbit on its own escape burn (not flown: its
    // own propulsion) while the stage comes home like a LEO flight (round 20: every successful flight lands)
    const ownEscape = arrival.success && mission?.id === "earth-escape";
    // ---- round 24 (user feedback 4): a successful Earth mission stays with the rocket: ascent, staging, the upper
    // stage to SECO, the payload release on screen (3.5 s, Earth below), a cut, then only the first stage's final
    // descent (below ~5 km, vertical, tail first, landing burn) into the tower catch, for every Earth destination
    // (ascent.js boosterStory, back to the pad only: Falcon 9 to LEO as flown; otherwise a modelled reserve, and
    // where even that cannot bring it back, its own landing with the final descent moved to the tower; listed).
    // The booster lands before the payload is released, so its final descent is replayed after the release on
    // its own clock ("story time"; t_vehicle is its own time). Flip, boostback and entry stay in the sim and the
    // result sentences, never on screen.
    const bst = arrival.success && arrival.body === "earth" ? boosterStory(build, catalog, s, { mode: "rtls", only: true }) : null;
    if (bst) {
      // opts.boosterInset (picture-in-picture): the release beat lasts as long as the booster's descent, the upper
      // stage drifting on in real time, and the booster flies alongside it on its own clock (f.booster), not after
      // a cut; its beats are then in f.booster.beats, not in the main events
      const inset = Boolean(opts.boosterInset);
      shareKey = inset ? "boosterInset" : "booster";
      const BS = bst.samples;
      const tDown = BS.at(-1).t;
      // the payload release: LEO / escape at the ascent's release; GTO right after its departure burn
      const thBurn = thAt(tEndAscent + period / 3);
      let tRel = AE.find((e) => e.type === "payload-release")?.t ?? tEndAscent + 20;
      let relState = stageOrbit(tRel);
      if (mission.id === "gto" && ve > 0 && mdot > 0) {
        const tDep = tEndAscent + period / 3;
        const mC = fullMass * Math.exp(-(departure * 1000) / ve);
        const T = (fullMass - mC) / mdot;
        const burn = burnArc(mul(rHat(thBurn), r0), mul(tHat(thBurn), vc), fullMass, F, mdot, Math.max(1e-3, T)).map((x) => ({ ...x, t: x.t + tDep }));
        const tCut = burn.at(-1).t;
        const after = coast(burn.at(-1).p, burn.at(-1).v, MU.earth, () => false, 30).map((x) => ({ ...x, t: x.t + tCut }));
        tRel = tCut + 0.2;
        const orbit0 = stageOrbit(Infinity);
        relState = (t) => {
          if (t < tDep) return { ...orbit0(t), stageIndex: upper, mass_kg: fullMass };
          const arc = t <= tCut ? burn : after;
          const { p, v } = hermite(arc, Math.min(t, arc.at(-1).t));
          return { body: "earth", pos: p, vel: v, axis: unit(v), throttle: t <= tCut ? 1 : 0, burn: t <= tCut ? "departure" : null, stageIndex: upper, mass_kg: t < tRel ? mC : mC - (payload?.mass_kg ?? 0), phase: t <= tCut ? "departure-burn" : "orbit" };
        };
      }
      upperStory = { secoAt: tEndAscent, releaseAt: tRel };
      for (let i = events.length - 1; i >= 0; i--) if (events[i].t_sim > tEndAscent + 1e-6) upperEvents.unshift(...events.splice(i, 1));
      // SECO, then a cut to the release; the release in real time (3.5 s); then a cut to the booster
      const rel0 = tRel - 1.75;
      const rel1 = inset ? rel0 + SHARE.boosterInset["payload-release"] : tRel + 1.75;
      // (round 27d: drawn, a time-lapse on the same camera, not a cut)
      pieces.push({ name: "orbit-coast", body: "earth", t0: tEndAscent, t1: rel0, fn: relState });
      pieces.push({ name: "payload-release", body: "earth", t0: rel0, t1: rel1, fn: relState });
      ev("payload-release", tRel, { body: "earth", stage: upper });
      win(rel0, rel1, LAMBDA_SPACE);
      stageDrops.push(dropAway("payload-release", upper, tRel, relState(tRel), PAYLOAD_OFF, { part: "payload" }));
      // the booster's final descent, in story time: from where it is last below 5 km, descending, to touchdown
      let k5 = BS.findIndex((x, i) => x.alt_m <= 5000 && BS.slice(0, i).some((y) => y.alt_m > 5000));
      if (k5 < 0) k5 = 0;
      // ...and already falling within 15 deg of vertical (a slanted arc starts on screen lower down)
      const slant = (k) => {
        const p0 = BS[Math.max(0, k - 1)];
        const p1 = BS[Math.min(BS.length - 1, k + 1)];
        return (Math.atan2(Math.abs(p1.x_m - p0.x_m), Math.abs(p1.alt_m - p0.alt_m) || 1e-9) * 180) / Math.PI;
      };
      // (a relocated descent is drawn straight down the tower line instead: its altitude and timing as flown)
      if (!bst.relocated) while (k5 < BS.length - 3 && slant(k5) > 15) k5++;
      const tB0 = BS[k5].t;
      const shift = (inset ? rel0 : rel1) - tB0; // story time = booster time + shift (inset: from the release beat)
      const xEnd = BS.at(-1).x_m;
      // relocated: the descent's ground track is moved so the touchdown is at the tower (the pad)
      const xOff = bst.relocated ? xEnd : 0;
      const posAt = (t) => {
        const [i, j, u] = bracket(BS, t, "t");
        const th = bst.relocated ? 0 : (lerp(BS[i].x_m, BS[j].x_m, u) - xOff) / 1000 / R.earth;
        return { pos: mul(rHat(th), R.earth + Math.max(0, lerp(BS[i].alt_m, BS[j].alt_m, u)) / 1000), a: BS[i], b: BS[j], u };
      };
      const boosterState = (ts) => {
        const t = Math.max(tB0, Math.min(tDown, ts - shift));
        const { pos, a, b, u } = posAt(t);
        const t1 = Math.max(tB0, t - 0.5);
        const t2 = Math.min(tDown, t + 0.5);
        const vel = t2 > t1 ? mul(sub(posAt(t2).pos, posAt(t1).pos), 1 / (t2 - t1)) : [0, 0, 0];
        // tail first: the axis against the fall (straight up once it has nearly stopped)
        const axis = len(vel) > 0.0005 ? mul(unit(vel), -1) : unit(pos);
        const throttle = lerp(a.throttle, b.throttle, u);
        return { body: "earth", pos, vel, axis, throttle, burn: throttle > 0 ? "landing" : null, stageIndex: 0, mass_kg: null, heat: lerp(a.heat ?? 0, b.heat ?? 0, u), gridFin_deg: lerp(a.gridFin_deg ?? 0, b.gridFin_deg ?? 0, u), tVehicle: t, phase: t >= tDown ? "touchdown" : "booster-descent" };
      };
      if (!inset) {
        storyCuts.push(rel1); // from the upper stage in orbit to the booster at 5 km: a cut by construction
        pieces.push({ name: "booster-descent", body: "earth", t0: rel1, t1: tDown + shift, fn: boosterState });
      }
      // the booster's own clock (f.booster) keeps the real-time windows the main clock gives its descent
      const bWindows = [[tB0, tB0 + 0.3], [tDown - 2, tDown]];
      const bBeats = [];
      for (const e of bst.events) {
        if (e.t < tB0) continue; // flip, boostback and entry: in the sim and the sentences, not on screen
        if (e.type === "landing-burn") {
          bWindows.push([e.t - 0.5, e.t + 0.5]);
          bBeats.push({ type: "landing-burn-start", t_vehicle: e.t, alt_m: e.alt_m, vel_ms: e.vel_ms });
          if (inset) continue;
          ev("booster-landing-burn", e.t + shift, { body: "earth", stage: 0, alt_m: e.alt_m, vel_ms: e.vel_ms, t_vehicle: e.t });
          ev("landing-burn-start", e.t + shift, { body: "earth", stage: 0, t_vehicle: e.t });
          win(e.t + shift - 0.5, e.t + shift + 0.5);
        }
      }
      bBeats.push({ type: "touchdown", t_vehicle: tDown, speed_ms: round(bst.touchdownSpeed_ms, 2) });
      if (!inset) {
        ev("booster-touchdown", tDown + shift, { body: "earth", stage: 0, speed_ms: round(bst.touchdownSpeed_ms, 2), t_vehicle: tDown });
        ev("touchdown", tDown + shift, { body: "earth", stage: 0, speed_ms: round(bst.touchdownSpeed_ms, 2), t_vehicle: tDown });
        win(tDown + shift - 2, tDown + shift);
      }
      const legs = Boolean(catalog.visuals?.tanks?.[build.stages[0]?.tankId]?.features?.includes("landing-legs"));
      const touch = posAt(tDown).pos;
      const steps = ["flipped", ...(bst.events.some((e) => e.type === "boostback") ? ["flew back"] : []), ...(bst.events.some((e) => e.type === "entry") ? ["re-entered"] : [])];
      const landing = {
        vehicle: "first stage",
        site: "tower",
        downrange_km: round(Math.abs(bst.landingDownrange_m) / 1000, 1),
        ...latLon(touch),
        pos_eci_km: r3(touch),
        touchdown_ms: round(bst.touchdownSpeed_ms, 2),
        legs,
        touchdown: "tower catch",
        relocated: Boolean(bst.relocated),
        steps,
        modelled: [...(bst.modelled ?? []), ...(legs ? ["caught at the tower (Falcon 9 itself lands on its legs)"] : [])],
      };
      endState = end("landed", "First stage caught at the tower · est.", { body: "earth", missionLine: arrival.lines.at(-1), payloadLine: `Payload released into ${MISSION_PAYLOAD[mission.id] ?? "its orbit"} at ${tPlus(tRel)} (est.)`, landing });
      ev("end", inset ? rel1 : tDown + shift, { body: "earth" });
      boosterTrack = { mode: "tower", relocated: Boolean(bst.relocated), events: bst.events, shift, onScreenFrom_t: tB0, inset, tB0, tDown, startSim: inset ? rel0 : rel1, windows: bWindows, beats: bBeats, state: boosterState };
    } else if (!(need > 0) || ownEscape) {
      // LEO: release the payload, then the stage comes home, its de-orbit timed so it touches down on the pad
      shareKey = "earth";
      const release = AE.find((e) => e.type === "payload-release");
      const tRel = release?.t ?? tEndAscent;
      const trial = returnPlan(0, mul(rHat(0), r0), mul(tHat(0), vc), stageOnly, propSeco);
      const lead = trial.thLand; // de-orbit point to touchdown, the same wherever the de-orbit starts
      const thD = 2 * Math.PI * Math.ceil((thAt(tRel + 60) + lead) / (2 * Math.PI)) - lead;
      const tD = tEndAscent + (thD - th0) / om;
      // shown: SECO and the payload release (2 s); then the coast to the de-orbit point is a cut (round 22)
      const tShown = Math.min(tD - 60, Math.max(tEndAscent + 2, tRel + 1.7));
      pieces.push({ name: "orbit", body: "earth", t0: tEndAscent, t1: tShown, fn: stageOrbit(tRel) });
      pieces.push({ name: "orbit-coast", body: "earth", t0: tShown, t1: tD, fn: stageOrbit(tRel), coast: true, skip: true });
      if (release) {
        ev("payload-release", release.t, { body: "earth", stage: upper });
        winSpace(release.t - 0.3, release.t + 1.7); // the payload release: 2 s
        stageDrops.push(dropAway("payload-release", upper, release.t, stageOrbit(tRel)(release.t), PAYLOAD_OFF, { part: "payload" }));
        if (ownEscape) ev("spacecraft-departure", release.t + 1, { body: "earth", dv_ms: Math.round(departure * 1000), note: "the spacecraft's own escape burn (est.; not flown)" });
      }
      const plan = returnPlan(tD, mul(rHat(thD), r0), mul(tHat(thD), vc), stageOnly, propSeco);
      landHome(plan, "pad", arrival.lines.at(-1));
    } else {
      // a third of a parking orbit, then the upper stage's departure burn (prograde, its own thrust and mass flow)
      // until it has given the mission's departure delta-v or its propellant is gone
      const remaining = s.remainingDeltaV_ms / 1000;
      const depleted = remaining + 1e-6 < departure;
      const burnDv = Math.min(remaining, departure);
      const mCut = ve > 0 ? fullMass * Math.exp(-(burnDv * 1000) / ve) : fullMass;
      const burnT = mdot > 0 ? (fullMass - mCut) / mdot : 0;
      const burnFrom = (thDep, t0) => {
        const p0 = mul(rHat(thDep), r0);
        const v0 = mul(tHat(thDep), vc);
        return burnT >= 1 ? burnArc(p0, v0, fullMass, F, mdot, burnT).map((x) => ({ ...x, t: x.t + t0 })) : [{ t: t0, p: p0, v: v0, m: fullMass }];
      };
      const toApogee = (b) => coast(b.at(-1).p, b.at(-1).v, MU.earth, (p, v, t) => t > 60 && dot(p, v) < 0, 30 * 86400).map((x) => ({ ...x, t: x.t + b.at(-1).t }));
      const homeMass = mCut - (payload?.mass_kg ?? 0);
      const homeProp = propSeco - (fullMass - mCut);
      // a third of a parking orbit; a GTO stage that comes home waits instead for the departure point that puts
      // its touchdown on the drone ship 600 km down the launch track (the return timed to the recovery zone, est.;
      // the angle from departure to touchdown is the same wherever the departure is, so one trial run finds it)
      let thDep = thAt(tEndAscent + period / 3);
      if (arrival.success && mission.id === "gto") {
        const b = burnFrom(0, 0);
        const a = toApogee(b);
        const plan = returnPlan(0, a.at(-1).p, a.at(-1).v, homeMass, homeProp);
        const lead = ((planeAngle(a.at(-1).p) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) + plan.thLand;
        const thMin = thAt(tEndAscent + period / 10);
        const target = DRONE_SHIP_KM / R.earth - lead;
        thDep = target + 2 * Math.PI * Math.ceil((thMin - target) / (2 * Math.PI));
      }
      const tDep = tEndAscent + (thDep - th0) / om;
      pieces.push({ name: "parking-orbit", body: "earth", t0: tEndAscent, t1: tDep, fn: orbitState(Infinity), coast: true, skip: true });
      const burn = burnFrom(thDep, tDep);
      const tCut = burn.at(-1).t;
      const pCut = burn.at(-1).p;
      const vCut = burn.at(-1).v;
      ev("departure-burn", tDep, { body: "earth", stage: upper, dv_ms: Math.round(burnDv * 1000), duration_s: round(burnT, 1) });
      winSpace(tDep - 0.1, tDep + 0.5);
      if (depleted) ev("depleted", tCut, { body: "earth", stage: upper, stageIndex: upper, altitude_m: Math.round((len(pCut) - R.earth) * 1000), v_ms: Math.round(len(vCut) * 1000), dv_ms: Math.round(burnDv * 1000) });
      else ev("departure-cutoff", tCut, { body: "earth", stage: upper, dv_ms: Math.round(burnDv * 1000) });
      winSpace(tCut - 0.8, tCut + 0.25); // cutoff, and the spacecraft leaving the stage a moment later
      if (burnT >= 1) {
        pieces.push({
          name: "departure-burn",
          body: "earth",
          t0: tDep,
          t1: tCut,
          skip: true, // ignition and cutoff shown in real time, the burn between them a cut (round 22)
          fn: (t) => {
            const { p, v } = hermite(burn, t);
            const [i, j, u] = bracket(burn, t, "t");
            return { body: "earth", pos: p, vel: v, axis: unit(v), throttle: 1, burn: "departure", stageIndex: upper, mass_kg: lerp(burn[i].m, burn[j].m, u), phase: "departure-burn" };
          },
        });
      }
      // the spacecraft leaves the spent stage 0.2 s after cutoff (inside the cutoff's real-time window)
      const tSep = tCut + 0.2;
      // Earth missions follow the stage home; the others follow the spacecraft
      const homeBound = arrival.success && arrival.body === "earth";
      // round 23 (user order): at the Moon / Mars the vehicle that lands is the remaining stage with the payload on
      // top: no spacecraft separation; its mass and thrust drive the descent (model choice, est.)
      const stageLands = arrival.success && arrival.lands && arrival.body !== "earth";
      if (stageLands) {
        landerStage = upper;
        landerMass = mCut;
        landerThrust_N = F;
      }
      const craft = (t) => (stageLands ? { stageIndex: upper, mass_kg: mCut } : homeBound ? { stageIndex: upper, mass_kg: t < tSep ? mCut : mCut - (payload?.mass_kg ?? 0) } : { stageIndex: t < tSep ? upper : null, mass_kg: t < tSep ? mCut : payloadMass });
      if (!stageLands) ev("spacecraft-sep", tSep, { body: "space", stage: upper });
      const el = elements(pCut, vCut, MU.earth);
      const orbitOut = { apogee_km: Number.isFinite(el.apogee) ? round(el.apogee - R.earth, 0) : null, perigee_km: round(el.perigee - R.earth, 0), period_s: Number.isFinite(el.period) ? round(el.period, 0) : null };
      const coastPiece = (name, arc, extra = () => ({})) => (t) => {
        const { p, v } = hermite(arc, t);
        return { body: "space", pos: p, vel: v, axis: unit(v), throttle: 0, ...craft(t), phase: name, ...extra(t, p, v) };
      };
      const arcFrom = (done, tMax) => coast(pCut, vCut, MU.earth, done, tMax).map((x) => ({ ...x, t: x.t + tCut }));
      // the coast of a failed transfer: once around (out to apogee and back) when bound, else out to `far` km
      const failedCoast = (far) => {
        const arc = el.bound && el.period < 60 * 86400 ? arcFrom(() => false, el.period) : arcFrom((p) => len(p) >= far, 30 * 86400);
        const iTop = arc.reduce((k, x, i) => (len(x.p) > len(arc[k].p) ? i : k), 0);
        if (el.bound && iTop > 0 && iTop < arc.length - 1) ev("apogee", arc[iTop].t, { body: "space", apogee_km: orbitOut.apogee_km });
        pieces.push({ name: "coast", body: "space", t0: tCut, t1: arc.at(-1).t, fn: coastPiece("coast", arc), coast: true, skip: true });
        return arc.at(-1).t;
      };
      const fail = (line, tEnd) => {
        shareKey = "failed";
        // the beat where the failure shows: the burn running dry, or the Moon passing by
        ev("transfer-failed", events.find((x) => x.type === "moon-flyby")?.t_sim ?? tCut, { body: "space", shortBy_ms: shortBy, apogee_km: orbitOut.apogee_km });
        endState = end("transfer-failed", line, { body: arrival.body, shortBy_ms: shortBy, ...orbitOut });
        ev("end", tEnd, { body: "space" });
      };
      const apo = orbitOut.apogee_km == null ? "escapes Earth" : `apogee ${num(orbitOut.apogee_km)} km`;
      const omM = (2 * Math.PI) / MOON_PERIOD_S;
      const placeMoon = (alpha, tAt) => {
        const moonPos = (t) => mul(rHat(alpha + omM * (t - tAt)), MOON_DIST);
        const moonVel = (t) => mul(tHat(alpha + omM * (t - tAt)), MOON_DIST * omM);
        bodies.moon = { radius_km: R.moon, distance_km: MOON_DIST, period_days: MOON_PERIOD_DAYS, pos_km_at_arrival: r3(moonPos(tAt)) };
        bodyPos = (body, t) => (body === "earth" ? [0, 0, 0] : body === "moon" ? moonPos(t) : null);
        return { moonPos, moonVel };
      };
      const rLo = R.moon + LUNAR_ORBIT_ALT;
      const rArr = MOON_DIST - rLo;

      if (arrival.body === "earth") {
        if (arrival.success) {
          // GTO: the stage coasts out to the transfer orbit's apogee with the payload gone, de-orbits there and
          // comes down where its arc ends (a drone ship)
          shareKey = "gto";
          const arc = toApogee(burn);
          pieces.push({ name: "transfer", body: "space", t0: tCut, t1: arc.at(-1).t, fn: coastPiece("transfer", arc), coast: true, skip: true });
          ev("apogee", arc.at(-1).t, { body: "space", apogee_km: orbitOut.apogee_km });
          const plan = returnPlan(arc.at(-1).t, arc.at(-1).p, arc.at(-1).v, homeMass, homeProp);
          landHome(plan, "drone-ship", `${arrival.lines.at(-1)} Apogee ${num(orbitOut.apogee_km)} km (est.).`);
        } else {
          const geo = mission.id === "gto" && el.apogee < GEO_R ? ` (GEO is ${num(GEO_R - R_EQ)} km)` : "";
          fail(`Transfer failed · short by ${num(shortBy)} m/s · ${apo}${geo} · falls back toward Earth (est.)`, failedCoast(ESCAPE_SHOW_KM));
        }
      } else if (arrival.body === "moon") {
        if (!arrival.success && depleted) {
          // the Moon stays where a full departure burn would have met it
          const nominal = coast(mul(rHat(thDep), r0), mul(tHat(thDep), vc + departure), MU.earth, (p) => len(p) >= rArr, 30 * 86400);
          placeMoon(planeAngle(nominal.at(-1).p), tDep + nominal.at(-1).t);
          const tail = el.apogee < MOON_DIST ? "falls back toward Earth" : "misses the Moon";
          fail(`Transfer failed · short by ${num(shortBy)} m/s · ${apo} · ${tail} (est.)`, failedCoast(2 * MOON_DIST));
        } else if (!arrival.success) {
          // departure complete, insertion short (lunar orbit): it crosses the Moon's orbit just ahead of the Moon
          // and flies on (the Moon's own gravity is not modelled)
          const arc = arcFrom((p) => len(p) >= 1.5 * MOON_DIST, 30 * 86400);
          const k = arc.findIndex((x) => len(x.p) >= MOON_DIST);
          const tX = arc[k].t;
          const { moonPos } = placeMoon(planeAngle(arc[k].p) + (R.moon + FLYBY_ALT) / MOON_DIST, tX);
          pieces.push({ name: "transfer", body: "space", t0: tCut, t1: tX, fn: coastPiece("transfer", arc), coast: true, skip: true });
          pieces.push({ name: "coast", body: "space", t0: tX, t1: arc.at(-1).t, fn: coastPiece("coast", arc), coast: true, skip: true });
          ev("moon-flyby", tX, { body: "space", distance_km: Math.round(len(sub(arc[k].p, moonPos(tX))) - R.moon) });
          fail(`Transfer failed · short by ${num(shortBy)} m/s for lunar orbit insertion · flies past the Moon (est.)`, arc.at(-1).t);
        } else {
          shareKey = arrival.lands ? "moon" : "moon-orbit";
          const arc = arcFrom((p) => len(p) >= rArr, 30 * 86400);
          const tArr = arc.at(-1).t;
          const alpha = planeAngle(arc.at(-1).p);
          const { moonPos, moonVel } = placeMoon(alpha, tArr);
          pieces.push({ name: "transfer", body: "space", t0: tCut, t1: tArr, fn: coastPiece("transfer", arc, (t) => (Math.abs(t - tArr) <= BURN_CUE_S ? { throttle: 1, burn: "insertion" } : {})), coast: true, skip: true });
          // circular 15 km lunar orbit in the flight plane, from the Earth-facing side, turning the way the
          // spacecraft arrives
          const u1 = mul(rHat(alpha), -1);
          const vRel = sub(arc.at(-1).v, moonVel(tArr));
          let u2 = sub(vRel, mul(u1, dot(vRel, u1)));
          u2 = len(u2) > 1e-6 ? unit(u2) : unit(cross(H_PLANE, u1));
          const vLo = Math.sqrt(MU.moon / rLo);
          const omLo = vLo / rLo;
          const tPdi = tArr + Math.PI / 2 / omLo;
          const ring = (beta, r) => add(mul(u1, r * Math.cos(beta)), mul(u2, r * Math.sin(beta)));
          const ringV = (beta, v) => add(mul(u1, -v * Math.sin(beta)), mul(u2, v * Math.cos(beta)));
          ev("lunar-orbit-insertion", tArr, { body: "moon" });
          winSpace(tArr - 0.5, tArr + 0.5);
          const loState = (t) => {
            const beta = omLo * (t - tArr);
            const rel = ring(beta, rLo);
            const relV = ringV(beta, vLo);
            const b = Math.abs(t - tArr) <= BURN_CUE_S ? "insertion" : null;
            return { body: "moon", pos: rel, posEci: add(moonPos(t), rel), vel: relV, velEci: add(relV, moonVel(t)), axis: mul(unit(relV), -1), throttle: b ? 1 : 0, burn: b, stageIndex: landerStage, mass_kg: landerMass, phase: "lunar-orbit" };
          };
          // a lander's quarter orbit to PDI is a cut (its retrograde attitude turns 90 deg with it, round 27c); an
          // orbiter's ending stays a shot of it in orbit (steady in the local frame)
          pieces.push({ name: "lunar-orbit", body: "moon", t0: tArr, t1: tPdi, fn: loState, coast: true, ...(arrival.lands ? { skip: true } : {}) });
          if (arrival.lands) {
            const tEnd = addDescent(descentTimeline(payload, { body: "moon" }), "moon", tPdi, Math.PI / 2, u1, u2, moonPos, moonVel);
            endState = end("landed", `Upper stage landed on the Moon with ${payloadName} on top · est.`, { body: "moon", landing: landerRecord() });
            ev("end", tEnd, { body: "moon" });
          } else {
            endState = end("in-orbit-of", arrival.lines.at(-1), { body: "moon" });
            ev("end", tPdi, { body: "moon" });
          }
        }
      } else {
        // Mars: a straight line along the cutoff velocity, its speed eased (the distance integrates the speed exactly);
        // Mars sits 2,000,000 km down it (not to scale)
        const dHat = unit(vCut);
        const w0 = unit(sub(pCut, mul(dHat, dot(pCut, dHat))));
        const v0 = len(vCut);
        const lineState = (vInf, vEnd, T2) => {
          const s1 = (EASE_S * (v0 + vInf)) / 2;
          const along = (t) => {
            const x = t - tCut;
            if (x <= EASE_S) {
              const u = x / EASE_S;
              return { s: EASE_S * (v0 * u + (vInf - v0) * (u ** 3 - u ** 4 / 2)), v: lerp(v0, vInf, smooth(u)) };
            }
            if (x <= EASE_S + T2 || vEnd == null) return { s: s1 + vInf * (x - EASE_S), v: vInf };
            const u = Math.min(1, (x - EASE_S - T2) / EASE_S);
            return { s: s1 + vInf * T2 + EASE_S * (vInf * u + (vEnd - vInf) * (u ** 3 - u ** 4 / 2)), v: lerp(vInf, vEnd, smooth(u)) };
          };
          return (b) => (t) => {
            const { s: d, v } = along(t);
            const cue = b && Math.abs(t - b) <= BURN_CUE_S ? "insertion" : null;
            return { body: "space", pos: add(pCut, mul(dHat, d)), vel: mul(dHat, v), axis: dHat, throttle: cue ? 1 : 0, burn: cue, ...craft(t), phase: "transfer" };
          };
        };
        const vInfFull = Math.sqrt(Math.max(0.01, (vc + departure) ** 2 - (2 * MU.earth) / r0));
        const placeMars = (gamDeg, rEnd) => {
          const gam = gamDeg * rad;
          const up = add(mul(dHat, Math.sin(gam)), mul(w0, Math.cos(gam)));
          const marsC = sub(add(pCut, mul(dHat, MARS_LINE_KM)), mul(up, rEnd));
          bodies.mars = { radius_km: R.mars, pos_km: r3(marsC), scaled: true, note: "placed 2,000,000 km down the departure line: not to scale" };
          bodyPos = (body) => (body === "earth" ? [0, 0, 0] : body === "mars" ? marsC : null);
          return { up, marsC };
        };
        if (!arrival.success) {
          placeMars(0, R.mars + MARS_ORBIT_ALT);
          if (el.bound) fail(`Transfer failed · missed Mars by ${num(shortBy)} m/s · ${apo} · falls back toward Earth (est.)`, failedCoast(2 * MOON_DIST));
          else {
            // escaped Earth too slowly: the line stops short in proportion to the hyperbolic excess speed
            const L = MARS_LINE_KM * Math.min(1, el.vInf / vInfFull);
            const s1 = (EASE_S * (v0 + el.vInf)) / 2;
            const tEnd = tCut + EASE_S * Math.min(1, L / s1) + Math.max(0, (L - s1) / el.vInf);
            pieces.push({ name: "coast", body: "space", t0: tCut, t1: tEnd, fn: lineState(el.vInf, null, Infinity)(null), coast: true, skip: true });
            fail(`Transfer failed · missed Mars by ${num(shortBy)} m/s · adrift in space (est.)`, tEnd);
          }
        } else {
          shareKey = arrival.lands ? "mars" : "mars-orbit";
          const vInf = Math.sqrt(Math.max(0.01, v0 * v0 - (2 * MU.earth) / len(pCut)));
          const s1 = (EASE_S * (v0 + vInf)) / 2;
          const s3 = (EASE_S * (vInf + MARS_ENTRY_SPEED)) / 2;
          const T2 = Math.max(3600, (MARS_LINE_KM - s1 - s3) / vInf);
          const tEi = tCut + 2 * EASE_S + T2;
          const rEnd = R.mars + (arrival.lands ? MARS_ENTRY_ALT : MARS_ORBIT_ALT);
          // the line's end, s1 + vInf T2 + s3 down the line, is the entry (or insertion) point
          const Lline = s1 + vInf * T2 + s3;
          const gam = (arrival.lands ? MARS_ENTRY_GAMMA : 0) * rad;
          const up = add(mul(dHat, Math.sin(gam)), mul(w0, Math.cos(gam)));
          const marsC = sub(add(pCut, mul(dHat, Lline)), mul(up, rEnd));
          bodies.mars = { radius_km: R.mars, pos_km: r3(marsC), scaled: true, note: "placed 2,000,000 km down the departure line: not to scale" };
          bodyPos = (body) => (body === "earth" ? [0, 0, 0] : body === "mars" ? marsC : null);
          pieces.push({ name: "transfer", body: "space", t0: tCut, t1: tEi, fn: lineState(vInf, MARS_ENTRY_SPEED, T2)(arrival.lands ? null : tEi), coast: true, skip: true });
          const u1 = up;
          const u2 = unit(sub(dHat, mul(u1, dot(dHat, u1))));
          if (arrival.lands) {
            ev("entry-interface", tEi, { body: "mars" });
            winSpace(tEi - 0.5, tEi + 0.5);
            const descent = descentTimeline(payload, { body: "mars" });
            marsEntry = descent.entry ?? null;
            const tEnd = addDescent(descent, "mars", tEi, 0, u1, u2, () => marsC, () => [0, 0, 0]);
            endState = end("landed", `Upper stage landed on Mars with ${payloadName} on top · est.`, { body: "mars", landing: landerRecord() });
            ev("end", tEnd, { body: "mars" });
          } else {
            const vO = Math.sqrt(MU.mars / rEnd);
            const omO = vO / rEnd;
            const tEnd = tEi + Math.PI / 2 / omO;
            ev("mars-orbit-insertion", tEi, { body: "mars" });
            winSpace(tEi - 0.5, tEi + 0.5);
            const moState = (t) => {
              const beta = omO * (t - tEi);
              const rel = add(mul(u1, rEnd * Math.cos(beta)), mul(u2, rEnd * Math.sin(beta)));
              const relV = add(mul(u1, -vO * Math.sin(beta)), mul(u2, vO * Math.cos(beta)));
              const b = Math.abs(t - tEi) <= BURN_CUE_S ? "insertion" : null;
              return { body: "mars", pos: rel, posEci: add(marsC, rel), vel: relV, axis: mul(unit(relV), -1), throttle: b ? 1 : 0, burn: b, stageIndex: null, mass_kg: payloadMass, phase: "mars-orbit" };
            };
            pieces.push({ name: "mars-orbit", body: "mars", t0: tEi, t1: tEnd, fn: moState, coast: true });
            endState = end("in-orbit-of", arrival.lines.at(-1), { body: "mars" });
            ev("end", tEnd, { body: "mars" });
          }
        }
      }
      const sepState = pieces.find((p) => tSep >= p.t0 && tSep <= p.t1)?.fn(tSep) ?? ascentState(tEndAscent);
      if (!stageLands) stageDrops.push(homeBound ? dropAway("spacecraft-sep", upper, tSep, sepState, PAYLOAD_OFF, { part: "payload" }) : dropAway("spacecraft-sep", upper, tSep, sepState, undefined, { part: "stage" }));
    }
  }

  // arrival.js descent samples -> body-centred states on the circle (u1, u2), beta0 = arc angle already flown
  function addDescent(d, body, t0, beta0, u1, u2, centre, centreVel) {
    const DS = d.samples;
    const T = DS.at(-1).t_s;
    const names = d.phases.map((p) => p.name);
    const starts = names.map((nm) => t0 + DS.find((x) => x.phase === nm).t_s);
    const posAt = (x) => {
      const [i, j, u] = bracket(DS, x, "t_s");
      const a = DS[i];
      const b = DS[j];
      const r = R[body] + lerp(a.alt_m, b.alt_m, u) / 1000;
      const beta = beta0 + lerp(a.downrange_m, b.downrange_m, u) / 1000 / R[body];
      return { pos: add(mul(u1, r * Math.cos(beta)), mul(u2, r * Math.sin(beta))), a, b, u, beta };
    };
    // the throttle the landing vehicle needs to fly the profile: (its acceleration + gravity) x mass / its thrust
    // (round 23: the stage + payload; without a stage thrust, arrival.js's throttle shape)
    const gBody = MU[body] / R[body] ** 2; // km/s^2
    const velAt = (x) => {
      const x2 = Math.min(T, x + 0.5);
      const x1 = Math.max(0, x - 0.5);
      return x2 > x1 ? mul(sub(posAt(x2).pos, posAt(x1).pos), 1 / (x2 - x1)) : [0, 0, 0];
    };
    const throttleAt = (x, a, b, u, up) => {
      const shape = lerp(a.throttle, b.throttle, u);
      if (!(shape > 0) || !(landerThrust_N > 0) || !(landerMass > 0)) return shape;
      // over +-6 s: the descent samples are up to ~8 s apart in the braking burn
      const xa = Math.max(0, x - 6);
      const xb = Math.min(T, x + 6);
      const acc = xb > xa ? mul(sub(velAt(xb), velAt(xa)), 1 / (xb - xa)) : [0, 0, 0]; // km/s^2
      const need = len(add(acc, mul(up, gBody))) * 1000 * landerMass; // N
      return Math.max(0.05, Math.min(1, need / landerThrust_N));
    };
    const descentState = (t) => {
      const x = Math.max(0, Math.min(T, t - t0));
      const { pos, a, b, u, beta } = posAt(x);
      const x2 = Math.min(T, x + 0.5);
      const x1 = Math.max(0, x - 0.5);
      const vel = x2 > x1 ? mul(sub(posAt(x2).pos, posAt(x1).pos), 1 / (x2 - x1)) : [0, 0, 0];
      const f = surfaceFrame(body, pos);
      const hz = sub(vel, mul(f.up, dot(vel, f.up)));
      const along = add(mul(u1, -Math.sin(beta)), mul(u2, Math.cos(beta))); // the ground track, downrange
      const hdir = len(hz) > 1e-6 ? unit(hz) : along;
      const pitch = lerp(a.pitch_deg, b.pitch_deg, u) * rad;
      const unpowered = a.phase === "entry" || a.phase === "parachute";
      // powered: thrust axis tilted back against the motion by the descent pitch; entry and chute: against the flow
      const axis = unpowered ? (len(vel) > 1e-6 ? mul(unit(vel), -1) : f.up) : unit(sub(mul(f.up, Math.cos(pitch)), mul(hdir, Math.sin(pitch))));
      return {
        body,
        pos,
        posEci: add(centre(t), pos),
        vel,
        velEci: add(vel, centreVel(t)),
        axis,
        throttle: throttleAt(x, a, b, u, f.up),
        stageIndex: landerStage,
        mass_kg: landerMass,
        heat: lerp(a.heat, b.heat, u),
        chute: lerp(a.chute ?? 0, b.chute ?? 0, u),
        dust: lerp(a.dust, b.dust, u),
        phase: x >= T ? "touchdown" : a.phase,
        frame: { up: f.up, along }, // for the attitude slew (round 27c)
      };
    };
    names.forEach((nm, i) => {
      const t1 = i + 1 < names.length ? starts[i + 1] : t0 + T;
      pieces.push({ name: nm, body, t0: starts[i], t1, fn: descentState, descent: true });
    });
    for (const m of d.moments) ev(m.type, t0 + m.t_s, { body, alt_m: m.alt_m, vel_ms: m.vel_ms });
    // the parachute and the final powered descent, by name (round 22): Mars' chute; the landing burn starts with
    // the powered descent (the Moon's braking burn; on Mars after the chute is released)
    const open = d.moments.find((m) => m.type === "chute-open");
    if (open) ev("chute-deploy", t0 + open.t_s, { body, alt_m: open.alt_m, vel_ms: open.vel_ms });
    const powered = names.find((nm) => nm === "braking" || nm === "approach");
    if (powered) ev("landing-burn-start", starts[names.indexOf(powered)], { body });
    const chute = d.moments.find((m) => m.type === "chute-open");
    if (chute) win(t0 + chute.t_s - 1, t0 + chute.t_s + 1);
    win(t0 + T - 3, t0 + T);
    return t0 + T;
  }

  // ---- round 27d: one cut after the climb. Every skip after the ascent, and everything between them, becomes one
  // skip ("cruise"): Moon / Mars from SECO straight to PDI / the entry interface (or into the orbit); a failed
  // transfer to FAIL_LEAD_S before its failing beat, the timeline ending FAIL_TAIL_S after it. The skipped beats
  // keep their events (HUD, result text), at the cut's screen time; windows inside it go.
  {
    const failAt = endState?.type === "transfer-failed" ? events.find((e) => e.type === "transfer-failed")?.t_sim : null;
    if (failAt != null) {
      // the timeline ends a moment after the failing beat (the coast after it, hours long, is the result text)
      const tEndNew = failAt + FAIL_TAIL_S;
      for (let i = pieces.length - 1; i >= 1; i--) {
        if (pieces[i].t0 >= tEndNew) pieces.splice(i, 1);
        else if (pieces[i].t1 > tEndNew) pieces[i].t1 = tEndNew;
      }
      for (let i = events.length - 1; i >= 0; i--) if (events[i].t_sim > tEndNew + 1e-6 && events[i].type !== "end") events.splice(i, 1);
      const endEv = events.find((e) => e.type === "end");
      if (endEv) endEv.t_sim = round(tEndNew, 3);
      for (let i = stageDrops.length - 1; i >= 0; i--) if (stageDrops[i].t_sim > tEndNew) stageDrops.splice(i, 1);
      win(failAt - FAIL_LEAD_S, tEndNew, LAMBDA_SPACE); // the failing beat in real time
    }
    const after = pieces.slice(1);
    const i0 = after.findIndex((p) => p.skip);
    if (i0 >= 0) {
      const i1 = failAt != null ? after.length - 1 : after.length - 1 - [...after].reverse().findIndex((p) => p.skip);
      const r0 = after[i0].t0;
      const r1 = failAt != null ? Math.max(r0, failAt - FAIL_LEAD_S) : after[i1].t1;
      if (r1 - r0 > 1) {
        // the pieces in [r0, r1] (a piece across r1 is split: its drawn rest keeps its name)
        const inner = [];
        const out = [pieces[0]];
        for (const p of after) {
          if (p.t0 >= r1 - 1e-9 && failAt != null) out.push({ ...p, skip: false }); // the failing beat is drawn
          else if (p.t1 <= r0 + 1e-9 || p.t0 >= r1 - 1e-9) out.push(p);
          else if (p.t1 <= r1 + 1e-9) inner.push(p);
          else {
            inner.push({ ...p, t1: r1 });
            out.push({ ...p, t0: r1, skip: false });
          }
        }
        const cruiseFn = (t) => {
          const q = inner.find((x) => t <= x.t1 + 1e-9) ?? inner.at(-1);
          return q.fn(Math.max(q.t0, Math.min(q.t1, t)));
        };
        const k = out.findIndex((p) => p.t0 >= r1 - 1e-9);
        out.splice(k < 0 ? out.length : k, 0, { name: "cruise", body: "space", t0: r0, t1: r1, fn: cruiseFn, coast: true, skip: true });
        pieces.splice(0, pieces.length, ...out.sort((a, b) => a.t0 - b.t0));
        for (let i = windows.length - 1; i >= 0; i--) {
          const w = windows[i];
          if (w[0] >= r0 - 1e-9 && w[1] <= r1 + 1e-9) windows.splice(i, 1);
          else if (w[0] < r1 && w[1] > r1) w[0] = r1; // e.g. the entry interface: shown from the cut on
        }
      }
    }
  }

  // coasts turn, over their last quarter, to the attitude the next piece starts with
  for (let i = 0; i < pieces.length - 1; i++) {
    const p = pieces[i];
    if (!p.coast) continue;
    const next = pieces[i + 1];
    const target = next.fn(next.t0).axis;
    const raw = p.fn;
    const span = (p.t1 - p.t0) * TURN_FRACTION;
    p.fn = (t) => {
      const st = raw(t);
      return { ...st, axis: turn(st.axis, target, smooth((t - (p.t1 - span)) / span)) };
    };
  }

  // ---- the clock: every boundary sits in a real-time window, so the rate is continuous across segments
  for (let i = 1; i < pieces.length; i++) {
    // each side of a boundary ramps as its own segment does: fast in space, gentle in the air; a skip side gets no
    // window (it is a cut)
    const lam = (piece) => (SPACE_SEGMENTS.has(piece.name) ? LAMBDA_SPACE : LAMBDA);
    const [L, Rr] = [pieces[i - 1], pieces[i]];
    if (L.skip && Rr.skip) continue;
    win(pieces[i].t0 - (L.skip ? 0 : 0.3), pieces[i].t0 + (Rr.skip ? 0 : 0.3), lam(L), lam(Rr));
  }
  const failed = pieces.length === 1;
  const share = SHARE[shareKey];
  const sumShare = failed ? FAILED_ASCENT_S : pieces.reduce((a, p) => a + (share[p.name] ?? 0), 0);
  // a requested total scales the shown segments; the cuts stay cuts
  const skipShare = failed ? 0 : pieces.filter((p) => p.skip).reduce((a, p) => a + (share[p.name] ?? 0), 0);
  const scale = ((opts.totalScreen_s ?? sumShare) - skipShare) / (sumShare - skipShare);
  const segs = pieces.map((p) => ({ t0: p.t0, t1: p.t1, skip: Boolean(p.skip), budget: (failed ? FAILED_ASCENT_S : share[p.name] ?? 1) * (p.skip ? 1 : scale) }));
  // round 27: every ramp that reaches into the first FIRST_GENTLE_S on screen is GENTLE (a lambda ramp into a
  // window takes ~1-1.5 s from the climb's speed: 2 s of reach). A gentler ramp moves the beats after it, so the
  // choice is made again on the new clock until it settles (if it flips back and forth, the gentler of the two).
  const own = windows.map((w) => [w[2], w[3]]);
  const pick = (c, prev) =>
    windows.map((w, i) => [
      (prev?.[i][0] ?? false) || c.simToScreen(w[0]) < FIRST_GENTLE_S + 2,
      own[i][1] === GENTLE || (prev?.[i][1] ?? false) || c.simToScreen(w[1]) < FIRST_GENTLE_S,
    ]);
  const apply = (flags) => windows.forEach((w, i) => ((w[2] = flags[i][0] ? GENTLE : own[i][0]), (w[3] = flags[i][1] ? GENTLE : own[i][1])));
  let clock = buildClock(segs, windows);
  let flags = pick(clock);
  for (let pass = 0; pass < 6; pass++) {
    apply(flags);
    clock = buildClock(segs, windows);
    const next = pick(clock);
    if (JSON.stringify(next) === JSON.stringify(flags)) break;
    flags = pass < 4 ? next : pick(clock, flags); // settle by union if it keeps flipping
  }

  for (const e of events) e.t_screen = round(clock.simToScreen(e.t_sim), 3);
  events.sort((a, b) => a.t_sim - b.t_sim);
  // never a drop for a part the scene does not have (Head 1: a missing part must not reach the director)
  for (let i = stageDrops.length - 1; i >= 0; i--) {
    const d = stageDrops[i];
    if (!parts.has(d.part) || (d.part === "stage" && !(d.stageIndex < stageCount))) stageDrops.splice(i, 1);
  }
  for (const d of stageDrops) d.t_screen = round(clock.simToScreen(d.t_sim), 3);
  const segments = pieces.map((p) => ({ name: p.name, body: p.body, ...(p.skip ? { skip: true } : {}), t0_sim: round(p.t0, 3), t1_sim: round(p.t1, 3), t0_screen: round(clock.simToScreen(p.t0), 3), t1_screen: round(clock.simToScreen(p.t1), 3) }));
  // the cuts (round 22): the director can cut (or fade) across each; the vehicle's state still moves continuously
  for (const [a, b] of clock.skips) {
    const sg = pieces.find((x) => x.skip && a >= x.t0 - 1e-6 && a < x.t1);
    events.push({ type: "time-skip", t_sim: round(a, 3), to_t_sim: round(b, 3), t_screen: round(clock.simToScreen(a), 3), to_t_screen: round(clock.simToScreen(b), 3), segment: sg?.name ?? null, body: sg?.body ?? "space" });
  }
  events.sort((a, b) => a.t_sim - b.t_sim);

  const pieceAt = (t) => pieces.find((x) => t >= x.t0 && t <= x.t1) ?? (t < pieces[0].t0 ? pieces[0] : pieces.at(-1));
  // round 27c: a landing's drawn attitude slews at most SLEW_DEG_S per screen second toward the modelled one, in
  // the frame (along the ground track, across it, up), from the descent's first frame (after the cut into it)
  const landing = pieces.filter((p) => p.descent);
  if (landing.length) {
    const tau0 = clock.simToScreen(landing[0].t0);
    const tau1 = clock.simToScreen(landing.at(-1).t1);
    const H = 1 / 120;
    const n = Math.max(1, Math.ceil((tau1 - tau0) / H));
    const raw = landing.map((p) => p.fn);
    const rawAt = (t) => {
      const i = Math.max(0, landing.findIndex((p) => t <= p.t1 + 1e-9));
      return raw[i](Math.max(landing[i].t0, Math.min(landing[i].t1, t)));
    };
    const toLocal = (st) => {
      const { up, along } = st.frame;
      const across = unit(cross(up, along));
      return [dot(st.axis, along), dot(st.axis, across), dot(st.axis, up)];
    };
    const maxStep = SLEW_DEG_S * rad * H;
    const drawn = [toLocal(rawAt(landing[0].t0))];
    for (let i = 1; i <= n; i++) {
      const want = toLocal(rawAt(clock.screenToSim(Math.min(tau1, tau0 + i * H))));
      const a = drawn[i - 1];
      const th = Math.atan2(len(cross(a, want)), dot(a, want));
      if (th <= maxStep) drawn.push(want);
      else {
        const k = maxStep / th;
        drawn.push(unit(add(mul(a, Math.sin((1 - k) * th) / Math.sin(th)), mul(want, Math.sin(k * th) / Math.sin(th)))));
      }
    }
    const drawnAt = (t) => {
      const x = Math.max(0, Math.min(n, (clock.simToScreen(t) - tau0) / H));
      const i = Math.min(n - 1, Math.floor(x));
      return unit(add(mul(drawn[i], 1 - (x - i)), mul(drawn[i + 1] ?? drawn[i], x - i)));
    };
    landing.forEach((p, j) => {
      p.fn = (t) => {
        const st = raw[j](t);
        const c = drawnAt(t);
        const { up, along } = st.frame;
        return { ...st, axis: unit(add(add(mul(along, c[0]), mul(unit(cross(up, along)), c[1])), mul(up, c[2]))) };
      };
    });
  }
  const dest = kind !== "earth" && bodies[kind] ? kind : null;
  const describe = (st, t, ts, segment, destPos) => {
    const frameBody = st.body === "space" ? "earth" : st.body;
    const f = surfaceFrame(frameBody, st.pos);
    const pitch = (Math.acos(Math.max(-1, Math.min(1, dot(st.axis, f.up)))) * 180) / Math.PI;
    // heading of the axis; straight up (or down) it has none, so use the direction of travel in the flight plane
    const level = sub(st.axis, mul(f.up, dot(st.axis, f.up)));
    const head = len(level) > 1e-3 ? level : tHat(planeAngle(st.pos));
    const yaw = (Math.atan2(dot(head, f.east), dot(head, f.north)) * 180) / Math.PI;
    return {
      t_sim: t, // story time (round 24: the booster's final descent runs after the release; t_vehicle is its own time)
      t_vehicle: st.tVehicle ?? t,
      t_screen: ts,
      body: st.body,
      segment,
      phase: st.phase,
      stageIndex: st.stageIndex,
      pos_km: r3(st.pos), // body-centred ("space": Earth-centred)
      pos_eci_km: r3(st.posEci ?? st.pos), // always Earth-centred
      vel_kms: r6(st.vel), // relative to the current body
      vel_eci_kms: r6(st.velEci ?? st.vel),
      dest_eci_km: destPos ? r3(destPos) : null, // the destination's centre (Moon moving, Mars fixed), Earth-centred
      speed_ms: round(len(st.vel) * 1000, 1),
      alt_km: round(altitude(frameBody, st.pos), 3),
      axis: r3(st.axis), // the vehicle's long axis (nose / thrust direction), unit, same frame as pos_km
      pitch_deg: round(pitch, 1), // 0 = straight up
      yaw_deg: round((yaw + 360) % 360, 1), // 0 = north, 90 = east
      throttle: round(st.throttle, 3),
      burn: st.burn ?? null,
      mass_kg: st.mass_kg == null ? null : Math.round(st.mass_kg),
      chute: round(st.chute ?? 0, 3),
      heat: round(st.heat ?? 0, 3),
      alpha_deg: round(st.alpha_deg ?? 0, 1), // a lost flight's tumble (angle of attack), else 0
      brokenUp: Boolean(st.brokenUp), // after a lost flight's breakup
      dust: round(st.dust ?? 0, 3),
    };
  };
  const sampleAt = (tScreen) => {
    const ts = Math.max(0, Math.min(clock.total, tScreen));
    const t = clock.screenToSim(ts);
    const piece = pieceAt(t);
    const st = piece.fn(Math.max(piece.t0, Math.min(piece.t1, t)));
    return describe(st, t, ts, piece.name, dest ? bodyPos(dest, t) : null);
  };
  // the booster's final descent on its own clock (same budget and real-time windows as its sequential segment),
  // so the director can play it after the cut or beside the upper stage (opts.boosterInset)
  let booster = null;
  if (boosterTrack) {
    const { state, windows: bWindows, beats, startSim, tB0, tDown, ...track } = boosterTrack;
    const bClock = buildClock([{ t0: tB0, t1: tDown, skip: false, budget: share[track.inset ? "payload-release" : "booster-descent"] * scale }], bWindows);
    const start = clock.simToScreen(startSim);
    const local = (tl) => Math.max(0, Math.min(bClock.total, tl));
    booster = {
      ...track,
      start_screen: round(start, 3),
      duration_s: round(bClock.total, 3),
      end_screen: round(start + bClock.total, 3),
      sampleAt: (tLocal) => {
        const tl = local(tLocal);
        const ts = Math.min(clock.total, start + tl);
        return { t_local: tl, ...describe(state(bClock.screenToSim(tl) + track.shift), clock.screenToSim(ts), ts, "booster-descent", null) };
      },
      beats: beats.map((b) => {
        const tl = round(bClock.simToScreen(b.t_vehicle), 3);
        return { ...b, t_local: tl, t_screen: round(start + tl, 3) };
      }),
    };
  }

  return {
    outcome: s.outcome,
    kind,
    endState,
    bodies,
    bodyPosAt: (body, t) => {
      const p = bodyPos(body, t);
      return p ? r3(p) : null;
    },
    segments,
    events,
    stageDrops,
    sampleAt,
    screenToSim: clock.screenToSim,
    simToScreen: clock.simToScreen,
    surfaceFrame,
    totalScreen_s: round(clock.total, 3),
    totalSim_s: round(pieces.at(-1).t1, 3),
    arrival,
    // for flightSummaryText: the parking orbit (ascent.js) and the highest / fastest point of the ascent
    parking: inOrbit ? { perigee_km: round(s.perigee_km, 1), apogee_km: Number.isFinite(s.apogee_km) ? round(s.apogee_km, 1) : null, t_sim: round(tEndAscent, 1) } : null,
    peak: { alt_km: round(Math.max(...AS.map((x) => x.alt_m)) / 1000, 1), speed_ms: Math.round(Math.max(...AS.map((x) => x.vel_ms))) },
    mission: mission?.id ?? null,
    calibration: s.calibration ?? null, // ascent.js: how the trajectory was made to agree with the verdict (est.)
    // round 23: the first stage's return (Earth missions; the main track follows it after staging), the upper
    // stage's events after the staging beat (off screen: result text), and the upper stage during the staging
    booster,
    entry: marsEntry, // Mars landings: the aeroshell and parachute arrival.js models (sizes are model choices)
    _cuts: storyCuts,
    upper: upperStory,
    upperEvents,
    upperAt: (ts) => {
      const t = clock.screenToSim(Math.max(0, Math.min(clock.total, ts)));
      const st = ascentState(Math.min(tEndAscent, t));
      return { t_sim: t, pos_eci_km: r3(st.pos), vel_eci_kms: r6(st.vel), axis: r3(st.axis), throttle: round(st.throttle, 3), stageIndex: st.stageIndex };
    },
    payload: payload ? { id: payload.id, archetype: catalog.visuals?.payloads?.[payload.id]?.archetype ?? null } : null,
    _clock: clock, // for checks
    est: true,
  };
}

// What happened, in plain words, from the timeline's own numbers (UI 3: the headline for the HUD, the sentences
// for the result card and the "assembly:report" bridge event, so the narration tells the real outcome).
//   flightSummaryText(timeline) -> { headline, sentences: [2-3 short sentences] }
// Every sentence that quotes a modelled number ends "(est.)".
const BODY_NAME = { earth: "Earth", moon: "the Moon", mars: "Mars" };
const MISSION_PAYLOAD = { leo: "low Earth orbit", gto: "GTO", "earth-escape": "an escape from Earth" };
const MISSION_SHORT = { leo: "LEO", gto: "GTO", "earth-escape": "Earth escape", "moon-transfer": "Moon transfer", "lunar-orbit": "lunar orbit", "mars-transfer": "Mars transfer" };
const MISSION_NAME = { leo: "Low Earth orbit", gto: "Geostationary transfer orbit", "earth-escape": "Earth escape", "moon-transfer": "Moon transfer", "lunar-orbit": "Lunar orbit", "mars-transfer": "Mars transfer" };
export const GEO_ALT_KM = Math.round(GEO_R - R_EQ);
const tPlus = (t) => `T+${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const est = (text) => `${text} (est.).`;
export function flightSummaryText(f) {
  const e = f.endState;
  const at = (type) => f.events?.find((x) => x.type === type);
  if (f.blocked || e.type === "aborted") {
    return f.blocked
      ? { headline: e.line, sentences: [`The design check stopped the launch: ${f.reason}.`, "Nothing left the pad."] }
      : { headline: "Pad abort", sentences: [est("The engines lit but their thrust never beat the rocket's weight"), "The hold-downs stayed shut and nothing left the pad."] };
  }
  const out = [];
  const p = f.parking;
  if (p) out.push(est(`Reached a ${num(p.perigee_km)} × ${p.apogee_km == null ? "escape" : num(p.apogee_km)} km parking orbit at ${tPlus(p.t_sim)}`));
  const dep = at("departure-burn");
  const dry = at("depleted");
  const apo = at("apogee");
  const days = (name) => {
    const g = f.segments.find((x) => x.name === name);
    return g ? (g.t1_sim - g.t0_sim) / 86400 : null;
  };
  const mission = MISSION_NAME[f.mission] ?? "The mission";
  if (e.type === "lost") {
    const i = e.impact;
    return {
      headline: "Lost · never reached orbit",
      sentences: [
        ...(e.orbitShortBy_ms ? [est(`The design check found it ${num(e.orbitShortBy_ms)} m/s short of the ${num(e.orbitBudget_ms)} m/s it needs to reach orbit, so its burn ran dry short of orbit`)] : []),
        // fast enough for orbit but too low (in the air) is a different miss from too slow
        est(f.peak.speed_ms >= Math.sqrt(MU.earth / (R.earth + f.peak.alt_km)) * 1000 ? `It reached ${num(f.peak.speed_ms)} m/s but only ${num(f.peak.alt_km)} km up, too low to stay in orbit` : `It climbed to ${num(f.peak.alt_km)} km at up to ${num(f.peak.speed_ms)} m/s, short of orbital speed`),
        est(`It fell back through the atmosphere and came down ${i.surface === "sea" ? `${num(i.downrange_km)} km downrange` : "near the pad"}`),
      ],
    };
  }
  if (e.type === "transfer-failed") {
    const short = num(e.shortBy_ms);
    if (at("moon-flyby")) {
      out.push(est(`The departure burn added ${num(dep.dv_ms)} m/s, but ${short} m/s short of what lunar orbit insertion needs`));
      out.push(est(`It crossed the Moon's orbit ${num(at("moon-flyby").distance_km)} km from the Moon and flew on past`));
    } else if (e.apogee_km == null) {
      out.push(est(`The departure burn ran dry ${short} m/s short; it escaped Earth too slowly to reach Mars and is adrift`));
    } else {
      const goal = f.mission === "gto" ? `below the ${num(GEO_ALT_KM)} km needed` : f.kind === "moon" ? (e.apogee_km + R.earth < MOON_DIST ? `short of the Moon, ${num(MOON_DIST)} km away` : "but the Moon was not there") : f.kind === "mars" ? "far short of an escape from Earth" : "short of an escape from Earth";
      out.push(est(`The departure burn ran dry ${short} m/s short; apogee ${num(e.apogee_km)} km, ${goal}; the vehicle fell back toward Earth`));
    }
    return { headline: `Transfer failed · short by ${short} m/s`, sentences: out.slice(0, 3) };
  }
  if (e.type === "landed" && e.body === "earth" && e.landing?.vehicle === "first stage") {
    // round 23: the first stage is the story; the upper stage's result in words
    const L = e.landing;
    const how = L.steps?.length ? `${L.steps.join(", ")} and was caught at the tower` : "was caught at the tower";
    return {
      headline: `${mission} reached · first stage caught at the tower`,
      sentences: [...out.slice(0, 1), est(e.payloadLine.replace(/ \(est\.\)$/, "")), est(`The first stage ${how} at ${L.touchdown_ms.toFixed(1)} m/s`)],
    };
  }
  if (e.type === "landed" && e.body === "earth") {
    const L = e.landing;
    if (f.mission === "gto") out.push(est(`The departure burn added ${num(dep.dv_ms)} m/s; apogee ${num(apo.apogee_km)} km`));
    else if (f.mission === "earth-escape") out.push(est(`The spacecraft left on its own ${num(at("spacecraft-departure").dv_ms)} m/s escape burn`));
    else if (at("payload-release")) out.push(est(`The payload was released at ${tPlus(at("payload-release").t_sim)}`));
    out.push(`In our story ending the stage de-orbits and lands on ${L.site === "pad" ? "the pad" : "the drone ship"} (est.); real upper stages are not recovered.`);
    return { headline: `${mission} reached · stage brought home (story)`, sentences: out };
  }
  // Moon / Mars: the coast from the departure cutoff to the insertion / entry interface, from the events' sim times
  // (round 27d folded the drawn transfer into the one cut, so it is no longer a segment of its own)
  const tArrive = (at("lunar-orbit-insertion") ?? at("mars-orbit-insertion") ?? at("entry-interface"))?.t_sim;
  const tLeave = (at("departure-cutoff") ?? at("depleted"))?.t_sim;
  const coast = tArrive != null && tLeave != null && tArrive > tLeave ? (tArrive - tLeave) / 86400 : days("transfer") ?? 0;
  out.push(est(`The departure burn added ${num(dep.dv_ms)} m/s; the coast to ${BODY_NAME[f.kind]} took ${coast < 2 ? `${num(coast * 24)} hours` : `${coast.toFixed(1)} days`}${f.kind === "mars" ? " on a shortened, not-to-scale path" : ""}`));
  if (e.type === "in-orbit-of") {
    out.push(est(`It braked into a ${f.kind === "moon" ? num(LUNAR_ORBIT_ALT) : num(MARS_ORBIT_ALT)} km orbit of ${BODY_NAME[f.kind]} with its own engine`));
    return { headline: `In orbit of ${BODY_NAME[f.kind]}`, sentences: out };
  }
  const td = at("touchdown");
  const chute = at("chute-open");
  // round 23 (user order): the upper stage lands with the payload on top
  const who = "The upper stage, with the payload on top,";
  out.push(est(f.kind === "mars" && chute ? `${who} came through entry, opened its parachute at ${num(chute.vel_ms)} m/s and touched down at ${num(td.vel_ms)} m/s` : `${who} descended from a ${num(LUNAR_ORBIT_ALT)} km orbit and touched down at ${num(td.vel_ms)} m/s`));
  return { headline: `Landed on ${BODY_NAME[f.kind]}`, sentences: out };
}

// A part's 2 s drop-away at its detach time. Body frame: +y = the vehicle's nose axis, +x = the vehicle's right
// (axis x local up), +z completes the frame; the direction is also given Earth-centred at that moment.
function dropAway(type, stageIndex, t, st, dirBody = [0.08, -1, 0], extra = {}) {
  const f = surfaceFrame("earth", st.posEci ?? st.pos);
  let x = cross(st.axis, f.up);
  x = len(x) < 1e-6 ? f.east : unit(x);
  const z = cross(x, st.axis);
  const d = unit(dirBody);
  return { type, stageIndex, t_sim: round(t, 3), dropAway: { dir_body: r3(d), dir_eci: r3(unit(add(add(mul(x, d[0]), mul(st.axis, d[1])), mul(z, d[2])))), speed_ms: DROP.speed_ms, duration_s: DROP.duration_s }, ...extra };
}
