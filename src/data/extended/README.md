# Extended datasets (P4) — gathered, validated, not yet wired into the app

Everything the P4 data research collected beyond the five live tables in `src/data/*.json`. Nothing in this
folder is imported by the app yet: `src/data/index.ts` is unchanged, so the physics, the closest-rocket lookup and
P2's tests behave exactly as before. These files exist so the upgrade phases (U1 twin/roast, U3 historic stages)
and the "big dataset" closest-match pool have real, sourced data ready on day one.

`validate-extended.test.ts` runs in `npm test` and checks ids, sources, units and counts for every file below.

| File | Rows | What it is | Roadmap use |
|---|---|---|---|
| `reference-rockets.extended.json` | 20 | Reference rockets with `launches`, `failures`, `firstLaunchYear` and 2–4 `roastFacts` each (text + source URL). Includes N1 (4 launches / 4 failures), Space Shuttle, Energia, Saturn IB, Ariane 5/6, Vulcan, New Glenn, Soyuz, Proton, Long March 5B, H3, Electron. Same base fields as the live `ReferenceRocket` type plus the U1 fields (needs contract v2). | U1 twin + roast |
| `stages.gcat.json` | 49 | Curated historic stages from GCAT (15+ vehicles: Saturn V/IB, Falcon 9 v1.0/B5, Atlas V, Delta IV, Shuttle, SLS, N1, Energia, Soyuz, Proton, Ariane, H-II, Long March, Electron…) with SI masses, thrust, burn time, engine + count, propellant class, launch counts, and an `ispForApp_s` chosen per the research rules (`gcatIsp_s` from engines.tsv, never the inconsistent derived value). Every row lists its GCAT uncertainty flags. | U3 historic stages |
| `gcat-rockets.json` | 534 | Every orbital/deep-space launch vehicle variant in GCAT `lv.tsv` that has both a launch mass and a launch thrust, joined with its launch record from `launch.tsv` (489 of them have flown). Fields: name, variant, family, manufacturer, stages, length, diameter, liftoff mass/thrust, LEO/GTO capacity (null when GCAT has none), launches, failures, first/last year, flags. | Big closest-match pool ("you built something between a Zenit-2 and an Atlas V") |
| `gcat-launch-stats.json` | 553 | Launches / successes / failures / unknown / first and last year for every (vehicle, variant) that attempted an orbital launch: 7,196 attempts, 507 failures through 2026-10-17. | Roast + history lines |
| `engines.pending.json` | 8 | Raptor 2/3 (+ vacuum), BE-4, BE-3U, Vulcain 2/2.1: partially sourced, every gap is `null` with a `_todo` note. Not usable in the app until the gaps have sources. | Starship / Vulcan / Ariane 6 builds |
| `payloads.pending.json` | 1 | Crew Dragon + trunk: dimensions sourced, launch mass still `TODO(source)`. | Crewed demo |
| `field-sources.json` | — | Per-field provenance for the live tables: URL, tier (primary / secondary / wikipedia / cross-check-only / derived) and the quoted value. This is the machine-readable form of `src/data/SOURCES.md`. | Audits |
| `demo-build.candidates.json` | 2 | The two demo stories checked against P2's `evaluateBuild`: the legal one (F9 first stage + Delta cryogenic upper stage + JWST to the Moon: red → one swap → green) and the real Falcon 9 (needs the 4 % dry-mass rule relaxed to 3 %). | Phase 2 demo tuning |
| `gcat/lv.tsv`, `gcat/stages.tsv`, `gcat/engines.tsv` | 1837 / 1626 / 1551 | Raw GCAT snapshots (2026-10-17 release) so the derived tables can be regenerated offline. `launch.tsv` (14 MB) is not committed; `derive.mjs` downloads it on demand. | Regeneration |
| `gcat/derive.mjs` | — | `node src/data/extended/gcat/derive.mjs [path/to/launch.tsv]` regenerates `gcat-rockets.json` and `gcat-launch-stats.json`. No dependencies. | Regeneration |

## Licenses and attribution
- GCAT: J. McDowell, *General Catalog of Artificial Space Objects*, https://planet4589.org/space/gcat, Release 1.8.8,
  **CC BY 4.0**. Every derived row carries the attribution in its `source` field.
- Reference-rocket facts: manufacturer pages, NASA, Wikipedia permalinks; the URL is on every fact.
- The research write-up with the source comparison, license table and the physics findings for P2 (4 % rule,
  engine-fit rule) is in `docs/data-research/`.

## Known limits (do not paper over these)
- GCAT launch masses are coarse (0.1 t) and some rows are placeholders; the derived Isp in `stages.tsv` is
  physically impossible for ~10 stages, which is why `stages.gcat.json` uses `ispForApp_s` from `engines.tsv`.
- GCAT `lv.tsv` numbers can differ from manufacturer pages (e.g. Falcon 9 FT5 liftoff mass 480 t vs SpaceX 549 t).
  The live `reference-rockets.json` keeps the manufacturer value; `gcat-rockets.json` keeps GCAT's. Do not mix
  them in one lookup without saying which is which.
- `LEO_Capacity` / `GTO_Capacity` exist for only ~20 % of GCAT vehicles.
- `ariane-5-eca` in the extended reference list still has `payloadLEO_kg` marked `TODO(source)`.
