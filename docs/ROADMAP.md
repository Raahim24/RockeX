# Rocket Configurator: Roadmap

Source: *Build Spec and Execution Plan* §3, §9, §11, §13. Core build is ~3 h (clock times below); with upgrades assume ~6 h. **Scale minutes if the real window differs. The freeze is always 15 min before the real end.**

**Gate rule:** nobody starts the next phase until P2 (integrator) declares the gate passed out loud. Finished early? Only the "if you finish early" list: tests for your module, review a teammate's PR, odd builds, README. Never a lower-tier feature.

```
Phase 0 ─G0─ Phase 1 ─G1─ Phase 2 ─G2─ Phase 3 ─G3─ U1 ─GU1─ U2 ─GU2─ U3 ─GU3─ U4 ─GU4─ Phase 4 ─ Phase 5 (freeze, submit)
 0:00-0:20    0:20-1:00    1:00-1:30    1:30-2:15  (Gate 3 = full demo 3x on live URL)                 polish        freeze
```

---

## Scope tiers (locked)

| Tier | Items |
|---|---|
| **MUST** (ships no matter what) | Procedural 3D snap-stacking rocket, orbit camera, lighting, livery picker · parts JSON (~8 real engines/tanks) · missions JSON (5-6) · delta-v + TWR calculator · feasibility bar · closest-rocket lookup (4-5) · Grok advisor + Apply suggestion · Grok Imagine render · spec card · default tutorial build |
| **SHOULD** (after end-to-end MUST works on deployed link) | Grok Voice · cached backup render + audio · loading/error states · mission patch decal · dark Porsche polish |
| **STRETCH** (one at a time, never after freeze) | 1. Blender `.glb` parts · 2. boosters (needs parallel staging; **not** in the upgrade list) |
| **CUT** (answer is no) | car integration, free-form building, stress/thermal/vibration/slosh/aero, accounts/DB/saved builds, multiplayer, importing all 1,500 GCAT stages |
| **UPGRADE** (committed, after Gate 3) | U1 twin/roast/countdown → U2 sim + video → U3 historic stages → U4 Grok tools + voice. Cut from the bottom: voice input, typed tools, historic stages, live video. **U1 is the last to go.** |

---

## Phase 0: Contract and setup (0:00-0:20)

**Goal:** one repo, one deployed blank app, one frozen contract, answers to the API unknowns.

| Who | Task | Done when |
|---|---|---|
| P2 | Scaffold repo (Next.js, TS, Tailwind, Zustand, R3F, drei, zod, vitest). Write `src/types/index.ts` (spec §6). Store skeleton returning hardcoded demo build. `CLAUDE.md` + `.cursor/rules/*` from §10. Add `typecheck`/`lint`/`test` scripts. Export spec to `docs/SPEC.md` | Repo pushed, all four cloned |
| P1 | Connect repo to Vercel, deploy blank app, R3F cube renders locally and on Vercel | Live URL shows a spinning cube |
| P3 | API spike (20 min): endpoints, models, auth, strict JSON?, Imagine reference image?, latency/limits, Voice audio format. Write `src/lib/ai/NOTES.md`. xAI key in Vercel + local env (never committed) | Every spike question has a written answer |
| P4 | Stub data in final schema: 2 engines, 2 tanks, 1 payload, 2 missions, 1 reference rocket | Stubs import with no type errors |
| All | Read the whole spec; each says "I own X and nothing else". One **Grok Bot** planning session, screenshots in `docs/grok-bot/` | Done |

**Gate 0:** main builds and deploys, types merged, stubs import, spike answers exist. If Imagine takes no reference image, the render prompt uses part names only. Decide now.

---

## Phase 1: Foundations in isolation (0:20-1:00)

**Goal:** each module works alone against the contract and mock data. Nobody waits.

| Who | Task | Done when |
|---|---|---|
| P1 | Procedural parts: engine cluster layouts for 1/3/9, tank cylinder sized from data, interstage, fairing, payload; stack positions from summed heights; orbit camera, lighting, launch pad | Demo build shows a rotatable rocket; editing the store updates the scene |
| P2 | `deltav.ts`, `twr.ts`, `feasibility.ts`, `closest.ts`, store actions, the **7 unit tests** | `npm test` green |
| P3 | `/api/advise` and `/api/render` with fallbacks, `grokClient.ts`, `prompts.ts`, schema validation, mock `GrokBar` | `curl` with sample AdviseRequest returns valid JSON; breaking the key still returns a fallback |
| P4 | Real data: 8 engines, tanks, payloads, 5-6 missions, 4-5 reference rockets, `SOURCES.md`, validation script | Validation passes; every record has a source URL |

**Gate 1 (~1:00):** all four branches merged to main, deployed app shows the 3D demo rocket, tests pass. Small PRs; no branch lives >30 min.

---

## Phase 2: Features complete, still separate (1:00-1:30)

