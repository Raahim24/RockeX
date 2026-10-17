# Real rocket stage data for deriving app `Tank`s

Compiled 2026-10-17. Every number below comes from a page or PDF fetched in this session. Each one has its URL and a short verbatim quote. Anything I couldn't source is marked **TODO(source)**. Conversions use 1 lb = 0.45359237 kg and 1 ft = 0.3048 m, and computed values are labeled *derived*.

Source quality tags:
- **[P]** primary: NASA, FAA, ULA, SpaceX, ESA, or a manufacturer.
- **[S]** secondary compilation: braeunig.us "Rocket & Space Technology".
- **[W]** Wikipedia. For [W] entries I list the cited reference, or say there isn't one.

How PDFs were read: I downloaded them to `scratchpad/downloads/<name>/` and extracted text with pypdf in an isolated venv, run as `python -I`. I read the scanned Saturn V News Reference pages after rendering them with PyMuPDF.

---

## 0. Summary table (derived Tank candidates)

`tankDry = stageDry − n × engineMass`. `ratio = tankDry / propellantMass`. The app rule requires ratio ≥ 4 %.

| id | prop | D (m) | H (m) | propellant (kg) | stage dry (kg) | engines | engine mass (kg) | tank dry (kg) | ratio | ≥4 %? |
|---|---|---|---|---|---|---|---|---|---|---|
| f9-b5-s1 | kerolox | 3.66 | 41.2 | 409,583 (FAA-derived) | 25,600 [W] | 9 × Merlin 1D | 467 [W] | 21,395 | 5.22 % | yes |
| f9-b5-s2 | kerolox | 3.66 | 13.8 | 105,664 (FAA) | 3,900 [W] | 1 × MVac | 467 (placeholder) | 3,433 | **3.25 %** | **NO** |
| saturn-v-s-ic | kerolox | 10.058 | 42.06 | 2,145,798 | 130,422 | 5 × F-1 | 8,391 | 88,465 | 4.12 % | yes (barely) |
| saturn-v-s-ii | hydrolox | 10.058 | 24.84 | 443,235 | 36,158 | 5 × J-2 | 1,579 | 28,265 | 6.38 % | yes |
| saturn-v-s-ivb | hydrolox | 6.614 | 18.07 | 107,095 | 11,273 | 1 × J-2 | 1,579 | 9,694 | 9.05 % | yes |
| atlas-v-ccb | kerolox | 3.81 | 32.46 | 284,089 | 21,054 | 1 × RD-180 | 5,480 [S] | 15,574 | 5.48 % | yes |
| centaur-iii-sec | hydrolox | 3.05 | 12.68 | 20,830 | 2,243 | 1 × RL10A-4-2 | 168 [S] | 2,075 | 9.96 % | yes |
| sls-core | hydrolox | 8.4 | 64.6 | 987,471 | 97,935 (weighed) | 4 × RS-25 | 3,527 | 83,828 | 8.49 % | yes |
| icps | hydrolox | 5.1 | 13.7 | 28,948 [W] | 3,800 [W] | 1 × RL10B-2 | 301 [S] | 3,499 | 12.09 % | yes |
| delta-iv-cbc | hydrolox | 5.13 | 40.8 | 199,640 [S] | 26,760 [S] | 1 × RS-68 | 6,604 [S] | 20,156 | 10.10 % | yes |
| dcss-5m | hydrolox | 5.0 | 13.7 | 27,220 [S] | 3,490 [S] | 1 × RL10B-2 | 301 [S] | 3,189 | 11.72 % | yes |
| ariane-6-llpm | hydrolox | 5.4 | 32 | 154,000 | 23,000 | 1 × Vulcain 2.1 | ~2,000 | 21,000 | 13.64 % | yes |
| delta-ii-s2 | hypergolic | 1.70 | 5.89 | 6,006 [S] | 924 [S] | 1 × AJ10-118K | 124.7 [S] | 799 | 13.31 % | yes |
| shuttle-et | hydrolox | 8.41 | 46.94 | 725,521 | 26,535 (no engines) | 0 | — | 26,535 | **3.66 %** | **NO** |
| shuttle-srb | solid | 3.71 | 45.48 | 504,259 | 84,731 (inert) | 0 (integral nozzle) | — | 84,731 | 16.80 % | yes |

Partial stages are in §11: Super Heavy, Starship, Centaur V, and Vulcan booster. They have propellant figures but no published dry mass, so they don't appear in the table above.

Key finding: **two real flight articles fail the app's 4 % floor.**
- The **Shuttle External Tank** is a pure tank and the best direct analogue. It comes out at 3.66–3.71 %.
- The **Falcon 9 second stage** comes out at 3.25–3.70 %, depending on which propellant figure you use.
- The **S-IC** passes only barely, at 4.12 %.

If the app wants to allow these, lower the floor to about 3 %. Otherwise accept that the ET and the F9 S2 can't be modelled faithfully.

---

## 1. Falcon 9 Block 5: first stage

SpaceX publishes no stage masses. The Falcon User's Guide gives diameter, engines, and thrust only. The FAA's 2020 EA gives propellant loads; I couldn't find a primary source for dry mass.

| field | SI value | original | URL | quote |
|---|---|---|---|---|
| diameter | 3.66 m | 3.66 m (12 ft) | [P] https://www.spacex.com/assets/media/falcon-users-guide-2025-05-09.pdf (p. 9, table) | "Diameter 3.66 m (12 ft) 3.66 m (12 ft)" |
| diameter (alt) | 3.7 m | 3.7 m / 12 ft | [W] https://en.wikipedia.org/wiki/Falcon_9 (Specifications table, uncited) | "Diameter … 3.7 m / 12 ft" |
| height | 41.2 m (47.7 m with interstage) | 41.2 m / 135.2 ft | [W] same, uncited | "Height … 41.2 m / 135.2 ft" ; "Height (with interstage) … 47.7 m / 156.5 ft" |
| overall vehicle height | 70 m | 70 m (229.6 ft) | [P] Falcon User's Guide p. 9 | "Height 70 m (229.6 ft) including both stages, interstage, and standard fairing" |
| engines | 9 × Merlin 1D | — | [P] Falcon User's Guide | "Nine SpaceX M1D engines power the Falcon 9 first stage with up to 845 kN (190,000 lbf) thrust per engine at sea level" |
| stage thrust (SL) | 7,686 kN (table) / 7,605 kN (text) | — | [P] Falcon User's Guide | table: "Thrust (stage total) 7,686 kN (sea level) (1,710,000 lbf)"; text: "for a total thrust of 7,605 kN (1,710,000 lbf) at liftoff". **The guide contradicts itself. 1,710,000 lbf is 7,607 kN.** |
| propellant, both stages (loaded) | 515,247 kg | 1,135,925 lbm | [P] FAA, Final EA SpaceX Falcon Launches at KSC & CCAFS, July 2020, Table 2-1: https://www.faa.gov/sites/faa.gov/files/space/environmental/nepa_docs/SpaceX_Falcon_Program_Final_EA_and_FONSI.pdf | "Propellant Quantitya (total) lbm 1,033,975 1,120,925 1,135,925" (Block 5 is the last column); "a Propellant quantities vary based on mission parameters." |
| second-stage propellant (same doc) | 105,664 kg | 168,000 lb LOX + 64,950 lb RP-1 | [P] FAA 2020 EA §2.1.1.2 | "168,000 pounds of LOX and 64,950 pounds of RP-1 in the second stage" (stated for Falcon Heavy). The FUG says FH "utilizes the same second stage and same payload fairing as flown on Falcon 9" |
| **first-stage propellant (derived)** | **409,583 kg** | 1,135,925 − 232,950 = 902,975 lb | derived from the two FAA rows | Cross-check: FAA FH first stage "1,898,000 pounds of LOX and 807,000 pounds of RP-1" ÷ 3 cores = 901,667 lb per core, within 0.15 % |
| propellant (alt) | 395,700 kg | 395,700 kg / 872,369 lb | [W] Falcon 9, uncited | "Propellant mass … 395,700 kg/ 872,369 lb" |
| stage dry mass | 25,600 kg | 25,600 kg / 56,423 lb | [W] Falcon 9, **uncited**. TODO(primary source) | "Empty mass … 25,600 kg / 56,423 lb" |
| burn time | 162 s | 162 sec. | [W] uncited | "Burn time … 162 sec." |
| Isp (SL / vac) | 283 / 312 s | — | [W] uncited | "Specific Impulse (sea-level) 283 sec." / "(vacuum sec) 312 sec." |

