# Submission notes (draft)

Owner: P4. Pitch, requirement proof, demo script and submission checklist. Everything unchecked must be done
before the code freeze.

## Pitch (one paragraph)

Rocket design is hidden in spec tables and textbooks, so most people never see why a rocket works or fails.
Rocket Configurator turns that data into something you can build with: pick a real mission, stack real engines
and tanks in 3D, and the rocket equation decides, live, whether it can get there. Grok is your flight engineer:
it reads the verdict, explains it in plain words, suggests one fix you can apply in a click, says it out loud,
and renders the exact rocket you built. The data matters because it is the judge: every engine, tank and mission
number is sourced and tested, and no AI is allowed to do the math.

## How we meet each requirement

| Requirement | How we meet it | Proof to submit |
|---|---|---|
| Real space data | Sourced engines, stages, missions, payloads and reference rockets drive the verdict; the GCAT launch catalog backs the upgrades | `src/data/SOURCES.md`, `src/data/validate.test.ts`, the red to green bar in the demo |
| Built with Cursor | Every phase built with scoped prompts per person, one rules file per person | Screenshots of prompts and `.cursor/rules/`, commit history (TODO screenshots) |
| Grok Imagine | Photoreal render of the exact build | The render on the final card |
| Grok Voice | Grok speaks its advice | Live audio in the demo, cached clip as backup (TODO clip) |
| Grok Bot (bonus) | Used to plan phases and split tasks | Screenshots in `docs/grok-bot/` (TODO) |

## Demo script (about 90 seconds)

Numbers below are from the canonical demo build and are checked by `src/store/demo.test.ts`.

| Time | Say | Do |
|---|---|---|
| 0:00 | "Real engine data decides whether your rocket works. Grok is your engineer." | App open on the demo build, mission Moon transfer |
| 0:10 | "We're sending the James Webb telescope toward the Moon. That needs 12.6 kilometers per second." | Point at the required delta-v, orbit the rocket once |
| 0:25 | "Real Falcon 9 booster, real hydrogen upper stage, real rocket equation. We're about 900 meters per second short." | Point at the red bar |
| 0:35 | "Grok reads the build and tells me what to fix." | Press the mic; Grok speaks the fix |
| 0:50 | "One click applies it." | Press Apply suggestion; the bar turns green, about 500 m/s of margin |
| 1:00 | "Now I make it mine." | Change the paint and mission patch |
| 1:10 | "Grok Imagine renders the exact rocket I built." | Press Render it; show the render and the closest real rocket |
| 1:25 | "Real data in, a rocket you can trust out. Built in Cursor." | Hold on the final card |

Open risk (issue 1 in `docs/qa/odd-builds.md`): the advisor picks from fixes ranked by the code, and for the demo
build the top-ranked fix is not the documented one (RL10C-1 on Centaur III). The bar still turns green, but the
spoken fix may differ from what the narrator expects. Rehearse with the live advisor and adjust the 0:35 and 0:50
lines to what it actually says, or wait for P2 and P3 to pin the demo fix.

## If something fails live

| What fails | What the audience sees | Narrator line |
|---|---|---|
| Grok advise | A rule-based message from the verdict ("You are 905 m/s short…"). Today there is no Apply button in this case (issue 6 in `docs/qa/odd-builds.md`); until it is fixed, add the stage by hand | "Even offline, the code knows what's wrong." |
| Grok Voice | Text only, no error | Read the message aloud |
| Grok Imagine | The cached render with a small "cached" label | "Here's one we rendered earlier." |
| Wifi or Vercel | Local build on the demo laptop (`npm run build && npm run start`) | Carry on |

## Submission checklist

- [ ] Live app link on Vercel, tested on a second device
- [x] Repo link with a README that explains the idea and how to run it
- [ ] Demo video or screen recording, 60 to 90 seconds, as a backup
- [ ] Screenshots of Cursor prompts and the rules files
- [ ] Screenshots of the Grok Bot planning session (`docs/grok-bot/`)
- [x] `SOURCES.md` listing where every real number came from
- [x] One paragraph pitch (above)
- [x] Team names and roles (in the README; confirm the spellings)