| Who | Task | Done when |
|---|---|---|
| P1 | `PartsPanel` with tabs + click-to-add, compatibility clamps, `TopBar` mission picker, livery picker (material swaps) | Any legal rocket buildable by clicking; illegal ones impossible |
| P2 | `SpecPanel`, `FeasibilityBar` (red/green), closest-rocket label, warnings list. Tune demo build with P4: red → one swap → green | Panel numbers match unit tests exactly |
| P3 | `/api/voice`, `MicButton`, `RenderButton`, working Apply suggestion via `applySuggestion` | Each works in isolation on the demo build |
| P4 | `demo-build.json` with P2. Re-verify every real number against source. Start README + submission notes. Blender only if already fast; never blocks | Demo build is red, then green after the documented swap |

**Gate 2 (~1:30):** every piece works alone; each person does a 30-second live show of theirs.

---

## Phase 3: Integration (1:30-2:15)

**Goal:** one screen, the full demo, end to end, on the deployed link.

| Who | Task | Done when |
|---|---|---|
| P1 | Compose `page.tsx` with all components; frame camera/layout for projector or laptop | One screen shows parts, 3D, specs, Grok bar |
| P2 | Own merge order. Run demo script (§Demo below), triage numbered bug list, assign by file owner | Bug list empty or cosmetic only |
| P3 | Connect advise to real `useVerdict()`. Run demo build through Grok 10x, tune prompt. Save good `render.jpg` + audio clip to `public/fallback/` | 10/10 valid messages; fallback assets exist |
| P4 | Try odd/extreme builds, report breakage, fix data issues. Collect Cursor-prompt and Grok Bot screenshots | Screenshot folder ready |

**Gate 3 (~2:15), the most important:** full demo scenario runs **3 times in a row** on the deployed Vercel URL with **no console errors**. If it fails, the next 30 min is bug-fixing only. P4 may start GCAT curation + reference-rocket records during Phases 2-3 (data only).

---

## Upgrade track (after Gate 3, before Phases 4-5)

Contract v2 PR first (P2): `src/types/v2.ts` + optional `historicStageId` on `StageBuild`, approved by all four in chat, then frozen again.

### U1: Twin, roast, countdown (~40 min)
| Who | Task | Done when |
|---|---|---|
| P2 | Merge contract v2. `twin.ts` (closest rocket over extended list, id + distance), odds function, tests | Falcon-9-sized → Falcon 9, N1-sized → N1, odds at 0 margin = 50 |
| P4 | Extend `reference-rockets.json` to 15-20 with launches, failures, firstLaunchYear, roastFacts, sources (incl. N1: 4 launches / 4 failures, verified). Update validator | Validation passes; N1 checked against a source |
| P3 | `/api/twin` (4 checks + fallback), `/api/countdown` (10 lines, fallback lines), `CountdownOverlay` | 10/10 valid; works with API key removed |
| P1 | `TwinCard`, Find twin button, overlay on a test button | Button shows twin + roast for demo build |

**Gate U1:** demo build shows twin + roast, countdown plays from test button, both fallbacks proven.

### U2: Sim, chart, video (~75 min)
| Who | Task | Done when |
|---|---|---|
| P2 | `flight.ts`, `outcome.ts`, calibration test (Plan B analytic profile if not calibrated in 30 min), `launch()` store action | Tests cover all 4 outcomes + calibration |
| P3 | Extend `/api/render` for video from outcome templates, timeout from spike, record demo clips to `public/fallback/`, start countdown on Launch | Both clips exist; route falls back on timeout |
| P1 | `FlightPanel`, `TelemetryChart` (plain SVG, synced cursor, event markers), Launch button, optional launch animation | With stub result + sample video the cursor tracks the video |
| P4 | Tune demo scenario with P2, write storyboard lines, test odd builds | Outcome table for demo builds written down |

**Gate U2:** Launch on demo build → countdown → video beside chart; outcome matches verdict; 3x in a row; fallback clips work with network off.

### U3: Historic stages (~45 min)
| Who | Task | Done when |
|---|---|---|
| P4 | `stages.json` (30-50 curated, 15-20 vehicles), GCAT column report first, 10 hand-checks in `SOURCES.md` | Validation passes |
| P2 | Historic-stage physics rules, "adapter needed" warning (>20% wider), Saturn V sanity test, `swap_stage` action | Tests green |
| P1 | History tab grouped by vehicle, scene rendering for historic stage (labeled cylinder) | Saturn V stage + custom Raptor stage builds and displays |
| P3 | Historic ids in advisor valid lists and agent tools; update prompts | Advisor can suggest a historic swap; invalid ids dropped |

**Gate U3:** "Raptor on a Saturn V first stage" builds, gets a verdict and a flight; all tests green.

### U4: Grok tools and voice (~60 min)
| Who | Task | Done when |
|---|---|---|
| P3 | `/api/agent`, tool schema + validation layer, `ChatBox`, `VoiceInput` | 10 sample phrases give valid calls; `launch`/`find_twin` only when asked |
| P2 | Every tool maps to an existing store action; fix gaps | Each tool call changes the build via the store |
| P1 | Mount chat box + mic; animate rocket on applied call | Rocket visibly updates while Grok talks |
| P4 | 15 test phrases with expected calls, run, report to P3; write and rehearse 2-min demo | Pass rate recorded; demo run twice |

