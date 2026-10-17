# Odd-build report (Phase 3, P4)

Run on main at `22d19dc` (2026-10-17). Test: `src/data/odd-builds.test.ts`, part of `npm test`.

## What was tested

- **Sweep:** every engine on every tank, with 1 and 9 engines, with and without an RL10C-1 upper stage, for every
  mission and payload plus "none": **18,480 builds** through P2's `evaluateBuild`.
- **Edge cases:** empty build, unknown ids, 0 / 50 / NaN engines, four stages, a full real Saturn V.
- **Real flown stages:** each engine on the tank it actually flew with, at its real engine count.
- **Advisor ranking:** which fix P3's `rankCandidates` puts first for the canonical demo build.
- **Advisor fallback:** what the advisor returns when Grok is unreachable.

## Result

No crashes. For every build the UI can create, every number is finite, delta-v is never negative, and `feasible`
always means delta-v and TWR both pass. A full Saturn V matches `saturn-v` and clears LEO with margin (the spec's
sanity test). The issues below are rule or robustness gaps, not data errors: every value involved matches its
primary source in `src/data/SOURCES.md`.

## Issues for owners

| # | Owner | Severity | Issue | Evidence | Suggested fix |
|---|---|---|---|---|---|
| 1 | P2, P3 | **High (demo)** | For the demo build, the advisor's top-ranked fix is not the documented `DEMO_FIX`. Rank 1 is "add RL10B-2 on Saturn V S-IVB tank" (+839 m/s), rank 2 "RL10B-2 on Centaur III" (+638 m/s). `DEMO_FIX` (RL10C-1 on Centaur III) is not in the top 3. The bar still turns green, but Grok will likely say a different fix than the script, and a 6.6 m stage on a 5 m stage looks wrong on screen. | `rankCandidates(DEMO_BUILD)` | Prefer `DEMO_FIX` when the build equals `DEMO_BUILD`, or rank stages wider than the stage below lower, or rewrite the demo script to the rank-1 fix. |
| 2 | P2 | Medium | The engine-fit rule `floor(0.6 x (D/d)^2)` allows only **4** F-1s on the S-IC (real: 5). A real Saturn V first stage cannot be built in the UI, which also blocks the U3 "Raptor on a Saturn V" demo with a real S-IC. | F-1 exit 3.531 m (NASA MSFC), S-IC 10.058 m | Raise the coefficient to 0.62 (gives exactly 5 F-1s and still 9 Merlins; 0.75 would allow 6), or use per-tank max counts from data. |
| 3 | P2 | Medium | The 4 % tank floor blocks two real tanks: Falcon 9 second stage (3.23 %) and Shuttle External Tank (3.71 %). The real Falcon 9 can't be the demo for this reason. | `falcon9-s2-tank`, `shuttle-et-tank` | Lower the floor to 3 %, as `src/data/extended/demo-build.candidates.json` already suggests. |
| 4 | P2 | Low | `evaluateBuild` does not check engine counts. 0 engines gives 8.3 km/s with no engines, 50 Merlins evaluates with no warning, and NaN returns NaN numbers that would print as "NaN". The store clamps counts, so only a bypass of the store hits this. | Edge cases in the test | Treat counts outside 1..9 or non-integers as a blocking warning in `evaluateBuild`. |
| 6 | P3 | **High (demo backup)** | When Grok fails, `fallbackAdvice` always returns `suggestion: null`, so Apply suggestion disappears. The spec's backup plan says Apply should still work offline using the built-in demo fix, and `buildStore.ts` describes `DEMO_FIX` as "also the advisor's built-in fallback", but nothing uses it that way. | `src/lib/ai/prompts.ts` `fallbackAdvice` | In the fallback, return `DEMO_FIX` when the build equals `DEMO_BUILD` (or the top code-ranked candidate for any build). |
| 5 | P2 | Low | With a vacuum engine on the booster (0 sea-level thrust), `closestRocketId` is an empty string. The build is already blocked, and the panel shows "—", so this is cosmetic. | 6,720 sweep builds | Fall back to a mass-only match when thrust is 0. |

Issues 2 to 4 are recorded as `it.todo` entries in `src/data/odd-builds.test.ts`; flip them to real tests once
fixed. Issues 1 and 6 need P2 and P3 before the Phase 3 demo rehearsal: both affect what the judges see.

## Real flown stages against the rules

| Engine x count on tank | Fit rule max | Dry / propellant | Blocking warnings as a booster |
|---|---|---|---|
| 9 x Merlin 1D on Falcon 9 S1 | 9 | 5.22 % | none |
| 1 x Merlin 1D Vac on Falcon 9 S2 | 1 | **3.23 %** | tank floor, plus vacuum-only (expected) |
| 5 x F-1 on Saturn V S-IC | **4** | 4.12 % | none (5 only possible outside the store) |
| 5 x J-2 on Saturn V S-II | 9 | 6.38 % | TWR (expected, upper stage) |
| 4 x RS-25 on SLS core | 8 | 8.49 % | TWR (expected without boosters) |
| 3 x RS-25 on Shuttle ET | 8 | **3.71 %** | tank floor, TWR (expected without boosters) |
| 1 x RD-180 on Atlas V CCB | 1 | 5.48 % | none |
| 1 x RS-68A on Delta IV CBC | 2 | 10.06 % | none |
