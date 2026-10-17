# Data sources

Owner: P4. Every record in `src/data/*.json` has a `source`. This file records where each number came from, which primary reference the cited page uses, and any arithmetic applied. Phase 0 stubs; Phase 1 re-verifies every value against primary sources and extends the set.

Wikipedia links are revision permalinks (`oldid`), so the cited numbers can't drift.

Conversions: 1 lb = 0.45359237 kg, 1 lbf = 4.4482216 N, 1 in = 0.0254 m.

## Conventions

- **Vacuum-only engines** have `thrustSL_kN: 0` and `ispSL_s: 0`. They are not rated at sea level. Physics (P2) should treat `thrustSL_kN === 0` as vacuum-only and block them on stage 0.
- **Tanks** are not catalog parts. A tank is a real flown stage minus its engines: `dryMass_kg = stage empty mass - engineCount x engine mass`. `height_m` is the full stage height.
- **Payload** has no `source` field in the contract. The JSON carries one anyway; it is ignored by the type.

## Engines

| id | Value | Number | Cited page's reference |
|---|---|---|---|
| merlin-1d | thrustSL / thrustVac | 845 / 981 kN | SpaceX *Falcon User's Guide*, April 2020 |
| merlin-1d | ispSL / ispVac | 282 / 311 s | SpaceX Falcon 9 page (2013, archived). Wikipedia flags it as outdated; re-verify |
| merlin-1d | mass | 1,030 lb = 467 kg | Tom Mueller (Quora, 2015). Weak; replace in Phase 1 |
| merlin-1d | diameter | 0.92 m | Uncited in Wikipedia infobox; replace in Phase 1 |
| rl10c-1 | thrustVac | 22,820 lbf = 101.5 kN | NASA NTRS 20110015783 (*Cryogenic Propulsion Stage*, 2011) |
| rl10c-1 | ispVac | 449.7 s | same |
| rl10c-1 | mass | 420 lb = 190.5 kg | same |
| rl10c-1 | diameter | 4 ft 9 in = 1.45 m | same |

## Tanks

| id | Value | Number | Source |
|---|---|---|---|
| falcon9-s1-tank | diameter, height | 3.7 m, 41.2 m | Wikipedia Falcon 9, Specifications, first stage |
| falcon9-s1-tank | propellant | 395,700 kg | same |
| falcon9-s1-tank | dry | 25,600 - 9 x 467 = 21,397 kg | same, minus Merlin 1D mass above |
| centaur-iii-tank | diameter, height | 3.05 m, 12.68 m | Wikipedia Centaur, Centaur III infobox (cites Atlas V User's Guide 2010) |
| centaur-iii-tank | propellant | 20,830 kg | same |
| centaur-iii-tank | dry | 2,247 - 190.5 = 2,056.5 kg | same (single-engine empty mass), minus RL10C-1 mass above |

## Payloads

| id | Value | Number | Source |
|---|---|---|---|
| nova-c | mass, height | 1,908 kg, 3.938 m | Wikipedia Intuitive Machines Nova-C, Design (cites Intuitive Machines, NSSDCA) |
| nova-c | diameter | 2 m | same, infobox |

## Missions

`requiredDeltaV_ms` is from Earth's surface and already includes gravity and drag losses. Never subtract them again.

| id | Number | Source |
|---|---|---|
| leo | 9,300 m/s | Wikipedia Delta-v budget, Earth-Moon table: Earth to LEO 9.3-10 km/s (lower bound used) |
| moon-transfer | 9,300 + 3,200 = 12,500 m/s | same page: LEO to TLI 3.20 km/s |

## Reference rockets

| id | Value | Number | Source |
|---|---|---|---|
| falcon-9 | liftoff mass | 549,000 kg | Wikipedia Falcon 9 Full Thrust infobox (cites spacex.com) |
| falcon-9 | liftoff thrust (SL) | 7,607 kN | same |
| falcon-9 | payload to LEO (expended) | 22,800 kg | same |
| falcon-9 | stages | 2 | same |
