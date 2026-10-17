# Rocket Configurator: Architecture

Source: *Rocket Configurator Build Spec and Execution Plan* (44 pages). Where this file and the spec disagree, the spec wins. Section numbers (§) refer to the spec.

**Pitch:** "Real engine data decides whether your rocket works. Grok is your engineer."

---

## 1. System at a glance

One Next.js project, one screen, one loop: **pick mission → build rocket in 3D → see verdict → Grok fixes it → render it.**

```
                         BROWSER (owns build + all math)
 ┌──────────────────────────────────────────────────────────────────┐
 │  components/parts ──┐                                            │
 │  (PartsPanel,TopBar)│ actions        ┌── components/scene (3D)   │
 │                     ▼                │                           │
 │            ┌─────────────────┐  read │                           │
 │            │ store/buildStore│───────┤                           │
 │            │ (Zustand)       │       └── components/specs        │
 │            │ BuildState only │           (SpecPanel, Feasibility │
 │            └───────┬─────────┘            Bar, SpecCard)         │
 │                    │ useVerdict() (derived, never stored)        │
 │                    ▼                                             │
 │            lib/physics  (pure TS: deltav, twr, feasibility,      │
 │                          closest)  ◄── src/data/*.json           │
 │                                                                  │
 │  components/grok (GrokBar, MicButton, RenderButton)              │
 └───────────────────────────┬──────────────────────────────────────┘
                             │ fetch (build + verdict)
 ┌───────────────────────────▼──────────────────────────────────────┐
 │ SERVER (Next.js API routes) — only place the xAI key exists      │
 │   POST /api/advise  → Grok chat   → zod-validate → id-check      │
 │   POST /api/voice   → Grok Voice  → audio body                   │
 │   POST /api/render  → Grok Imagine→ image (+ cached fallback)    │
 │   lib/ai: prompts.ts, schemas.ts, grokClient.ts                  │
 └───────────────────────────┬──────────────────────────────────────┘
                             ▼
                          xAI API
```

### Five design decisions (§4), non-negotiable
1. **A vertical stack, not free-form building.** Maps cleanly to delta-v per stage.
2. **The verdict is computed in code, never by Grok.** Grok explains, suggests, speaks, renders.
3. **Procedural parts first, Blender later.** Modeling can never block the demo.
4. **Data saved as JSON ahead of time.** No live data-source calls during judging.
5. **One screen.** Fewer routes, states and bugs.

### Stack (fixed; a new dependency is a Phase 0 decision by P2)
| Layer | Choice |
|---|---|
| App | Next.js (App Router) + TypeScript |
| 3D | React Three Fiber + drei |
| Styling | Tailwind CSS |
| State | Zustand |
| Validation | Zod |
| Tests | Vitest |
| Server | Next.js API routes (one file per Grok capability) |
| Data | JSON in repo, every record has a `source` URL |
| Hosting | Vercel |

---

## 2. Repo structure and ownership

One owner per file. Nobody edits a file they don't own. `src/types/` is the single shared contract, frozen after Phase 0.

```
rocket-configurator/
  CLAUDE.md                       P2   rules for Claude Code + Cursor
  .cursor/rules/                  P2   one rules file per person
  docs/SPEC.md                    P2   the spec, exported to Markdown (source of truth)
  docs/ARCHITECTURE.md, ROADMAP.md, AGENT-PROMPTS.md
  docs/grok-bot/                  P4   planning screenshots (bonus points)
  src/
    types/index.ts                P2   CONTRACT (frozen after Phase 0)
    types/v2.ts                   P2   additive contract for upgrades (U1)
    data/                         P4   engines, tanks, payloads, missions,
                                       reference-rockets, stages (U3), SOURCES.md
    lib/physics/                  P2   deltav, twr, feasibility, closest, *.test.ts
    lib/sim/                      P2   flight, outcome, twin (U1/U2)
    lib/ai/                       P3   prompts, schemas, grokClient, NOTES.md,
                                       countdownFallback (U1)
    store/buildStore.ts           P2   Zustand, single source of truth
    components/scene/             P1   RocketScene, Stack, PartMesh, LaunchPad, Livery
    components/parts/             P1   PartsPanel, TopBar
    components/specs/             P2   SpecPanel, FeasibilityBar, SpecCard
    components/grok/              P3   GrokBar, MicButton, RenderButton (+ChatBox, ...)
    components/flight/            P1   TelemetryChart, FlightPanel, TwinCard (U1/U2)
    app/page.tsx, layout.tsx, css P1   composition only, no logic
    app/api/{advise,voice,render} P3   (+ twin, agent, countdown in upgrades)
  public/fallback/                P3   render.jpg, audio clip, demo-*.mp4
  public/models/                  P4   optional Blender .glb
```