Does the dry mass include engines? Wikipedia doesn't say, but by convention "empty mass" includes installed engines, legs, and grid fins and excludes the interstage. The 41.2 m height also excludes the interstage. This definition is **unverified**.

Isp cross-check, computed as F·t/(m·g0) with 7,607 kN and 162 s:
- With the FAA propellant: 306.8 s, which sits between the SL and vac values. Plausible.
- With Wikipedia's 395,700 kg: 317.6 s, which is above the vacuum Isp.

So the FAA figure is the more self-consistent one. The booster also keeps landing propellant that it doesn't burn during ascent.

### Merlin 1D (engine)

| field | SI | original | URL | quote |
|---|---|---|---|---|
| mass | 467 kg | 1,030 lb | [W] https://en.wikipedia.org/wiki/SpaceX_Merlin, citing Tom Mueller (Merlin designer) on Quora: https://www.quora.com/Is-SpaceXs-Merlin-1Ds-thrust-to-weight-ratio-of-150+-believable/answer/Thomas-Mueller-11 (Quora returned 403, so I couldn't fetch it) | cited quote: "The Merlin 1D weighs 1030 pounds, including the hydraulic steering (TVC) actuators … The new full thrust variant weighs the same" |
| sea-level diameter | 0.92 m | 0.92 m | [W] SpaceX Merlin infobox, **uncited**. TODO(primary) | "diameter = Sea level: {{cvt\|0.92\|m\|ft}}<br/>Vacuum: {{cvt\|3.3\|m\|ft}}" |
| MVac mass | **TODO(source)** | — | — | Not found. I used the M1D mass as a placeholder in the S2 derivation. MVac has a much larger nozzle, so it is probably heavier, which would make the S2 tank ratio even lower. |
| MVac expansion | 165:1 | — | [P] FUG | "using a fixed 165:1 expansion nozzle" |

## 2. Falcon 9 Block 5: second stage

| field | SI | original | URL | quote |
|---|---|---|---|---|
| diameter | 3.66 m | 3.66 m (12 ft) | [P] FUG table | "Diameter 3.66 m (12 ft) 3.66 m (12 ft)" |
| height | 13.8 m | 13.8 m / 45.3 ft | [W] uncited | "Height … 13.8 m / 45.3 ft" |
| propellant (loaded) | 105,664 kg | 168,000 lb LOX + 64,950 lb RP-1 | [P] FAA 2020 EA (see §1) | "168,000 pounds of LOX and 64,950 pounds of RP-1 in the second stage" |
| propellant (alt) | 92,670 kg | 92,670 kg / 204,302 lb | [W] uncited | "Propellant mass … 92,670 kg / 204,302 lb" |
| dry mass | 3,900 kg | 3,900 kg / 8,598 lb | [W] **uncited**. TODO(primary) | "Empty mass … 3,900 kg / 8,598 lb" |
| engine | 1 × MVac, 981 kN vac | 220,500 lbf | [P] FUG | "981 kN (Vacuum) (220,500 lbf)" |
| burn time / Isp | 397 s / 348 s | — | [W] uncited | "Burn Time 397 sec" ; "Specific Impulse (vacuum) 348 sec" |

Isp cross-check:
- With Wikipedia's 92,670 kg: 981 kN × 397 s / (92,670 × g0) = 428.5 s. That is impossible for kerolox (348 s), so Wikipedia's S2 propellant is inconsistent with its own thrust and burn time.
- With the FAA's 105,664 kg: 375.8 s. Still high, but MVac throttles, so this is closer.

Either way the S2 tank ratio lands at **3.25–3.70 %**, below the app's 4 %.

## 3. Saturn V S-IC (first stage), AS-506 / Apollo 11 actuals

| field | SI | original | URL | quote |
|---|---|---|---|---|
| diameter | 10.058 m | 33 ft | [P] Saturn V Flight Manual SA-503, MSFC-MAN-503, NTRS 19750063889: https://ntrs.nasa.gov/api/citations/19750063889/downloads/19750063889.pdf | "The S-IC stage (figure 4-1) is a cylindrical booster, 138 feet long and 33 feet in diameter, powered by five liquid propellant F-1 rocket engines." |
| length | 42.06 m | 138 ft | same | (same quote) |
| dry mass, AS-506 actual | 130,422 kg | 287,531 lb | [P] NASA SP-4029 *Apollo by the Numbers*, "Ground Ignition Weights" table (PDF p. 294): https://www.nasa.gov/wp-content/uploads/2023/04/sp-4029.pdf | Apollo 11 column: "S-IC stage, dry … 287,531" |
| fuel (RP-1) | 646,319 kg | 1,424,889 lb | same | "S-IC stage, fuel … 1,424,889" |
| oxidizer (LOX) | 1,499,479 kg | 3,305,786 lb | same | "S-IC stage, oxidizer … 3,305,786" |
| other | 2,468 kg | 5,442 lb | same | "S-IC stage, other … 5,442" (not counted as propellant) |
| total at ignition | 2,278,689 kg | 5,023,648 lb | same | "S-IC stage, total … 5,023,648" (the components sum exactly) |
| **propellant (loaded at ground ignition)** | **2,145,798 kg** | 4,730,675 lb | derived (fuel + oxidizer) | — |
| dry mass, nominal (SA-503 manual) | 138,391 kg | 305,100 lb | [P] Flight Manual | "The stage dry weight is approximately 305,100 pounds and total weight at ground ignition is approximately 4,792,200 pounds." **Disagrees with AS-506 actual (287,531 lb). I use the actual.** |
| thrust / burn | 7,610,000 lbf total SL; 150.7 s nominal | — | [P] Flight Manual | "F-I 1,522,000 7,610,000 150.7SEC" |
| AS-506 burn | outboard cutoff 168.03 s and center 141.6 s after ground ignition | — | [P] SP-4029, Apollo 11 ascent table | "S-IC outboard engine cutoff 000:02:41.63 … 168.03" ; "S-IC center engine cutoff3 000:02:15.20 … 141.6" |

Dry mass includes the five installed F-1 engines. The S-IC/S-II interstage is listed separately ("S-IC/S-11 interstage, dry … 11,509" lb for Apollo 11), so it is excluded.

