# Rocket Assembly prototype (front end for the cinematic build)

Standalone front end for the "build it like a movie" experience: real dataset records become 3D parts at true
scale, parts fly in and lock with sound, the stack can be exploded and reassembled, every part can be clicked for
its numbers, and the verdict line uses the same physics as the app. It lives here so the backend people can read
the contracts and start wiring while the front end keeps changing.

Status: work in progress (snapshot of 2026-10-17 evening). Live build of the previous version:
https://bhumishdayal.github.io/rocket-assembly-demo/ · source of truth for the prototype's own history:
https://github.com/BhumishDayal/rocket-assembly-demo

## Run it
```
cd prototype/rocket-assembly
npm install
npm run dev        # http://localhost:5173
```
Vanilla three.js 0.180 + anime.js 4 + Vite. No React, no Next.js, nothing shared with the app's `package.json`.
URL flags: `?build=falcon-9|saturn-v|atlas-v-401|delta-iv-m|demo-build`, `?demo=1` auto-builds, `?lite=1` drops
post-processing and shadows for weak GPUs.

Keys: click the hologram ghost to build the next part · click any part for its card · `Space` explode / assemble ·
`B` build all · `R` reset · `M` mute · `[` `]` change rocket · `1`–`9`,`0` build the n-th part · `Esc` close card.

## How it maps to the app (what to connect)
| Prototype | App equivalent | Notes |
|---|---|---|
| `src/data/*.json` | `src/data/*.json` | byte-identical copies of the live tables (plus `presets.json`, `payloads.extra.json`, `visuals.json` which are prototype-only and fully sourced) |
| `src/physics.js` | `src/lib/physics/*.ts` | JS port with the same export names; `scripts/check-physics.mjs` proves it matches the TS to 1e-6 on every preset |
| `src/data/catalog.js` → `presetToBuild`, `optionsFor`, `applyOption` | store actions | a preset is a `BuildState`; `applyOption` is what "Apply suggestion" would call |
| `src/layout.js` → `buildManifest(build, catalog)` | P1 scene | turns a `BuildState` into an ordered list of parts with true sizes (engines → tank → interstage per stage, payload, fairing) |
| `src/parts.js` | P1 procedural parts | geometry from the records: cluster layouts from engine count, bells from exit diameter, tanks at D × H, finishes from `visuals.json` |
| `src/choreo.js` | (new) | `build / remove / explode / assemble / swap / restack` driven by anime.js springs |
| `src/ui/card.js`, `src/ui/select.js` | `SpecPanel` + picking | card appears only on click; one "Options" button per slot |
| HUD line | `FeasibilityBar` + verdict | "name · height · mass · Δv achieved / required · TWR · GO/NO-GO · warnings" |

Backend hooks the front end expects, in the shape of the frozen contract (`src/types/index.ts`):
- input: a `BuildState` (`missionId`, `stages[] {engineId, engineCount, tankId}`, `payloadId`);
- output: a `Verdict` from `evaluateBuild` (the prototype computes it locally with the port; the app should pass its own);
- advisor: an `AdviseResponse` whose `suggestion` can be applied with `applyOption`-style swaps (`swap_engine`,
  `swap_tank`, `set_engine_count`, `add_stage`), each of which the choreography can animate as a part swap.

## Honest numbers
Every value on screen is a dataset field or a named formula result (labelled "est." / "derived"). Structures the
dataset has no mass for (interstage, fairing, adapters) say so. The physics port is unchanged from the app, which is
why the verdict line flags all three real vehicles: Falcon 9 on the 4 % dry-mass rule (second stage is 3.2 %),
Saturn V (TWR 1.18) and Atlas V 401 (TWR 1.17) on the TWR ≥ 1.2 rule. That is evidence for P2's rule review, not a
prototype bug.

## Not in this snapshot yet
Mechanical sub-assembly build (anime.js-lens style), option swap animation, launch sequence. See
`docs/v2-design.md` for the design rounds and the per-file contracts.
