# Data sources

Owner: P4. Every record in `src/data/*.json` has a `source`. This file gives the evidence for each number: where it came from, how strong the source is, the exact quote, and any arithmetic. `validate.test.ts` (runs in `npm test`) fails if a record has no source URL, carries a `TODO`, or has physically impossible values.

Researched 2026-10-17. The raw evidence (verbatim quotes per value) and rejected sources are in the team's research notes.

## Source tiers

| Tier | Meaning |
|---|---|
| primary | Manufacturer or agency document (NASA, L3Harris, Aerojet, Energomash, ULA, FAA, SpaceX, NOAA) |
| secondary | Expert compilation (braeunig.us, GCAT) |
| wikipedia | Wikipedia, CC BY-SA 4.0. Used only where no primary source publishes the number |
| cross-check-only | A game-mod config (Realism Overhaul). One value in the dataset relies on it; see weak spots |
| derived | Arithmetic on sourced values, shown inline |

Conversions: 1 lb = 0.45359237 kg, 1 lbf = 4.4482216 N, 1 tf = 9.80665 kN, 1 in = 0.0254 m.

## Conventions

- **Vacuum-only engines** have `thrustSL_kN: 0` and `ispSL_s: 0` (P2's `isVacuumOnly` treats them that way).
- **Tanks are real flown stages minus their engines:** `dryMass_kg = published stage dry mass - engineCount x catalog engine mass`, using the same engine mass as `engines.json`. Picking the real engine and count therefore rebuilds the real stage. `height_m` is the published stage length.
- **Missions** give delta-v from Earth's surface **including gravity and drag losses**: 9,400 m/s to LEO plus a cited increment. Never subtract losses again.
- **Engine `diameter_m`** is the nozzle-exit diameter, except RD-180, RD-191 and RS-68A, where only the overall engine diameter is published.
- **Payload** has no `source` field in the contract; the JSON carries one anyway.

## Weak spots (best available, flagged honestly)

| Record | Field | Issue |
|---|---|---|
| merlin-1d | mass_kg, diameter_m | No primary source exists. Mass via Wikipedia citing Tom Mueller (SpaceX); diameter is uncited on Wikipedia |
| merlin-1d | ispSL_s, ispVac_s | Newest SpaceX-published figures are from 2013 |
| merlin-1d-vac | mass_kg | Only available from a game-mod config (Realism Overhaul); no published figure |
| merlin-1d-vac | diameter_m | Uncited on Wikipedia |
| f-1 | thrustVac_kN, ispVac_s | Wikipedia, no inline citation |
| j-2 | thrustSL_kN, ispSL_s | Wikipedia only (J-2 never flew as a first-stage engine) |
| falcon9-s1-tank, falcon9-s2-tank | dry mass | Stage dry masses are uncited on Wikipedia; propellant loads are primary (FAA) |
| icps-tank | masses | Uncited on Wikipedia |
| goes-r | diameter_m, height_m | NOAA gives 6.1 x 5.6 x 3.9 m; which axis is "height" is our reading |
| starship | liftoffMass_kg, payloadLEO_kg | No official gross mass (GCAT estimate, flagged "?"); payload is SpaceX's "100+ t" target |

Not included, because no complete sourced record exists: Raptor 2/3 and Raptor Vacuum, BE-4, Vulcain 2, BE-3U (engines); Super Heavy, Starship, Centaur V and New Glenn stages (no published dry masses); Crew Dragon (only the mass at undocking is published, not at launch).

## Engines


### Merlin 1D (`merlin-1d`)

| Field | Value | Tier | Quote | Source |
|---|---|---|---|---|
| thrustSL_kN | 845 | primary | "Thrust" "845 kN / 190,000 lbf" | https://www.spacex.com/vehicles/falcon-9 |
| thrustVac_kN | 914.1 | derived | stage "Thrust in vacuum" 8,227 kN / 1,849,500 lbf ÷ 9 engines | https://www.spacex.com/vehicles/falcon-9 |
| ispSL_s | 282 | primary (2013, older 147 klbf Merlin 1D; dated) | "Sea Level Isp: 282s" | https://web.archive.org/web/20130715094112/http://www.spacex.com/falcon9 |
| ispVac_s | 311 | primary (2013; dated) | "Vacuum Isp: 311s" | https://web.archive.org/web/20130715094112/http://www.spacex.com/falcon9 |
| mass_kg | 467.2 | wikipedia (cites Tom Mueller on Quora; Quora not fetchable) | "The Merlin 1D weighs 1030 pounds" -> 467.2 kg | https://en.wikipedia.org/wiki/SpaceX_Merlin |
| diameter_m | 0.92 | wikipedia (UNCITED in infobox); needs a primary source | "Sea level: 0.92 m" | https://en.wikipedia.org/wiki/SpaceX_Merlin |

### Merlin 1D Vacuum (`merlin-1d-vac`)

| Field | Value | Tier | Quote | Source |
|---|---|---|---|---|
| thrustSL_kN | 0 | derived | 0 | vacuum-only convention |
| ispSL_s | 0 | derived | 0 | vacuum-only convention |
| thrustVac_kN | 981 | primary | "981 kN / 220,500 lbf" | https://www.spacex.com/vehicles/falcon-9 |
| ispVac_s | 348 | primary (archived 2016-2019) | "vacuum isp of 348 seconds" | https://web.archive.org/web/20190101/http://www.spacex.com/falcon9 |
| mass_kg | 490 | cross-check-only (game config); needs a primary source | "Merlin 1DVac+ ... Dry Mass: 490 Kg" | https://github.com/KSP-RO/RealismOverhaul/blob/master/GameData/RealismOverhaul/Engine_Configs/Merlin1_Config.cfg |
| diameter_m | 3.3 | wikipedia (UNCITED); needs a primary source | "Vacuum: 3.3 m" | https://en.wikipedia.org/wiki/SpaceX_Merlin |

### RS-25 (D/E, 109% RPL) (`rs-25`)

| Field | Value | Tier | Quote | Source |
|---|---|---|---|---|
| thrustSL_kN | 1859.4 | primary | "At Sea Level 418,000 lb" | https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rs-25-spec-sheet.pdf |
| thrustVac_kN | 2278.8 | primary | "In Vacuum 512,300 lb" | https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rs-25-spec-sheet.pdf |
| ispSL_s | 366 | primary | "Sea Level: 366 sec." | https://www.l3harris.com/all-capabilities/rs-25-engine |
| ispVac_s | 452.3 | primary | "Specific Impulse In Vacuum 452.3 sec" | https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rs-25-spec-sheet.pdf |
| mass_kg | 3526.2 | primary | "Weight Dry 7,774 lb" | https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rs-25-spec-sheet.pdf |
| diameter_m | 2.286 | primary | "7.5 feet in diameter at the nozzle exit" | https://www.nasa.gov/wp-content/uploads/2016/08/174533main_shuttle_propulsion.pdf |

### RL10C-1 (`rl10c-1`)

| Field | Value | Tier | Quote | Source |
|---|---|---|---|---|
| thrustVac_kN | 101.82 | primary | "Thrust ... 22,890 lbf" | https://web.archive.org/web/2024/https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rl10-spec-sheet.pdf |
| ispVac_s | 449.7 | primary | "Specific Impulse ... 449.7 sec" | https://web.archive.org/web/2024/https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rl10-spec-sheet.pdf |
| mass_kg | 190.5 | primary | "Weight ... 420 lbs" | https://web.archive.org/web/2024/https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rl10-spec-sheet.pdf |
| diameter_m | 1.448 | primary | "Nozzle Diameter ... 57”" | https://web.archive.org/web/2024/https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rl10-spec-sheet.pdf |
| thrustSL_kN | 0 | derived | 0 | vacuum-only convention |
| ispSL_s | 0 | derived | 0 | vacuum-only convention |

### RL10C-1-1 (`rl10c-1-1`)

| Field | Value | Tier | Quote | Source |
|---|---|---|---|---|
| thrustVac_kN | 105.98 | primary | "Thrust ... 23,825 lbf" | https://web.archive.org/web/2024/https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rl10-spec-sheet.pdf |
| ispVac_s | 453.8 | primary | "Specific Impulse ... 453.8 sec" | https://web.archive.org/web/2024/https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rl10-spec-sheet.pdf |
| mass_kg | 188.2 | primary | "Weight ... 415 lbs" | https://web.archive.org/web/2024/https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rl10-spec-sheet.pdf |
| diameter_m | 1.575 | primary | "Nozzle Diameter ... 62”" | https://web.archive.org/web/2024/https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rl10-spec-sheet.pdf |
| thrustSL_kN | 0 | derived | 0 | vacuum-only convention |
| ispSL_s | 0 | derived | 0 | vacuum-only convention |

### RL10B-2 (`rl10b-2`)

| Field | Value | Tier | Quote | Source |
|---|---|---|---|---|
| thrustVac_kN | 110.09 | primary | "Thrust ... 24,750 lbf" | https://web.archive.org/web/2024/https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rl10-spec-sheet.pdf |
| ispVac_s | 465.5 | primary | "Specific Impulse ... 465.5 sec" | https://web.archive.org/web/2024/https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rl10-spec-sheet.pdf |
| mass_kg | 301.2 | primary | "Weight ... 664 lbs" | https://web.archive.org/web/2024/https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rl10-spec-sheet.pdf |
| diameter_m | 2.146 | primary | "Nozzle Diameter ... 84.5”" | https://web.archive.org/web/2024/https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rl10-spec-sheet.pdf |
| thrustSL_kN | 0 | derived | 0 | vacuum-only convention |
| ispSL_s | 0 | derived | 0 | vacuum-only convention |

### F-1 (`f-1`)

| Field | Value | Tier | Quote | Source |
|---|---|---|---|---|
| thrustSL_kN | 6770.2 | primary | "uprated to 1,522,000 lb. thrust for Vehicle 504" (sea level) | https://web.archive.org/web/20051221114403/http://history.msfc.nasa.gov/saturn_apollo/documents/F-1_Engine.pdf |
| thrustVac_kN | 7766.6 | wikipedia (no inline citation) | "1746000 lbf" | https://en.wikipedia.org/wiki/Rocketdyne_F-1 |
| ispSL_s | 260 | primary | "SPECIFIC IMPULSE (minimum) 260 sec." | https://web.archive.org/web/20051221114403/http://history.msfc.nasa.gov/saturn_apollo/documents/F-1_Engine.pdf |
| ispVac_s | 304 | wikipedia (no inline citation) | "304 isp" | https://en.wikipedia.org/wiki/Rocketdyne_F-1 |
| mass_kg | 8391.5 | primary | "WEIGHT FLIGHT CONFIGURATION 18,500 lb. maximum" | https://web.archive.org/web/20051221114403/http://history.msfc.nasa.gov/saturn_apollo/documents/F-1_Engine.pdf |
| diameter_m | 3.531 | primary | "MAXIMUM NOZZLE EXIT DIAMETER 11 ft. 7 in." | https://web.archive.org/web/20051221114403/http://history.msfc.nasa.gov/saturn_apollo/documents/F-1_Engine.pdf |

### J-2 (`j-2`)

| Field | Value | Tier | Quote | Source |
|---|---|---|---|---|
| thrustSL_kN | 486.2 | wikipedia (not confirmed by any primary fetched) | "486.2 kN" | https://en.wikipedia.org/wiki/Rocketdyne_J-2 |
| thrustVac_kN | 1023.1 | primary | "THRUST (altitude) 230,000 lb." | https://web.archive.org/web/20200808233218/https://www.nasa.gov/centers/marshall/pdf/499245main_J2_Engine_fs.pdf |
| ispSL_s | 200 | wikipedia (not confirmed by any primary fetched) | "200 isp" | https://en.wikipedia.org/wiki/Rocketdyne_J-2 |
| ispVac_s | 424 | primary | "SPECIFIC IMPULSE 424 sec." | https://web.archive.org/web/20200808233218/https://www.nasa.gov/centers/marshall/pdf/499245main_J2_Engine_fs.pdf |
| mass_kg | 1578.5 | primary | "WEIGHT, DRY, FLIGHT CONFIGURATION 3,480 lb." | https://web.archive.org/web/20200808233218/https://www.nasa.gov/centers/marshall/pdf/499245main_J2_Engine_fs.pdf |
| diameter_m | 1.956 | primary | "NOZZLE EXIT DIAMETER 6 ft. 5 in." | https://web.archive.org/web/20200808233218/https://www.nasa.gov/centers/marshall/pdf/499245main_J2_Engine_fs.pdf |

### RD-180 (`rd-180`)

| Field | Value | Tier | Quote | Source |
|---|---|---|---|---|
| thrustSL_kN | 3826.6 | primary | "Thrust, sea level / vacuum, tf 390,2 / 423,4" | https://web.archive.org/web/20140705155358/http://www.npoenergomash.ru/eng/engines/rd180/ |
| thrustVac_kN | 4152.1 | primary | same | https://web.archive.org/web/20140705155358/http://www.npoenergomash.ru/eng/engines/rd180/ |
| ispSL_s | 311.9 | primary | "Specific impulse, sea level / vacuum, sec 311,9 / 338,4" | https://web.archive.org/web/20140705155358/http://www.npoenergomash.ru/eng/engines/rd180/ |
| ispVac_s | 338.4 | primary | same | https://web.archive.org/web/20140705155358/http://www.npoenergomash.ru/eng/engines/rd180/ |
| mass_kg | 5480 | primary | "Weight, dry / filled, kg 5480 / 5950" | https://web.archive.org/web/20140705155358/http://www.npoenergomash.ru/eng/engines/rd180/ |
| diameter_m | 3.2 | primary (OVERALL engine diameter, 2 nozzles) | "height / diameter, mm 3600 / 3200" | https://web.archive.org/web/20140705155358/http://www.npoenergomash.ru/eng/engines/rd180/ |

### RD-191 (`rd-191`)

| Field | Value | Tier | Quote | Source |
|---|---|---|---|---|
| thrustSL_kN | 1922.1 | primary | "Thrust, sea level / vacuum, tf 196 / 212,6" | https://web.archive.org/web/20131223082506/http://www.npoenergomash.ru/eng/engines/rd191/ |
| thrustVac_kN | 2084.9 | primary | same | https://web.archive.org/web/20131223082506/http://www.npoenergomash.ru/eng/engines/rd191/ |
| ispSL_s | 311.2 | primary | "311,2 / 337,5" | https://web.archive.org/web/20131223082506/http://www.npoenergomash.ru/eng/engines/rd191/ |
| ispVac_s | 337.5 | primary | same | https://web.archive.org/web/20131223082506/http://www.npoenergomash.ru/eng/engines/rd191/ |
| mass_kg | 2200 | primary | "Weight, dry, kg 2200" | https://web.archive.org/web/20131223082506/http://www.npoenergomash.ru/eng/engines/rd191/ |
| diameter_m | 2.1 | primary (OVERALL diameter) | "height / diameter, mm 3780 / 2100" | https://web.archive.org/web/20131223082506/http://www.npoenergomash.ru/eng/engines/rd191/ |

### RS-68A (`rs-68a`)

| Field | Value | Tier | Quote | Source |
|---|---|---|---|---|
| thrustSL_kN | 3136.0 | primary | "Thrust (Sea Level): 705K lbf" | https://web.archive.org/web/2020/https://www.rocket.com/sites/default/files/documents/RS-68A_data_sheet.pdf |
| thrustVac_kN | 3558.6 | primary | "Thrust (Vacuum): 800K lbf" | https://web.archive.org/web/2020/https://www.rocket.com/sites/default/files/documents/RS-68A_data_sheet.pdf |
| ispSL_s | 362 | primary | "Isp, Sea Level: 362 sec" | https://web.archive.org/web/2020/https://www.rocket.com/sites/default/files/documents/RS-68A_data_sheet.pdf |
| ispVac_s | 411 | primary | "Isp, Vacuum: 411 sec" | https://web.archive.org/web/2020/https://www.rocket.com/sites/default/files/documents/RS-68A_data_sheet.pdf |
| mass_kg | 6686.0 | primary | "Weight: 14,740 lbs" | https://web.archive.org/web/2020/https://www.rocket.com/sites/default/files/documents/RS-68A_data_sheet.pdf |
| diameter_m | 2.438 | primary (engine "Diameter", not stated as nozzle exit) | "Diameter: 8 ft" | https://web.archive.org/web/2020/https://www.rocket.com/sites/default/files/documents/RS-68A_data_sheet.pdf |

## Tanks

| id | Propellant | D x H (m) | Propellant (kg) | Dry (kg) | Dry / propellant | Derivation and sources |
|---|---|---|---|---|---|---|
| `falcon9-s1-tank` | kerolox | 3.66 x 41.2 | 409,583 | 21,395.2 | 5.22 % | propellant: FAA 2020 EA Table 2-1 total 1,135,925 lbm minus S2 232,950 lb (primary); dry 25,600 kg Wikipedia UNCITED; D 3.66 m Falcon User's Guide 2025; H 41.2 m Wikipedia; derived: stage dry 25,600 kg minus 9 x merlin-1d 467.2 kg; https://www.faa.gov/sites/faa.gov/files/space/environmental/nepa_docs/SpaceX_Falcon_Program_Final_EA_and_FONSI.pdf |
| `falcon9-s2-tank` | kerolox | 3.66 x 13.8 | 105,664 | 3,410 | 3.23 % | propellant: FAA 2020 EA "168,000 pounds of LOX and 64,950 pounds of RP-1 in the second stage"; dry 3,900 kg Wikipedia UNCITED; MVac mass is an RO placeholder; FAILS the 4% floor; derived: stage dry 3,900 kg minus 1 x merlin-1d-vac 490 kg; https://www.faa.gov/sites/faa.gov/files/space/environmental/nepa_docs/SpaceX_Falcon_Program_Final_EA_and_FONSI.pdf |
| `centaur-iii-tank` | hydrolox | 3.05 x 12.68 | 20,830 | 2,052.5 | 9.85 % | ULA Atlas V User's Guide 2010 Fig 1.4.1-3: "Inert Mass: 4X1: 2,243 kg", "Propellant: 20,830-kg", "3.05-m ... x 12.68-m ... Length with Extended Nozzle". Guide-era engine was RL10A-4-2 (168 kg, braeunig); catalog RL10C-1 mass used so the round trip closes; derived: stage dry 2,243 kg minus 1 x rl10c-1 190.5 kg; https://www.ulalaunch.com/docs/default-source/rockets/atlasvusersguide2010.pdf |
| `saturn-v-s-ic-tank` | kerolox | 10.058 x 42.06 | 2,145,798 | 88,464.4 | 4.12 % | SP-4029 Apollo 11 ground-ignition weights: dry 287,531 lb, fuel 1,424,889 lb, oxidizer 3,305,786 lb; D/L 33 ft x 138 ft from SA-503 flight manual https://ntrs.nasa.gov/api/citations/19750063889/downloads/19750063889.pdf; derived: stage dry 130,422 kg minus 5 x f-1 8391.5 kg; https://www.nasa.gov/wp-content/uploads/2023/04/sp-4029.pdf |
| `saturn-v-s-ii-tank` | hydrolox | 10.058 x 24.84 | 443,235 | 28,265.2 | 6.38 % | SP-4029 Apollo 11: dry 79,714 lb; LOX 819,050 lb + LH2 158,116 lb (scan labels swapped, column sum verified); 33 ft x 81.5 ft from SA-503 manual; derived: stage dry 36,158 kg minus 5 x j-2 1578.5 kg; https://www.nasa.gov/wp-content/uploads/2023/04/sp-4029.pdf |
| `saturn-v-s-ivb-tank` | hydrolox | 6.614 x 18.07 | 107,095 | 9,694.2 | 9.05 % | SP-4029 Apollo 11: dry 24,852 lb; LH2 43,608 + LOX 192,497 lb; 21.7 ft x 59.3 ft from SA-503 manual (length may include aft skirt); derived: stage dry 11,273 kg minus 1 x j-2 1578.5 kg; https://www.nasa.gov/wp-content/uploads/2023/04/sp-4029.pdf |
| `atlas-v-ccb-tank` | kerolox | 3.81 x 32.46 | 284,089 | 15,574 | 5.48 % | ULA Atlas V UG 2010: "Propellant: 284,089-kg", "Inert Mass: 21,054 kg" (400-series), "3.81-m ... x 32.46-m"; derived: stage dry 21,054 kg minus 1 x rd-180 5480 kg; https://www.ulalaunch.com/docs/default-source/rockets/atlasvusersguide2010.pdf |
| `sls-core-tank` | hydrolox | 8.4 x 64.6 | 987,471 | 83,830.3 | 8.49 % | NASA: LH2 317,000 lb + LOX 1.86 M lb; 212 ft, 27.6 ft. Dry = Artemis II weighed 215,910 lb (Wikipedia citing @NASAGroundSys, not fetched) - inference that this includes engines; alt NASA "empty 188,000 lb" gives ~8.6%; derived: stage dry 97,935 kg minus 4 x rs-25 3526.2 kg; https://www.nasa.gov/reference/sls-space-launch-system-core-stage |
| `icps-tank` | hydrolox | 5.1 x 13.7 | 28,948 | 3,498.8 | 12.09 % | size from NASA ICPS fact sheet; masses Wikipedia UNCITED (empty 3,800 / gross 32,748 kg) https://en.wikipedia.org/wiki/Delta_Cryogenic_Second_Stage - low confidence; derived: stage dry 3,800 kg minus 1 x rl10b-2 301.2 kg; https://nasa.gov/wp-content/uploads/2021/11/icps_fact_sheet_11172021.pdf |
| `delta-iv-cbc-tank` | hydrolox | 5.0 x 40.8 | 199,640 | 20,074.0 | 10.06 % | braeunig (secondary, no license notice): stage 226,400 kg, propellant 199,640 kg, length 40.8 m; D 5 m from ULA Delta IV UG https://www.ulalaunch.com/docs/default-source/rockets/delta-iv-user's-guide.pdf; GCAT agrees on masses for the RS-68A CBC; derived: stage dry 26,760 kg minus 1 x rs-68a 6686.0 kg; http://www.braeunig.us/space/specs/delta.htm |
| `dcss-5m-tank` | hydrolox | 5.0 x 13.7 | 27,200 | 3,188.8 | 11.72 % | propellant 27,200 kg ULA Delta IV UG (primary); stage 30,710 / propellant 27,220 kg and 13.7 m from braeunig http://www.braeunig.us/space/specs/delta.htm; derived: stage dry 3,490 kg minus 1 x rl10b-2 301.2 kg; https://www.ulalaunch.com/docs/default-source/rockets/delta-iv-user's-guide.pdf |
| `shuttle-et-tank` | hydrolox | 8.41 x 46.94 | 725,521 | 26,943.4 | 3.71 % | NASA propulsion fact sheet: "approximately 59,400 pounds while empty and 1,658,900 pounds full"; 154 ft x 27.6 ft (SLWT sheet). No engines. FAILS the 4% floor; tank empty mass 26,943 kg (no engines); https://www.nasa.gov/wp-content/uploads/2016/08/174533main_shuttle_propulsion.pdf |

Two real flown articles fall under P2's 4 % dry-mass rule: `falcon9-s2-tank` (3.23 %) and `shuttle-et-tank` (3.71 %, a pure tank). The data is real; the rule is P2's call.

## Payloads

| id | Mass (kg) | D x H (m) | Source |
|---|---|---|---|
| `nova-c` | 1,908 | 2 x 3.938 | https://en.wikipedia.org/w/index.php?title=Intuitive_Machines_Nova-C&oldid=1379202564 ("launch mass of 1908 kg"; "3.938 m tall"; infobox diameter 2 m) |
| `goes-r` | 5,192 | 3.9 x 6.1 | https://www.nesdis.noaa.gov/our-satellites/currently-flying/goes-east-west/goes-r-series-spacecraft-instruments ("mass at launch (fueled): 11,446 lbs (5,192 kg)"; "6.1 m x 5.6 m x 3.9 m") |
| `jwst` | 6,200 | 4.472 x 10.661 | https://science.nasa.gov/mission/webb/fact-sheet/ (mass "Approx 6200 kg"); stowed dims https://www.eucass.eu/images/eucass2022/plenaries/P0-9_ArianeGroup_-_Rongier.pdf |
| `hubble` | 10,886 | 4.2 x 13.3 | https://science.nasa.gov/missions/hubble/a-nasa-refresher-on-hubble-facts-for-the-25th-anniversary |

## Missions

| id | Required delta-v (m/s) | Derivation and sources |
|---|---|---|
| `leo` | 9,400 | https://en.wikipedia.org/w/index.php?title=Delta-v_budget&oldid=1362285519 ("about 9.4 km/s"; table 9.3-10 km/s); cross-check https://seitzman.gatech.edu/classes/ae4451/vehicle_acceleration.pdf (Saturn V 9,267 m/s net of Earth rotation) |
| `gto` | 11,900 | derived: 9,400 m/s surface->LEO incl. losses (https://en.wikipedia.org/w/index.php?title=Delta-v_budget&oldid=1362285519 "about 9.4 km/s"; bracketed by Humble/Henry/Larson Table 2.10 via https://seitzman.gatech.edu/classes/ae4451/vehicle_acceleration.pdf) + 2,500 LEO->GTO (https://web.archive.org/web/20070701211813/http://www.pma.caltech.edu/~chirata/deltav.html, chart-read) |
| `moon-transfer` | 12,600 | derived: 9,400 m/s surface->LEO incl. losses (https://en.wikipedia.org/w/index.php?title=Delta-v_budget&oldid=1362285519 "about 9.4 km/s"; bracketed by Humble/Henry/Larson Table 2.10 via https://seitzman.gatech.edu/classes/ae4451/vehicle_acceleration.pdf) + 3,200 LEO->TLI (https://en.wikipedia.org/w/index.php?title=Delta-v_budget&oldid=1362285519 Gateway table "3.20"; Apollo TLI 3.05-3.25 km/s) |
| `lunar-orbit` | 13,500 | derived: 9,400 m/s surface->LEO incl. losses (https://en.wikipedia.org/w/index.php?title=Delta-v_budget&oldid=1362285519 "about 9.4 km/s"; bracketed by Humble/Henry/Larson Table 2.10 via https://seitzman.gatech.edu/classes/ae4451/vehicle_acceleration.pdf) + 3,200 TLI + 900 LOI (https://ntrs.nasa.gov/api/citations/20150019648/downloads/20150019648.pdf "at minimum around 900 m/s") |
| `mars-transfer` | 13,200 | derived: 9,400 m/s surface->LEO incl. losses (https://en.wikipedia.org/w/index.php?title=Delta-v_budget&oldid=1362285519 "about 9.4 km/s"; bracketed by Humble/Henry/Larson Table 2.10 via https://seitzman.gatech.edu/classes/ae4451/vehicle_acceleration.pdf) + 3,800 LEO->Mars transfer (https://web.archive.org/web/20070701211813/http://www.pma.caltech.edu/~chirata/deltav.html chart 2.5+0.7+0.6); ULA "typical" 4.3 km/s gives 13,700 (https://web.archive.org/web/20111020010301/http://www.ulalaunch.com/site/docs/publications/DepotBasedTransportationArchitecture2010.pdf) |
| `earth-escape` | 12,600 | derived: 9,400 m/s surface->LEO incl. losses (https://en.wikipedia.org/w/index.php?title=Delta-v_budget&oldid=1362285519 "about 9.4 km/s"; bracketed by Humble/Henry/Larson Table 2.10 via https://seitzman.gatech.edu/classes/ae4451/vehicle_acceleration.pdf) + 3,200 (https://web.archive.org/web/20111020010301/http://www.ulalaunch.com/site/docs/publications/DepotBasedTransportationArchitecture2010.pdf "a further 3.2 km/sec") |

Surface-to-LEO figures in the literature range from 8.8 to 10.2 km/s; 9,400 m/s is Wikipedia's stated "about 9.4 km/s" and sits inside the Humble/Henry/Larson range (Saturn V: 9,267 m/s net of Earth rotation).

## Reference rockets

| id | Liftoff mass (kg) | Liftoff thrust (kN) | LEO payload (kg) | Stages | Source |
|---|---|---|---|---|---|
| `falcon-9` | 549,054 | 7,607 | 22,800 | 2 | https://www.spacex.com/vehicles/falcon-9/ |
| `falcon-heavy` | 1,420,788 | 22,819 | 63,800 | 2 | https://www.spacex.com/vehicles/falcon-heavy/ |
| `saturn-v` | 2,800,000 | 34,500 | 118,000 | 3 | https://www.nasa.gov/learning-resources/for-kids-and-students/what-was-the-saturn-v-grades-5-8/ |
| `starship` | 5,500,000 | 80,807 | 100,000 | 2 | https://www.spacex.com/vehicles/starship/ (thrust 8,240 tf, payload "100+ t" TARGET); liftoff mass 5,500 t from GCAT lv.tsv "Starship V3" (?-flagged) https://planet4589.org/space/gcat/tsv/tables/lv.tsv |
| `sls-block-1` | 2,603,000 | 36,786 | 95,000 | 2 | https://www.nasa.gov/wp-content/uploads/2022/03/sls-reference-guide-2022-v2-508-0.pdf |

## Credits

- GCAT data: J. McDowell, planet4589.org/space/gcat, CC BY 4.0 (`starship` liftoff mass).
- Wikipedia facts: CC BY-SA 4.0, cited per value above.
- NASA documents are US Government works.
