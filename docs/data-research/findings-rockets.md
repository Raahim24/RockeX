# Reference rockets: sourced data

**Compiled:** 2026-10-17. Every number below comes from a page or API response fetched in this session. Each one has its URL and a short verbatim quote. Anything I could not source is marked `TODO(source)`.

## Conventions

- **Units.** SI throughout. lbf→kN ×0.0044482216152605 and lb→kg ×0.45359237, with the original values shown. Tonne-force (tf, used by SpaceX and RussianSpaceWeb) →kN ×9.80665, the standard-gravity definition.
- **liftoffThrust_kN.** Sea-level thrust of everything lit at liftoff. Where a source gives only per-engine values, the total is computed and the arithmetic is shown.
- **stages.** Inline core stages only. Strap-on boosters are **not** counted and are listed separately in each table. For example, Falcon Heavy = 2 stages + 2 side boosters. The stage count each source itself uses is also recorded, because Russian practice calls the strap-ons "stage 1" and Wikipedia uses "2.5" and similar.
- **failures** in the extended JSON = full failures + partial failures, meaning any launch that did not fully succeed. Pad accidents that were not launches are excluded. Disagreements are called out.
- **Launch-count "as of".** Launch Library 2 (LL2) API v2.3.0 was snapshotted on 2026-10-17, using `GET https://ll.thespacedevs.com/2.3.0/launcher_configurations/?limit=100&offset={0..500}&mode=detailed`, which returned 532 configs. The SpaceX stats API and Wikipedia were also fetched 2026-10-17. Wikipedia revision timestamps are given where relevant.
- **LL2 units.** `launch_mass` is in **tonnes**, `to_thrust` in **kN** and `leo_capacity` in **kg**. LL2 quotes below are the raw JSON fields. Each config's canonical URL is `https://ll.thespacedevs.com/2.3.0/launcher_configurations/{id}/`.
- **SpaceX site.** spacex.com is an Angular app. The spec text is held in JS bundles that the vehicle pages load, so I cite both the page URL and the bundle URL. Launch counters come from SpaceX's CMS API.
- **Not used.** GCAT (planet4589) and Space Launch Report were not fetched. The cross-checks here are LL2 and Wikipedia, plus RussianSpaceWeb for N1 and Energia.

---

## CORE 5

### 1. Falcon 9 Block 5 (`falcon-9-block-5`)

| field | value (SI) | original | URL | verbatim quote |
|---|---|---|---|---|
| liftoffMass_kg | **549,054** | 549,054 kg / 1,207,920 lbs | https://www.spacex.com/vehicles/falcon-9/ (bundle https://www.spacex.com/2343.25ddd7bb77e7b318.js) | `{label:"Mass",value:"549,054 kg",secondValue:" / 1,207,920 lbs"}` |
| note | SpaceX's own lb figure converts to 547,903 kg, so the two units on the page do not match exactly. The kg value is used. | | | |
| liftoffThrust_kN | **7,607** | 7,607 kN / 1,710,000 lbs (1,710,000 lbf → 7,606.5 kN) | same bundle | `{label:"Number of engines",value:"9"},{label:"Thrust at sea level",value:"7,607 kN",secondValue:" / 1,710,000 lbs"}` |
| payloadLEO_kg | **22,800 (EXPENDABLE)** | 22,800 kg / 50,265 lbs | same bundle | `{label:"Payload to LEO",value:"22,800 kg",secondValue:" / 50,265 lbs"}` |
| expendable caveat | The SpaceX page itself does not say "expendable". Wikipedia does. | | https://en.wikipedia.org/wiki/Falcon_9 | `'''FT''': {{cvt |22800|kg}} when expended,` |
| payloadLEO reusable (secondary, not SpaceX-published on the vehicle page) | 17,500 | 17,500 kg | https://en.wikipedia.org/wiki/Falcon_9 | `{{cvt|17500|kg}} when landing on [[Autonomous spaceport drone ship|drone ship]]` (Wikipedia's citation for this is an Elon Musk post on X) |
| stages | **2** (no strap-ons) | | https://www.spacex.com/vehicles/falcon-9/ | `Falcon 9 is a reusable, two-stage rocket` |
| cross-check LL2 #164 | 549 t, 7,607 kN, 22,800 kg | | https://ll.thespacedevs.com/2.3.0/launcher_configurations/164/ | `"full_name": "Falcon 9 Block 5"`, `"launch_mass": 549.0`, `"leo_capacity": 22800.0`, `"to_thrust": 7607.0` |
| launches (Block 5) | **640** (LL2) / 638 (Wikipedia) | | LL2 #164; Wikipedia template | LL2: `"total_launch_count": 640, "successful_launches": 639, "failed_launches": 1`. Wikipedia `{{Falcon rocket statistics|F9FTBlock5launch}}` expanded to `B5launch=638;B5success=637;B5fail=1` (template data rev 2026-10-13) |
| launches (all Falcon 9 versions) | 694 | | https://content.spacex.com/api/spacex-website/falcon-nine-stats | `{"totalLaunches":694,"totalLandings":647,"totalReflights":613}`. Wikipedia `F9launch=694;F9success=691` agrees. |
| failures (Block 5) | **1** | | Wikipedia infobox | `'''FT Block 5''': Starlink Group 9-3` |
| firstLaunchYear | **2018** | | LL2 #164 / Wikipedia | `"maiden_flight": "2018-05-11"`; `'''FT Block 5''': May 11, 2018 ([[Bangladesh Satellite-1]])` |
| disagreement | LL2 counts 640 Block 5 launches and Wikipedia 638, both as of 2026-10-17. SpaceX publishes only an all-Falcon-9 total. | | | |

### 2. Falcon Heavy (`falcon-heavy`)

| field | value | original | URL | quote |
|---|---|---|---|---|
| liftoffMass_kg | **1,420,788** | 1,420,788 kg / 3,125,735 lbs | https://www.spacex.com/vehicles/falcon-heavy/ (bundle https://www.spacex.com/5767.5b4a8d45f1daeb84.js) | `{label:"Mass",value:"1,420,788 kg",secondValue:" / 3,125,735 lbs"}` (the lb converts to 1,417,810 kg, another small unit mismatch) |
| liftoffThrust_kN | **22,819** | 22,819 kN / "5,130,00 lbs" (sic, typo on SpaceX site; 5,130,000 lbf → 22,819.4 kN) | same bundle | `{label:"Number of engines",value:"27"},{label:"Thrust at sea level",value:"22,819 kN",secondValue:" / 5,130,00 lbs"}` |
| payloadLEO_kg | **63,800 (fully expendable)** | 63,800 kg / 140,660 lbs | same bundle; caveat from Wikipedia | `{label:"Payload to LEO",value:"63,800 kg",secondValue:" / 140,660 lbs"}`. Wikipedia: `{{cvt|63800|kg}} when fully expended` (with efn "Theoretical, would need a custom payload adapter") |
| reusable LEO | TODO(source). Wikipedia gives 57,000 kg (boosters recovered), but it carries a `{{Citation needed}}` tag, so it is not used. | | https://en.wikipedia.org/wiki/Falcon_Heavy | `{{cvt|57000|kg}} with boosters recovered{{Citation needed|date=December 2024}}` |
| stages | **2** core stages + **2** side boosters (Wikipedia says "2.5"; LL2 `min_stage`/`max_stage` = 3) | | SpaceX bundle; Wikipedia | `Falcon Heavy is composed of three reusable Falcon 9 nine-engine cores`; Wikipedia `| stages = 2.5`; LL2 `"min_stage": 3, "max_stage": 3` |
| cross-check LL2 #161 | 1,400 t, 22,819 kN, 63,800 kg | | https://ll.thespacedevs.com/2.3.0/launcher_configurations/161/ | `"launch_mass": 1400.0`, `"to_thrust": 22819.0`, `"leo_capacity": 63800.0` |
| launches | **14** | | https://content.spacex.com/api/spacex-website/falcon-heavy-stats | `{"totalLaunches":14,"totalLandings":25,"totalReflights":21}`. LL2: `"total_launch_count": 14, "successful_launches": 14, "failed_launches": 0`. Wikipedia: `| launches = 14 | success = 14` |
| failures | **0** | | as above | |
| firstLaunchYear | **2018** | | Wikipedia | `| first = February 6, 2018 ([[Falcon Heavy test flight|test flight]])` |

### 3. Saturn V (`saturn-v`)