**Gate U4:** "Make it bigger" and "launch it" work by typing, and by voice in at least one browser; invalid calls dropped.

**If time runs short, cut in order:** voice input → typed Grok tools → historic stages → live video generation (keep sim, chart, pre-recorded clips). Freeze time never moves.

---

## Phase 4: Polish and SHOULD items (last ~30-45 min)

| Who | Task | Done when |
|---|---|---|
| P1 | Dark Porsche styling, big typography, mission patch decal, smooth part-snap animation | Screenshots look like a product page |
| P2 | Final `SpecCard` (render, verdict, margin, closest real rocket); empty and error states | Card appears after Render it |
| P3 | Loading states for Grok calls, spoken briefing after render, error toasts | Every failure shows something sensible |
| P4 | Finish README, `SOURCES.md`, submission text, demo script; rehearse as narrator | Submission draft complete |

Stretch (launch animation, Blender, Launch Library) only if Gate 3 had ≥15 min spare, on a separate branch behind a feature flag, merged before freeze or deleted.

---

## Phase 5: Freeze, rehearse, submit (last 15 min)

1. **Code freeze** at T-15. Only bug fixes merge.
2. Run the full demo 3x on the deployed link, once with Grok network off to prove fallbacks.
3. P4 submits: pitch, Cursor screenshots, Grok Bot evidence, live app + repo links.
4. Everyone leaves the deployed URL open; **nobody pushes to main again.**

### Submission checklist
- [ ] Live Vercel link, tested on a second device
- [ ] Repo link with README (idea + how to run)
- [ ] 60-90 s demo video / screen recording as backup
- [ ] Screenshots of Cursor prompts and rules files
- [ ] Screenshots of Grok Bot planning session
- [ ] `SOURCES.md` for every real number
- [ ] One-paragraph pitch (problem, solution, why the data matters)
- [ ] Team names and roles

---

## Demo scripts

### Core, ~90 s
| Time | Say | Do |
|---|---|---|
| 0:00 | "Real engine data decides whether your rocket works. Grok is your engineer." | App open on demo build, mission = Moon transfer |
| 0:10 | "This is a real mission. It needs about 12.5 km/s from the ground." | Point at required delta-v, orbit the rocket once |
| 0:25 | "The numbers come from real engine specs and the rocket equation." | Point at red bar, short ~0.9 km/s |
| 0:35 | "Grok reads the build and tells me what to fix." | Press mic, Grok speaks the hydrolox swap |
| 0:50 | "One click applies it." | Apply suggestion; upper stage changes; bar turns green |
| 1:00 | "Now I make it mine." | Change livery and mission patch |
| 1:10 | "Grok Imagine renders the exact rocket I built." | Render it; show render + spec card with closest real rocket |
| 1:25 | "Real data in, a rocket you can trust out. Built entirely in Cursor." | Hold on spec card |

### Upgraded, ~2 min (numbers chosen in U2 after tuning; don't script them before)
0:00 pitch · 0:10 "Every stage here really flew" (History tab, historic stage under a Raptor stage) · 0:25 red bar and shortfall · 0:35 "Grok finds my closest ancestor" (Find twin, roast aloud) · 0:50 "make it bigger" (type or say) · 1:05 "Launch it" (countdown with trash talk) · 1:20 "Grok Imagine shows what physics decided" (video beside chart, point at stage event) · 1:45 close on final card.

---

## Risk register (top items)

| Risk | Mitigation | Owner |
|---|---|---|
| xAI endpoint differs from assumptions | Spike in first 20 min; fallbacks on every route | P3 |
| Real specs typed wrong | Source URL on every record, validation script, second pass in Phase 2 | P4 |
| Demo doesn't go red → green | Tune in Phase 2, unit test in Phase 1 | P2 |
| Someone adds scope | Scope tiers, "if you finish early" list | P2 |
| Merge conflicts | Exclusive ownership, 30-min merge cadence | P2 |
| 3D becomes a time sink | Procedural only, Blender never blocks | P1 |
| Render ≠ 3D model | Frame as interpretation; prompt carries part names + livery | P3 |
| Time runs out | Freeze at T-15, gates, cut from bottom of tiers | P2 |
| Video slow/fails (U2) | Pre-recorded clips, timeout from spike, hold lines | P3 |
| Sim contradicts verdict (U2) | Outcome derives from verdict; calibration test; Plan B | P2 |
| GCAT data thin (U3) | Curated 30 is enough; column report first | P4 |
| Roast invents facts / goes too far (U1) | Facts only from record, number check, blocklist, fallback | P3 |
| P2 bottleneck | UI sits with P1; P4 can take integrator hat in U2-U4 | P2 |
