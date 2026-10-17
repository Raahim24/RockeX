# Rocket engine data: sourced values

Compiled 2026-10-17. **Every number below was read from a page or PDF fetched in this session.** The quote column holds the verbatim text that contains the number. Where a value could not be sourced it is written as `TODO(source)`.

**Conversion factors used**
- 1 lbf = 4.4482216152605 N
- 1 lb = 0.45359237 kg
- 1 in = 0.0254 m
- 1 tf (metric tonne-force) = 9.80665 kN. This is the standard definition. SpaceX and Energomash quote thrust in tf.

**Source ranking:** P = primary (manufacturer or agency, live or archived). S = secondary (Wikipedia, press). X = cross-check only (Realism Overhaul KSP configs; never used as a chosen value).

**How to fetch:** spacex.com is a JavaScript single-page app, so its spec text was read from the site's own JS bundles and CMS JSON (URLs given). blueorigin.com and npoenergomash.ru block scripted clients, so Wayback Machine captures of those pages were used (URLs given).

---

## 1. Merlin 1D (sea level, current Falcon 9 first-stage engine): kerolox

| field | value (SI) | original | source | quote |
|---|---|---|---|---|
| thrustSL_kN | **845** | 845 kN / 190,000 lbf (190,000 lbf = 845.16 kN) | P: https://www.spacex.com/vehicles/falcon-9 (text served from https://www.spacex.com/2343.25ddd7bb77e7b318.js) | `header:"Merlin" ... {label:"Thrust",value:"845 kN",secondValue:" / 190,000 lbf"}` |
| thrustSL_kN (cross-check) | 845.2 per engine | stage total 7,607 kN / 1,710,000 lbf ÷ 9 | same page | `{label:"Number of engines",value:"9"},{label:"Thrust at sea level",value:"7,607 kN",secondValue:" / 1,710,000 lbs"}` |
| thrustVac_kN | **914.1** (derived) | stage total 8,227 kN / 1,849,500 lbf ÷ 9 engines (1,849,500/9 = 205,500 lbf = 914.11 kN) | same page | `{label:"Thrust in vacuum",value:"8,227 kN",secondValue:" / 1,849,500 lbs"}` |
| ispSL_s | **282** ⚠ dated | 282 s | P (archived 2013): https://web.archive.org/web/20130715094112/http://www.spacex.com/falcon9 | `Sea Level Thrust : 147,000 lbf Vacuum Thrust: 161,000 lbf Sea Level Isp: 282s Vacuum Isp: 311s` |
| ispVac_s | **311** ⚠ dated | 311 s | same | same quote |
| mass_kg | **467.2** ⚠ S | 1,030 lb | S: Wikipedia "SpaceX Merlin" citation quote (Tom Mueller on Quora). The Quora page returned 403 and could not be fetched. https://en.wikipedia.org/wiki/SpaceX_Merlin | `The Merlin 1D weighs 1030 pounds, including the hydraulic steering (TVC) actuators. ... The new full thrust variant weighs the same and makes about 185,500 lbs force in vacuum.` |
| diameter_m | **TODO(source)** | Wikipedia infobox: "Sea level: 0.92 m". This entry has no citation. | S | not used |

**Disagreements and notes**
- Falcon User's Guide (Apr 2020) says `up to 854 kN (190,000 lbf) thrust per engine at sea level, for a total thrust of 7,686 kN (1.71 million lbf)`. That guide is at https://web.archive.org/web/20201202093334/https://www.spacex.com/media/falcon_users_guide_042020.pdf; only the first 1 MB was captured, but the text was extracted. Since 190,000 lbf = 845.2 kN, "854" looks like a digit transposition. **Chosen: 845 kN**, which matches the live SpaceX site and the lbf figure.
- The same guide gives the throttle range `Yes (190,000 lbf to 108,300 lbf sea level)`.
- The Isp figures come from the July 2013 SpaceX page, which describes the 147,000 lbf Merlin 1D. SpaceX no longer publishes Merlin 1D Isp, so current Full Thrust Isp is not officially public. Wikipedia carries the same 282/311 s with an "update after" flag.
- X: Realism Overhaul `Merlin1_Config.cfg` gives "Merlin1D++" maxThrust 914.12 kN and Isp 311 (vac) / 288.5 (SL). Cross-check only.

## 2. Merlin 1D Vacuum (MVac): kerolox, **vacuum-only**

| field | value (SI) | original | source | quote |
|---|---|---|---|---|
| thrustSL_kN | **N/A: vacuum-only** | n/a | n/a | n/a |
| thrustVac_kN | **981** | 981 kN / 220,500 lbf (= 980.83 kN) | P: https://www.spacex.com/vehicles/falcon-9 (chunk 2343.25ddd7bb77e7b318.js) | `{name:"Vacuum",description:"Merlin Vacuum features a larger exhaust section ...",metrics:[...{label:"Thrust",value:"981 kN",secondValue:" / 220,500 lbf"}]` |
| thrustVac_kN (cross-check) | 981 | 981 kN (Vacuum) (220,500 lbf) | P: Falcon User's Guide 2020 (URL above) | `Thrust (stage total) 7,686 kN (sea level) (1,710,000 lbf) 981 kN (Vacuum) (220,500 lbf)` |
| ispSL_s | **N/A: vacuum-only** | | | |
| ispVac_s | **348** | 348 s | P (archived 2016–2019): https://web.archive.org/web/20190101/http://www.spacex.com/falcon9 (same text in the 2016-06 and 2017-06 captures) | `SpaceX's Merlin vacuum engine has the highest vacuum specific impulse (isp)... with a vacuum isp of 348 seconds.` |
| mass_kg | **TODO(source)** | | | |
| diameter_m | **TODO(source)** | Wikipedia infobox "Vacuum: 3.3 m" has no citation | S | not used |

