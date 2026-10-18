# Progress: what's done and what's left

Snapshot of `main` at `197a694` (after PR #16), 2026-10-17. Tasks and gates follow `docs/ROADMAP.md`.
Update this file when a phase lands.

**Legend:** ✅ done and on main · 🟡 partly done, or done but not merged · ❌ not started · ⏸️ waiting on something else

## At a glance

| Phase | P1 (3D and UI) | P2 (physics, integrator) | P3 (Grok) | P4 (data, submission) | Gate |
|---|---|---|---|---|---|
| 0 Setup | ✅ | ✅ | ✅ | ✅ | ✅ except Grok Bot screenshots |
| 1 Foundations | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 Features | 🟡 built, not merged | ✅ | ✅ | ✅ | 🟡 waiting on P1 |
| 3 Integration | ❌ | ❌ | ✅ | 🟡 | ❌ |
| 4 Polish | ❌ | ❌ | 🟡 | 🟡 | ❌ |
| 5 Freeze and submit | ❌ | ❌ | ❌ | ❌ | ❌ |
| Upgrades U1–U4 | ❌ | ❌ | ❌ | 🟡 data ready | ❌ |

**Health of main:** typecheck and lint clean, 78 tests passing, 3 known rule issues as to-dos.

**The biggest gap:** the live page still shows only the 3D rocket. The verdict panel, Grok bar, mic and render
buttons all exist but are not on the page. Gate 3 (the full demo, three times in a row on the live URL) needs
P1's Phase 2 merged and Phase 3 composed.

## Phase by phase

### Phase 0: contract and setup

| Owner | Task | Status |
|---|---|---|
| P2 | Repo, shared types, store skeleton, `CLAUDE.md`, Cursor rules, `docs/SPEC.md` | ✅ |
| P1 | Vercel deploy, spinning cube on the live URL | ✅ spaxe-x.vercel.app |
| P3 | xAI API spike, `src/lib/ai/NOTES.md`, key in Vercel | ✅ |
| P4 | Stub data in the final schema | ✅ |
| All | Grok Bot planning session, screenshots in `docs/grok-bot/` | ❌ folder is empty (bonus points) |

### Phase 1: foundations

| Owner | Task | Status |
|---|---|---|
| P1 | Procedural rocket: engine clusters 1/3/9, tanks from data, interstage, fairing, payload, pad, orbit camera | ✅ |
| P2 | Delta-v, TWR, feasibility, closest rocket, store actions, the 7 required tests | ✅ |
| P3 | `/api/advise` and `/api/render` with fallbacks, Grok client, prompts, schemas | ✅ |
| P4 | Real data: 11 engines, 12 tanks, 6 missions, 4 payloads, 5 reference rockets, `SOURCES.md`, validation test | ✅ |

### Phase 2: features complete

| Owner | Task | Status |
|---|---|---|
| P1 | Parts panel with click to add, compatibility rules, mission picker, livery picker | 🟡 Built on local branch `p1-phase2` (hologram workshop: pick up and attach parts, fly-in and scan animation, beginner panel, anime.js). **Not pushed.** On main, `PartsPanel.tsx` and `TopBar.tsx` are still placeholders |
| P2 | Spec panel, red/green bar, closest rocket, warnings | ✅ |
| P2 + P4 | Demo build: red, one change, green | ✅ JWST to a Moon transfer: 905 m/s short, add an RL10C-1 on Centaur III, about +500 m/s. Proven by `src/store/demo.test.ts` |
| P3 | `/api/voice`, mic button, render button, Apply suggestion | ✅ |
| P4 | Re-verify numbers, start README and submission notes | ✅ |

### Phase 3: integration (Gate 3 is the one that matters)

| Owner | Task | Status |
|---|---|---|
| P1 | Compose `page.tsx` with every component, frame it for a projector | ❌ Page shows only the rocket |
| P2 | Own merge order, run the demo script, triage a numbered bug list | ❌ Waits for the composed page |
| P3 | Advise wired to the real verdict, 10 consistent runs, fallback render and audio saved | ✅ Demo fix offered first, offline fallback offers it too, `render.jpg` and `advice.mp3` saved |
| P4 | Odd and extreme builds, report breakage | ✅ 18,480 builds, report in `docs/qa/odd-builds.md` |
| P4 | Screenshots of Cursor prompts and the Grok Bot session | ❌ Needs people |
| **Gate 3** | Full demo three times in a row on the live URL, no console errors | ❌ |

### Phase 4: polish

| Owner | Task | Status |
|---|---|---|
| P1 | Dark styling, big type, mission patch decal, smooth part snap | ❌ (some of this exists on `p1-phase2`) |
| P2 | Final spec card with render, verdict, margin, closest rocket; empty and error states | ❌ `SpecCard.tsx` is a placeholder |
| P3 | Loading states, spoken briefing after the render, error toasts | 🟡 Loading states exist; briefing and toasts not checked |
| P4 | README, `SOURCES.md`, submission text, demo script | ✅ |
| P4 | Rehearse as the narrator | ❌ Needs the integrated page |

### Phase 5: freeze, rehearse, submit

| Task | Status |
|---|---|
| Code freeze 15 minutes before the end | ❌ |
| Full demo three times on the live link, once with Grok offline | ❌ |
| Submit: pitch, Cursor screenshots, Grok Bot evidence, live and repo links (checklist in `docs/SUBMISSION.md`) | ❌ |

### Upgrades (after Gate 3)

| Phase | P1 | P2 | P3 | P4 |
|---|---|---|---|---|
| U1 twin, roast, countdown | ❌ Twin card | ❌ Contract v2, twin match, odds | ❌ `/api/twin`, `/api/countdown` | ✅ 20 rockets with launch records and roast facts in `src/data/extended/` |
| U2 sim and video | ❌ Flight panel, chart | ❌ Flight sim, outcomes | ❌ Video route, clips | ⏸️ Outcome table waits for the sim |
| U3 historic stages | ❌ History tab | ❌ Historic-stage rules | ❌ Advisor lists | 🟡 49 GCAT stages ready; 10 hand-checks to confirm |
| U4 Grok tools and voice | ❌ Chat and mic mount | ❌ Tool mapping | ❌ `/api/agent` | ⏸️ Test phrases wait for the agent |

## Open issues (from `docs/qa/odd-builds.md`)

| # | Owner | Issue |
|---|---|---|
| 2 | P2 | Engine-fit rule allows only 4 F-1s on the Saturn V S-IC (real: 5). A coefficient of 0.62 fixes it and keeps 9 Merlins |
| 3 | P2 | The 4 % tank floor blocks the real Falcon 9 second stage and the Shuttle External Tank |
| 4 | P2 | `evaluateBuild` doesn't check engine counts (0, 50, NaN); only the store clamps them |
| 5 | P2 | Closest rocket is empty when booster thrust is 0 (cosmetic) |

## Next steps, in order

1. **P1:** push and merge `p1-phase2`, then compose the one screen (Phase 3).
2. **P2:** run the demo script on the composed page, keep the bug list, then the spec card. Fix rule issues 2 to 4.
3. **Everyone:** the Grok Bot planning session plus screenshots, and Cursor prompt screenshots.
4. **All:** pass Gate 3, then polish (Phase 4) or start U1, whichever the time allows.
