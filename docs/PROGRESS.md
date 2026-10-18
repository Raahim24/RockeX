# Progress: what's done and what's left

Snapshot of `main` at `e7600da` (after PR #20), 2026-10-18. Tasks and gates follow `docs/ROADMAP.md`.
Update this file when a phase lands.

**Legend:** ✅ done and on main · 🟡 partly done · ❌ not started · ⏸️ waiting on something else

## The big change since the last snapshot

**The team picked Bhumish's cinematic rocket assembly as the front end.** It was a separate Vite app
(`prototype/rocket-assembly`, #18); #19 made it the homepage of the Next.js app, so it is now live at
https://spaxe-x.vercel.app. The old R3F scene in `src/components/scene/` is no longer used.

What the live page does today: pick a preset (Falcon 9, Saturn V, Atlas V 401, Delta IV M, the team demo build),
build it part by part or all at once with fly-in, lock flash and sound, explode and reassemble, click any part for
its real numbers and swap it from the **Options** list, and read the verdict line
("Δv 11 695 / 12 600 m/s · TWR 1.64 · NO-GO · Δv short" for the demo build).

What it does not do yet: **no Grok on the page** (no Ask Grok, Apply, mic or render), no mission picker, and it runs
its own JS copies of the data and physics (proven equal by `prototype/rocket-assembly/scripts/check-physics.mjs`).

## At a glance

| Phase | P1 (3D and UI) | P2 (physics, integrator) | P3 (Grok) | P4 (data, submission) | Gate |
|---|---|---|---|---|---|
| 0 Setup | ✅ | ✅ | ✅ | ✅ | ✅ except Grok Bot screenshots |
| 1 Foundations | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 Features | ✅ via the assembly front end | ✅ | ✅ | ✅ | ✅ |
| 3 Integration | 🟡 front end live, Grok not on it | ❌ | ✅ | 🟡 | ❌ |
| 4 Polish | 🟡 the assembly is already polished | ❌ | 🟡 | 🟡 | ❌ |
| 5 Freeze and submit | ❌ | ❌ | ❌ | ❌ | ❌ |
| Upgrades U1–U4 | ❌ | ❌ | ❌ | 🟡 data ready | ❌ |

**Health of main:** typecheck clean, lint 0 errors (8 warnings inside the prototype), 86 tests passing, 3 to-dos in
`src/data/odd-builds.test.ts` (two of them are now fixed by #20 and can become real tests). Production build passes and Vercel deploys main automatically.

**The critical path now:** put the Grok bar (advise, Apply, mic, render) and P2's verdict on the assembly screen, then
run the full demo three times on the live URL (Gate 3).

## Phase by phase

### Phase 0: contract and setup

| Owner | Task | Status |
|---|---|---|
| P2 | Repo, shared types, store skeleton, `CLAUDE.md`, Cursor rules, `docs/SPEC.md` | ✅ |
| P1 | Vercel deploy | ✅ spaxe-x.vercel.app, deploys on every merge to main |
| P3 | xAI API spike, `src/lib/ai/NOTES.md`, key in Vercel | ✅ (confirm `XAI_API_KEY` is set for Production and Preview) |
| P4 | Stub data in the final schema | ✅ |
| All | Grok Bot planning session, screenshots in `docs/grok-bot/` | ❌ folder is empty (bonus points) |

### Phase 1: foundations

| Owner | Task | Status |
|---|---|---|
| P1 | Procedural rocket at true scale, pad, orbit camera | ✅ (now superseded by the assembly front end) |
| P2 | Delta-v, TWR, feasibility, closest rocket, store actions, the 7 required tests | ✅ |
| P3 | `/api/advise` and `/api/render` with fallbacks, Grok client, prompts, schemas | ✅ |
| P4 | Real data: 11 engines, 12 tanks, 6 missions, 4 payloads, 5 reference rockets, `SOURCES.md`, validation test | ✅ |

### Phase 2: features complete

| Owner | Task | Status |
|---|---|---|
| P1 | Build a legal rocket by clicking; illegal builds impossible | ✅ The assembly builds presets part by part and swaps parts from **Options** (only dataset records). Mission picker and livery picker are not in it |
| P2 | Spec panel, red/green bar, closest rocket, warnings | ✅ In the app as React components; the assembly shows its own verdict line instead |
| P2 + P4 | Demo build: red, one change, green | ✅ JWST to a Moon transfer: 905 m/s short, add an RL10C-1 on Centaur III, about +500 m/s. Proven by `src/store/demo.test.ts`; also a preset in the assembly |
| P3 | `/api/voice`, mic button, render button, Apply suggestion | ✅ As React components; not yet on the assembly screen |
| P4 | Re-verify numbers, README and submission notes | ✅ |

### Phase 3: integration (Gate 3 is the one that matters)

| Owner | Task | Status |
|---|---|---|
| P1 | One screen with everything, framed for a projector | 🟡 The assembly is the screen and is live. Missing on it: the Grok bar (Ask Grok, Apply, mic, render) and a mission picker |
| P2 | Own merge order, run the demo script, triage a numbered bug list | ❌ Waits for Grok on the screen |
| P3 | Advise wired to the real verdict, 10 consistent runs, fallback render and audio | ✅ Demo fix offered first, offline fallback offers it too, `render.jpg` and `advice.mp3` saved |
| P4 | Odd and extreme builds, report breakage | ✅ 18,480 builds, report in `docs/qa/odd-builds.md` |
| P4 | Screenshots of Cursor prompts and the Grok Bot session | ❌ Needs people |
| **Gate 3** | Full demo three times in a row on the live URL, no console errors | ❌ Needs Grok on the screen first |

### Phase 4: polish

| Owner | Task | Status |
|---|---|---|
| P1 | Dark styling, big type, smooth part snap, mission patch decal | 🟡 The assembly already has the dark look, fly-in, lock flash, sound and exploded view. No patch decal |
| P2 | Final spec card with render, verdict, margin, closest rocket; empty and error states | ❌ `SpecCard.tsx` is a placeholder |
| P3 | Loading states, spoken briefing after the render, error toasts | 🟡 Loading states exist; briefing and toasts not checked |
| P4 | README, `SOURCES.md`, submission text, demo script | ✅ The README and demo script describe the Grok flow, which is not on the live screen yet |
| P4 | Rehearse as the narrator | ❌ Needs Grok on the screen |

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

## Open issues

| # | Owner | Issue |
|---|---|---|
| QA 2 | P2 | ✅ Fixed in #20: fit factor 0.62, so the S-IC takes its real 5 F-1s and a Falcon 9 tank still takes 9 Merlins |
| QA 3 | P2 | The 4 % tank floor blocks the real Falcon 9 second stage and the Shuttle External Tank, so the Falcon 9 preset shows NO-GO |
| QA 4 | P2 | ✅ Fixed in #20: counts outside 1–9 or non-integers are blocked, and too many engines for a tank is a blocking warning that names the limit, instead of a silent clamp |
| QA 5 | P2 | Closest rocket is empty when booster thrust is 0 (cosmetic) |
| New | P2, P4 | **The assembly's physics is now behind the app.** #20 changed the TS physics (fit factor 0.62, engine-count warnings) but `prototype/rocket-assembly/src/physics.js` still has the old rules. `check-physics.mjs` still prints OK only because its golden numbers were generated before #20. Port #20 to `physics.js`, regenerate the goldens, and do the same after every future change to `src/data` or `src/lib/physics` |
| New | P1, P4 | Agree who edits `prototype/rocket-assembly` now that it is the live front end |
| New | P2 | `animejs` was added to the root `package.json` for the assembly (#19); P2 to confirm |

## Next steps, in order

1. **P1 + P3:** put the Grok bar on the assembly screen. Ask Grok sends the current build and verdict to
   `/api/advise`, Apply runs the suggestion through the assembly's swap animation, mic plays `/api/voice`, Render
   shows `/api/render` on a final card.
2. **P1:** add a mission picker to the assembly (the demo needs Moon transfer).
3. **P2:** run the demo script on the live URL, keep the bug list, build the spec card, decide on QA issue 3 (4 % tank floor).
   **P4:** port #20 into the assembly's `physics.js` and regenerate its goldens; turn the fixed to-dos into real tests.
4. **Everyone:** Grok Bot planning session plus screenshots, Cursor prompt screenshots.
5. **All:** pass Gate 3, rehearse, then polish or start U1 as time allows.