**Notes:** The 2016–2019 archived SpaceX pages list the second stage as `Thrust 934 kN 210,000 lbf`. That is an older MVac rating, superseded by the current 981 kN. In April 2015 the site said `vacuum isp of 340 seconds` and `Thrust 801 kN 180,000 lbf`. The User's Guide 2020 says MVac uses `a fixed 165:1 expansion nozzle` and throttles `Yes (220,500 lbf to 140,679 lbf)`. X: RO "Merlin1DVac+" has 934.12 kN and 348 s.

## 3. Raptor 2 (sea-level engine): methalox

| field | value (SI) | original | source | quote |
|---|---|---|---|---|
| thrustSL_kN | **2255.5** | 230 tf / 507,000 lbf (230 tf = 2255.5 kN; 507,000 lbf = 2255.2 kN) | P: SpaceX update "Introducing Starship V3" (2026-05-12), https://www.spacex.com/updates (CMS JSON: https://content.spacex.com/api/spacex-website/updates) | `Raptor 3 engines deliver increased thrust, with sea-level variants now producing 250 tf (551,000 lbf) up from 230 tf (507,000 lbf)` |
| thrustVac_kN | **TODO(source)** | | | |
| ispSL_s | **TODO(source)** | | | |
| ispVac_s | **350** ⚠ approximate, Raptor-1-era statement | "~350 sec" | P-ish (CEO tweet, archived): https://web.archive.org/web/20190925065050/https://twitter.com/elonmusk/status/1171118891671490560 | `Sea level Raptor’s vacuum Isp is ~350 sec, but ~380 sec with larger vacuum-optimized nozzle` |
| mass_kg | **1630** | 1,630 kg | P: same SpaceX V3 update | `Mass of the Raptor sea-level engines has been reduced to 1,525 kg from 1,630 kg.` |
| diameter_m | **1.3** ⚠ | 1.3 m / 4.2 ft | P: https://www.spacex.com/vehicles/starship (chunk https://www.spacex.com/2337.c79c2132bc6aff75.js) | `{name:"Raptor",...metrics:[{label:"Diameter",value:"1.3 m",secondValue:" / 4.2 ft"},{label:"Height",value:"2.9 m"...},{label:"Thrust",value:"250 tf",secondValue:" / 551 klbf"}]` |

**Notes**
- The current Starship page describes Raptor 3: it lists 250 tf. SpaceX does not say whether "Diameter" means the nozzle exit or the overall width, and does not give a separate Raptor 2 diameter. Wikipedia also gives 1.3 m, citing the 2017 "Making Life Multiplanetary" talk.
- The "230 tf" figure is described as the rating of the "sea-level variant". SpaceX does not say whether it is measured at sea level or in vacuum. I treated it as SL.
- Wikipedia lists 327 s SL Isp, citing a 2018 Musk video. That video's quote contains only "specific impulse of 380" at high expansion, so **327 s is not supported by its citation**. I left it out.
- X: RO `Raptor_Config.cfg` "Raptor-2": 2255.53 kN, Isp 326.357 SL / 347 Vac, dry mass 1,630 kg. No source is given in the config.

## 4. Raptor Vacuum (RVac, Raptor 2 generation): methalox, **vacuum-only**

| field | value (SI) | original | source | quote |
|---|---|---|---|---|
| thrustSL_kN | **N/A: vacuum-only** | | | |
| thrustVac_kN | **2530.1** | 258 tf / 568,000 lbf (258 tf = 2530.1 kN; 568,000 lbf = 2526.6 kN) | P: SpaceX "Introducing Starship V3" | `while vacuum engines produce 275 tf (606,000 lbf) up from 258 tf (568,000 lbf).` |
| ispSL_s | **N/A** | | | |
| ispVac_s | **380** ⚠ approximate (2019 tweet) | "~380 sec" | archived tweet (URL above) | `~380 sec with larger vacuum-optimized nozzle` |
| mass_kg | **TODO(source)** | | | |
| diameter_m | **2.3** ⚠ | 2.3 m / 7.5 ft | P: https://www.spacex.com/vehicles/starship (chunk 2337…js) | `{name:"Raptor vacuum (RVAC)",...metrics:[{label:"Diameter",value:"2.3 m",secondValue:" / 7.5 ft"},{label:"Height",value:"4.4 m"...},{label:"Thrust",value:"275 tf",secondValue:" / 606 klbf"}]` |

This is the current (Raptor 3 era) page; SpaceX does not say what "Diameter" measures.

## 5. Raptor 3 (sea level) and Raptor 3 Vacuum: methalox (SpaceX has published numbers)

| field | value (SI) | original | source | quote |
|---|---|---|---|---|
| Raptor 3 thrustSL_kN | **2451.7** | 250 tf / 551,000 lbf (= 2451.7 / 2451.0 kN) | P: SpaceX V3 update + Starship page | `sea-level variants now producing 250 tf (551,000 lbf)` and `{label:"Thrust",value:"250 tf",secondValue:" / 551 klbf"}` |
| Raptor 3 Vac thrustVac_kN | **2696.8** | 275 tf / 606,000 lbf (= 2696.8 / 2695.6 kN) | P: same | `vacuum engines produce 275 tf (606,000 lbf)` |
| Raptor 3 mass_kg | **1525** | 1,525 kg | P: same | `Mass of the Raptor sea-level engines has been reduced to 1,525 kg from 1,630 kg.` |
| Raptor 3 diameter_m | **1.3** | 1.3 m | P: Starship page | see §3 quote |
| Raptor 3 Vac diameter_m | **2.3** | 2.3 m | P: Starship page | see §4 quote |
| Raptor 3 Isp | **350** ⚠ S, condition ambiguous | "350s" | S: NextBigFuture (2024-08-03) reporting SpaceX's Raptor 3 card: https://nextbigfuture.substack.com/p/spacex-reveals-raptor-3-engine-and-specificationshtml | `280tf` ... `350s` ... `1525kg` ... `1720kg` (engine + vehicle-side commodities) |
| Raptor 3 Vac Isp | **TODO(source)** | | | |
| Raptor 3 Vac mass | **TODO(source)** | | | |

