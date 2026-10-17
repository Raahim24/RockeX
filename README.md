# Rocket Configurator

**Real engine data decides whether your rocket works. Grok is your engineer.**

A 3D rocket build page, like a car configurator but for rockets. Pick a real mission, stack real engines and
tanks, and a bar turns red or green. The verdict comes from the rocket equation and sourced engine data, never
from an AI. Grok reads the build, explains what is wrong, suggests one fix you can apply in a click, says it out
loud, and renders a photoreal image of the exact rocket you built.

Built for the SpaceX x Cursor hackathon, theme "Make It Legendary". Live at **https://spaxe-x.vercel.app**.

## The demo in one minute

1. Mission: **Moon transfer**, 12.6 km/s of delta-v needed. Payload: **James Webb Space Telescope**.
2. The rocket: a real Falcon 9 first stage (9 × Merlin 1D) with an RL10B-2 hydrogen upper stage.
3. The bar is **red**: about 905 m/s short.
4. Grok suggests one fix and says it out loud: add a third stage. One click applies it.
5. The bar turns **green**: about +500 m/s of margin. Grok Imagine renders the rocket.

`src/store/demo.test.ts` proves this story with the real data on every `npm test`: red only because of delta-v,
one change, then green, with the 1.2 lift-off TWR rule passing both times.

## How it works

- **Code decides, Grok narrates.** Delta-v, thrust-to-weight, the legality rules and the closest real rocket are
  pure TypeScript in `src/lib/physics/`. Grok only explains the verdict and picks from fixes the code has already
  checked, so a bad model reply can never make the demo wrong.
- **Real data, every number sourced.** `src/data/` holds 11 engines, 12 tanks, 6 missions, 4 payloads and
  5 reference rockets. Every record has a source URL, and `src/data/SOURCES.md` quotes the exact value.
  `src/data/validate.test.ts` fails the build if a record loses its source or has impossible values.
- **Saved ahead of time.** The data is JSON in the repo, so no data API call can fail during a demo.
- **Every AI call has a fallback.** No key, a timeout or a bad reply still gives a rule-based message, a cached
  render and text without audio.

| Grok capability | Used for | Route |
|---|---|---|
| Chat (`grok-4.20-non-reasoning`, strict JSON) | The advisor message and one suggested fix | `POST /api/advise` |
| Voice (text to speech) | Speaking the advice | `POST /api/voice` |
| Imagine (`grok-imagine-image-2.0`) | Photoreal render of the build | `POST /api/render` |
| Grok Bot | Planning the build phases and splitting tasks | `docs/grok-bot/` |

## Run it locally

Needs Node 20 or newer.

```bash
npm install
```

Create `.env.local` in the repo root with your xAI key. It is read on the server only and is git-ignored.

```bash
XAI_API_KEY=your-key-here
```

```bash
npm run dev
```

Open http://localhost:3000. Without a key the app still works and every Grok feature uses its fallback.

Checks (run before every pull request):

```bash
npm run typecheck && npm run lint && npm test
```

## Stack

Next.js (App Router) and TypeScript, React Three Fiber and drei for the 3D, Zustand for state, Zod to validate
Grok's replies, Vitest for tests, Tailwind for styling, deployed on Vercel. Built with Cursor and Claude Code.

## Repo map

| Path | What it is | Owner |
|---|---|---|
| `src/types/` | The shared contract every part of the app codes against | P2 |
| `src/lib/physics/` | Rocket equation, TWR, legality rules, closest real rocket | P2 |
| `src/store/` | The build store and the canonical demo build | P2 |
| `src/components/specs/` | The verdict panel and feasibility bar | P2 |
| `src/lib/ai/`, `src/app/api/`, `src/components/grok/` | Grok client, prompts, routes, advisor bar, mic and render buttons | P3 |
| `src/components/scene/`, `src/components/parts/`, `src/app/page.tsx` | The 3D rocket and the parts panel | P1 |
| `src/data/` | Sourced data, `SOURCES.md`, validation | P4 |
| `src/data/extended/` | Data gathered for the upgrades (rocket histories, historic stages, the GCAT catalog), not yet used by the app | P4 |
| `docs/` | Spec, architecture, roadmap, AI prompts, data research, QA report, submission notes | All |

## Data sources and licenses

- Engine, stage and payload specs: manufacturer and agency documents (SpaceX, NASA, L3Harris, Aerojet,
  ULA, NOAA, FAA) first, Wikipedia permalinks only where no primary source publishes the number. Weak spots are
  listed honestly at the top of `src/data/SOURCES.md`.
- Mission delta-v budgets: the Wikipedia delta-v budget tables, which cite NASA and textbook values.
- Launch catalog: J. McDowell, *General Catalog of Artificial Space Objects* (GCAT),
  https://planet4589.org/space/gcat, CC BY 4.0.

## Team

| Role | Name |
|---|---|
| P1: 3D scene and UI | Raahim Khan |
| P2: physics, store and integration | Zayyan (zessani) |
| P3: Grok integration | Vikhyat Kulshrestha |
| P4: data, assets and submission | Bhumish Dayal |

Planning, the build spec and the roadmap are in `docs/`. The build spec is the source of truth: if code and spec
disagree, the spec wins.