| field | value | original | URL | quote |
|---|---|---|---|---|
| liftoffMass_kg | **2,800,000** | 2.8 million kg (6.2 million lb → 2,812,273 kg) | https://www.nasa.gov/learning-resources/for-kids-and-students/what-was-the-saturn-v-grades-5-8/ | `Fully fueled for liftoff, the Saturn V weighed 2.8 million kilograms (6.2 million pounds), the weight of about 400 elephants.` |
| alt mass | Wikipedia 6,221,823–6,537,238 lb (2,822,171–2,965,241 kg); LL2 2,970 t | | https://en.wikipedia.org/wiki/Saturn_V ; LL2 #93 | `| mass = {{cvt|6,221,823|to|6,537,238|lb|order=flip}}`; `"launch_mass": 2970.0` |
| liftoffThrust_kN | **34,500** | 34.5 million N (NASA's own lbf figure: 7.6 million lbf → 33,806 kN, which does not match its N figure) | NASA page above | `The rocket generated 34.5 million newtons (7.6 million pounds) of thrust at launch, creating more power than 85 Hoover Dams.` |
| alt thrust | Wikipedia S-IC 7,500,000 lbf → 33,362 kN; LL2 35,100 kN. Wikipedia's lead also says 34.5 MN. | | Wikipedia; LL2 #93 | `| thrust = {{cvt|7,500,000|lbf|kN|order=flip}} at sea level`; `At 34.5 meganewtons, it is the fourth most powerful rocket by thrust at launch`; `"to_thrust": 35100.0` |
| payloadLEO_kg | **118,000** (NASA) | about 118,000 kg (130 tons) | NASA page | `It could launch about 118,000 kilograms (130 tons) into Earth orbit.` |
| alt LEO | 140,000 kg (Wikipedia, LL2). Wikipedia notes this figure *includes the S-IVB third stage and its remaining propellant*. | | Wikipedia; LL2 | `The Saturn V holds the record for the largest payload capacity to low Earth orbit, 140,000 kg (310,000 lb), which included the S-IVB third stage with remaining propellant`; `"leo_capacity": 140000.0` |
| stages | **3** | | Wikipedia; LL2 | `| stages = 3`; `"min_stage": 3, "max_stage": 3` |
| launches | **13** | | Wikipedia; LL2 | `| launches = 13 | success = 12 | partial = 1 ([[Apollo 6]])`; LL2 `"total_launch_count": 13, "successful_launches": 12, "failed_launches": 1` |
| failures | **1** (Apollo 6 *partial*; LL2 counts it as failed) | | as above | |
| firstLaunchYear | **1967** | | Wikipedia | `| first=November 9, 1967 (AS-501 [[Apollo 4]])` |

### 4. Starship: Super Heavy + Starship, V3 (`starship`). TARGET FIGURES, FLAGGED

| field | value | original | URL | quote |
|---|---|---|---|---|
| liftoffMass_kg | **5,250,000**. Flagged: likely propellant-only. | LL2 V3: 5,250 t | https://ll.thespacedevs.com/2.3.0/launcher_configurations/522/ | `"full_name": "Starship V3"`, `"launch_mass": 5250.0` |
| caveat | 5,250 t equals SpaceX's two *propellant capacities* added together (3,650 t + 1,600 t). It probably leaves out dry mass and payload. SpaceX does not publish a gross liftoff mass on the page. Wikipedia gives a generic 5,000 t. | | SpaceX bundle https://www.spacex.com/2337.c79c2132bc6aff75.js ; https://en.wikipedia.org/wiki/SpaceX_Starship | `{label:"Propellant capacity",value:"3,650 t",secondValue:" / 8 Mlb"}` (Super Heavy); `{label:"Propellant capacity",value:"1,600 t",secondValue:" / 3.5 Mlb"}` (Starship); Wikipedia `| mass = {{cvt|5000|t|lb}}` |
| liftoffThrust_kN | **80,807** | 8,240 tf (×9.80665 = 80,806.8 kN) / 18.1 Mlbf (→ 80,513 kN) | https://www.spacex.com/vehicles/starship/ (bundle above) | `{label:"Thrust",value:"8,240 tf",secondValue:" / 18.1 Mlbf"}` (Super Heavy tile; `Powered by 33 Raptor engines`) |
| cross-check | LL2 V3 80,807 kN matches. Wikipedia stage-1 figure is 89.5 MN, which disagrees. | | LL2 #522; Wikipedia | `"to_thrust": 80807.0`; `|thrust = {{Cvt|89.5|MN}}` |
| payloadLEO_kg | **100,000**. TARGET, "100+ t", fully reusable. Not demonstrated. | 100+ t | SpaceX bundle | `designed to carry more than 100 metric tonnes to orbit in a fully reusable configuration.` / `{label:"Payload capacity",value:"100+ t"}` |
| alt payload | Wikipedia: Block 1 15 t, Block 2 35 t, Block 3 100 t, Block 4 200 t (est.) | | Wikipedia | `'''Block 3''': {{cvt|100|t|lb}}` |
| stages | **2** | | Wikipedia; LL2 | `| stages = 2`; `"min_stage": 2, "max_stage": 2` |
| launches (all versions) | **14** | | Wikipedia; LL2 V1 (#464), V2 (#527) and V3 (#522) added together | Wikipedia lead: `As of September 28, 2026, Starship has launched 14 times, with 9 successful flights and 5 failures.` Wiki template: `SS=14;SSok=9;SSfail=5;B1=6;B2=5;B3=3;B3ok=3`. LL2: V1 `6/4/2`, V2 `5/2/3`, V3 `3/3/0` (total/ok/fail) = 14/9/5 |
| failures | **5** (all versions); V3 alone 0 of 3 | | as above | |
| firstLaunchYear | **2023** | | Wikipedia | `| first = {{start date and age|2023|4|20}}` |

### 5. SLS Block 1 (`sls-block-1`)

| field | value | original | URL | quote |
|---|---|---|---|---|
| liftoffMass_kg | **2,603,000** | 5.74 million lb (2,603 t); 5.74e6 lb → 2,603,620 kg | https://www.nasa.gov/wp-content/uploads/2022/03/sls-reference-guide-2022-v2-508-0.pdf (p. 8 "SLS Block 1 by the Numbers") | `Weight: 5.74 million lbs. (2,603 t) fueled` |
| alt mass | NASA Dec 2025 fact sheet and elsewhere in the same guide: 5.75 million lb (2,608 t). NASA disagrees with itself by about 5 t. LL2: 2,628 t. | | https://www.nasa.gov/wp-content/uploads/2026/03/sls-5640-sls-fact-sheet-dec2025-508.pdf ; ref guide; LL2 #143 | `stands 322 ft. — taller than the Statue of Liberty — and weighs 5.75 million lbs. fueled`; `The weight of the entire 5.75 million-lbs. (2,608 t) rocket rests on the booster aft skirts.`; `"launch_mass": 2628.0` |
| liftoffThrust_kN | **36,786** (NASA "launch thrust") | 8.27 million lbf (36,786 kN) | ref guide p. 8 | `Launch thrust: 8.27 million lbs. (36,786 kN)` |
| alt thrust | "Maximum thrust" 8.8 million lbf (39,144 kN). This is the commonly quoted figure, and it is what Wikipedia and LL2 (39,000) use, but it is a peak, not the liftoff value. | | ref guide; fact sheet; LL2 | `Maximum thrust: 8.8 million lbs. (39,144 kN)`; `SLS produces 8.8 million lbs. of maximum thrust, 15% more thrust than the Saturn V rocket.`; `"to_thrust": 39000.0` |
| payloadLEO_kg | **95,000** | 209,439 lb (95 t) | ref guide p. 8 | `Single-launch payload to low-Earth orbit: 209,439 lbs. (95 t)` |
| stages | **2** core stages (core stage + ICPS) + **2** five-segment SRBs. Wikipedia: "2½". | | NASA fact sheet; Wikipedia | `powered by twin five-segment solid rocket boosters in addition to the four RS-25 liquid propellant engines. After reaching space, the interim cryogenic propulsion stage (ICPS)`; `| stages = {{frac|2|1|2}}` |
| launches | **2** (Artemis I 2022, Artemis II Apr 2026) | | Wikipedia; LL2 #143 | `| launches = 2 | success = 2`; `"total_launch_count": 2, "successful_launches": 2, "failed_launches": 0` |
| failures | **0** | | | |
| firstLaunchYear | **2022** | | Wikipedia | `| first = November 16, 2022` |

---

## EXTENDED (15 more, 20 total)

### 6. N1 (`n1`): 4 launches, 4 failures, CONFIRMED by 3 independent sources

| field | value | original | URL | quote |
|---|---|---|---|---|
| liftoffMass_kg | **2,750,000** | 2,750,000 kg | https://en.wikipedia.org/wiki/N1_(rocket) ; LL2 #114 | `|mass = {{cvt|2750000|kg}}`; `"launch_mass": 2750.0` |
| alt mass | RussianSpaceWeb: 2,783–2,825 t | | https://www.russianspaceweb.com/n1.html | `Liftoff mass 2,783-2,825 tons` |
| liftoffThrust_kN | **45,780** (Block A, sea level) | 45,780 kN | Wikipedia | `{{abbr|SL|at sea level}}: {{cvt|45780|kN}}` |
| alt thrust | LL2 45,400 kN; RSW 4,500 t-force → 44,130 kN | | LL2; RSW | `"to_thrust": 45400.0`; `Liftoff thrust 4,500 tons` |
| payloadLEO_kg | **95,000** (all three sources agree; design figure, never achieved) | | Wikipedia; LL2; RSW | `{{cvt|95000|kg}}`; `"leo_capacity": 95000.0`; `Payload mass to low Earth orbit, LEO 95 tons` |
| stages | **5** (inline: Blocks A, B, V plus L3's Blocks G, D; no strap-ons). RSW counts the launcher alone as 3 stages. | | Wikipedia; LL2; RSW | `|stages = 5`; `"max_stage": 5`; RSW: `Total mass of liquid oxygen oxidizer (three stages: Block A, B and V)` |
| launches / failures | **4 / 4** | | Wikipedia; LL2; RSW | Wikipedia: `|launches = 4 |success = 0 |fail = 4` and `All four launch attempts between 1969 and 1972 failed.` LL2: `"total_launch_count": 4, "successful_launches": 0, "failed_launches": 4`. RSW: `the N1's catastrophic failures during four test launches on Feb. 21 and July 3 , 1969, June 27, 1971 , and Nov. 23, 1972` |
| firstLaunchYear | **1969** | | Wikipedia | `|first=21 February 1969` |

### 7. Space Shuttle / STS (`space-shuttle`)

| field | value | original | URL | quote |
|---|---|---|---|---|
| liftoffMass_kg | **2,041,166** | 4.5 million lb | https://www.nasa.gov/reference/the-space-shuttle/ | `Liftoff Weight* 4.5 million pounds ... * weight varied depending on payloads and on board consumables.` |
| alt | Wikipedia 2,030,000 kg; LL2 2,030 t | | Wikipedia; LL2 #493 | `| mass = {{cvt|2030000|kg}}`; `"launch_mass": 2030.0` |
| liftoffThrust_kN | **28,580** (computed) | 3 × 375,000 lbf SSME (sea level) + 2 × 2,650,000 lbf SRB = 6,425,000 lbf → 28,579.8 kN | NASA page above | `produce a sea level thrust of 179,097 kilograms (375,000 pounds)`; `SRB Stats Thrust at lift-off 2,650,000 pounds` |
| alt thrust | The same NASA page also says SRBs "some 5.8 million pounds" combined, "six million pounds", and a "total (7.8 million pounds)" ET load. NASA contradicts itself here. LL2: 28,200 kN. | | NASA; LL2 | `the External Tank absorbs the total (7.8 million pounds) thrust loads`; `"to_thrust": 28200.0` |
| payloadLEO_kg | **27,500** | 27,500 kg to 204 km | Wikipedia; LL2 | `| altitude = {{cvt|204|km}} | mass = {{cvt|27500|kg}}`; `"leo_capacity": 27500.0`. TODO(source): NASA primary figure not found on the fetched page. |
| stages | **1** core (orbiter + ET) + **2** SRBs. Wikipedia "1½"; LL2 2. | | Wikipedia; LL2 | `| stages = 1½`; `"max_stage": 2` |
| launches / failures | **135 / 2** (Challenger = launch failure; Columbia = reentry failure, so only 1 *launch* failure) | | Wikipedia; LL2 | `| launches = 135 | success = 133 | fail = 2`; `"total_launch_count": 135, "successful_launches": 133, "failed_launches": 2` |
| firstLaunchYear | **1981** | | Wikipedia | `| first = April 12, 1981 ([[STS-1]])` |

### 8. Atlas V 551 (`atlas-v-551`). Chosen over 401 because LL2's 401 mass (590 t, the same as the generic Atlas V figure) looks wrong for a 401.

| field | value | original | URL | quote |
|---|---|---|---|---|
| liftoffMass_kg | **573,000** (LL2, 551-specific) | 573 t | LL2 #27 | `"full_name": "Atlas V 551"`, `"launch_mass": 573.0` |
| alt | Wikipedia generic Atlas V 590,000 kg. ULA gives no gross mass on the fetched pages, so this is TODO(source) for a primary figure. | | https://en.wikipedia.org/wiki/Atlas_V | `| mass = {{cvt|590000|kg}}` |
| liftoffThrust_kN | **12,269** (LL2) | RD-180 3,827 kN + 5 SRB (LL2 total = 3,827 + 5 × 1,688.4 AJ-60A) | LL2 #27; ULA | `"to_thrust": 12269.0`; ULA: `It delivers 3,827 kN (860,300 lbf) of thrust at sea level.` |
| alt | With GEM 63 SRBs (1,663 kN each per Wikipedia) the total is 12,142 kN. Atlas V switched from AJ-60A to GEM 63 boosters in Nov 2020. ULA gives SRB thrust only as "Peak Vacuum Thrust: 380,000 lbs". | | Wikipedia; https://www.ulalaunch.com/rockets/atlas-v | `| thrust = {{cvt|1688.4|kN}}` / `| thrust = {{cvt|1663|kN}}`; `switched to Graphite-Epoxy Motor (GEM 63) boosters beginning in November 2020` |
| payloadLEO_kg | **18,850** | 18,850 kg / 41,570 lb (LEO-REF 200 km, 28.7°) | https://www.ulalaunch.com/rockets/atlas-v ; https://www.ulalaunch.com/docs/default-source/rockets/atlas-v-and-delta-iv-technical-summary.pdf | `551 3,850 kg 8,500 lbs 8,900 kg 19,620 lbs 18,850 kg 41,570 lbs` (columns GEO, GTO, LEO 28.7°) |
| stages | **2** + **5** SRBs | | Wikipedia; ULA | `| stages = 2`; `the 500 series can support up to five SRBs` |
| launches / failures | **23 / 0** (551 only) | | Wikipedia; LL2 | `'''551:''' 23` (launches and successes); `"total_launch_count": 23, "successful_launches": 23, "failed_launches": 0` |
| firstLaunchYear | **2006** | | LL2 | `"maiden_flight": "2006-01-19"` |

### 9. Delta IV Heavy (`delta-iv-heavy`)

| field | value | original | URL | quote |
|---|---|---|---|---|
| liftoffMass_kg | **733,000** | | Wikipedia; LL2 #21 | `| mass = {{cvt|733000|kg}}`; `"launch_mass": 733.0`. TODO(source): ULA primary not found. |
| liftoffThrust_kN | **9,411** (computed) | 3 × RS-68A at 3,137 kN (705,250 lbf) | https://www.ulalaunch.com/docs/default-source/rockets/delta-iv-heavy-cutaway.pdf | `The RS-68A ... delivers 3,137 kN (705,250 lbf) of thrust at sea level.` / `employs three CBCs` |
| disagreement | ULA web page: RS-68A 702,000 lbs → 3 × = 9,368 kN. LL2: 8,674 kN, which appears to be original-RS-68 era. Wikipedia: 3,140 kN per CBC. | | https://www.ulalaunch.com/rockets/delta-iv ; LL2 | `Nominal Thrust (sea level): 702,000 lbs`; `"to_thrust": 8674.0` |
| payloadLEO_kg | **28,370** | 28,370 kg / 62,540 lb (LEO-REF) | ULA page + tech summary | `Heavy 6,580 kg 14,500 lbs 14,210 kg 31,330 lbs 28,370 kg 62,540 lbs` |
| stages | **2** + **2** CBC side boosters | | Wikipedia | `|type = booster |number = 2` |
| launches / failures | **16 / 1** (2004 demo = partial) | | Wikipedia; LL2 | `| launches = 16 | success = 15 | partial = 1`; `"failed_launches": 1` |
| firstLaunchYear | **2004** | | Wikipedia | `| first = December 21, 2004` |

### 10. Ariane 5 ECA (`ariane-5-eca`): ECA and ECA+ combined

| field | value | original | URL | quote |
|---|---|---|---|---|
| liftoffMass_kg | **780,000** (LL2) | 780 t | LL2 #20 | `"full_name": "Ariane 5 ECA"`, `"launch_mass": 780.0` |
| alt | Wikipedia 777,000 kg (the variant is unclear; Wikipedia itself flags this) | | https://en.wikipedia.org/wiki/Ariane_5 | `| mass = {{cvt|777000|kg}}{{Clarify|...reason=which variant of Ariane 5 is this?` |
| liftoffThrust_kN | **11,400** (LL2) | | LL2 #20 | `"to_thrust": 11400.0` |
| disagreement | Wikipedia: 2 boosters (GS/ECA/ES) total 14,160 kN, *before* adding the Vulcain 2. This conflicts with LL2. | | Wikipedia | `| diff = GS, ECA, ES ... | thrust = {{cvt|7080|kN}} | total = {{cvt|14160|kN}}` |
| payloadLEO_kg | **null**. TODO(source). | GTO only: 10,865 kg | Wikipedia | `* '''ECA:''' {{cvt|10865|kg}}` (GTO); LL2 `"leo_capacity": null` |
| stages | **2** + **2** EAP solid boosters (Wikipedia "2.5") | | Wikipedia | `| stages = 2.5` |
| launches | **84** | | https://www.esa.int/Enabling_Support/Space_Transportation/Launch_vehicles/Ariane_5 | `16 Ariane 5 G, 3 Ariane 5 G+, 6 Ariane 5 GS, 8 Ariane 5 ES and 84 Ariane 5 ECA flights` |
| split disagreement | LL2: ECA 73 + ECA+ 11. Wikipedia: ECA 72 + ECA+ 12. Both total 84. | | LL2 #20/#215; Wikipedia | `"total_launch_count": 73` / `11`; `'''ECA:'''&nbsp;72, '''ECA+:'''&nbsp;12` |
| failures | **2** (Wikipedia: 1 fail + 1 partial; LL2 ECA: 2 failed) | | Wikipedia; LL2 | `| fail = 2 ('''G:''' 1, '''ECA:''' 1)`, `| partial = 3 ('''G:''' 2, '''ECA:''' 1)`; `"failed_launches": 2` |
| firstLaunchYear | **2002** | | Wikipedia | `* '''ECA:''' 11 December 2002` |

### 11. Ariane 6, specs for Ariane 64 (`ariane-64`); launch stats are for the whole Ariane 6 family

| field | value | original | URL | quote |
|---|---|---|---|---|
| liftoffMass_kg | **860,000** | | Wikipedia; LL2 #116 | `| A64: {{cvt|860000|kg}}`; `"launch_mass": 860.0`. ESA (vaguer): `Ariane 6 will weigh almost 900 tonnes when launched with a full payload` |
| liftoffThrust_kN | **15,000** (LL2). Low confidence. | | LL2 #116 | `"to_thrust": 15000.0` |
| disagreement | Wikipedia: P120C 4,780 kN each ×4 + core 1,370 kN = 20,490 kN. It is not stated whether these are sea-level values. TODO(source): ESA or Arianespace primary. | | https://en.wikipedia.org/wiki/Ariane_6 | `| thrust = {{cvt|4780|kN}} each`; `| thrust = {{cvt|1370|kN}}` |
| payloadLEO_kg | **21,600** | 21.6 t | https://www.esa.int/Enabling_Support/Space_Transportation/Launch_vehicles/Ariane_6 | `Ariane 64 can launch payloads of approximately 11.5 tonnes into geostationary transfer orbit and 21.6 tonnes into low Earth orbit.` (Wikipedia/LL2: 21,650) |
| stages | **2** + **4** P120C boosters | | Wikipedia; ESA | `| stages = [[Two-stage-to-orbit|2]]`; `Ariane 64 with four boosters` |
| launches / failures (family) | **9 / 1** (partial: maiden VA262, Ariane 62). LL2 records 0 failures. | | Wikipedia; LL2 #121+#116+#512 | `| launches = 9 | success = 8 | fail = 0 | partial = 1 ([[Ariane flight VA262|VA262]])`; LL2 A62 `6/6/0`, A64 `2/2/0`, A64 Block 2 `1/1/0` |
| firstLaunchYear | **2024** (family); A64 first flew 2026 | | Wikipedia; LL2 | `| first = {{Start date|2024|7|9|df=y}}`; A64 `"maiden_flight": "2026-02-12"` |

### 12. Vulcan Centaur VC2S (`vulcan-vc2s`); launch stats are for the whole family

| field | value | original | URL | quote |
|---|---|---|---|---|
| liftoffMass_kg | **663,000** (LL2) | | LL2 #201 | `"full_name": "Vulcan VC2S"`, `"launch_mass": 663.0` |
| alt | Wikipedia generic 546,700 kg (configuration unspecified) | | https://en.wikipedia.org/wiki/Vulcan_Centaur | `| mass = {{cvt|546700|kg}}` |
| liftoffThrust_kN | **9,303** (LL2) | | LL2 #201 | `"to_thrust": 9303.0` |
| cross-check | ULA BE-4 2 × 550,000 lbf + Wikipedia GEM 63XL 2 × 463,249 lbf = 2,026,498 lbf → 9,014 kN. That is about 3% below LL2. | | https://www.ulalaunch.com/docs/default-source/rockets/vulcancentaur.pdf ; Wikipedia | `a pair of BE-4 engines, each producing 550,000 lbs of thrust`; `{{cvt|463249|lb-f|kN...}} each` |
| payloadLEO_kg | **19,000** | 19,000 kg / 41,900 lb (2 solids, LEO-REF) | https://www.ulalaunch.com/rockets/vulcan-centaur | `2 Solids 2,600 kg 5,700 lbs 8,400 kg 18,500 lbs 19,000 kg 41,900 lbs` (GEO, GTO, LEO-REF) |
| stages | **2** + **2** GEM 63XL | | Wikipedia; ULA | `| stages = 2`; `up to six Northrop Grumman ... GEM 63XL` |
| launches / failures (family) | **4 / 0** | | Wikipedia; LL2 #201 + #516 | `| launches = 4 | success = 4`; VC2S `2/2/0`, VC4S `2/2/0` |
| firstLaunchYear | **2024** | | Wikipedia | `| first = January 8, 2024` |

### 13. New Glenn 7×2 (`new-glenn`)

| field | value | original | URL | quote |
|---|---|---|---|---|
| liftoffMass_kg | **null**. TODO(source). LL2 is null and the Wikipedia field is blank. blueorigin.com was blocked by a Vercel checkpoint / HTTP 429. | | LL2 #138 | `"launch_mass": null` |
| liftoffThrust_kN | **17,126** | LL2 17,126 kN. Cross-check: 7 × BE-4 at 550,000 lbf (ULA's BE-4 figure) = 3,850,000 lbf → 17,125.7 kN. | LL2 #138; ULA Vulcan poster; Wikipedia | `"to_thrust": 17126.0`; `The New Glenn 7×2 first stage is powered by seven methalox BE-4 engines` |
| payloadLEO_kg | **45,000** | | Wikipedia; LL2 | `| 7×2: {{cvt|45000|kg}}`; `"leo_capacity": 45000.0` |
| stages | **2** | | Wikipedia | `| stages = 2` |
| launches / failures | **3 / 1** | | Wikipedia; LL2 | `| launches = 3 | success = 2 | fail = 1`; `"total_launch_count": 3, "successful_launches": 2, "failed_launches": 1` |
| firstLaunchYear | **2025** | | Wikipedia | `| first = January 16, 2025` |

### 14. Soyuz-2.1b, R-7 family (`soyuz-2-1b`)

| field | value | original | URL | quote |
|---|---|---|---|---|
| liftoffMass_kg | **312,000** | | Wikipedia; LL2 #15 | `| mass = {{cvt|312000|kg}}`; `"launch_mass": 312.0` |
| liftoffThrust_kN | **4,150** (LL2, 2.1b Fregat config) | | LL2 #42 | `"full_name": "Soyuz 2.1b Fregat"`, `"to_thrust": 4150.0` |
| cross-check | Wikipedia: 4 boosters × 838.5 kN + core 792.5 kN (sea level) = 4,146.5 kN | | https://en.wikipedia.org/wiki/Soyuz-2 | `{{abbr|SL|at sea level}}: {{cvt|838.5|kN}}` (boosters, number = 4); `{{abbr|SL|at sea level}}: {{cvt|792.5|kN}}` (core) |
| payloadLEO_kg | **8,200** (LL2) | | LL2 #15 | `"leo_capacity": 8200.0` |
| alt | Wikipedia B: 8,670 kg (first LEO entry; launch site not shown in the extract) | | Wikipedia | `| B: {{cvt|8670|kg}}` |
| stages | **2** inline (core Block A + Block I) + **4** strap-ons; Fregat makes 3. Russian/Wikipedia count: "3 or 4". | | Wikipedia | `| stages = 3 or 4` |
| launches / failures | **88 / 2** | | Wikipedia; LL2 #15+#42+#134+#555 | `| launches = 170 (A: 82, B: 88)`, `| fail = 4 (A: 2, B: 2)`; LL2 `25/25/0`, `26/24/2`, `36/36/0`, `1/1/0` = 88/86/2. (Soyuz ST-B from Kourou is a separate config in LL2 and is not included.) |
| firstLaunchYear | **2006** | | Wikipedia | `followed by the Soyuz‑2.1b, with a 15 percent more powerful third stage, on 27 December 2006` |

### 15. Proton-M (`proton-m`)

| field | value | original | URL | quote |
|---|---|---|---|---|
| liftoffMass_kg | **705,000** | | Wikipedia; LL2 #152 | `|mass = {{cvt|705000|kg}}`; `"launch_mass": 705.0` (Briz-M config #22: 712 t) |
| liftoffThrust_kN | **10,532** (first stage) | | Wikipedia; LL2 #152 | `|thrust = {{cvt|10532|kN}}`; `"to_thrust": 10532.0` |
| payloadLEO_kg | **23,000** | 180 km, 51.5° from Baikonur | Wikipedia; LL2 | `|kilos = {{cvt|23000|kg}}`; `"leo_capacity": 23000.0` |
| stages | **4** with Briz-M (the usual configuration); 3 base. No strap-ons. | | Wikipedia; LL2 #22 | `|stages = 3 or 4`; `"max_stage": 4` |
| launches / failures | **116 / 11** (9 failures + 2 partial) | | Wikipedia; LL2 | `|launches = 116 |fail = 9 |partial = 2 |success = 105`; LL2 configs #22 68/6, #87 33/3, #46 8/2, #94 6/0, #152 1/0 = 116 launches, 11 failed |
| firstLaunchYear | **2001** | | Wikipedia | `|first = 7 April 2001` |

### 16. Long March 5B (`long-march-5b`); launch stats are for the whole CZ-5 family

| field | value | original | URL | quote |
|---|---|---|---|---|
| liftoffMass_kg | **837,000** (LL2 5B) | | LL2 #208 | `"full_name": "Long March 5B"`, `"launch_mass": 837.0` |
| alt | Wikipedia 851,800 kg (variant not specified); LL2 CZ-5 867 t | | https://en.wikipedia.org/wiki/Long_March_5 ; LL2 #128 | `|mass = {{cvt|851800|kg}}`; `"launch_mass": 867.0` |
| liftoffThrust_kN | **10,565** (LL2) | | LL2 #208 | `"to_thrust": 10565.0` |
| cross-check | Wikipedia: boosters 9,600 kN total + core 1,036 kN (sea level) = 10,636 kN | | Wikipedia | `|total = {{cvt|9600|kN}}`; `'''Sea level:''' {{cvt|1036|kN}}` |
| payloadLEO_kg | **25,000** | | Wikipedia; LL2 | `approximately 25,000 kg (55,000 lb) to low Earth orbit (for CZ-5B)`; `"leo_capacity": 25000.0` |
| stages | **1** core stage + **4** boosters (the core itself reaches orbit) | | LL2 #208 | `"min_stage": 1, "max_stage": 1` |
| launches / failures (CZ-5 family) | **18 / 1** | | Wikipedia infobox; LL2 #128+#123+#208+#508 | `|launches = {{flatlist|18`, `|fail = {{flatlist|1 (CZ-5)`; LL2 9/0 + 2/1 + 4/0 + 3/0. (The Wikipedia lead still says "As of April 2026 ... 17 times", which is stale.) |
| firstLaunchYear | **2016** (family); 5B 2020 | | Wikipedia | `First launched in 2016`; `The CZ-5B first launched in 2020.` |

### 17. H3-24 (`h3-24`); launch stats are for the whole H3 family

| field | value | original | URL | quote |
|---|---|---|---|---|
| liftoffMass_kg | **574,000** (H3-24L, without payload) | 574 tons | https://global.jaxa.jp/projects/rockets/h3/ | `Major characteristics of Standard H3 (H3-24L) Length: 63 meters Total mass: 574 tons (without payloads)` |
| liftoffThrust_kN | **12,142** | LL2 12,142 kN = Wikipedia 4 × SRB-3 2,300 + 2 × LE-9 (2,942 kN for two) | LL2 #204; https://en.wikipedia.org/wiki/H3_(rocket) | `"to_thrust": 12142.0`; `| thrust = {{cvt|2300|kN}} each`; `{{cvt|2942|or|4413|kN}}` |
| payloadLEO_kg | **16,000** (ISS orbit) | | Wikipedia | `[[Low-earth orbit|LEO]] ([[International Space Station|ISS]]) | mass = H3-24: {{cvt|16000|kg}}` |
| stages | **2** + **4** SRB-3 | | Wikipedia | `| stages = 2`; `| number = 0, 2 or 4` |
| launches / failures (family) | **9 / 2** | | Wikipedia; LL2 #486+#204+#203 | `| launches = 9 | success = 7 | fail = 2`; LL2 H3-22 7/2, H3-24 1/0, H3-30 1/0 |
| firstLaunchYear | **2023** (family); H3-24 first flew 2025 | | Wikipedia; LL2 | `| first = 7 March 2023`; `"maiden_flight": "2025-10-26"` |

### 18. Electron (`electron`)

| field | value | original | URL | quote |
|---|---|---|---|---|
| liftoffMass_kg | **13,000** | 13.0 t | https://en.wikipedia.org/wiki/Rocket_Lab_Electron ; LL2 #26 | `| mass = {{cvt| 13.0| t| lb}}`; `"launch_mass": 13.0` |
| liftoffThrust_kN | **224.3** (Wikipedia, stage 1 sea level) | | Wikipedia | `{{abbr|SL|at sea level}}: {{cvt|224.3|kN}}` |
| disagreement | LL2: 162 kN. Rocket Lab's site returned a Cloudflare challenge / HTTP 403, so there is no primary check. | | LL2 #26 | `"to_thrust": 162.0` |
| payloadLEO_kg | **300** ("updated"; originally 225) | | Wikipedia; LL2 | `'''Updated:''' {{cvt| 300| kg}}`; `"leo_capacity": 300.0` |
| stages | **2** (optional kick stage not counted) | | Wikipedia | `Electron is a two-stage, expendable orbital launch vehicle` |
| launches / failures | **97 / 4** | | Wikipedia; LL2 | `Electron has launched successfully 93 times, with an additional 4 failures, for a total of 97 launches.`; `"total_launch_count": 97, "successful_launches": 93, "failed_launches": 4` |
| firstLaunchYear | **2017** | | Wikipedia | `| first = 25 May 2017` |

### 19. Saturn IB (`saturn-ib`)

| field | value | original | URL | quote |
|---|---|---|---|---|
| liftoffMass_kg | **589,770** | 1,300,220 lb (without payload) | https://en.wikipedia.org/wiki/Saturn_IB | `| mass = {{convert|1,300,220|lb|kg|abbr=on}}<br />without payload` (LL2: `"launch_mass": 590.0`) |
| liftoffThrust_kN | **7,117** | 1,600,000 lbf | Wikipedia | `The S-IB first stage also increased the S-I baseline's thrust from 1,500,000 to 1,600,000 pounds-force (6,700 to 7,100 kN)` (LL2: 7,100) |
| payloadLEO_kg | **20,865** | 46,000 lb | Wikipedia | `| mass = {{cvt|46,000|lb|kg|order=flip}}` (LL2: 21,000) |
| stages | **2** | | Wikipedia | `| stages = 2` |
| launches / failures | **9 / 0** | | Wikipedia | `| launches = 9 | success = 9` |
| disagreement | LL2 lists 10 launches and 1 failure. The extra "failure" is the Apollo 1 pad fire, a ground test and not a launch. | | `https://ll.thespacedevs.com/2.3.0/launches/?rocket__configuration__id=163` | `1967-01-27 Saturn IB / Apollo 1 (Failure before launch) / Launch Failure` |
| firstLaunchYear | **1966** | | Wikipedia | `| first = {{Start date|1966|2|26}}` |

### 20. Energia (`energia`)

| field | value | original | URL | quote |
|---|---|---|---|---|
| liftoffMass_kg | **2,400,000** | 2,400 tons | https://www.russianspaceweb.com/energia.html ; Wikipedia | `Weight (fueled) 2,400 tons`; `|mass = {{Convert|2400000|kg|lb|abbr=on}}` (LL2 Energiya: 2,524 t) |
| liftoffThrust_kN | **35,129** (LL2, Energiya/Polyus config) | | LL2 #314 | `"to_thrust": 35129.0` (Energiya/Buran #315: 35,301) |
| cross-check | Wikipedia: boosters 29,000 kN + core 5,800 kN (sea level) = 34,800 kN, if the 29,000 is the total for 4 boosters. The infobox is ambiguous. | | https://en.wikipedia.org/wiki/Energia_(rocket) | `|number = 4 |thrust = {{Convert|29000|kN|lbf|abbr=on}} sea level`; `{{Convert|5800|kN|lbf|abbr=on}} sea level` |
| payloadLEO_kg | **100,000** (Wikipedia "about 100 tonnes") | RSW 95–100 t; LL2 88,000 kg | Wikipedia; RSW; LL2 | `The launch vehicle had the capacity to place about 100 tonnes in Low Earth orbit`; `Payload from Baikonur 95-100 tons to 51-degree LEO`; `"leo_capacity": 88000.0` |
| stages | **1** core (Block Ts) + **4** strap-ons; RSW/Wikipedia say 2 | | RSW | `Number of stages 2`; `Stage I , Block A, 11S25 Four strap-on boosters` |
| launches / failures | **2 / 0** (launch vehicle) | | Wikipedia; RSW | `|launches = 2 |success = 2 |fail = 0`; RSW: `The rocket performed flawlessly, however, the Polyus spacecraft fired its engines in opposite direction` |
| disagreement | LL2 counts the 1987 Polyus flight as a failure: Energiya #314 `1/0/1`. The rocket worked; the payload failed. | | LL2 #314/#315 | `"total_launch_count": 1, "successful_launches": 0, "failed_launches": 1` |
| firstLaunchYear | **1987** | | Wikipedia | `|first = 15 May 1987` |

---

## (a) CORE 5: `ReferenceRocket[]` (exact contract shape)

```json
[
  {
    "id": "falcon-9-block-5",
    "name": "Falcon 9 Block 5",
    "liftoffMass_kg": 549054,
    "liftoffThrust_kN": 7607,
    "payloadLEO_kg": 22800,
    "stages": 2,
    "source": "https://www.spacex.com/vehicles/falcon-9/"
  },
  {
    "id": "falcon-heavy",
    "name": "Falcon Heavy",
    "liftoffMass_kg": 1420788,
    "liftoffThrust_kN": 22819,
    "payloadLEO_kg": 63800,
    "stages": 2,
    "source": "https://www.spacex.com/vehicles/falcon-heavy/"
  },
  {
    "id": "saturn-v",
    "name": "Saturn V",
    "liftoffMass_kg": 2800000,
    "liftoffThrust_kN": 34500,
    "payloadLEO_kg": 118000,
    "stages": 3,
    "source": "https://www.nasa.gov/learning-resources/for-kids-and-students/what-was-the-saturn-v-grades-5-8/"
  },
  {
    "id": "starship",
    "name": "Starship (Super Heavy + Starship, V3)",
    "liftoffMass_kg": 5250000,
    "liftoffThrust_kN": 80807,
    "payloadLEO_kg": 100000,
    "stages": 2,
    "source": "https://www.spacex.com/vehicles/starship/"
  },
  {
    "id": "sls-block-1",
    "name": "SLS Block 1",
    "liftoffMass_kg": 2603000,
    "liftoffThrust_kN": 36786,
    "payloadLEO_kg": 95000,
    "stages": 2,
    "source": "https://www.nasa.gov/wp-content/uploads/2022/03/sls-reference-guide-2022-v2-508-0.pdf"
  }
]
```

Flags for the core 5:
- **Falcon 9 / Falcon Heavy payload.** These are *expendable* figures. Falcon 9 with a drone-ship landing is about 17,500 kg, a secondary figure from Wikipedia.
- **Starship.** `payloadLEO_kg` is a **design target** ("100+ t"), not a demonstrated value. `liftoffMass_kg` is LL2's figure, which equals SpaceX's propellant capacities added together.
- **SLS thrust.** 36,786 kN is NASA's *launch* thrust. The famous 8.8 Mlbf (39,144 kN) is *maximum* thrust.
- **Saturn V payload.** 118,000 kg is NASA's figure. The 140,000 kg record figure includes the S-IVB stage and its remaining propellant.

## (b) ALL 20: extended records (asOf 2026-10-17)

`failures` = failures + partial failures. `null` = TODO(source). Stats for Ariane 6, Vulcan, Long March 5 and H3 are family-wide; the specs are for the named variant.

```json
[
  {
    "id": "falcon-9-block-5", "name": "Falcon 9 Block 5",
    "liftoffMass_kg": 549054, "liftoffThrust_kN": 7607, "payloadLEO_kg": 22800, "stages": 2,
    "source": "https://www.spacex.com/vehicles/falcon-9/",
    "launches": 640, "failures": 1, "firstLaunchYear": 2018,
    "roastFacts": [
      {"text": "SpaceX bills Falcon 9 as the world's first orbital-class reusable rocket.", "source": "https://www.spacex.com/vehicles/falcon-9/"},
      {"text": "On January 24, 2021, a Falcon 9 set the record for most satellites launched by a single rocket: 143.", "source": "https://en.wikipedia.org/wiki/Falcon_9"},
      {"text": "Individual Falcon 9 boosters have flown as many as 37 times.", "source": "https://en.wikipedia.org/wiki/Falcon_9"}
    ],
    "asOf": "2026-10-17"
  },
  {
    "id": "falcon-heavy", "name": "Falcon Heavy",
    "liftoffMass_kg": 1420788, "liftoffThrust_kN": 22819, "payloadLEO_kg": 63800, "stages": 2,
    "source": "https://www.spacex.com/vehicles/falcon-heavy/",
    "launches": 14, "failures": 0, "firstLaunchYear": 2018,
    "roastFacts": [
      {"text": "SpaceX says Falcon Heavy's liftoff thrust equals approximately eighteen 747 aircraft at full power.", "source": "https://www.spacex.com/vehicles/falcon-heavy/"},
      {"text": "SpaceX says Falcon Heavy can lift the equivalent of a fully loaded 737 jetliner, complete with passengers.", "source": "https://www.spacex.com/vehicles/falcon-heavy/"},
      {"text": "Its first payload was Elon Musk's personal Tesla Roadster, with a mannequin named \"Starman\" at the wheel.", "source": "https://en.wikipedia.org/wiki/Falcon_Heavy"}
    ],
    "asOf": "2026-10-17"
  },
  {
    "id": "saturn-v", "name": "Saturn V",
    "liftoffMass_kg": 2800000, "liftoffThrust_kN": 34500, "payloadLEO_kg": 118000, "stages": 3,
    "source": "https://www.nasa.gov/learning-resources/for-kids-and-students/what-was-the-saturn-v-grades-5-8/",
    "launches": 13, "failures": 1, "firstLaunchYear": 1967,
    "roastFacts": [
      {"text": "Fully fueled, the Saturn V weighed about as much as 400 elephants.", "source": "https://www.nasa.gov/learning-resources/for-kids-and-students/what-was-the-saturn-v-grades-5-8/"},
      {"text": "NASA says its launch thrust created more power than 85 Hoover Dams.", "source": "https://www.nasa.gov/learning-resources/for-kids-and-students/what-was-the-saturn-v-grades-5-8/"},
      {"text": "The fuel for one lunar mission could drive a 30-mpg car around the world about 800 times.", "source": "https://www.nasa.gov/learning-resources/for-kids-and-students/what-was-the-saturn-v-grades-5-8/"}
    ],
    "asOf": "2026-10-17"
  },
  {
    "id": "starship", "name": "Starship (Super Heavy + Starship, V3)",
    "liftoffMass_kg": 5250000, "liftoffThrust_kN": 80807, "payloadLEO_kg": 100000, "stages": 2,
    "source": "https://www.spacex.com/vehicles/starship/",
    "launches": 14, "failures": 5, "firstLaunchYear": 2023,
    "roastFacts": [
      {"text": "SpaceX calls Starship the world's most powerful launch vehicle ever developed.", "source": "https://www.spacex.com/vehicles/starship/"},
      {"text": "The Super Heavy booster lands by being caught by a pair of hydraulic arms on the launch tower.", "source": "https://en.wikipedia.org/wiki/SpaceX_Super_Heavy"},
      {"text": "After several setbacks, Starship did not reach orbit until its fourteenth flight test.", "source": "https://en.wikipedia.org/wiki/SpaceX_Starship"}
    ],
    "asOf": "2026-10-17"
  },
  {
    "id": "sls-block-1", "name": "SLS Block 1",
    "liftoffMass_kg": 2603000, "liftoffThrust_kN": 36786, "payloadLEO_kg": 95000, "stages": 2,
    "source": "https://www.nasa.gov/wp-content/uploads/2022/03/sls-reference-guide-2022-v2-508-0.pdf",
    "launches": 2, "failures": 0, "firstLaunchYear": 2022,
    "roastFacts": [
      {"text": "NASA says SLS produces 15% more maximum thrust than the Saturn V.", "source": "https://www.nasa.gov/wp-content/uploads/2026/03/sls-5640-sls-fact-sheet-dec2025-508.pdf"},
      {"text": "At 322 ft, SLS Block 1 is taller than the Statue of Liberty.", "source": "https://www.nasa.gov/wp-content/uploads/2026/03/sls-5640-sls-fact-sheet-dec2025-508.pdf"},
      {"text": "The whole 5.75-million-lb rocket rests on the aft skirts of its two boosters.", "source": "https://www.nasa.gov/wp-content/uploads/2022/03/sls-reference-guide-2022-v2-508-0.pdf"}
    ],
    "asOf": "2026-10-17"
  },
  {
    "id": "n1", "name": "N1",
    "liftoffMass_kg": 2750000, "liftoffThrust_kN": 45780, "payloadLEO_kg": 95000, "stages": 5,
    "source": "https://en.wikipedia.org/wiki/N1_(rocket)",
    "launches": 4, "failures": 4, "firstLaunchYear": 1969,
    "roastFacts": [
      {"text": "All four N1 launch attempts, from 1969 to 1972, failed.", "source": "https://www.russianspaceweb.com/n1.html"},
      {"text": "Its first stage clustered thirty NK-15 engines, managed by an analog computer (KORD) that shut down the engine opposite any that failed.", "source": "https://en.wikipedia.org/wiki/N1_(rocket)"},
      {"text": "The second flight caused one of the largest conventional explosions ever and put its launch pad out of action for 18 months.", "source": "https://en.wikipedia.org/wiki/N1_(rocket)"}
    ],
    "asOf": "2026-10-17"
  },
  {
    "id": "space-shuttle", "name": "Space Shuttle (STS)",
    "liftoffMass_kg": 2041166, "liftoffThrust_kN": 28580, "payloadLEO_kg": 27500, "stages": 1,
    "source": "https://www.nasa.gov/reference/the-space-shuttle/",
    "launches": 135, "failures": 2, "firstLaunchYear": 1981,
    "roastFacts": [
      {"text": "The main engines burned fuel fast enough to drain an average family swimming pool in under 25 seconds.", "source": "https://www.nasa.gov/reference/the-space-shuttle/"},
      {"text": "The external tank was the only part of the Shuttle that was not reused.", "source": "https://www.nasa.gov/reference/the-space-shuttle/"},
      {"text": "Two orbiters were lost in accidents, Challenger in 1986 and Columbia in 2003, killing 14 astronauts in total.", "source": "https://en.wikipedia.org/wiki/Space_Shuttle"}
    ],
    "asOf": "2026-10-17"
  },
  {
    "id": "atlas-v-551", "name": "Atlas V 551",
    "liftoffMass_kg": 573000, "liftoffThrust_kN": 12269, "payloadLEO_kg": 18850, "stages": 2,
    "source": "https://www.ulalaunch.com/rockets/atlas-v",
    "launches": 23, "failures": 0, "firstLaunchYear": 2006,
    "roastFacts": [
      {"text": "An Atlas V 551 launched New Horizons toward Pluto on January 19, 2006.", "source": "https://en.wikipedia.org/wiki/Atlas_V"},
      {"text": "Its first stage runs on a single Russian-made RD-180 engine.", "source": "https://en.wikipedia.org/wiki/Atlas_V"},
      {"text": "ULA says Atlas V builds on a heritage of more than 600 Atlas program launches.", "source": "https://www.ulalaunch.com/rockets/atlas-v"}
    ],
    "asOf": "2026-10-17"
  },
  {
    "id": "delta-iv-heavy", "name": "Delta IV Heavy",
    "liftoffMass_kg": 733000, "liftoffThrust_kN": 9411, "payloadLEO_kg": 28370, "stages": 2,
    "source": "https://www.ulalaunch.com/rockets/delta-iv",
    "launches": 16, "failures": 1, "firstLaunchYear": 2004,
    "roastFacts": [
      {"text": "Its hydrogen-fuelled ignition often produced a large fireball that scorched the outside of the boosters.", "source": "https://en.wikipedia.org/wiki/Delta_IV_Heavy"},
      {"text": "It sent the Parker Solar Probe to study the Sun's atmosphere.", "source": "https://www.ulalaunch.com/rockets/delta-iv"},
      {"text": "The Delta family's six-decade run ended at 389 launches.", "source": "https://www.ulalaunch.com/rockets/delta-iv"}
    ],
    "asOf": "2026-10-17"
  },
  {
    "id": "ariane-5-eca", "name": "Ariane 5 ECA",
    "liftoffMass_kg": 780000, "liftoffThrust_kN": 11400, "payloadLEO_kg": null, "stages": 2,
    "source": "https://ll.thespacedevs.com/2.3.0/launcher_configurations/20/",
    "launches": 84, "failures": 2, "firstLaunchYear": 2002,
    "roastFacts": [
      {"text": "The first Ariane 5 ECA launch (11 December 2002) ended in failure: it veered off course and was destroyed about three minutes into flight.", "source": "https://en.wikipedia.org/wiki/Ariane_5"},
      {"text": "An Ariane 5 (flight VA256) launched the James Webb Space Telescope on 25 December 2021.", "source": "https://en.wikipedia.org/wiki/Ariane_5"},
      {"text": "Ariane 5 had a run of 82 consecutive successful launches between 2003 and 2017.", "source": "https://en.wikipedia.org/wiki/Ariane_5"}
    ],
    "asOf": "2026-10-17"
  },
  {
    "id": "ariane-64", "name": "Ariane 64 (Ariane 6)",
    "liftoffMass_kg": 860000, "liftoffThrust_kN": 15000, "payloadLEO_kg": 21600, "stages": 2,
    "source": "https://www.esa.int/Enabling_Support/Space_Transportation/Launch_vehicles/Ariane_6",
    "launches": 9, "failures": 1, "firstLaunchYear": 2024,
    "roastFacts": [
      {"text": "ESA says a fully loaded Ariane 6 weighs roughly as much as one and a half Airbus A380s.", "source": "https://www.esa.int/Enabling_Support/Space_Transportation/Launch_vehicles/Ariane_6"},
      {"text": "Its 8,200-tonne mobile gantry is nearly a thousand tonnes heavier than the Eiffel Tower.", "source": "https://www.esa.int/Enabling_Support/Space_Transportation/Launch_vehicles/Ariane_6"},
      {"text": "On the maiden flight, VA262, the satellites reached orbit but the Vinci engine failed to ignite a third time to deorbit the upper stage.", "source": "https://en.wikipedia.org/wiki/Ariane_6"}
    ],
    "asOf": "2026-10-17"
  },
  {
    "id": "vulcan-vc2s", "name": "Vulcan Centaur VC2S",
    "liftoffMass_kg": 663000, "liftoffThrust_kN": 9303, "payloadLEO_kg": 19000, "stages": 2,
    "source": "https://www.ulalaunch.com/rockets/vulcan-centaur",
    "launches": 4, "failures": 0, "firstLaunchYear": 2024,
    "roastFacts": [
      {"text": "On its second flight a solid booster's nozzle fell off about 37 seconds in, and Vulcan still reached its planned orbit.", "source": "https://en.wikipedia.org/wiki/Vulcan_Centaur"},
      {"text": "Its first launch carried the Peregrine lunar lander.", "source": "https://en.wikipedia.org/wiki/Vulcan_Centaur"}
    ],
    "asOf": "2026-10-17"
  },
  {
    "id": "new-glenn", "name": "New Glenn (7x2)",
    "liftoffMass_kg": null, "liftoffThrust_kN": 17126, "payloadLEO_kg": 45000, "stages": 2,
    "source": "https://ll.thespacedevs.com/2.3.0/launcher_configurations/138/",
    "launches": 3, "failures": 1, "firstLaunchYear": 2025,
    "roastFacts": [
      {"text": "It is named after John Glenn, the first American to orbit Earth.", "source": "https://en.wikipedia.org/wiki/New_Glenn"},
      {"text": "The booster first landed successfully on the second flight, NG-2, on November 13, 2025.", "source": "https://en.wikipedia.org/wiki/New_Glenn"},
      {"text": "In May 2026 a New Glenn exploded during preparations for an Amazon Leo launch, heavily damaging LC-36.", "source": "https://en.wikipedia.org/wiki/New_Glenn"}
    ],
    "asOf": "2026-10-17"
  },
  {
    "id": "soyuz-2-1b", "name": "Soyuz-2.1b",
    "liftoffMass_kg": 312000, "liftoffThrust_kN": 4150, "payloadLEO_kg": 8200, "stages": 2,
    "source": "https://ll.thespacedevs.com/2.3.0/launcher_configurations/15/",
    "launches": 88, "failures": 2, "firstLaunchYear": 2006,
    "roastFacts": [
      {"text": "Soyuz-2 is the seventh major iteration of the Soyuz family and still flies from pads built for its R-7 ancestors.", "source": "https://en.wikipedia.org/wiki/Soyuz-2"},
      {"text": "In 2015 it emerged that parts of the Vostochny assembly complex had been designed for a different rocket variant and were too small for Soyuz-2.", "source": "https://en.wikipedia.org/wiki/Soyuz-2"}
    ],
    "asOf": "2026-10-17"
  },
  {
    "id": "proton-m", "name": "Proton-M",
    "liftoffMass_kg": 705000, "liftoffThrust_kN": 10532, "payloadLEO_kg": 23000, "stages": 4,
    "source": "https://en.wikipedia.org/wiki/Proton-M",
    "launches": 116, "failures": 11, "firstLaunchYear": 2001,
    "roastFacts": [
      {"text": "The July 2013 failure was traced to three yaw-rate sensors installed in the wrong orientation.", "source": "https://en.wikipedia.org/wiki/Proton-M"},
      {"text": "In December 2010 an upper stage overloaded with 1,500 kg of liquid oxygen failed to reach orbital velocity, losing three GLONASS satellites.", "source": "https://en.wikipedia.org/wiki/Proton-M"}
    ],
    "asOf": "2026-10-17"
  },
  {
    "id": "long-march-5b", "name": "Long March 5B",
    "liftoffMass_kg": 837000, "liftoffThrust_kN": 10565, "payloadLEO_kg": 25000, "stages": 1,
    "source": "https://ll.thespacedevs.com/2.3.0/launcher_configurations/208/",
    "launches": 18, "failures": 1, "firstLaunchYear": 2016,
    "roastFacts": [
      {"text": "Its nickname is \"Pang-Wu\" (\"Fat-Five\").", "source": "https://en.wikipedia.org/wiki/Long_March_5"},
      {"text": "The first 5B's core stage may have been the most massive object to make an uncontrolled re-entry since Salyut 7 (1991) and Skylab (1979).", "source": "https://en.wikipedia.org/wiki/Long_March_5"},
      {"text": "It launched all three modules of the Tiangong space station.", "source": "https://en.wikipedia.org/wiki/Long_March_5"}
    ],
    "asOf": "2026-10-17"
  },
  {
    "id": "h3-24", "name": "H3-24",
    "liftoffMass_kg": 574000, "liftoffThrust_kN": 12142, "payloadLEO_kg": 16000, "stages": 2,
    "source": "https://global.jaxa.jp/projects/rockets/h3/",
    "launches": 9, "failures": 2, "firstLaunchYear": 2023,
    "roastFacts": [
      {"text": "The H3 maiden flight in March 2023 failed when the second-stage engine did not ignite.", "source": "https://en.wikipedia.org/wiki/H3_(rocket)"},
      {"text": "JAXA says the H3's LE-9 engine needed more thrust than any liquid rocket engine Japan had ever developed.", "source": "https://global.jaxa.jp/projects/rockets/h3/"}
    ],
    "asOf": "2026-10-17"
  },
  {
    "id": "electron", "name": "Electron",
    "liftoffMass_kg": 13000, "liftoffThrust_kN": 224.3, "payloadLEO_kg": 300, "stages": 2,
    "source": "https://en.wikipedia.org/wiki/Rocket_Lab_Electron",
    "launches": 97, "failures": 4, "firstLaunchYear": 2017,
    "roastFacts": [
      {"text": "Its Rutherford engines are the first electric-pump-fed engines to power an orbital-class rocket, with the pumps running on lithium-polymer batteries.", "source": "https://en.wikipedia.org/wiki/Rocket_Lab_Electron"},
      {"text": "The second stage hot-swaps its batteries and throws away the empty ones to save mass.", "source": "https://en.wikipedia.org/wiki/Rocket_Lab_Electron"},
      {"text": "Almost all of the engine parts are 3D printed.", "source": "https://en.wikipedia.org/wiki/Rocket_Lab_Electron"}
    ],
    "asOf": "2026-10-17"
  },
  {
    "id": "saturn-ib", "name": "Saturn IB",
    "liftoffMass_kg": 589770, "liftoffThrust_kN": 7117, "payloadLEO_kg": 20865, "stages": 2,
    "source": "https://en.wikipedia.org/wiki/Saturn_IB",
    "launches": 9, "failures": 0, "firstLaunchYear": 1966,
    "roastFacts": [
      {"text": "In 1973 Saturn IBs carried three crews to Skylab, and in 1975 one launched the Apollo side of the Apollo-Soyuz Test Project.", "source": "https://en.wikipedia.org/wiki/Saturn_IB"},
      {"text": "A backup Saturn IB was readied for a Skylab rescue mission but never flew.", "source": "https://en.wikipedia.org/wiki/Saturn_IB"}
    ],
    "asOf": "2026-10-17"
  },
  {
    "id": "energia", "name": "Energia",
    "liftoffMass_kg": 2400000, "liftoffThrust_kN": 35129, "payloadLEO_kg": 100000, "stages": 1,
    "source": "https://www.russianspaceweb.com/energia.html",
    "launches": 2, "failures": 0, "firstLaunchYear": 1987,
    "roastFacts": [
      {"text": "On its first flight the rocket worked perfectly, but the Polyus payload fired its engines the wrong way and fell into the ocean.", "source": "https://www.russianspaceweb.com/energia.html"},
      {"text": "Its second and last flight carried the uncrewed Buran shuttle, which landed automatically after two orbits.", "source": "https://www.russianspaceweb.com/energia.html"},
      {"text": "Mothballed Energia and Buran hardware at Baikonur was destroyed when the assembly building roof collapsed.", "source": "https://www.russianspaceweb.com/energia.html"}
    ],
    "asOf": "2026-10-17"
  }
]
```

## Disagreements summary

| rocket | field | values | chosen |
|---|---|---|---|
| Falcon 9 B5 | launches | LL2 640, Wikipedia 638 | LL2 640 |
| Saturn V | LEO | NASA 118,000; Wikipedia/LL2 140,000 (incl. S-IVB) | NASA |
| Saturn V | thrust | NASA 34.5 MN (its own lbf: 33,806 kN); Wikipedia 7.5 Mlbf = 33,362 kN; LL2 35,100 | NASA 34,500 |
| SLS | thrust | launch 36,786 kN vs max 39,144 kN (both NASA) | launch thrust |
| SLS | mass | NASA 2,603 t vs 2,608 t; LL2 2,628 t | 2,603 t |
| Starship | thrust | SpaceX 80.8 MN; Wikipedia 89.5 MN | SpaceX |
| Shuttle | thrust | computed 28,580 kN; NASA "7.8 million pounds" total; LL2 28,200 | computed from NASA per-engine values |
| Delta IV H | thrust | ULA poster 9,411; ULA web 9,368; LL2 8,674 | 9,411 |
| Ariane 5 ECA | split | LL2 73+11, Wikipedia 72+12 (both 84) | 84 |
| Ariane 6 | failures | Wikipedia 1 partial (VA262); LL2 0 | 1 |
| Ariane 64 | thrust | LL2 15,000; Wikipedia per-booster sum 20,490 | LL2, low confidence |
| Electron | thrust | Wikipedia 224.3; LL2 162 | Wikipedia |
| Saturn IB | launches | Wikipedia 9/0; LL2 10/1 (Apollo 1 pad fire) | 9/0 |
| Energia | failures | Wikipedia/RSW 0; LL2 1 (Polyus payload) | 0 |
| N1 | mass/thrust | 2,750 t / 45,780 kN (Wikipedia) vs RSW 2,783–2,825 t / 44,130 kN vs LL2 45,400 | Wikipedia |
| Atlas V 551 | mass | LL2 573 t; Wikipedia (generic) 590 t | LL2 |

## TODO(source)

1. **Ariane 5 ECA `payloadLEO_kg`.** No LEO figure found. LL2 is null and Wikipedia lists only G and ES for LEO. Need an Arianespace user's manual.
2. **New Glenn `liftoffMass_kg`.** LL2 is null and the Wikipedia field is blank. blueorigin.com blocked the fetch (Vercel checkpoint / HTTP 429).
3. **Starship `liftoffMass_kg`.** The 5,250 t from LL2 is probably propellant-only. Need a SpaceX gross liftoff mass.
4. **Falcon Heavy reusable LEO.** Wikipedia's 57,000 kg carries "citation needed", so it was not used.
5. **Primary sources for Atlas V 551, Delta IV Heavy and Vulcan VC2S liftoff mass.** ULA pages and posters give no gross mass. The ULA user's guide PDFs were not parsed.
6. **Ariane 64 liftoff thrust.** Conflicting secondary values; need an ESA or Arianespace primary.
7. **Electron.** Rocket Lab's site returned a Cloudflare 403, so there is no primary check of thrust or payload.
8. **Shuttle LEO payload (27,500 kg).** Only LL2 and Wikipedia; no NASA primary found.
9. **GCAT / Space Launch Report cross-check of launch counts.** Not done. The cross-checks used were LL2 and Wikipedia, plus RussianSpaceWeb for N1 and Energia.
10. **Soyuz-2.1b, Proton-M, Long March 5, Saturn IB, N1 and Energia specs.** All are secondary (LL2 / Wikipedia / RSW). No Roscosmos or CASC primary was fetched.