**Disagreement:** the 2024 card reported **280 tf** for Raptor 3. SpaceX's own 2026 V3 update and the Starship page say **250 tf**, which presumably is the flight rating versus a test-stand figure. **Chosen: 250 tf**, the official current value. The 350 s figure is shown on the card without saying whether it is SL or vacuum. Musk's 2019 tweet calls ~350 s the SL Raptor's vacuum Isp, so I mapped it to ispVac and left ispSL null. X: RO "Raptor-3" uses 350 vac / 334.258 SL.

## 6. RS-25 (RS-25D/E as flown on SLS, 109% rated power level): hydrolox

| field | value (SI) | original | source | quote |
|---|---|---|---|---|
| thrustSL_kN | **1859.4** | 418,000 lb(f) | P: L3Harris RS-25 spec sheet (07/2024) https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rs-25-spec-sheet.pdf | `Maximum Thrust: (109% Power Level) At Sea Level 418,000 lb In Vacuum 512,300 lb` |
| thrustVac_kN | **2278.8** | 512,300 lb(f) | P: same | same |
| ispSL_s | **366** | 366 sec | P: https://www.l3harris.com/all-capabilities/rs-25-engine | `Sea Level: 366 sec.` (109% power level) |
| ispVac_s | **452.3** | 452.3 sec | P: spec sheet | `Specific Impulse In Vacuum 452.3 sec` |
| mass_kg | **3526.2** | 7,774 lb dry | P: spec sheet | `Weight Dry 7,774 lb` |
| diameter_m | **2.286** (nozzle exit) | 7.5 ft | P: NASA "Shuttle propulsion" fact sheet https://www.nasa.gov/wp-content/uploads/2016/08/174533main_shuttle_propulsion.pdf | `are 14 feet long and 7.5 feet in diameter at the nozzle exit. The Main Engine weighs approximately 7,000.` |
| (overall width) | 2.438 | 96 in | P: spec sheet | `Dimensions 168 in. long 96 in. wide` |

**Disagreements**
- Vacuum Isp: the L3Harris web page rounds to `Vacuum: 452 sec.` I chose the sheet's 452.3 s.
- Mass: 7,774 lb on the sheet, 7,775 lb on the web page (`Weight: 7,775 lb.`), "approximately 7,000" in the older NASA Shuttle text, and 7,004 lb in Wikipedia (from astronautix). **Chosen: 7,774 lb**, the current manufacturer sheet.
- Area ratio: the sheet says 69:1. Wikipedia says 78:1.
- X: RO "RS-25D-E" uses 452.3 / 366.3 s.

## 7. RL10 (upper stage, **vacuum-only**): hydrolox. Variants: RL10B-2, RL10C-1, RL10C-1-1, plus RL10C-3

Source for all rows (P): L3Harris RL10 spec sheet (07/2024), https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rl10-spec-sheet.pdf. The live URL returned 404 to the fetcher, so it was read from the Wayback capture https://web.archive.org/web/2024/https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rl10-spec-sheet.pdf. The sheet's thrust is the vacuum (altitude) rating; it is labeled just "Thrust".

Verbatim table rows from the sheet:
`RL10 Model RL10B-2 RL10C-2-1 | RL10A-4-2 | RL10C-1 | RL10C-1-1 | RL10C-X | RL10C-3`
`Thrust 24,750 lbf 22,300 lbf 22,890 lbf 23,825 lbf 24,120 lbf 24,340 lbf`
`Weight 664 lbs 370 lbs 420 lbs 415 lbs 510 lbs 508 lbs`
`Specific Impulse 465.5 sec 451.0 sec 449.7 sec 453.8 sec 460.9 sec 460.1 sec`
`Nozzle Diameter 84.5” 46” 57” 62” 73.7” 73”`

| variant | thrustVac_kN | ispVac_s | mass_kg | diameter_m (nozzle) |
|---|---|---|---|---|
| RL10B-2 (Delta IV; sheet groups it with RL10C-2-1) | **110.09** (24,750 lbf) | **465.5** | **301.2** (664 lb) | **2.146** (84.5 in; extendible nozzle deployed) |
| RL10C-1 (Atlas V) | **101.82** (22,890 lbf) | **449.7** | **190.5** (420 lb) | **1.448** (57 in) |
| RL10C-1-1 (Atlas V, Vulcan) | **105.98** (23,825 lbf) | **453.8** | **188.2** (415 lb) | **1.575** (62 in) |
| RL10C-3 (SLS EUS) | 108.27 (24,340 lbf) | 460.1 | 230.4 (508 lb) | 1.854 (73 in) |