| Role | Person | Hat |
|---|---|---|
| P1 | 3D + UI | scene, parts, page composition, flight UI |
| P2 | Logic + **integrator** | types, physics, store, specs panel, merges, rules files |
| P3 | AI | all xAI integration, API routes, fallbacks, Grok components |
| P4 | Data + assets | sourced JSON, validation script, README, submission |

Rules that follow: no importing another person's internals (store, types, documented exports only); missing contract field → message P2, one small PR, everyone pulls; `page.tsx` has no logic; **no real-world number is ever typed into a component**.

---

## 3. Data contract (summary of §6; full TS lives in `src/types/index.ts`)

All SI, unit in the field name. Stage index 0 = bottom stage, first to fire.

- **Part data:** `Engine`, `Tank`, `Payload`, `Mission`, `ReferenceRocket`, each with `source`.
- **Build:** `BuildState { missionId, stages: StageBuild[], payloadId, livery }`; `StageBuild { engineId, engineCount (1-9), tankId }` (one tank per stage).
- **Derived:** `Verdict { stages: StageResult[], totalDeltaV_ms, requiredDeltaV_ms, marginDeltaV_ms, liftoffTWR, deltaVOk, twrOk, feasible, totalMass_kg, liftoffThrust_kN, closestRocketId, warnings[] }`.
- **AI:** `Suggestion` (swap_engine | set_engine_count | swap_tank | add_stage), `AdviseRequest/Response`, `RenderRequest/Response`, `VoiceRequest`.

### Store API (P2)
`useBuild()`, `useVerdict()` (derived, not stored), `setMission`, `setStageEngine`, `setEngineCount`, `setStageTank`, `addStage`, `removeStage`, `setPayload`, `setLivery`, `applySuggestion` (ignores unknown ids), `loadDemoBuild`, `reset`.

### API endpoints (P3)
| Endpoint | In | Out | On failure |
|---|---|---|---|
| `POST /api/advise` | AdviseRequest | AdviseResponse | rule-based message from verdict, `suggestion: null`, HTTP 200 |
| `POST /api/voice` | VoiceRequest | audio body | HTTP 502; UI silently shows text only |
| `POST /api/render` | RenderRequest | RenderResponse | cached `render.jpg`, `fallback: true`, HTTP 200 |

xAI key lives only in server env vars.

---

## 4. Physics (P2, pure TypeScript, no libraries; §7)

- Stage mass = `n·m_engine + m_tank_dry + m_propellant`.
- `m_start,i = Σ_{j≥i} m_stage,j + m_payload`; `m_end,i = m_start,i − m_propellant,i` (upper stages are dead weight).
- `Δv_i = Isp_i · g0 · ln(m_start/m_end)`, `g0 = 9.80665`. Total = sum.
- **Isp:** stage 0 uses sea-level, upper stages vacuum.
- `TWR = n0·F_SL,0·1000 / (m_start,0 · g0)`, stage 0 only.
- **Losses** are already inside each mission's `requiredDeltaV_ms`. Never subtract again.

| Rule | Effect |
|---|---|
| margin ≥ 0 | `deltaVOk` |
| TWR ≥ 1.2 | `twrOk`; below 1.0 is a blocking warning |
| engine propellant = tank propellant | else blocking warning |
| max engines = `floor(0.6 · (tankD/engineD)²)`, tune so 3.66 m tank + Merlin = 9 | `setEngineCount` clamps |
| vacuum-only engines not on stage 0 | blocking warning, UI disallows |
| tank dry mass ≥ 4% of propellant | else blocking warning |
| `feasible = deltaVOk && twrOk && no blocking warnings` | drives the green bar |

**Closest real rocket:** `d = √(ln(m_b/m_r)² + ln(F_b/F_r)²)`, pick min. Code picks, Grok only phrases.

**Seven required unit tests (Phase 1 DoD):** worked example within 50 m/s; empty build returns infeasible without throwing; one-stage + zero payload; propellant mismatch → blocked; TWR 0.9 → `twrOk:false` + blocking; Falcon-9-sized build → Falcon 9; `applySuggestion` ignores unknown ids.