Isp check: (4 × 168.03 + 141.6) engine-s × 1,522,000 lbf / (2,145,798 kg × g0) = **261.8 s**. The F-1 sheet gives 260 s minimum at sea level, so this is consistent.

### F-1 engine

Source: [P] Saturn V News Reference, *F-1 Engine Fact Sheet* (MSFC). Archived copy: https://web.archive.org/web/20090412022007/http://history.msfc.nasa.gov/saturn_apollo/documents/F-1_Engine.pdf (scanned; I read it from the rendered page image).

| field | SI | original | quote |
|---|---|---|---|
| mass | 8,391 kg | 18,500 lb | "WEIGHT FLIGHT CONFIGURATION 18,500 lb. maximum" |
| nozzle exit | 3.531 m | 11 ft 7 in | "MAXIMUM NOZZLE EXIT DIAMETER 11 ft. 7 in." |
| width | 3.759 m | 12 ft 4 in | "WIDTH 12 ft. 4 in." |
| length | 5.79 m | 19 ft | "LENGTH 19 ft." |
| thrust (SL) | 6.67 MN (6.77 MN uprated) | 1,500,000 lb, uprated to 1,522,000 lb | "THRUST (sea level) 1,500,000 lb." ; "F-1 engine will be uprated to 1,522,000 lb. thrust for Vehicle 504 and all subsequent operational vehicles." |

## 4. Saturn V S-II (second stage), AS-506

| field | SI | original | URL | quote |
|---|---|---|---|---|
| diameter / length | 10.058 m / 24.84 m | 33 ft / 81.5 ft | [P] Flight Manual | "The stage (figure 5-1) is 81.5 feet long, 33 feet in diameter, and is powered by five liquid propellant J-2 rocket engines" |
| dry, AS-506 actual | 36,158 kg | 79,714 lb | [P] SP-4029 p. 294 | Apollo 11 column: "S-11 stage, dry … 79,714" |
| LOX | 371,515 kg | 819,050 lb | same | Apollo 11 column, second value: 819,050. **The scan labels this row "fuel" and the next one "oxidizer", but the magnitudes show they are swapped** (LOX ≈ 5× LH2). The column sums correctly: 79,714 + 819,050 + 158,116 + 1,260 = 1,058,140 = "S-Il stage, total". |
| LH2 | 71,720 kg | 158,116 lb | same | (see above) |
| **propellant (loaded)** | **443,235 kg** | 977,166 lb | derived | — |
| dry, nominal (SA-503) | 40,098 kg | 88,400 lb | [P] Flight Manual | "Dry weight of the stage is approximately 88,400 pounds (98,659 pounds including the S-IC/S-II interstage)." So this figure **excludes** the interstage. |
| thrust | 5 × 228,000 lbf vac | — | [P] Flight Manual | "develop a nominal vacuum thrust of 228,000 pounds each for a total of 1,140,000 pounds" |
| AS-506 burn | outboard 384.22 s, center 296.62 s | — | [P] SP-4029 | "S-II outboard engine cutoff 000:09:08.22 … 384.22" ; "S-II center engine cutoff 000:07:40.62 … 296.62" |

Isp check: (4 × 384.22 + 296.62) × 228,000 lbf / (443,235 kg × g0) = **427.8 s**. The J-2 sheet gives 424 s (427 at 5:1 mixture ratio), so this is consistent.

### J-2 engine

Source: [P] Saturn V News Reference, *J-2 Engine Fact Sheet*. Archived copy: https://web.archive.org/web/2005/http://history.msfc.nasa.gov/saturn_apollo/documents/J-2_Engine.pdf (scanned; I read the rendered page).

| field | SI | original | quote |
|---|---|---|---|
| mass | 1,579 kg | 3,480 lb | "WEIGHT, DRY, FLIGHT CONFIGURATION 3,480 lb." |
| nozzle exit | 1.956 m | 6 ft 5 in | "NOZZLE EXIT DIAMETER 6 ft. 5 in." |
| length / width | 3.38 m / 1.97 m | 11 ft 1 in / 6 ft 8½ in | "LENGTH 11 ft. 1 in." "WIDTH 6 ft. 8½ in." |
| thrust / Isp | 230,000 lb (altitude) / 424 s | — | "THRUST (altitude) 230,000 lb. (vehicle 503 2nd stage 225,000 lb.)" ; "SPECIFIC IMPULSE 424 sec. (427 at 5:1 mixture ratio)" |

## 5. Saturn V S-IVB (third stage), AS-506

| field | SI | original | URL | quote |
|---|---|---|---|---|
| diameter / length | 6.614 m / 18.07 m | 21.7 ft / 59.3 ft | [P] Flight Manual, stage dimensions table | "S-IVB Stage 21.7 FEET 59.3 FEET". The stage drawing shows "59.0 FEET" and "21.6 FEET", a minor disagreement. The length likely includes the aft skirt and interstage region. |
| dry, AS-506 | 11,273 kg | 24,852 lb | [P] SP-4029 p. 294 | Apollo 11 column: "S-IVBstage, dry … 24,852". The S-II/S-IVB interstage is listed separately (8,076 lb). |
| LH2 / LOX | 19,780 / 87,315 kg | 43,608 / 192,497 lb | same | "S-IVB stage, fuel 43,608"; "oxidizer 192,497". The sum checks: total 262,613 lb. |
| **propellant (loaded)** | **107,095 kg** | 236,105 lb | derived | — |
| other | 751 kg | 1,656 lb | same | not counted |
| dry, nominal (SA-503), incl. interstage | 15,033 kg | 33,142 lb | [P] Flight Manual | "The stage dry weight (including interstage) is approximately 33,142 pounds." |
| engine | 1 × J-2 | — | [P] Flight Manual | "Its single J-2 engine…" |
| 1st burn (AS-506) | 147.13 s | — | [P] SP-4029 | "S-IVB 1st burn cutoff 000:11:39.33 … 147.13" |

The Saturn IB version (Apollo 7, S-IVB-205) is in the same SP-4029 table: dry 21,852 lb, fuel 39,909 lb, oxidizer 193,330 lb. I didn't build a separate tank because I couldn't source Saturn IB dimensions this session. TODO.

## 6. Atlas V Common Core Booster and Centaur III

All from [P] ULA *Atlas V Launch Services User's Guide*, Rev 11, March 2010, Fig. 1.4.1-3: https://www.ulalaunch.com/docs/default-source/rockets/atlasvusersguide2010.pdf

### Common Core Booster (CCB)

| field | SI | original | quote |
|---|---|---|---|
| size | 3.81 m × 32.46 m | 150 in × 1278 in | "Size: 3.81-m (150-in) Dia x 32.46-m (1278-in) Length" |
| propellant | 284,089 kg | 626,309 lb | "Propellant: 284,089-kg (626,309 lbs) LO2 & RP-1" |
| inert mass (400-series) | 21,054 kg | 46,416 lb | "Inert Mass: 21,054 kg (46,416 lbs)" |
| inert mass (500-series) | 21,351 kg | 47,071 lb | "Inert Mass: 21,351 kg (47,071 lbs)" |
| engine / thrust | 1 × RD-180, 3,827 kN SL | — | "SL 100% Thrust = 3,827 kN (860,309 lbf), I SP = 311.3 s" |

Disagreement: braeunig [S] http://www.braeunig.us/space/specs/atlas.htm gives "Dry mass: 20,743 kg (21,173 kg for 55X configuration)". The ULA figure is used.