SL thrust and SL Isp: **N/A, vacuum-only.**
Cross-check (P): an archived ULA Delta IV page (https://web.archive.org/web/20140720073154/http://www.ulalaunch.com/Products_DeltaIV.aspx) agrees for the RL10B-2: `Nominal Thrust: 24,750 lbs Specific Impulse: 465.5 seconds ... Length: 86.5 in (stowed); 163.5 in (deployed) Diameter (nozzle extension): 84.5 in Weight : 664 lbs`. X: RO RL10B-2 465.5 s and RL10C-1 449.7 s match.

## 8. F-1 (Saturn V S-IC): kerolox

| field | value (SI) | original | source | quote |
|---|---|---|---|---|
| thrustSL_kN | **6770.2** | 1,522,000 lb (uprated, vehicle 504+) | P: Saturn V News Reference, F-1 Engine Fact Sheet (MSFC, Dec 1968), https://web.archive.org/web/20051221114403/http://history.msfc.nasa.gov/saturn_apollo/documents/F-1_Engine.pdf | `THRUST (sea level) 1,500,000 lb.` ... `NOTE: F-1 engine will be uprated to 1,522,000 lb. thrust for Vehicle 504 and all subsequent operational vehicles.` |
| thrustVac_kN | **7766.6** ⚠ S | 1,746,000 lbf | S: Wikipedia infobox (no inline citation), https://en.wikipedia.org/wiki/Rocketdyne_F-1 | `thrust(Vac) = {{cvt|1746000|lbf|kN|order=flip}}` |
| ispSL_s | **260** (minimum spec, 1.5 Mlbf rating) | 260 sec | P: F-1 fact sheet | `SPECIFIC IMPULSE (minimum) 260 sec.` |
| ispVac_s | **304** ⚠ S | 304 s | S: Wikipedia infobox | `specific_impulse_vacuum = {{cvt|304|isp}}` |
| mass_kg | **8391.5** | 18,500 lb (maximum, flight configuration) | P: fact sheet | `WEIGHT FLIGHT CONFIGURATION 18,500 lb. maximum` |
| diameter_m | **3.531** (nozzle exit) | 11 ft 7 in = 139 in | P: fact sheet | `MAXIMUM NOZZLE EXIT DIAMETER 11 ft. 7 in.` |
| (overall width) | 3.759 | 12 ft 4 in | P: fact sheet | `WIDTH 12 ft. 4 in.` |

**Disagreements:** Wikipedia's SL Isp is 263 s; the primary sheet gives 260 s as a minimum. **Chosen: 260 s (primary).** The primary sheet gives no vacuum values, so the vacuum thrust and Isp are Wikipedia fallbacks. Wikipedia's text points to MSFC chart MSFC-9801771, which I did not retrieve. X: RO "F-1-1.52M" uses 7895.01 kN vac, 305/265 s.

## 9. J-2 (Saturn V S-II/S-IVB, Saturn IB S-IVB): hydrolox. Upper stage, but ground-startable

| field | value (SI) | original | source | quote |
|---|---|---|---|---|
| thrustSL_kN | **486.2** ⚠ S | 486.2 kN | S: Wikipedia infobox, https://en.wikipedia.org/wiki/Rocketdyne_J-2. The citations are the MSFC page and the fact sheet below, but neither gives an SL thrust. The archived MSFC page I fetched states only 200,000 and 230,000 lb. | `thrust(SL) = {{cvt|486.2|kN|sigfig=6}}` |
| thrustVac_kN | **1023.1** | 230,000 lb (altitude) | P: Saturn V News Reference, J-2 Engine Fact Sheet (changed Dec 1968), https://web.archive.org/web/20200808233218/https://www.nasa.gov/centers/marshall/pdf/499245main_J2_Engine_fs.pdf | `THRUST (altitude) 230,000 lb. (vehicle 503 2nd stage 225,000 lb.)` |
| ispSL_s | **200** ⚠ S | 200 s | S: Wikipedia infobox | `specific_impulse_sea_level = {{cvt|200|isp}}` |
| ispVac_s | **424** | 424 sec | P: fact sheet | `SPECIFIC IMPULSE 424 sec. (427 at 5:1 mixture ratio)` |
| mass_kg | **1578.5** | 3,480 lb | P: fact sheet | `WEIGHT, DRY, FLIGHT CONFIGURATION 3,480 lb.` |
| diameter_m | **1.956** (nozzle exit) | 6 ft 5 in = 77 in | P: fact sheet | `NOZZLE EXIT DIAMETER 6 ft. 5 in.` |
| (overall width) | 2.045 | 6 ft 8½ in | P: fact sheet | `WIDTH 6 ft. 8½ in.` |

**Disagreements:** Wikipedia's dry mass is 3,942 lb; the primary sheet says 3,480 lb. **Chosen: 3,480 lb.** The thrust rating also varies by flight: 200,000 lb (early), 225,000 lb, 230,000 lb (`The engine was uprated to provide 230,000 pounds of thrust for the fourth Apollo Saturn V flight and subsequent missions.`, from the MSFC abstract https://web.archive.org/web/20080610202726/http://mix.msfc.nasa.gov/abstracts.php?p=1093). **The SL thrust and SL Isp are Wikipedia-only and are not confirmed by a primary source.**

## 10. BE-4 (Blue Origin; Vulcan and New Glenn first stages): methalox (LNG/LOX)

| field | value (SI) | original | source | quote |
|---|---|---|---|---|
| thrustSL_kN | **2846.9** ⚠ condition not stated | 640,000 lbf (2,846 kN) | P: https://www.blueorigin.com/engines/be-4 (live site behind a bot wall; read from https://web.archive.org/web/20251205145253/https://www.blueorigin.com/engines/be-4) | `BE-4 is capable of producing 640,000 lbf (2,846 kN) thrust with deep throttle capability.` |
| thrustVac_kN | **TODO(source)** | | | |
| ispSL_s | **TODO(source)** | Wikipedia lists 340 s, citing a YouTube factory tour; not verified | S | not used |
| ispVac_s | **TODO(source)** | | | |
| mass_kg | **TODO(source)** | Wikipedia lists "Original: 5400 kg", citing an X post; not verified | S | not used |
| diameter_m | **TODO(source)** | | | |

**Notes:** Blue Origin does not say whether 640,000 lbf is a sea-level or vacuum rating. For a booster engine it is conventionally SL, which is why I put it in thrustSL. Wikipedia lists "Original: 2460 kN; Improved: 2847 kN", citing a Blue Origin news post that I could not fetch (Vercel checkpoint / 429). X: RO `BE-4_Config.cfg` uses 2647.5 kN, Isp 341/305.

## 11. RD-180 (NPO Energomash; Atlas III/V): kerolox (2 chambers)

| field | value (SI) | original | source | quote |
|---|---|---|---|---|
| thrustSL_kN | **3826.6** | 390.2 tf | P: NPO Energomash RD-180 page (archived), https://web.archive.org/web/20140705155358/http://www.npoenergomash.ru/eng/engines/rd180/ | `Thrust, sea level / vacuum, tf 390,2 / 423,4` |
| thrustVac_kN | **4152.1** | 423.4 tf | P: same | same |
| ispSL_s | **311.9** | 311.9 s | P: same | `Specific impulse, sea level / vacuum, sec 311,9 / 338,4` |
| ispVac_s | **338.4** | 338.4 s | P: same | same |
| mass_kg | **5480** | 5,480 kg dry | P: same | `Weight, dry / filled, kg 5480 / 5950` |
| diameter_m | **3.2** ⚠ overall engine diameter, not nozzle exit | 3,200 mm | P: same | `Overall dimensions, height / diameter, mm 3600 / 3200` |

**Cross-check (P):** ULA Atlas V Launch Services User's Guide (2010), https://www.ulalaunch.com/docs/default-source/rockets/atlasvusersguide2010.pdf: `RD-180 Booster Engine (2 Chambers) SL 100% Thrust = 3,827 kN(860,309 lbf), ISP= 311.3 s Vac100% Thrust = 4,152 kN, (933,369 lbf) ISP= 337.8 s`. Another table in the same guide gives `ISP= 311.9 s ... ISP=338.4 s`. The thrust values agree. Isp differs by 0.6 s between the guide's tables. **Chosen: Energomash 311.9/338.4**, the manufacturer's figures, which also match one of the ULA tables. The engine has 2 nozzles, so a single "nozzle exit diameter" does not apply; the 3.2 m is the overall diameter. X: RO RD-180 4152 kN, 338.4/311.9 s.

## 12. Vulcain 2 (Ariane 5 ECA) and Vulcain 2.1 (Ariane 6): hydrolox

### Vulcain 2
| field | value (SI) | original | source | quote |
|---|---|---|---|---|
| thrustSL_kN | **TODO(source)** | | | |
| thrustVac_kN | **1359** | 1,359 kN | P: EADS Astrium (thrust-chamber maker) Vulcain 2 page, archived: https://web.archive.org/web/20120327075131/http://cs.astrium.eads.net/sp/launcher-propulsion/rocket-engines/vulcain-2-rocket-engine.html | `Vulcain 2 Thrust Chamber Characteristics Propellants LOX / LH2 Thrust vac 1,359 kN Specific Impulse vac. 429 s` |
| ispSL_s | **TODO(source)** | | | |
| ispVac_s | **429** | 429 s | P: same | same |
| mass_kg | **1800** ⚠ S | 1,800 kg | S: Wikipedia infobox, https://en.wikipedia.org/wiki/Vulcain_(rocket_engine) | `'''2''': {{cvt|1800|kg}}` (dry_weight) |
| diameter_m | **2.09** (nozzle exit) | 2.09 m | P: Astrium page | `Nozzle area ratio 58.2 Nozzle exit diameter 2.09 m Overall engine length 3.44 m Thrust Chamber mass 909 kg` |

Notes: ESA's Ariane 5 ECA page (archived, https://web.archive.org/web/2010/https://www.esa.int/SPECIALS/Launchers_Access_to_Space/SEM0LR2PGQD_0.html) says `modified to increase its thrust by 20%, up to 137 tonnes` (137 tf = 1343.5 kN; the condition is not stated). The 909 kg Astrium figure is the **thrust chamber only**, not the whole engine. Wikipedia's body text gives 1,686 kg for Vulcain 1.

### Vulcain 2.1
| field | value (SI) | original | source | quote |
|---|---|---|---|---|
| thrustVac_kN | **1371** | 1371 kN | P: ESA "The engines of Ariane 6", https://www.esa.int/Enabling_Support/Space_Transportation/Ariane/The_engines_of_Ariane_6 (also ESA video page https://www.esa.int/ESA_Multimedia/Videos/2020/09/Vulcain_2.1_roars) | `1371 kN of thrust` / `The cryogenic Vulcain 2.1 engine delivers 1371 kN thrust in a vacuum.` |
| thrustSL_kN / ispSL_s / ispVac_s | **TODO(source)** | | | |
| mass_kg | **2000** (approximate) | "about 2 tonnes" | P: ESA image caption, https://www.esa.int/ESA_Multimedia/Images/2017/10/Vulcain_2.1 | `The Vulcain is 3.7 m high, 2.5 m in diameter and weighs about 2 tonnes, and will deliver 135 tonnes of thrust in vacuum.` |
| diameter_m | **2.5** ⚠ "in diameter"; ESA does not say nozzle exit | 2.5 m | P: same | same |

**Disagreement:** ESA 2017 says 135 t vacuum (= 1323.9 kN; Wikipedia uses 1,324 kN). ESA's newer pages say 1371 kN. **Chosen: 1371 kN**, the more recent ESA figure, stated twice. ArianeGroup's Vulcain page (https://www.ariane.group/en/equipment-and-services/vulcain/) has no specs. X: RO "Vulcain-2" uses 1350 kN, 433/320 s.

## 13. RS-68A (Delta IV): hydrolox (optional)

| field | value (SI) | original | source | quote |
|---|---|---|---|---|
| thrustSL_kN | **3136.0** | 705K lbf | P: Aerojet Rocketdyne RS-68A data sheet (Mar 2019), archived https://web.archive.org/web/2020/https://www.rocket.com/sites/default/files/documents/RS-68A_data_sheet.pdf | `Thrust (Vacuum): 800K lbf  Thrust (Sea Level): 705K lbf ... Isp, Vacuum: 411 sec  Isp, Sea Level: 362 sec` (Full Power column) |
| thrustVac_kN | **3558.6** | 800K lbf | P: same | same |
| ispSL_s | **362** | 362 sec | P: same | same |
| ispVac_s | **411** | 411 sec | P: same | same |
| mass_kg | **6686.0** | 14,740 lbs | P: same | `Height: 17.1 ft  Weight: 14,740 lbs  Diameter: 8 ft  Expansion Ratio: 21.5` |
| diameter_m | **2.438** ⚠ engine "Diameter", not stated as nozzle exit | 8 ft | P: same | same |

**Disagreements:** ULA's Delta IV User's Guide (June 2013, https://web.archive.org/web/20140710005717/http://www.ulalaunch.com/uploads/docs/Launch_Vehicles/Delta_IV_Users_Guide_June_2013.pdf) gives `3137kN (705,250 lbf) of sea level thrust and having a vacuum specific impulse of 411.9 sec`. ULA's archived Delta IV page gives `Nominal Thrust (sea level): 702,000 lbs Specific Impulse (sea level): 362 seconds Length: 204 in Weight: 14,876 lbs`. **Chosen: the Aerojet sheet**, as the manufacturer source.

## 14. Rutherford (Rocket Lab Electron): kerolox (optional)

Source (P): Rocket Lab Electron page, https://www.rocketlabusa.com/launch/electron/. The live page is JavaScript-rendered, so it was read from https://web.archive.org/web/20251231172443/https://rocketlabcorp.com/launch/electron/.
Quote: `First Stage 9 Sea-level Rutherford Engines Lift-off Thrust: 190 kN (43,000 lbf) Peak Thrust: 224 kN (50,600 lbf) ISP: 311 seconds Second Stage Single Vacuum Rutherford Engine Total Thrust: 25.8 kN (5,800 lbf) ISP: 343 seconds`

| field | Rutherford (sea level) | Rutherford Vacuum |
|---|---|---|
| thrustSL_kN | **21.1** (derived: 190 kN ÷ 9 at lift-off) | N/A, vacuum-only |
| thrustVac_kN | TODO(source) for the single engine (peak 224 kN ÷ 9 = 24.9 kN is the stage peak, not a vacuum rating) | **25.8** (5,800 lbf = 25.80 kN) |
| ispSL_s | **311** | N/A |
| ispVac_s | TODO(source) | **343** |
| mass_kg | **35** ⚠ S (Wikipedia infobox `{{cvt|35|kg}}`) | TODO(source) |
| diameter_m | TODO(source). Wikipedia lists 0.25 m without saying what it measures. | TODO(source) |

Note: a 2023 capture said `Peak Thrust: 224 kN (56,000 lbf)`, while 2025 says `(50,600 lbf)`. 224 kN = 50,357 lbf, so the lbf figure is inconsistent in both captures. kN was used.

## 15. RD-191 (Angara): kerolox (optional)

| field | value (SI) | original | source | quote |
|---|---|---|---|---|
| thrustSL_kN | **1922.1** | 196 tf | P: NPO Energomash RD-191 page (archived), https://web.archive.org/web/20131223082506/http://www.npoenergomash.ru/eng/engines/rd191/ | `Thrust, sea level / vacuum, tf 196 / 212,6` |
| thrustVac_kN | **2084.9** | 212.6 tf | P: same | same |
| ispSL_s | **311.2** | 311.2 s | P: same | `Specific impulse, sea level / vacuum, sec 311,2 / 337,5` |
| ispVac_s | **337.5** | 337.5 s | P: same | same |
| mass_kg | **2200** | 2,200 kg dry | P: same | `Weight, dry, kg 2200` |
| diameter_m | **2.1** ⚠ overall diameter | 2,100 mm | P: same | `Overall dimensions, height / diameter, mm 3780 / 2100` |

Wikipedia (from astronautix) gives 1920/2090 kN, 310.7/337 s, 2290 kg, and 1.45 m diameter. **Chosen: Energomash.**

## 16. BE-3U (New Glenn upper stage): hydrolox, **vacuum-only** (optional)

| field | value (SI) | original | source | quote |
|---|---|---|---|---|
| thrustVac_kN | **778.4** | 175,000 lbf (778 kN) | P: Blue Origin BE-3U page, archived https://web.archive.org/web/20251116191758/https://www.blueorigin.com/engines/be-3u | `BE-3U is a liquid oxygen/liquid hydrogen engine capable of generating 175,000 lbf (778 kN) thrust in vacuum, with throttleability to 140,000 lbf (623 kN).` |
| thrustSL / ispSL | N/A, vacuum-only | | | |
| ispVac_s / mass_kg / diameter_m | **TODO(source)** | | | |

Wikipedia lists "Original 711.5 kN / Improved 889.5 kN / demonstrated 211,658 lbf" and 445 s; none of these were verified. Related: Blue Origin's BE-3PM (New Shepard) page says `BE-3PM generates up to 110,000 lbf (490 kN) thrust at Launch Site One (109,000 lbf / 485 kN at sea level)` (https://web.archive.org/web/20260113095133/https://www.blueorigin.com/engines/be-3).

---

## Final JSON (contract shape)

In this JSON, `null` means `TODO(source)`, or N/A for SL fields of vacuum-only engines (see the per-engine notes below). `source` is the main primary URL for each engine. Values marked ⚠ S above are Wikipedia fallbacks and are listed in the notes.

```json
[
  { "id": "merlin-1d", "name": "Merlin 1D", "propellant": "kerolox", "thrustSL_kN": 845, "thrustVac_kN": 914.1, "ispSL_s": 282, "ispVac_s": 311, "mass_kg": 467.2, "diameter_m": null, "source": "https://www.spacex.com/vehicles/falcon-9" },
  { "id": "merlin-1d-vac", "name": "Merlin 1D Vacuum", "propellant": "kerolox", "thrustSL_kN": null, "thrustVac_kN": 981, "ispSL_s": null, "ispVac_s": 348, "mass_kg": null, "diameter_m": null, "source": "https://www.spacex.com/vehicles/falcon-9" },
  { "id": "raptor-2", "name": "Raptor 2", "propellant": "methalox", "thrustSL_kN": 2255.5, "thrustVac_kN": null, "ispSL_s": null, "ispVac_s": 350, "mass_kg": 1630, "diameter_m": 1.3, "source": "https://www.spacex.com/updates" },
  { "id": "raptor-vacuum", "name": "Raptor Vacuum (Raptor 2 gen)", "propellant": "methalox", "thrustSL_kN": null, "thrustVac_kN": 2530.1, "ispSL_s": null, "ispVac_s": 380, "mass_kg": null, "diameter_m": 2.3, "source": "https://www.spacex.com/updates" },
  { "id": "raptor-3", "name": "Raptor 3", "propellant": "methalox", "thrustSL_kN": 2451.7, "thrustVac_kN": null, "ispSL_s": null, "ispVac_s": 350, "mass_kg": 1525, "diameter_m": 1.3, "source": "https://www.spacex.com/updates" },
  { "id": "raptor-3-vacuum", "name": "Raptor 3 Vacuum", "propellant": "methalox", "thrustSL_kN": null, "thrustVac_kN": 2696.8, "ispSL_s": null, "ispVac_s": null, "mass_kg": null, "diameter_m": 2.3, "source": "https://www.spacex.com/updates" },
  { "id": "rs-25", "name": "RS-25 (D/E, 109% RPL)", "propellant": "hydrolox", "thrustSL_kN": 1859.4, "thrustVac_kN": 2278.8, "ispSL_s": 366, "ispVac_s": 452.3, "mass_kg": 3526.2, "diameter_m": 2.286, "source": "https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rs-25-spec-sheet.pdf" },
  { "id": "rl10b-2", "name": "RL10B-2", "propellant": "hydrolox", "thrustSL_kN": null, "thrustVac_kN": 110.09, "ispSL_s": null, "ispVac_s": 465.5, "mass_kg": 301.2, "diameter_m": 2.146, "source": "https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rl10-spec-sheet.pdf" },
  { "id": "rl10c-1", "name": "RL10C-1", "propellant": "hydrolox", "thrustSL_kN": null, "thrustVac_kN": 101.82, "ispSL_s": null, "ispVac_s": 449.7, "mass_kg": 190.5, "diameter_m": 1.448, "source": "https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rl10-spec-sheet.pdf" },
  { "id": "rl10c-1-1", "name": "RL10C-1-1", "propellant": "hydrolox", "thrustSL_kN": null, "thrustVac_kN": 105.98, "ispSL_s": null, "ispVac_s": 453.8, "mass_kg": 188.2, "diameter_m": 1.575, "source": "https://l3harris.com/sites/default/files/2024-07/l3harris-ar-rl10-spec-sheet.pdf" },
  { "id": "f-1", "name": "F-1", "propellant": "kerolox", "thrustSL_kN": 6770.2, "thrustVac_kN": 7766.6, "ispSL_s": 260, "ispVac_s": 304, "mass_kg": 8391.5, "diameter_m": 3.531, "source": "https://web.archive.org/web/20051221114403/http://history.msfc.nasa.gov/saturn_apollo/documents/F-1_Engine.pdf" },
  { "id": "j-2", "name": "J-2", "propellant": "hydrolox", "thrustSL_kN": 486.2, "thrustVac_kN": 1023.1, "ispSL_s": 200, "ispVac_s": 424, "mass_kg": 1578.5, "diameter_m": 1.956, "source": "https://web.archive.org/web/20200808233218/https://www.nasa.gov/centers/marshall/pdf/499245main_J2_Engine_fs.pdf" },
  { "id": "be-4", "name": "BE-4", "propellant": "methalox", "thrustSL_kN": 2846.9, "thrustVac_kN": null, "ispSL_s": null, "ispVac_s": null, "mass_kg": null, "diameter_m": null, "source": "https://www.blueorigin.com/engines/be-4" },
  { "id": "rd-180", "name": "RD-180", "propellant": "kerolox", "thrustSL_kN": 3826.6, "thrustVac_kN": 4152.1, "ispSL_s": 311.9, "ispVac_s": 338.4, "mass_kg": 5480, "diameter_m": 3.2, "source": "https://web.archive.org/web/20140705155358/http://www.npoenergomash.ru/eng/engines/rd180/" },
  { "id": "vulcain-2", "name": "Vulcain 2", "propellant": "hydrolox", "thrustSL_kN": null, "thrustVac_kN": 1359, "ispSL_s": null, "ispVac_s": 429, "mass_kg": 1800, "diameter_m": 2.09, "source": "https://web.archive.org/web/20120327075131/http://cs.astrium.eads.net/sp/launcher-propulsion/rocket-engines/vulcain-2-rocket-engine.html" },
  { "id": "vulcain-2-1", "name": "Vulcain 2.1", "propellant": "hydrolox", "thrustSL_kN": null, "thrustVac_kN": 1371, "ispSL_s": null, "ispVac_s": null, "mass_kg": 2000, "diameter_m": 2.5, "source": "https://www.esa.int/Enabling_Support/Space_Transportation/Ariane/The_engines_of_Ariane_6" },
  { "id": "rs-68a", "name": "RS-68A", "propellant": "hydrolox", "thrustSL_kN": 3136.0, "thrustVac_kN": 3558.6, "ispSL_s": 362, "ispVac_s": 411, "mass_kg": 6686.0, "diameter_m": 2.438, "source": "https://web.archive.org/web/2020/https://www.rocket.com/sites/default/files/documents/RS-68A_data_sheet.pdf" },
  { "id": "rutherford", "name": "Rutherford (sea level)", "propellant": "kerolox", "thrustSL_kN": 21.1, "thrustVac_kN": null, "ispSL_s": 311, "ispVac_s": null, "mass_kg": 35, "diameter_m": null, "source": "https://www.rocketlabusa.com/launch/electron/" },
  { "id": "rutherford-vac", "name": "Rutherford Vacuum", "propellant": "kerolox", "thrustSL_kN": null, "thrustVac_kN": 25.8, "ispSL_s": null, "ispVac_s": 343, "mass_kg": null, "diameter_m": null, "source": "https://www.rocketlabusa.com/launch/electron/" },
  { "id": "rd-191", "name": "RD-191", "propellant": "kerolox", "thrustSL_kN": 1922.1, "thrustVac_kN": 2084.9, "ispSL_s": 311.2, "ispVac_s": 337.5, "mass_kg": 2200, "diameter_m": 2.1, "source": "https://web.archive.org/web/20131223082506/http://www.npoenergomash.ru/eng/engines/rd191/" },
  { "id": "be-3u", "name": "BE-3U", "propellant": "hydrolox", "thrustSL_kN": null, "thrustVac_kN": 778.4, "ispSL_s": null, "ispVac_s": null, "mass_kg": null, "diameter_m": null, "source": "https://www.blueorigin.com/engines/be-3u" }
]
```

### Per-engine notes (secondary URLs, flags, what `null` means)

- **merlin-1d:** spec text served from https://www.spacex.com/2343.25ddd7bb77e7b318.js. thrustVac is derived (stage total ÷ 9). The Isp values come from the 2013 archived page (https://web.archive.org/web/20130715094112/http://www.spacex.com/falcon9) and describe the 147 klbf engine, so they are dated. mass is a Wikipedia fallback (Mueller quote via https://en.wikipedia.org/wiki/SpaceX_Merlin). diameter = TODO(source). Falcon User's Guide 2020 (archived) says 854 kN, which is a typo.
- **merlin-1d-vac:** vacuum-only, so SL fields are N/A. Isp from https://web.archive.org/web/20190101/http://www.spacex.com/falcon9. mass and diameter = TODO(source).
- **raptor-2:** the starship page chunk is https://www.spacex.com/2337.c79c2132bc6aff75.js and the CMS JSON is https://content.spacex.com/api/spacex-website/updates. ispVac is "~350" from the 2019 Musk tweet (https://web.archive.org/web/20190925065050/https://twitter.com/elonmusk/status/1171118891671490560), from the Raptor-1 era. The diameter is the current-page generic Raptor value. thrustVac and ispSL = TODO(source).
- **raptor-vacuum:** vacuum-only. ispVac is "~380" from the 2019 tweet. diameter from the current Starship page (https://www.spacex.com/vehicles/starship). mass = TODO(source).
- **raptor-3:** 250 tf is official; the 2024 card said 280 tf (https://nextbigfuture.substack.com/p/spacex-reveals-raptor-3-engine-and-specificationshtml). The 350 s Isp comes from that secondary report of the card, with its condition ambiguous. ispSL and thrustVac = TODO(source).
- **raptor-3-vacuum:** vacuum-only. Isp and mass = TODO(source).
- **rs-25:** ispSL from https://www.l3harris.com/all-capabilities/rs-25-engine. Nozzle exit diameter from https://www.nasa.gov/wp-content/uploads/2016/08/174533main_shuttle_propulsion.pdf. The overall width is 96 in (2.438 m).
- **rl10b-2 / rl10c-1 / rl10c-1-1:** vacuum-only. The spec sheet was read via the Wayback capture. Cross-check: https://web.archive.org/web/20140720073154/http://www.ulalaunch.com/Products_DeltaIV.aspx. The RL10C-3 (EUS) values are in §7 if wanted.
- **f-1:** thrustVac (1,746,000 lbf) and ispVac (304 s) are Wikipedia fallbacks (https://en.wikipedia.org/wiki/Rocketdyne_F-1) with no inline citation. ispSL is the primary "minimum" spec of 260 s; Wikipedia says 263 s.
- **j-2:** thrustSL (486.2 kN) and ispSL (200 s) are Wikipedia-only (https://en.wikipedia.org/wiki/Rocketdyne_J-2) and **not confirmed by any primary source fetched**. The MSFC abstract (https://web.archive.org/web/20080610202726/http://mix.msfc.nasa.gov/abstracts.php?p=1093) gives only the 200k/230k lb ratings.
- **be-4:** the page was read from https://web.archive.org/web/20251205145253/https://www.blueorigin.com/engines/be-4. "640,000 lbf thrust" is not labeled SL or vacuum. The Isp, mass and diameter values on Wikipedia (https://en.wikipedia.org/wiki/BE-4) are unverified, so all three = TODO(source).
- **rd-180:** cross-check is the ULA Atlas V User's Guide 2010 (https://www.ulalaunch.com/docs/default-source/rockets/atlasvusersguide2010.pdf). diameter_m is the **overall** diameter of the 2-chamber engine, not a nozzle exit.
- **vulcain-2:** mass (1800 kg) is a Wikipedia fallback (https://en.wikipedia.org/wiki/Vulcain_(rocket_engine)). SL thrust and SL Isp = TODO(source). The ESA ECA page says 137 t.
- **vulcain-2-1:** mass and diameter from https://www.esa.int/ESA_Multimedia/Images/2017/10/Vulcain_2.1, which also says 135 t vacuum, in disagreement with 1371 kN. All Isp and SL values = TODO(source).
- **rs-68a:** cross-checks: https://web.archive.org/web/20140710005717/http://www.ulalaunch.com/uploads/docs/Launch_Vehicles/Delta_IV_Users_Guide_June_2013.pdf and https://web.archive.org/web/20140720073154/http://www.ulalaunch.com/Products_DeltaIV.aspx. diameter_m is the engine "Diameter: 8 ft", which the sheet does not say is the nozzle exit.
- **rutherford / rutherford-vac:** the page was read from https://web.archive.org/web/20251231172443/https://rocketlabcorp.com/launch/electron/. SL thrust is derived (190 kN ÷ 9). The 35 kg mass is a Wikipedia fallback (https://en.wikipedia.org/wiki/Rutherford_(rocket_engine)). Other fields = TODO(source).
- **rd-191:** diameter_m is the **overall** diameter. Wikipedia/astronautix values differ slightly.
- **be-3u:** vacuum-only. The page was read from https://web.archive.org/web/20251116191758/https://www.blueorigin.com/engines/be-3u.
- **Cross-check only (X):** Realism Overhaul configs at https://github.com/KSP-RO/RealismOverhaul/tree/master/GameData/RealismOverhaul/Engine_Configs (BE-4, F1, J2, Merlin1, RD180, RD191, RL10, RS68, Raptor, RaptorVac, Rutherford, SSME, Vulcain). Most of their numbers agree with the primary values above (RD-180, RD-191, RL10, RS-25, RS-68A Isp, Merlin 1D Isp). Their header comments rarely cite sources, so they were never used as chosen values.

### Fetch failures (for transparency)
- api.spacexdata.com/v4/rockets: HTTP 522 (service down).
- quora.com: 403.
- blueorigin.com live: Vercel bot checkpoint; Blue Origin news post: 429.
- npoenergomash.ru / engine.space live: 403.
- arianespace.com user's manuals: 410. The archived PDFs downloaded but use CID fonts and I could not extract the Vulcain text. The ArianeGroup-hosted Ariane 6 manual PDF also could not be parsed by the fetcher.
- l3harris RL10 sheet live: 404. The archived copy was used.