### Canonical demo scenario (must work every time)
Moon transfer, 12.5 km/s, 5 t payload. Stage 1 kerolox 400 t / 25 t dry / Isp 290; stage 2 kerolox 100 t / 6 t dry / Isp 348 → ~11.56 km/s, **red, ~940 m/s short**. Swap stage 2 to hydrolox (Isp ~450, 8 t dry) → ~13.08 km/s, **green, ~580 m/s margin**. Masses are placeholders: P4 + P2 re-tune with real engines so stage-0 TWR ≈ 1.3. **Never weaken the TWR rule to make the demo pass.**

---

## 5. Grok integration (P3, §8)

Principle: **code decides, Grok narrates.** Every route has a non-AI fallback so the demo can't break.

- **API spike (first 20 min), recorded in `src/lib/ai/NOTES.md`:** exact endpoints/models/auth for chat, Voice, Imagine; strict-JSON support; Imagine reference image or text only; latency and rate limits; Voice audio format; (U2) video generation time, clip length, screenshot input; (U4) function calling, speech-input support.
- **Advisor:** server attaches valid engine/tank ids; system prompt forbids arithmetic and invented numbers, requires JSON `{message ≤2 sentences, suggestion|null}`; server zod-validates, drops suggestions with unknown ids (keeps message), 8 s timeout, any failure → rule-based message.
- **Voice:** speak only ≤2-sentence messages; failure is silent; one backup clip in `public/fallback/`.
- **Imagine:** prompt built from the build (never free user text); loading state with honest wait; failure → `render.jpg` with `fallback: true` and spec card still shows. Framed as an artistic interpretation.
- **Grok Bot (bonus, non-optional):** one Phase 0 planning session saved to `docs/grok-bot/`.

---

## 6. Upgrade architecture (§13; additive, after Gate 3)

Contract v2 (`src/types/v2.ts`, one optional `historicStageId` on `StageBuild`) is the only contract change, merged at the start of U1.

| Upgrade | Code decides | Grok does |
|---|---|---|
| **U1** twin + roast | closest rocket over 15–20 refs; joke odds `round(100/(1+e^(−margin/400)))` | phrases roast; `/api/twin` checks ≤280 chars, blocklist, numbers present in record, else fallback line |
| **U1** countdown | odds, twin name | 10 lines ≤12 words; static fallback in `countdownFallback.ts`; starts without waiting |
| **U2** sim + video | `flight.ts` 2D point-mass replay (0.1 s step), `outcome.ts` rule order: no_liftoff → falls_back → stranded_in_orbit → success; Plan B analytic profile | Imagine video from an outcome template; chart cursor synced to video; pre-recorded clips as fallback |
| **U3** historic stages | `stages.json` (30–50 curated GCAT rows, Isp derived `F·t/(m·g0)`), historic-stage physics rules, "adapter needed" warning | advisor can suggest historic swaps |
| **U4** tools + voice | zod + id check on every `ToolCall`, max 3 per message, `launch`/`find_twin` only if asked | `/api/agent` returns message + tool calls; typed chat primary, browser speech recognition secondary |

Verdict stays the single authority; sim outcome derives from it, so chart, video and verdict can never disagree.

---

## 7. Cross-cutting rules

**Ten AI rules (go in CLAUDE.md + every Cursor rules file):** own files only · never edit `src/types/` · no new deps · no features outside the current phase task list · no data values in components · never invent real-world numbers (`TODO(source)`) · no secrets in git · pure, small, typed functions, no `any` · run typecheck + lint + test and paste output · prefer deleting scope.

**Git:** branches `p1-scene`, `p2-logic`, `p3-ai`, `p4-data`; Phase 0 straight to `main` by P2; PR + merge at least every 30 min and at each gate; `git pull --rebase origin main` first; P2 merges and rejects PRs touching unowned paths; lockfile changes only in Phase 0; no force-push; after freeze only bug fixes.

**Blocked >5 min:** post one line in chat, switch to the "if you finish early" list (tests for your module, review a PR, odd builds, README). Never edit someone else's file.

---

## 8. Demo resilience

| Failure | Fallback | Owner |
|---|---|---|
| Grok advise | rule-based message; Apply still works via built-in demo swap | P3 |
| Voice | text only, no error | P3 |
| Imagine | cached `render.jpg` with small "cached" label | P3 |
| Venue wifi / Vercel | local `npm run start` build on demo laptop | P2 |
| Slow 3D | `?lite=1` lowers pixel ratio + shadows | P1 |
| Video (U2) | pre-recorded `demo-success.mp4` / `demo-failure.mp4`, countdown hold lines | P3 |