"Inert mass" includes the installed RD-180. Whether it includes the 400-series ISA is unclear; the ISA is listed separately in the same figure ("Mass: 4X1: 947 kg").

### RD-180 engine

| field | SI | URL | quote |
|---|---|---|---|
| dry mass | 5,480 kg | [S] braeunig atlas.htm | "Dry mass: 5,480 kg" |
| max diameter | 3.15 m (two-chamber engine) | [S] same | "Maximum diameter: 3.15 m" |

TODO: primary source (NPO Energomash).

### Centaur III (Common Centaur)

| field | SI | original | quote |
|---|---|---|---|
| size | 3.05 m × 12.68 m | 120 in × 499 in | "Size: 3.05-m (120-in) Dia. x 12.68-m (499-in) Length with Extended Nozzle" |
| inert mass | 2,243 kg (SEC) / 2,458 kg (DEC) | 4,945 / 5,419 lb | "Inert Mass: 4X1: 2,243 kg (4,945 lbs) 4X2: 2,458 kg (5,419 lbs)" |
| propellant | 20,830 kg | 45,922 lb | "Propellant: 20,830-kg (45,922 lbs) LH2 & LO2" |
| engine | RL10A-4-2, 99.2 kN, Isp 450.5 s | — | "Thrust: 99.2 kN (22,300 lbf) (SEC) 198.4 kN (44,600 lbf) (DEC) — ISP: 450.5 s" |

Disagreement: braeunig [S] gives "Dry mass: 1,914 kg SEC, 2,106 kg DEC". The ULA "inert" figure is used.

RL10A-4-2 engine:
- dry mass 168 kg, from [S] braeunig atlas.htm: "P&W / RL10A-4-1, RL10A-4-2 … Dry mass: 168 kg"
- max diameter 1.53 m: "Maximum diameter: 1.53 m"

I couldn't fetch the L3Harris RL10 data sheets (HTTP 404 or HTML). TODO(primary).

## 7. SLS core stage

| field | SI | original | URL | quote |
|---|---|---|---|---|
| length | 64.6 m | ~212 ft | [P] https://www.nasa.gov/reference/sls-space-launch-system-core-stage and [P] fact sheet FS-2021-04-27-MSFC https://www.nasa.gov/wp-content/uploads/2020/02/sls_core_stage_fact_sheet_04262021_508.pdf | "Approximately 212 feet (64.6 meters)" |
| diameter | 8.4 m | 27.6 ft | same | "27.6 feet (8.4 meters)" |
| empty weight | 85,275 kg | ~188,000 lb | same | "Approximately 188,000 lbs (85,275 kg)" |
| LH2 | 143,789 kg | 317,000 lb | same | "Liquid Hydrogen (LH2) 537,000 gallons (2 million liters) (317,000 pounds)" |
| LOX | 843,682 kg | 1.86 M lb | same | "Liquid Oxygen (LOX) 196,000 gallons (741,941 liters) (1.86 million pounds)" |
| **propellant (capacity)** | **987,471 kg** | 2,177,000 lb | derived | — |
| weighed mass (Artemis II core) | 97,935 kg | 215,910 lb | [W] https://en.wikipedia.org/wiki/Space_Launch_System_core_stage, citing a @NASAGroundSys tweet (not fetched directly) | "Core stage weighs a total of 215,910 pounds! When full of propellant, core stage will weigh over 2 million pounds." |
| engines | 4 × RS-25 | — | [P] NASA page | "four RS-25 engines" |
| operating time | ~500 s | — | [P] NASA page | "designed to operate for approximately 500 seconds" |

Do the dry figures include engines? Neither NASA source says. The weighed 215,910 lb is 27,910 lb more than the 188,000 lb "empty weight". Four RS-25s weigh 4 × 7,775 = 31,100 lb. My **inference** is that 188,000 lb excludes engines and 215,910 lb includes them; this is unverified.

Both readings give a nearly identical tank dry mass:
- 215,910 − 31,100 = 184,810 lb = 83,828 kg (ratio 8.49 %)
- 85,275 kg (ratio 8.64 %)

### RS-25 engine

| field | SI | URL | quote |
|---|---|---|---|
| mass | 3,527 kg | [P] NASA RS-25 fact sheet FS-2015-07-064-MSFC https://www.nasa.gov/wp-content/uploads/2020/09/final_sls_rs25_fact_sheet_508_07312015.pdf | "Size/Weight ..... 14 feet x 8 feet, 7,775 lbs." |
| mass (L3Harris) | 3,526 kg | [P] https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rs-25-spec-sheet.pdf | "Weight Dry 7,774 lb" ; "Dimensions 168 in. long 96 in. wide" ; "Area Ratio Exit/Throat 69:1" |
| SSME mass (2005) | ~3,175 kg | [P] NASA Facts "Space Shuttle Propulsion Systems" https://www.nasa.gov/wp-content/uploads/2016/08/174533main_shuttle_propulsion.pdf | "The Main Engine weighs approximately 7,000." (the unit is missing in the source; lb implied) |
| nozzle exit | 2.286 m | same | "14 feet long and 7.5 feet in diameter at the nozzle exit" |
| thrust | 512,000 lbf vac (109 %) | [P] NASA RS-25 sheet | "Thrust ..... 512,000 pounds" |

## 8. ICPS (SLS Block 1 upper stage) and Delta IV stages

### ICPS

| field | SI | URL | quote |
|---|---|---|---|
| height / diameter | 13.7 m / 5.1 m | [P] NASA ICPS fact sheet FS-2021-10-51-MSFC https://nasa.gov/wp-content/uploads/2021/11/icps_fact_sheet_11172021.pdf | "Measuring 45 ft (13.7 m) tall and 16.7-foot (5.1 m) in diameter" |
| engine / thrust | 1 × RL10 (RL10B-2 on Artemis I), 24,750 lbf | same | "powered by one Aerojet Rocketdyne RL10 engine and generates 24,750 lbs. of maximum thrust" |
| empty / gross | 3,800 kg / 32,748 kg, giving propellant 28,948 kg (derived) | [W] https://en.wikipedia.org/wiki/Delta_Cryogenic_Second_Stage (ICPS infobox, **uncited**) | "\|empty = {{cvt\|3800\|kg}}" "\|gross = {{cvt\|32748\|kg}}" |

The ICPS masses are low confidence. NASA doesn't publish them. TODO(primary).

### Delta IV Common Booster Core (RS-68 era)

The [P] ULA *Delta IV Launch Services User's Guide* (June 2013), https://www.ulalaunch.com/docs/default-source/rockets/delta-iv-user's-guide.pdf, gives thrust and Isp but no masses: "capable of delivering 3137kN (705,250 lbf) of sea level thrust and having a vacuum specific impulse of 411.9 sec" (RS-68A) and "The CBC has an overall dia of 5 -m". The masses come from [S] braeunig http://www.braeunig.us/space/specs/delta.htm:

| field | SI | quote |
|---|---|---|
| length / diameter | 40.8 m / 5.13 m | "Length: 40.8 m" "Diameter: 5.13 m" |
| stage mass | 226,400 kg | "Stage mass: 226,400 kg" |
| propellant | 199,640 kg | "Propellant mass: 199,640 kg", giving dry 26,760 kg (derived; matches Wikipedia's "empty 26760 kg") |
| thrust / burn | 2,891 kN SL / 246 s | "Thrust: 2,891 kN SL, 3,314 kN vac" "Burn time: 246 s" |
| RS-68 mass | 6,604 kg | "ROCKETDYNE / RS-68 … Dry mass: 6,604 kg" |

These figures are for the original RS-68. The RS-68A (current) mass is TODO.

### Delta IV 5-m second stage (DCSS)

| field | SI | URL | quote |
|---|---|---|---|
| propellant | 27,200 kg | [P] Delta IV UG | "The total propellant load increases to 27,200 kg (60,000 lb), allowing a burn time of over 1,125 sec." |
| length / diameter / stage mass / propellant | 13.7 m / 5.0 m / 30,710 kg / 27,220 kg | [S] braeunig delta.htm | "Length: 12.2 m (13.7 m)" "Diameter: 4.0 m (5.0 m)" "Stage mass: 24,170 kg (30,710 kg)" "Propellant mass: 21,320 kg (27,220 kg)" (5-m values in parentheses), giving dry 3,490 kg (derived) |
| RL10B-2 mass / max diameter | 301 kg / 2.14 m | [S] braeunig delta.htm | "Dry mass: 301 kg" "Maximum diameter: 2.14 m" |

Small disagreement on the 4-m DCSS propellant: the ULA guide says "20,410 kg (45,000 lb)" and braeunig says 21,320 kg.

## 9. Ariane 6 core stage (LLPM, Vulcain 2.1)

| field | SI | URL | quote |
|---|---|---|---|
| height / diameter / dry | 32 m / 5.4 m / 23,000 kg | [P] ESA "Ariane 6: what's it made of?" https://esa.int/Enabling_Support/Space_Transportation/Ariane/Ariane_6_what_s_it_made_of | "At 32 m tall, 5.4 m wide and weighing 23000kg without propellants" |
| propellant | ~154,000 kg | same | "almost 154 tonnes of liquid hydrogen and oxygen fuel" |
| propellant consumed, thrust, burn | 154,000 kg; 1,371 kN; 468 s | [P] ESA "The engines of Ariane 6" https://www.esa.int/Enabling_Support/Space_Transportation/Ariane/The_engines_of_Ariane_6 | "154 000 kg of liquid oxygen (LOX) and liquid hydrogen (LH2) consumed" ; "1371 kN of thrust" ; "468 seconds of operation" |
| Vulcain 2.1 mass / size | ~2,000 kg; 3.7 m tall; 2.5 m diameter | [P] ESA image caption https://esa.int/spaceinimages/Images/2017/10/Vulcain_2.1 | "The Vulcain is 3.7 m high, 2.5 m in diameter and weighs about 2 tonnes" |
| upper stage (ULPM) propellant | 30,000 kg | [P] ESA "what's it made of" | "fuelled by 30 tonnes of cryogenically cooled liquid oxygen and liquid hydrogen". ULPM dry mass and dimensions are TODO. |

I couldn't fetch a CNES figure of 1,650 kg for Vulcain 2.1 (the page redirected and had no specs), so I didn't use it.

The Ariane 6 User's Manual (Issue 2, https://ariane.group/app/uploads/sites/4/2024/10/Mua-6_Issue-2_Revision-0_March-2021.pdf) has no stage masses.

ESA doesn't say whether the 23,000 kg includes the engine. I assumed it does, giving tank dry 21,000 kg. If it doesn't, tank dry is 23,000 kg (14.9 %).

## 10. Space Shuttle External Tank and SRB: the pure-tank examples

### External Tank (Super Lightweight Tank)

| field | SI | original | URL | quote |
|---|---|---|---|---|
| empty (SLWT) | 26,535 kg | ~58,500 lb | [P] NASA Facts "Super Lightweight External Tank" FS-2005-04-025-MSFC https://www.nasa.gov/sites/default/files/113020main_shuttle_lightweight.pdf | "places the new Super Lightweight Tank at about 58,500 pounds empty, and 1.6 million pounds when filled with propellants." |
| empty (ESA) | 26,535 kg | — | [P] ESA https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Space_Shuttle/Shuttle_technical_facts | "Empty weight: 26 535 kg" ; "Length: 46.9 m" ; "Diameter: 8.4 m" ; "Propellant volume: 2025 m3" |
| empty / full | 26,943 / 752,464 kg | 59,400 / 1,658,900 lb | [P] NASA Facts "Space Shuttle Propulsion Systems" FS-2005-04-028-MSFC (URL in §7) | "with a length of 154 feet and a diameter of 27.5 feet. Weighing in at approximately 59,400 pounds while empty and 1,658,900 pounds full of fuel and oxidizer" |
| **propellant (loaded)** | **725,521 kg** | 1,599,500 lb | derived (full − empty, same document) | — |
| size | 46.94 m × 8.41 m | 154 ft × 27.6 ft | [P] SLWT sheet | "27.6 feet wide and 154 feet tall" |
| engines | none: it feeds the 3 orbiter SSMEs | — | [P] SLWT sheet | "feeds 535,000 gallons of liquid propellants—hydrogen and oxygen—to the Shuttle's three Main Engines" |

Disagreements within NASA:
- diameter: 27.5 ft vs 27.6 ft
- empty mass: 59,400 lb vs 58,500 lb
- propellant volume: "535,000 gallons" (SLWT sheet) vs "526,000 gallons" (propulsion sheet)

Using "1.6 million pounds when filled" instead gives 1.6 M − 58,500 ≈ 1,541,500 lb, but that "1.6 million" is rounded. Either way the dry/propellant ratio is **3.66–3.80 %, below 4 %** (58,500 / 1,541,500 = 3.80 %).

The ET also carries the orbiter and SRB loads (it's the "structural backbone"), and it still comes in under 4 %. So the 4 % floor isn't a physical minimum. It may still be a fine game-balance choice.

### Solid Rocket Booster (solid example)

| field | SI | original | URL | quote |
|---|---|---|---|---|
| length | 45.48 m | 149.2 ft | [P] NASA propulsion sheet | "Each booster is 149.2 feet and weighs approximately 186,800 pounds inert and 1,298,500 pounds full of fuel before launch." |
| inert | 84,731 kg | 186,800 lb | same | (same quote) |
| propellant | 504,259 kg (derived, full − inert) / ~498,952 kg | 1,111,700 lb / ~1.1 M lb | same | "Each motor is filled with approximately 1.1 million pounds of solid propellant" |
| diameter | 3.71 m | — | [P] ESA shuttle facts | "Diameter: 3.71 m" ; "Length: 45.46 m" ; "Burn time: 124 s" ; "Thrust at liftoff of one booster (at sea level): 12.5 MN" |
| empty (ESA) | 68,000 kg | — | [P] ESA | "Empty weight of one booster: 68 000 kg". **Disagrees with NASA's 84,731 kg inert.** ESA's figure may exclude recovery and parachute hardware; unverified. |

## 11. Partial stages (no dry mass published)

| stage | field | SI | URL | quote |
|---|---|---|---|---|
| Super Heavy | diameter / height | 9 m / 69 m | [P] FAA 2023 Written Re-evaluation of the 2022 PEA https://www.faa.gov/sites/faa.gov/files/20230414_Starship_ReEvaluationEA.pdf | "Super Heavy is only 69 meters tall and nine meters in diameter" |
| Super Heavy | propellant | ≤ 3,700,000 kg | same | "Super Heavy is expected to hold up to 3,700 metric tons of propellant and Starship will hold up to 1,500 metric tons of propellant." |
| Super Heavy (future, KSC EIS) | 80 m, 9 m, 35 engines, 4,100 t | — | [P] FAA SpaceX 39A EIS meeting slides https://www.faa.gov/space/stakeholder_engagement/spacex_starship_ksc/SpaceX-39A-EIS_In-Person_Meeting_Slides_Final.pdf | "Length (meters; m) 70 80 … Diameter (m) 9 9 … Number of Engines 9 35 … Propellant quantity (metric ton; MT) 2,650 4,100" (columns: Starship, Super Heavy) |
| Super Heavy | engines | 33 Raptor 2 (2022 baseline) | [P] FAA Appendix G https://www.faa.gov/sites/faa.gov/files/2022-06/AppendixG_ExhaustPlumeCalculations.pdf | "The baseline Super Heavy stage includes 33 Raptor2 engines." |
| Starship (ship) | propellant | ≤ 1,500,000 kg (2023) / 2,650,000 kg (future) | the two FAA docs above | (quotes above) |
| Starship | length | 70 m (future version) | KSC slides | (above). The current-version ship length is TODO; the 2023 doc says only "approximately 120 meters (394 feet) tall" for the full stack. |
| Super Heavy, Starship | **dry mass** | **TODO(source)** | — | SpaceX hasn't published it |
| Raptor 3 | mass | 1,525 kg | [S] NextBigFuture (reporting a SpaceX card, 3 Aug 2024) https://nextbigfuture.substack.com/p/spacex-reveals-raptor-3-engine-and-specificationshtml | "Engine mass: 1525kg" ; "Engine + vehicle-side commodities and hardware mass : 1720kg" |
| Raptor 2 | nozzle exit | 1.306 m | [P] FAA Appendix G (2022) | "Nozzle exit radius Rj (in) 25.718" |
| Raptor (v1) | nozzle exit | 1.301 m | [P] FAA Appendix G (older) https://www.faa.gov/sites/faa.gov/files/space/stakeholder_engagement/spacex_starship/Appendix_G_Exhaust_Plume_Calculations.pdf | "Nozzle exit diameter (in) 51.226" (same doc: "The baseline Super Heavy stage includes 31 Raptor engines") |
| Centaur V | size, propellant | 5.4 m × 11.7 m; 54,431 kg | [P] ULA Vulcan Centaur fact sheet https://www.ulalaunch.com/docs/default-source/rockets/vulcancentaur.pdf | "The Centaur upper stage is 5.4 m (17.7 ft) in diameter and 11.7 m (38.5 ft) long with a 120,000-lb propellant capacity." ; "two RL10C engines". Dry mass TODO. |
| Vulcan booster | size | 5.4 m × 33.3 m; 2 × BE-4 | same | "The Vulcan Centaur booster is 5.4 m (17.7 ft) in diameter and 33.3 m (109.2 ft) long." |
| Vulcan booster | propellant | "over a million pounds" (vague) | [P] Vulcan User's Guide Oct 2023 https://www.ulalaunch.com/docs/default-source/rockets/2023_vulcan_user_guide.pdf | "aluminum orthogrid tanks that hold over a million pounds of liquid oxygen and liquid natural gas" ; "BE-4 main engines, each delivering 2446.5-kN (550k-lbf) sea level thrust". Dry mass, exact propellant, and BE-4 mass are TODO. |
| New Glenn GS1 | everything | TODO(source) | — | not attempted in depth; Blue Origin doesn't publish stage masses that I could find |

### Hypergolic example: Delta II second stage

Source: [S] braeunig delta.htm.
- Size: "Length: 5.89 m" "Diameter: 1.70 m, suspended by 2.44 m diameter mini-skirt"
- Mass: "Stage mass: 6,930 kg"
- Propellants: "Oxidizer: nitrogen tetroxide" "Fuel: Aerozine-50" "Propellant mass: 6,006 kg (usable)"
- Performance: "Thrust: 43.37 kN vac" "Burn time: 432 s"
- Engine: "AEROJET / AJ10-118K … Dry mass: 124.7 kg"

This gives stage dry 924 kg and tank dry 799 kg (derived), a ratio of 13.3 %.

---

## 12. Proposed method for deriving app Tanks from real stages

**Primary formula (used in the JSON below):**

```
tank.propellantMass = loaded propellant mass (fuel + oxidizer only; exclude "other" such as
                      ullage-motor propellant, helium, APS)
tank.dryMass        = stageDry − nEngines × engineMass
tank.diameter_m     = stage core diameter
tank.height_m       = stage length as published (usually excludes the interstage; flag where it doesn't)
```

Rationale: the app rebuilds stage mass as `n·engineMass + tankDry + propellant`. If tankDry is defined as stageDry − n·engineMass, then picking the same engine and count in the app reproduces the real stage's dry and wet mass exactly. It also reproduces the real Δv, as long as the engine Isp matches.

Rules and caveats:
1. **Use the same engine-mass figure in the tank derivation as in the app's engine catalogue.** Otherwise the round trip doesn't close.
2. **Loaded vs usable.** Saturn (SP-4029 "ground ignition") and FAA numbers are loaded, so they include unusable residuals and the propellant burned during thrust buildup on the pad. The Delta II "usable" figure excludes residuals. For a game, loaded is fine. If the app wants exact burnout mass, count about 1–2 % of propellant as residual and add it to dry. That percentage is my estimate, not sourced: TODO(source) if needed.
3. **Interstage.** Exclude it. SP-4029, the SA-503 manual, and the Atlas guide all list interstages separately. Exceptions: the SA-503 S-IVB dry figure *includes* the interstage (15,033 kg vs 11,273 kg actual without), and the S-IVB 59.3 ft length probably includes the aft skirt flare.
4. **Engine mass not separable.** Several sources don't say whether "empty/inert/dry" includes engines (SLS core, Ariane 6 LLPM, Falcon 9). Where it's ambiguous I state the assumption. In this dataset, engines are about 7–32 % of stage dry mass: Centaur SEC 7 %, F9 S1 16 %, RS-68 25 % of CBC dry, F-1s 32 % of S-IC dry. So getting this wrong shifts the tank ratio a lot.
5. **Recovery hardware.** The F9 S1 dry mass carries legs and grid fins. Super Heavy and Starship carry heat shield, flaps, and landing propellant. Treat these as tank structure.
6. **Solids.** For SRBs set nEngines = 0. tank.dryMass is the motor inert mass (case, nozzle, TVC, and on the Shuttle also recovery gear). The app would need a "no separate engine" path for `propellant: "solid"`.

**Alternatives:**
- **(a) The Shuttle ET as a literal tank.** It's the only real flight article that *is* a tank with no engines. Ratio 3.66 % (hydrolox, 8.4 m). A good sanity anchor, and it shows that 4 % is above at least one real tank.
- **(b) Structural-coefficient model.** tankDry = k(propellant) × propellantMass, with k fitted per propellant type from the table above:
  - kerolox: 4.1–5.5 % (S-IC, CCB, F9 S1)
  - hydrolox boosters/cores: 6.4–13.6 % (S-II, SLS, CBC, LLPM)
  - hydrolox upper stages: 9–12 % (S-IVB, Centaur III, ICPS, DCSS)
  - hypergolic: ~13 % (one data point)
  - solid: ~17 % (one data point)
  
  This is useful for procedurally generated tanks. It also explains why hydrolox needs more tank mass: LH2 density is low, so a given propellant mass needs a much larger tank volume. That's the physical reason; I didn't fetch a source for the LH2 density figure.
- **(c) Geometric model.** tankDry ∝ wall area × areal density, with height derived from propellant volume / (π D²/4). It needs propellant densities and mixture ratios. I didn't source those this session (TODO), so I'm not proposing numbers.

---

## 13. Engine-count rule check: `maxEngines = floor(0.6 · (tankD / engineD)²)`

Engine diameters are nozzle exit diameters unless noted.

| case | D tank (m) | d engine (m) [source] | (D/d)² | floor(0.6·q) | actual | coefficient needed for actual: n/q | verdict @0.6 |
|---|---|---|---|---|---|---|---|
| F9 S1 / Merlin 1D | 3.66 | 0.92 [W, uncited] | 15.83 | **9** | 9 | ≥0.569 (and <0.632 to give exactly 9) | OK |
| F9 S1 (3.7 m) | 3.70 | 0.92 | 16.17 | 9 | 9 | 0.556–0.618 | OK |
| Saturn V S-IC / F-1 | 10.058 | 3.531 exit [P] | 8.12 | **4** | 5 | ≥0.616 | **fails** |
| S-IC / F-1 (width) | 10.058 | 3.759 width [P] | 7.16 | 4 | 5 | ≥0.698 | fails |
| Super Heavy / Raptor 2 | 9.0 | 1.306 [P FAA] | 47.46 | **28** | 33 | ≥0.695 (exactly 33 if < 0.716) | **fails** |
| Super Heavy / Raptor 1 | 9.0 | 1.301 [P FAA] | 47.85 | 28 | 33 | ≥0.690 | fails |
| SLS core / RS-25 | 8.4 | 2.286 exit [P] | 13.50 | 8 | 4 | ≥0.296 | OK (allows 8, real is 4) |
| SLS core / RS-25 (width 96 in) | 8.4 | 2.438 [P] | 11.87 | 7 | 4 | ≥0.337 | OK |
| S-II / J-2 | 10.058 | 1.956 [P] | 26.45 | 15 | 5 | ≥0.189 | OK |
| S-IVB / J-2 | 6.614 | 1.956 | 11.44 | 6 | 1 | — | OK |
| Atlas CCB / RD-180 | 3.81 | 3.15 max dia [S] | 1.46 | **0** | 1 | ≥0.684 | **fails** (0 engines allowed) |
| F9 S2 / MVac | 3.66 | 3.3 [W] | 1.23 | **0** | 1 | ≥0.813 | **fails** |
| Centaur III / RL10A-4-2 | 3.05 | 1.53 [S] | 3.97 | 2 | 2 (DEC) | ≥0.503 | OK |
| ICPS / RL10B-2 | 5.1 | 2.14 [S] | 5.68 | 3 | 1 | — | OK |
| Ariane 6 / Vulcain 2.1 | 5.4 | 2.5 (overall dia) [P] | 4.67 | 2 | 1 | — | OK |

Conclusions:
- With Merlin d = 0.92 m (a Wikipedia value, uncited), 0.6 does give 9 for a 3.66 m tank. Any coefficient in [0.569, 0.632) also gives 9, so 0.6 is consistent with the stated tuning.
- **But 0.6 is too strict for densely packed real boosters.** It forbids the S-IC's 5 F-1s (needs ≥ 0.616) and Super Heavy's 33 Raptors (needs ≥ 0.695). It also gives **0** for single big-engine stages where the engine nearly fills the tank (Atlas CCB, F9 S2 with its vacuum nozzle).
- **No single coefficient gives exactly 9 for F9 and also allows 33 for Super Heavy.** F9 needs < 0.632; Super Heavy needs ≥ 0.695. The F9 Octaweb is loosely packed compared with Super Heavy.

Suggested fix:
```
maxEngines = max(1, floor(0.70 · (tankD / engineExitD)²))
```
- c = 0.70 allows S-IC (5), Super Heavy (33, exactly at the limit), Atlas CCB (1), Centaur DEC (2), and gives F9 up to 11 Merlins.
- `max(1, …)` handles vacuum nozzles wider than the stage, such as MVac on F9 S2. The real MVac nozzle extends below the interstage line, so it's fine for it to be wider.
- If the "3.66 m + Merlin = 9" tuning matters more than reproducing Super Heavy and the S-IC, keep 0.6 but add the `max(1, …)` floor.

(Optional context: the theoretical upper bound is the packing density of equal circles in a circle, times (D/d)². I didn't fetch a source for packing values, so none are quoted.)

---

## 14. Derived Tank records (contract shape)

The `source` field is the main URL. The other sources and the derivation are in §1–§11 and the notes below.

```json
[
  {"id":"f9-b5-s1","name":"Falcon 9 Block 5 first stage","propellant":"kerolox","diameter_m":3.66,"height_m":41.2,"propellantMass_kg":409583,"dryMass_kg":21395,"source":"https://www.faa.gov/sites/faa.gov/files/space/environmental/nepa_docs/SpaceX_Falcon_Program_Final_EA_and_FONSI.pdf"},
  {"id":"f9-b5-s2","name":"Falcon 9 Block 5 second stage","propellant":"kerolox","diameter_m":3.66,"height_m":13.8,"propellantMass_kg":105664,"dryMass_kg":3433,"source":"https://www.faa.gov/sites/faa.gov/files/space/environmental/nepa_docs/SpaceX_Falcon_Program_Final_EA_and_FONSI.pdf"},
  {"id":"saturn-v-s-ic","name":"Saturn V S-IC (AS-506)","propellant":"kerolox","diameter_m":10.058,"height_m":42.06,"propellantMass_kg":2145798,"dryMass_kg":88465,"source":"https://www.nasa.gov/wp-content/uploads/2023/04/sp-4029.pdf"},
  {"id":"saturn-v-s-ii","name":"Saturn V S-II (AS-506)","propellant":"hydrolox","diameter_m":10.058,"height_m":24.84,"propellantMass_kg":443235,"dryMass_kg":28265,"source":"https://www.nasa.gov/wp-content/uploads/2023/04/sp-4029.pdf"},
  {"id":"saturn-v-s-ivb","name":"Saturn V S-IVB (AS-506)","propellant":"hydrolox","diameter_m":6.614,"height_m":18.07,"propellantMass_kg":107095,"dryMass_kg":9694,"source":"https://www.nasa.gov/wp-content/uploads/2023/04/sp-4029.pdf"},
  {"id":"atlas-v-ccb","name":"Atlas V Common Core Booster","propellant":"kerolox","diameter_m":3.81,"height_m":32.46,"propellantMass_kg":284089,"dryMass_kg":15574,"source":"https://www.ulalaunch.com/docs/default-source/rockets/atlasvusersguide2010.pdf"},
  {"id":"centaur-iii-sec","name":"Centaur III (single-engine)","propellant":"hydrolox","diameter_m":3.05,"height_m":12.68,"propellantMass_kg":20830,"dryMass_kg":2075,"source":"https://www.ulalaunch.com/docs/default-source/rockets/atlasvusersguide2010.pdf"},
  {"id":"sls-core","name":"SLS core stage","propellant":"hydrolox","diameter_m":8.4,"height_m":64.6,"propellantMass_kg":987471,"dryMass_kg":83828,"source":"https://www.nasa.gov/reference/sls-space-launch-system-core-stage"},
  {"id":"icps","name":"SLS Interim Cryogenic Propulsion Stage","propellant":"hydrolox","diameter_m":5.1,"height_m":13.7,"propellantMass_kg":28948,"dryMass_kg":3499,"source":"https://nasa.gov/wp-content/uploads/2021/11/icps_fact_sheet_11172021.pdf"},
  {"id":"delta-iv-cbc","name":"Delta IV Common Booster Core","propellant":"hydrolox","diameter_m":5.13,"height_m":40.8,"propellantMass_kg":199640,"dryMass_kg":20156,"source":"http://www.braeunig.us/space/specs/delta.htm"},
  {"id":"dcss-5m","name":"Delta IV 5-m Cryogenic Second Stage","propellant":"hydrolox","diameter_m":5.0,"height_m":13.7,"propellantMass_kg":27220,"dryMass_kg":3189,"source":"http://www.braeunig.us/space/specs/delta.htm"},
  {"id":"ariane-6-llpm","name":"Ariane 6 core stage (LLPM)","propellant":"hydrolox","diameter_m":5.4,"height_m":32.0,"propellantMass_kg":154000,"dryMass_kg":21000,"source":"https://esa.int/Enabling_Support/Space_Transportation/Ariane/Ariane_6_what_s_it_made_of"},
  {"id":"delta-ii-s2","name":"Delta II second stage (AJ10-118K)","propellant":"hypergolic","diameter_m":1.70,"height_m":5.89,"propellantMass_kg":6006,"dryMass_kg":799,"source":"http://www.braeunig.us/space/specs/delta.htm"},
  {"id":"shuttle-et","name":"Space Shuttle External Tank (SLWT)","propellant":"hydrolox","diameter_m":8.41,"height_m":46.94,"propellantMass_kg":725521,"dryMass_kg":26535,"source":"https://www.nasa.gov/wp-content/uploads/2016/08/174533main_shuttle_propulsion.pdf"},
  {"id":"shuttle-srb","name":"Space Shuttle Solid Rocket Booster","propellant":"solid","diameter_m":3.71,"height_m":45.48,"propellantMass_kg":504259,"dryMass_kg":84731,"source":"https://www.nasa.gov/wp-content/uploads/2016/08/174533main_shuttle_propulsion.pdf"}
]
```

**Derivation notes per record.** Formula: tank.dryMass = stageDry − n × engineMass. Ratio = dry / propellant.

- **f9-b5-s1**
  - Propellant: FAA total 1,135,925 lb − S2 232,950 lb = 902,975 lb.
  - Dry: 25,600 kg [W, uncited] − 9 × 467 kg (M1D, 1,030 lb per Mueller via [W]).
  - Ratio 5.22 %. Alternative with Wikipedia propellant 395,700 kg: 5.41 %.
- **f9-b5-s2** ⚠ **ratio 3.25 % < 4 %.**
  - Dry: 3,900 kg [W] − 1 × 467 kg. MVac mass is TODO; M1D used as a placeholder.
  - Alternative with Wikipedia propellant: 3.70 %, also < 4 %.
  - This record would be rejected by the app rule.
- **saturn-v-s-ic**
  - Dry 287,531 lb − 5 × 18,500 lb (F-1 fact sheet).
  - Propellant = SP-4029 fuel + oxidizer.
  - Diameter and height from MSFC-MAN-503. Ratio 4.12 %.
- **saturn-v-s-ii**
  - Dry 79,714 lb − 5 × 3,480 lb (J-2 fact sheet).
  - Propellant = 819,050 + 158,116 lb.
  - Ratio 6.38 %.
- **saturn-v-s-ivb**
  - Dry 24,852 lb − 1 × 3,480 lb.
  - Propellant = 43,608 + 192,497 lb.
  - Ratio 9.05 %.
- **atlas-v-ccb**
  - Inert 21,054 kg (ULA) − RD-180 5,480 kg [S].
  - Ratio 5.48 %.
- **centaur-iii-sec**
  - Inert 2,243 kg (ULA) − RL10A-4-2 168 kg [S].
  - Ratio 9.96 %. DEC: 2,458 − 2 × 168 = 2,122 kg (10.19 %).
- **sls-core**
  - Weighed 215,910 lb (NASA EGS via [W]) − 4 × 7,775 lb (NASA RS-25 sheet) = 184,810 lb.
  - Ratio 8.49 %. Alternative: NASA empty weight 85,275 kg taken as excluding engines (8.64 %).
- **icps**
  - Empty 3,800 kg, gross 32,748 kg [W, uncited]; low confidence.
  - Dry 3,800 − RL10B-2 301 kg [S].
  - Ratio 12.09 %.
- **delta-iv-cbc**
  - Stage 226,400 − propellant 199,640 = 26,760 kg, − RS-68 6,604 kg [S].
  - Ratio 10.10 %. This is the RS-68 era vehicle, not the RS-68A.
- **dcss-5m**
  - Stage 30,710 − propellant 27,220 = 3,490 kg, − RL10B-2 301 kg [S].
  - Ratio 11.72 %. The ULA guide gives propellant 27,200 kg.
- **ariane-6-llpm**
  - Dry 23,000 kg (ESA) − Vulcain 2.1 "about 2 tonnes" (ESA), assuming the ESA dry mass includes the engine.
  - Ratio 13.64 %.
- **delta-ii-s2**
  - Stage 6,930 − usable propellant 6,006 = 924 kg, − AJ10-118K 124.7 kg [S].
  - Ratio 13.31 %.
- **shuttle-et** ⚠ **ratio 3.66 % < 4 %.**
  - No engines. Dry = SLWT empty 26,535 kg (NASA SLWT sheet; ESA gives the same number).
  - Propellant = 1,658,900 − 59,400 lb (NASA propulsion sheet).
  - With 59,400 lb as dry: 3.71 %. Would be rejected by the app rule.
- **shuttle-srb**
  - No separate engine. Dry = inert 186,800 lb.
  - Propellant = 1,298,500 − 186,800 lb (NASA).
  - Diameter from ESA. Ratio 16.80 %.

---

## 15. TODO list
- Primary source for Falcon 9 S1 and S2 **dry masses**. Only Wikipedia has them, uncited.
- **MVac** mass, and a primary source for the **Merlin 1D mass and nozzle exit diameter**. The current values are Wikipedia; the mass traces to a Mueller Quora post I couldn't fetch.
- **Super Heavy and Starship dry masses and stage lengths** for the current version. Raptor 2 mass (only Raptor 3's 1,525 kg was found, from a secondary source).
- **Centaur V dry mass. Vulcan booster** dry mass and exact propellant. **BE-4** mass and exit diameter.
- **New Glenn** first and second stage: everything.
- Primary sources for **RD-180, RL10A-4-2, RL10B-2, RS-68 / RS-68A** masses. Current values are from braeunig [S]; the L3Harris PDFs were unreachable.
- **ICPS** propellant and dry mass from NASA or ULA (currently Wikipedia, uncited). Exploration Upper Stage: not researched.
- Primary sources for the **Delta IV CBC and DCSS masses** (currently braeunig). The ULA guide has no masses.
- Whether the **SLS core** "empty weight" and the **Ariane 6 LLPM** 23 t include the engines.
- Saturn IB S-IVB-205 dimensions, so it can become a tank (masses are already in SP-4029).
- Ariane 6 ULPM dry mass and dimensions. Ariane 5 EPC: the user's manual link was dead (returned HTML), so not done.
- Residual-propellant fraction, propellant densities, and mixture ratios, if the app wants the geometric tank model (§12c).
