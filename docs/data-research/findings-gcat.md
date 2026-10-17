# GCAT launch-vehicle tables: column report and curated historic stages

Every number in this report comes from GCAT files downloaded on 2026-10-17 (GCAT pages show "GCAT Release 1.8.8 (2026 Sep 3) | Data Update 2026 Oct 16"; each TSV's second line is `# Updated 2026 Oct 16 2334:11`). No values were filled in from memory. Where GCAT is empty, the field is `null`.

Machine-readable output: `gcat-stages.json` in this folder (49 stages).

## 1. License and attribution (verified)

Source: https://planet4589.org/space/gcat/ (fetched; the license link on the page goes to https://creativecommons.org/licenses/by/4.0)

> GCAT is released under the Creative Commons CC-BY licence.
> You are free to use the data in GCAT as long as you include a citation to it. A suitable short
> citation is 'data from GCAT (J. McDowell, planet4589.org/space/gcat)'. A full citation is
> McDowell, Jonathan C., 2020. General Catalog of Artificial Space Objects, Release 1.8.8 , https://planet4589.org/space/gcat

The same page's footer says:

> (c) 2020-2026 Jonathan McDowell
> Licence: CC-BY-4.0 Creative Commons/Attribution
> This data may be freely reproduced as long as you cite it.
> A minimal citation is "Data from J. McDowell, planet4589.org".
> A more complete citation is "McDowell, J, 2020: General Catalog of Artificial Space Objects, https://planet4589.org/space/gcat"

- **Version: CC-BY-4.0.** This confirms the CC-BY belief and pins the version.
- **Attribution string used in the JSON:** `Data from GCAT (J. McDowell, planet4589.org/space/gcat), General Catalog of Artificial Space Objects Release 1.8.8, CC-BY-4.0`. For an app "About" screen, use the full citation above.

## 2. Files downloaded

All files are in `scratchpad/downloads/gcat/` and are treated as untrusted data.

| Local file | URL | Rows (data) |
|---|---|---|
| stages.tsv | https://planet4589.org/space/gcat/tsv/tables/stages.tsv | 1626 |
| engines.tsv | https://planet4589.org/space/gcat/tsv/tables/engines.tsv | 1488 |
| lv.tsv | https://planet4589.org/space/gcat/tsv/tables/lv.tsv | 1837 |
| lvs.tsv | https://planet4589.org/space/gcat/tsv/tables/lvs.tsv | 4745 |
| family.tsv | https://planet4589.org/space/gcat/tsv/tables/family.tsv | 676 |
| launch.tsv | https://planet4589.org/space/gcat/tsv/launch/launch.tsv | ~76,000 (13.8 MB) |
| doc_stages.html | https://planet4589.org/space/gcat/web/lvs/stages/index.html | docs |
| doc_engines.html | https://planet4589.org/space/gcat/web/lvs/engines/index.html | docs |
| doc_lv.html | https://planet4589.org/space/gcat/web/lvs/lv/index.html | docs |
| doc_lvstages.html | https://planet4589.org/space/gcat/web/lvs/lvstages/index.html | docs |
| doc_family.html | https://planet4589.org/space/gcat/web/lvs/family/index.html | docs |
| doc_lcols.html | https://planet4589.org/space/gcat/web/launch/lcols.html | launch-list column docs |

Path note: the TSVs live under `/space/gcat/tsv/tables/`. The `/space/gcat/data/tables/` directory holds the fixed-width `.html` text versions; of the TSVs, only `family.tsv` is also there.

### File format

- UTF-8 text, **tab-separated**, with values **space-padded** inside cells (for example `" 42.1"`, `"SaturnV "`). Trim every cell.
- **Line 1 is the header**: it starts with `#`, e.g. `#Stage_Name\tStage_Family\t...`. Strip the `#` to get column names.
- **Line 2** is `# Updated 2026 Oct 16 2334:11`.
- Other lines starting with `#` are comments. `engines.tsv` has 65 of them, used as section dividers such as `# Solid propellant engines` and `# Liquid propellant engines: LOX/Kerosene`. Skip every line that starts with `#`.
- **Empty or missing values** are written as `-`. Some numeric fields hold a literal `0` or `0.0` that also means "unknown", for example 154 stages with `Launch_Mass = 0.0` and 71 with `Dry_Mass = 0`.
- **Flag columns** (`*_Flag`, `MFlag`, `TFlag`, ...) hold `?` (uncertain). In engines.tsv `TFlag`/`IspFlag` sometimes hold `s`. The stages and engines pages do not explain these flags. `s` may mean sea level, but that is a guess.
- Every row in the 5 tables has the same column count as its header (checked).

## 3. Column reports

The "Meaning" column quotes the GCAT doc pages listed above. "Fill" is the percentage of rows that are neither `-` nor blank. "Fill ≠0" also excludes zero numeric placeholders.

### 3.1 stages.tsv (1626 rows, 20 columns)

Doc: "The Stages file gives basic information for all of the stages making up the launch vehicles in the LV file. The reader is again cautioned about the approximate nature of the numerical values in this file."

| # | Column | Meaning (GCAT doc) | Units | Fill | Fill ≠0 | Notes |
|---|---|---|---|---|---|---|
| 0 | Stage_Name | "Stage name" | – | 99.9% | | primary key; 1 row is `?` |
| 1 | Stage_Family | "Stage family" | – | 100% | | 654 distinct |
| 2 | Stage_Manufacturer | "Manufacturer" | – | 98.0% | | org codes, see orgs.tsv |
| 3 | Stage_Alt_Name | "Alternate name" | – | 19.9% | | |
| 4 | Length | "Length (m)" | m | 99.9% | 97.3% | |
| 5 | Length_Flag | (undocumented) | – | 21.6% | | only `?` |
| 6 | Diameter | "Diameter (m)" | m | 99.7% | 97.1% | |
| 7 | Diameter_Flag | (undocumented) | – | 11.2% | | only `?` |
| 8 | Launch_Mass | "Full mass (tonne)" | **tonne** | 97.6% | 88.1% | 0.1 t resolution |
| 9 | Launch_Mass_Flag | (undocumented) | – | 25.4% | | only `?` |
| 10 | Dry_Mass | "Dry mass (kg)" | **kg** | 67.7% | 63.3% | different unit from Launch_Mass |
| 11 | Dry_Mass_Flag | (undocumented) | – | 15.3% | | only `?` |
| 12 | Thrust | "Typical thrust (vacuum) (kN)" | kN | 77.3% | 73.1% | total stage thrust |
| 13 | Thrust_Flag | (undocumented) | – | 5.5% | | `?` 88 rows, `s` 1 row |
| 14 | ThrustSL | "Typical sea level thrust (kN)" | kN | **0.0%** | | documented but empty in every row |
| 15 | ThrustSL_Flag | (undocumented) | – | 0.0% | | |
| 16 | Duration | "Typical burn duration (s)" | s | 70.1% | 66.2% | |
| 17 | Engine | "Main engine name" | – | 95.8% | | join key to engines.tsv `Name`. "The main engine name has been made up (e.g. RD R-29 (1) for the first stage of the R-29) for cases where no name for the engine is available." |
| 18 | NEng | "Main engine multiplicity (i.e. the stage has this many main engines, all of the type defined in the previous column.)" | count | 99.9% | 96.3% | |
| 19 | Class | "Stage type. This doesn't really mean anything and can be ignored." | – | 99.6% | | |

Example rows (trimmed):

```
Saturn S-IC | SaturnV | BOMI | - | 42.1 |  | 10.06 |  | 2286.0 |  | 135200 |  | 33500.0 |  | - |  | 170.0 | F-1 | 5 | O
ESC-A       | EPS     | ASTD | - | 7.0  | ? | 5.43 |  | 18.4   |  | 2000   | ? | 64.0   |  | - |  | 945.0 | HM-7B | 1 | O
```

### 3.2 engines.tsv (1488 rows, 20 columns)

Doc: "The Engines file gives basic information for solid motors and liquid engines used as the main engines of stages in the Stages file."

| # | Column | Meaning (GCAT doc) | Units | Fill | Fill ≠0 | Notes |
|---|---|---|---|---|---|---|
| 0 | Name | "Engine name" | – | 100% | | primary key |
| 1 | Manufacturer | "Manufacturer" | – | 100% | | |
| 2 | Family | "Engine Family (loosely defined grouping)" | – | 43.5% | | |
| 3 | Alt_Name | "Alternative name" | – | 16.7% | | |
| 4 | Oxidizer | "Oxidizer type" | – | 38.9% | | `-` for solids; free text such as `LOX`, `N2O4`, `MON-3`, `N204` (typo), `LOX?` |
| 5 | Fuel | "Fuel type" | – | 100% | | free text, 134 distinct (`Kero`, `Kerosene RP-1`, `Kero T-1`, `LH2`, `Methane LNG`, `UDMH`, `AZ-50`, `HTPB`, `PBAN`, `Solid`, ...) |
| 6 | Mass | "Mass, kg, loaded (solids only)" | kg | 61.0% | 60.8% | |
| 7 | MFlag | (undocumented) | – | 21.1% | | `?` |
| 8 | Impulse | "Total impulse, kNs (mostly for solids)" | kN·s | 25.6% | 24.6% | |
| 9 | ImpFlag | (undocumented) | – | 2.1% | | `?` |
| 10 | Thrust | "Typical thrust (kN)" | kN | 80.6% | 79.7% | per engine; vac/SL **not stated** |
| 11 | TFlag | (undocumented) | – | 5.5% | | `?` 68 rows, `s` 14 rows |
| 12 | Isp | "Typical Isp (s), (vacuum Isp where available)" | s | 50.1% | 49.9% | |
| 13 | IspFlag | (undocumented) | – | 2.6% | | `s` 21 rows, `?` 17 rows |
| 14 | Duration | "Typical burn duration (s)" | s | 60.8% | 60.3% | |
| 15 | DurFlag | (undocumented) | – | 2.8% | | `?` |
| 16 | Chambers | "Number of engine chambers per engine" | count | 99.6% | | |
| 17 | Date | "Date of first flight" | vague date | 61.6% | | year only, or e.g. `1965 Jul 16`, `1990s` |
| 18 | Usage | "Example of usage (stage number in brackets)" | – | 94.5% | | |
| 19 | Group | (not listed on the doc page) | – | 100% | | clean propellant-class code, 21 values (`Solid`, `LOX/Kero`, `LOX/LH2`, `LOX/Methane`, `NTO/UDMH`, `NTO/Hyd`, ...). Matches the `#` section headers. **Best key for propellant mapping.** |

Example rows:

```
F-1    | RDYNE | F-1   | - | LOX | Kerosene RP-1 | -        | | -       | | 6680.00 |   | 260.0 |   | -     | | 1 | 1967 | Saturn V [1] | LOX/Kero
RS-68  | RDYNE | RS-68 | - | LOX | LH2           | -        | | -       | | 2950.00 | s | 409.0 | s | -     | | 1 | -    | Delta 4      | LOX/LH2
RSRMV  | NGISP | RSRM  | - | -   | PBAN          | 726000.0 | | 1320000 | | 9996.00 |   | -     |   | 132.8 | | 1 | 2022 | SLS SRB      | Solid
```

### 3.3 lv.tsv (1837 rows, 20 columns): launch-vehicle variants

| # | Column | Meaning (GCAT doc, abridged quotes) | Units | Fill | Fill ≠0 |
|---|---|---|---|---|---|
| 0 | LV_Name | "Name of launch vehicle" | – | 100% | |
| 1 | LV_Family | "Launch vehicle family - base stage." | – | 100% | |
| 2 | LV_Manufacturer | "Manufacturer. See the Orgs file." | – | 99.8% | |
| 3 | LV_Variant | "Sometimes two different launch vehicles have the same name ... These variants are indicated by an extra string in this field." | – | 12.5% | |
| 4 | LV_Alias | "An entry in this field indicates that the vehicle mentioned as an alias is an alternate name for this vehicle." | – | 1.3% | |
| 5 | LV_Min_Stage | "Two numbers giving the minimum and maximum stage number. The minimum is usually 1, but sometimes 0 to allow for strapon booster stages, and occasionally -1 ..." | – | 100% | |
| 6 | LV_Max_Stage | (as above) | – | 100% | |
| 7 | Length | "Length (metres.) The length is approximate, and may vary when different payloads and fairings are used." | m | 99.0% | 98.9% |
| 8 | LFlag | (undocumented, `?`) | – | 19.2% | |
| 9 | Diameter | "Diameter (metres)" | m | 99.8% | 99.7% |
| 10 | DFlag | (undocumented, `?`) | – | 6.3% | |
| 11 | Launch_Mass | "Launch mass, (tonnes)" | tonne | 96.9% | 92.8% |
| 12 | MFlag | (undocumented, `?`) | – | 21.2% | |
| 13 | LEO_Capacity | "LEO payload capacity in kg, approximate; only provided for some of the orbital vehicles. Values in these fields are especially tentative." | kg | 92.3% | **21.4%** (`0` = unknown) |
| 14 | GTO_Capacity | "GTO payload capacity in kg, approximate ..." | kg | 97.4% | **12.7%** |
| 15 | TO_Thrust | "Launch thrust, kN." | kN | 74.3% | 73.9% |
| 16 | Class | "Vehicle type": O orbital, D deep space, M missile, R research rocket, V/X/Y/A/C/Q/T/W (sub-types) | – | 100% | |
| 17 | Apogee | "Estimated max apogee (kilometers). In many cases this is a rough order of magnitude (ROM) estimate." | km | 99.7% | 98.0% |
| 18 | Range | "In some cases for IRBM/ICBMs I include an extra figure representing the range." | km | 14.2% | |
| 19 | GenericName | (undocumented; e.g. `Saturn 5`, `Atlas V`, `CZ-5`) | – | 31.5% | |

Example: `Saturn V | SaturnV | MSFC | - | - | 1 | 3 | 110.6 | | 10.06 | | 2913.0 | | 118000 | 0 | 34030 | O | 400000 | - | Saturn 5`

### 3.4 lvs.tsv (4745 rows, 17 columns): stage composition per vehicle

Doc: "Each line represents a single stage within a vehicle ... 0 is used for strapon boosters, and in the rare cases where two different kinds of strapon booster are present, -1 is used as well. In some cases the nose fairing is included, and given a stage `number' of F, or an interstage or auxiliary motor component given a stage `number' of C (for component). You may wish to ignore these."

| # | Column | Meaning (GCAT doc) | Fill | Notes |
|---|---|---|---|---|
| 0 | LV_Name | "The vehicle name." | 100% | join to lv.tsv on (LV_Name, LV_Variant) |
| 1 | LV_Variant | "The vehicle variant (usually blank)." | 17.0% | |
| 2 | Stage_No | "the stage number (which can be -1 or 0 for strapons, and F for fairing or C for components such as interstages, or A for an air launch platform ...)" | 100% | values `-1,0,1..6,F,C,A` |
| 3 | Stage_Name | "the stage name (which maps to the Stages file)" | 100% | join key to stages.tsv |
| 4 | Qualifier | "uncertainty flag ... not confirmed that this stage is the correct one" | 0.2% | |
| 5 | Dummy | "a flag to indicate a dummy stage" | 0.8% | `d` |
| 6 | Multiplicity | "the stage multiplicity: e.g. stage 0 of the ASLV consists of two AS-0 strapon stages" | 100% | |
| 7 | Stage_Impulse | "the stage impulse in kNs reserved for future use and not currently filled in." | **5.2%** | the doc says unfilled, but 248 rows have values |
| 8 | Stage_Apogee | "the stage typical apogee, approximate only" | 100% | km |
| 9 | Stage_Perigee | "the stage typical perigee, approximate only" | 100% | km; negative = suborbital (e.g. -6378) |
| 10 | Perigee_Qual | "Apogee/perigee uncertainly flag ignore this ..." | 58.8% | |
| 11–16 | TimeOn, TimeOff, AltOn, AltOff, VelOn, VelOff | ignition/cutoff time (s since liftoff), altitude range (km), inertial velocity (km/s): "reserved for future use" | **0%** | all empty |

R-7/Soyuz numbering, per the doc: "as of Aug 2026 the boosters are denoted stage 0 and the core stage is stage 1".

### 3.5 family.tsv (676 rows, 1 column)

Single column, `Family`: a plain list of family codes such as `10KS2500`, `SaturnV`, `Falcon9`. It holds no attributes. The doc explains the rule: "The rule I've adopted for defining a new family is a change in the tankage diameter."

### 3.6 launch.tsv (launch log, 33 columns)

Header: `Launch_Tag, Launch_JD, Launch_Date, LV_Type, Variant, Fairing, Flight_ID, Flight, Mission, FlightCode, Platform, Launch_Site, Launch_Pad, Ascent_Site, Ascent_Pad, Perigee, Apogee, Apoflag, Inc, Azimuth, Range, RangeFlag, Dest, OrbMass, OrbPay, Agency, LaunchCode, FailCode, Group, Category, LTCite, Cite, Notes`.

- `LV_Type` + `Variant` join to lv.tsv and lvs.tsv.
- `LaunchCode`: the first letter is the category (O orbital, M missile, S suborbital, D deep space, ...). The second letter is the outcome, "S, F or U for Success, Fail or Unknown", with optional percentage digits.
- Per the doc, Perigee, Inc, Azimuth and OrbMass "(added Jul 2026) does not yet have the values filled in."

I used the log only to count launches per stage (`launchesInGcatLog`, `firstLaunch`, `lastLaunch` in the JSON). It covers every launch of every (LV_Type, Variant) that lvs.tsv says uses the stage.

## 4. Propellant mapping (engines.tsv `Group` → app enum)

I mapped on engines.tsv `Group` rather than the free-text Oxidizer/Fuel columns, because Group is a clean 21-value code. The stage's propellant is taken from its main engine (stages.tsv `Engine` → engines.tsv `Name`).

| GCAT Group | Typical Oxidizer / Fuel strings | App enum |
|---|---|---|
| LOX/Kero | LOX / Kero, Kerosene RP-1, Kero T-1, Kero RG-1, Jet A ... | `kerolox` |
| LOX/Methane | LOX / Methane, Methane LNG | `methalox` |
| LOX/LH2 | LOX / LH2 | `hydrolox` |
| NTO/UDMH | N2O4 / UDMH, AZ-50, UH25 | `hypergolic` |
| NTO/Hyd | N2O4, MON-3 / MMH, N2H4 | `hypergolic` |
| NA/UDMH, NA/AA, NA/Amine | nitric acid (RFNA, IRFNA, AK-27...) / UDMH, aniline, amine | `hypergolic` |
| Solid | `-` / HTPB, PBAN, CTPB, PBAA, Solid ... | `solid` |
| NA/Kero, NA/Turps, H2O2/Kero, LOX/Alcohol, LOX/UDMH, LOX/NH3, LOX/Propane, Hybrid, MonoHyd, N2, Green, EP | various | no enum (`null`). None of the 49 curated stages uses these. |

Caveat: whether nitric-acid/kerosene or turpentine counts as "hypergolic" is a chemistry judgment that GCAT does not state. I left those groups unmapped rather than guess.

## 5. Curated stages (49 stages, 19 vehicle programs)

Programs: Saturn V, Saturn IB, Falcon 9 (v1.0 and Block 5/FT5; Falcon Heavy via shared stage records), Atlas V, Delta IV, Space Shuttle, SLS Block 1, Ariane 5 (ECA, G), Soyuz-2.1b, Proton-M, N1, Titan II, Titan IVB, Energiya, Long March 5, H-IIA, Electron, Starship/Super Heavy.

How each field was built:
- `launchMass_kg` = stages.tsv `Launch_Mass` (tonnes) × 1000. `dryMass_kg` = `Dry_Mass` (already kg).
- `propellantMass_kg` = launch − dry. GCAT has no propellant-mass column, so this is always derived.
- `thrust_kN` = stages.tsv `Thrust`, which the docs call "Typical thrust (vacuum)". **`thrustType` is `"vac"` for every stage**, because the `ThrustSL` column is empty across the whole file.
- `derivedIsp_s` = F·t / (m_prop·g0), with F = vacuum stage thrust in N, t = stages.tsv `Duration`, g0 = 9.80665. Because vacuum thrust is used, this is roughly a vacuum Isp. For boosters it overstates the real average Isp.
- `gcatIsp_s` = engines.tsv `Isp` for the main engine ("vacuum Isp where available").
- `ispForApp_s` = `gcatIsp_s` when present. Otherwise it is `derivedIsp_s`, unless the derived value failed a plausibility check, in which case it is `null`.
- Automatic flags:
  - derived Isp and engine Isp differ by more than 10%;
  - stage thrust differs from NEng × engine thrust by more than 10%;
  - a solid stage's launch mass differs from the motor's loaded mass by more than 10%;
  - derived Isp is above the highest Isp of **any** engine in the same Group in engines.tsv;
  - derived Isp is more than 20% below the Group median when there is no engine Isp to compare against;
  - any GCAT `?` uncertainty flag on the stage row.

Units below: D and L in m, masses in kg, F in kN, t in s, Isp in s. "launches" = rows in launch.tsv for every vehicle (and variant) whose lvs.tsv composition includes the stage.

| id | GCAT stage | vehicle | prop | D m | L m | m0 kg | dry kg | mprop kg | F vac kN | t s | engine x n | Isp derived | Isp GCAT | launches | flags |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| saturn-v-s-ic | Saturn S-IC | Saturn V | kerolox | 10.06 | 42.1 | 2,286,000 | 135,200 | 2,150,800 | 33,500.0 | 170.0 | F-1 x5 | 270.0 | 260.0 | 13 | — |
| saturn-v-s-ii | Saturn S-II | Saturn V | hydrolox | 10.06 | 24.8 | 490,800 | 39,000 | 451,800 | 4,500.0 | 270.0 | J-2 x5 | 274.2 | 427.0 | 13 | derived Isp 274s differs from engines.tsv Isp 427s by -36%; stage thrust 4500 kN vs NEng x engine thrust 5x1023=5115 kN (-12%) |
| saturn-v-s-ivb | Saturn S-IVB | Saturn V | hydrolox | 6.60 | 18.7 | 120,000 | 13,300 | 106,700 | 890.0 | 500.0 | J-2 x1 | 425.3 | 427.0 | 21 | stage thrust 890 kN vs NEng x engine thrust 1x1023=1023 kN (-13%) |
| saturn-ib-s-ib | Saturn S-IB | Saturn IB | kerolox | 6.53 | 24.4 | 448,700 | 41,594 | 407,106 | 8,240.0 | 155.0 | H-1 x8 | 319.9 | 263.0 | 9 | derived Isp 320s differs from engines.tsv Isp 263s by +22%; stage thrust 8240 kN vs NEng x engine thrust 8x721=5768 kN (+43%) |
| falcon-9-v1-0-s1 | Falcon 9 St 1 | Falcon 9 v1.0 | kerolox | 3.65 | 29.0 | 302,000 | 17,726 | 284,274 | 3,680.0 | 174.0 | Merlin 1C x9 | 229.7 | 304.0 | 19 | GCAT uncertainty flag '?' on Launch_Mass; derived Isp 230s differs from engines.tsv Isp 304s by -24% |
| falcon-9-v1-0-s2 | Falcon 9 St 2 | Falcon 9 v1.0 | kerolox | 3.65 | 10.0 | 52,000 | 2,957 | 49,043 | 427.0 | 345.0 | Merlin 1C-Vac x1 | 306.3 | 342.0 | 19 | GCAT uncertainty flag '?' on Length; GCAT uncertainty flag '?' on Launch_Mass; derived Isp 306s differs from engines.tsv Isp 342s by -10% |
| falcon-9-b5-s1 | Falcon 9 St 1/1D-5 | Falcon 9 Block 5 (GCAT variant FT5) | kerolox | 3.65 | 43.5 | 390,000 | 18,000 | 372,000 | 6,770.0 | 180.0 | Merlin 1D-5 x9 | 334.0 | 304.8 | 640 | GCAT uncertainty flag '?' on Launch_Mass; GCAT uncertainty flag '?' on Dry_Mass; stage thrust 6770 kN vs NEng x engine thrust 9x845=7605 kN (-11%) |
| falcon-9-b5-s2 | Falcon 9 St 2/1D-5 | Falcon 9 Block 5 (GCAT variant FT5) | kerolox | 3.65 | 12.6 | 75,700 | 4,900 | 70,800 | 801.0 | 372.0 | Merlin 1D-Vac x1 | 429.2 | 345.0 | 642 | GCAT uncertainty flag '?' on Length; GCAT uncertainty flag '?' on Launch_Mass; GCAT uncertainty flag '?' on Dry_Mass; derived Isp 429s differs from engines.tsv Isp 345s by +24%; derived Isp 429s exceeds the highest Isp of ANY LOX/Kero engine in engines.tsv (362s, 11D58M (s)) - inputs (thrust, burn time or masses) are inconsistent |
| atlas-v-ccb | Atlas CCB | Atlas V | kerolox | 3.80 | 32.5 | 304,000 | 20,890 | 283,110 | 3,800.0 | 240.0 | RD-180 x1 | 328.5 | 337.8 | 110 | — |
| atlas-v-centaur | Centaur IIIB/SEC | Atlas V | hydrolox | 3.05 | 11.7 | 22,900 | 2,130 | 20,770 | 99.2 | 740.0 | RL10A-4-2 x1 | 360.4 | 451.0 | 58 | derived Isp 360s differs from engines.tsv Isp 451s by -20% |
| atlas-v-srb | Atlas V SRM | Atlas V (5xx) | solid | 1.55 | 19.5 | 46,200 | 3,600 | 42,600 | 1,361.0 | 91.0 | AJ-60A x1 | 296.5 | 275.0 | 43 | GCAT uncertainty flag '?' on Dry_Mass |
| delta-iv-cbc | Delta CBC | Delta IV Medium/Heavy | hydrolox | 5.00 | 40.8 | 226,400 | 26,760 | 199,640 | 2,891.0 | 249.0 | RS-68 x1 | 367.7 | 409.0 | 28 | derived Isp 368s differs from engines.tsv Isp 409s by -10% |
| delta-iv-cbc-rs68a | Delta CBC RS-68A | Delta IV Heavy (variants A/B) | hydrolox | 5.00 | 40.8 | 226,400 | 26,760 | 199,640 | 3,124.0 | 249.0 | RS-68A x1 | 397.3 | 414.0 | 17 | — |
| delta-iv-dcss5 | DCSS5-1 | Delta IV Heavy (variant B) | hydrolox | 5.00 | 12.0 | 30,700 | 3,490 | 27,210 | 110.0 | 1,125.0 | RL10C-2-1 x1 | 463.8 | 462.5 | 3 | — |
| sts-srb | SRM | Space Shuttle | solid | 3.77 | 45.5 | 590,000 | 88,000 | 502,000 | 11,790.0 | 123.0 | SRM x1 | 294.6 | 267.3 | 140 | derived Isp 295s differs from engines.tsv Isp 267s by +10% |
| sts-et | ET | Space Shuttle | hydrolox | 8.40 | 47.0 | 748,000 | 27,000 | 721,000 | 6,300.0 | 516.0 | SSME x3 | 459.8 | 452.5 | 140 | — |
| sls-srb | RSRMV | SLS Block 1 | solid | 3.77 | 47.4 | 733,000 | 72,000 | 661,000 | 9,999.0 | 132.8 | RSRMV x1 | 204.8 | — | 2 | derived Isp 205s is >20% below the median engines.tsv Isp for Solid engines (267s) and there is no engine Isp to compare against |
| sls-core | SLS CS | SLS Block 1 | hydrolox | 8.40 | 64.6 | 1,102,000 | 85,300 | 1,016,700 | 9,116.0 | 483.0 | RS-25 x4 | 441.6 | 452.5 | 2 | — |
| sls-icps | ICPS | SLS Block 1 | hydrolox | 5.10 | 13.7 | 31,000 | 3,500 | 27,500 | 110.0 | 1,125.0 | RL10B-2 x1 | 458.9 | 465.5 | 2 | GCAT uncertainty flag '?' on Launch_Mass; GCAT uncertainty flag '?' on Dry_Mass |
| ariane-5-eap | Ariane EAP P240 | Ariane 5 ECA | solid | 3.01 | 31.6 | 280,000 | 40,000 | 240,000 | 6,719.0 | 130.0 | EAP MPS P240 x1 | 371.1 | 275.4 | 98 | derived Isp 371s differs from engines.tsv Isp 275s by +35%; derived Isp 371s exceeds the highest Isp of ANY Solid engine in engines.tsv (306s, SR120) - inputs (thrust, burn time or masses) are inconsistent; stage thrust 6719 kN vs NEng x engine thrust 1x5000=5000 kN (+34%) |
| ariane-5-epc-h175 | Ariane 5 EPC H175 | Ariane 5 ECA | hydrolox | 5.46 | 30.5 | 189,000 | 14,200 | 174,800 | 1,320.0 | 540.0 | Vulcain 2 x1 | 415.8 | 434.0 | 92 | — |
| ariane-5-esc-a | ESC-A | Ariane 5 ECA | hydrolox | 5.43 | 7.0 | 18,400 | 2,000 | 16,400 | 64.0 | 945.0 | HM-7B x1 | 376.1 | 445.1 | 72 | GCAT uncertainty flag '?' on Length; GCAT uncertainty flag '?' on Dry_Mass; derived Isp 376s differs from engines.tsv Isp 445s by -16% |
| ariane-5-epc-h158 | Ariane 5 EPC H158 | Ariane 5 G | hydrolox | 5.46 | 30.5 | 170,000 | 12,700 | 157,300 | 1,114.0 | 589.0 | Vulcain x1 | 425.4 | 430.0 | 25 | — |
| soyuz-2-1b-blok-bvgd | 14S53 | Soyuz-2.1b | kerolox | 2.68 | 19.8 | 44,500 | 3,915 | 40,585 | 992.0 | 120.0 | RD-107A x1 | 299.1 | 310.0 | 170 | — |
| soyuz-2-1b-blok-a | 14S53A | Soyuz-2.1b | kerolox | 2.95 | 28.0 | 105,400 | 6,875 | 98,525 | 1,009.4 | 286.0 | RD-108A x1 | 298.8 | 311.0 | 170 | — |
| soyuz-2-1b-blok-i | 14S54 | Soyuz-2.1b | kerolox | 2.66 | 6.7 | 26,000 | 2,800 | 23,200 | 294.0 | 359.0 | RD-0124 x1 | 463.9 | 359.0 | 100 | derived Isp 464s differs from engines.tsv Isp 359s by +29%; derived Isp 464s exceeds the highest Isp of ANY LOX/Kero engine in engines.tsv (362s, 11D58M (s)) - inputs (thrust, burn time or masses) are inconsistent |
| proton-m-s1 | 8S810M | Proton-M | hypergolic | 7.40 | 21.2 | 450,000 | 30,600 | 419,400 | 10,470.0 | 120.0 | RD-253 14D14 x6 | 305.5 | 316.0 | 30 | — |
| proton-m-s2 | 8S811 | Proton-M | hypergolic | 4.10 | 17.1 | 167,800 | 11,750 | 156,050 | 2,330.0 | 215.0 | RD-0211 x4 | 327.3 | 326.5 | 327 | — |
| proton-m-s3 | 8S812M | Proton-M | hypergolic | 4.10 | 4.1 | 50,300 | 3,700 | 46,600 | 608.0 | 238.0 | RD-0210 x1 | 316.6 | 326.5 | 58 | — |
| n1-blok-a | N-1 Blok-A | N1 (GCAT 'N-1 11A52') | kerolox | 14.00 | 30.0 | 1,870,000 | 130,000 | 1,740,000 | 45,300.0 | 110.0 | NK-15 x30 | 292.0 | 284.0 | 4 | — |
| n1-blok-b | N-1 Blok-B | N1 (GCAT 'N-1 11A52') | kerolox | 10.30 | 20.5 | 540,000 | 56,000 | 484,000 | 14,000.0 | 130.0 | NK-15V x8 | 383.4 | 346.0 | 4 | derived Isp 383s differs from engines.tsv Isp 346s by +11%; derived Isp 383s exceeds the highest Isp of ANY LOX/Kero engine in engines.tsv (362s, 11D58M (s)) - inputs (thrust, burn time or masses) are inconsistent |
| n1-blok-v | N-1 Blok-V | N1 (GCAT 'N-1 11A52') | kerolox | 6.40 | 12.5 | 185,000 | 13,700 | 171,300 | 1,610.0 | 400.0 | NK-21 x4 | 383.4 | 353.0 | 4 | derived Isp 383s exceeds the highest Isp of ANY LOX/Kero engine in engines.tsv (362s, 11D58M (s)) - inputs (thrust, burn time or masses) are inconsistent |
| titan-ii-s1 | LR87AJ5 | Titan II / Titan II GLV | hypergolic | 3.05 | 21.5 | 122,000 | 4,000 | 118,000 | 2,090.0 | 147.0 | LR87AJ5 x2 | 265.5 | 296.0 | 108 | derived Isp 265s differs from engines.tsv Isp 296s by -10% |
| titan-ii-s2 | LR91AJ5 | Titan II / Titan II GLV | hypergolic | 3.05 | 7.3 | 28,900 | 2,400 | 26,500 | 440.0 | 182.0 | LR91AJ5 x1 | 308.1 | 316.0 | 108 | — |
| titan-ivb-srmu | SRMU | Titan IVB | solid | 3.20 | 34.3 | 350,000 | 37,000 | 313,000 | 7,500.0 | 137.8 | SRMU x1 | 336.7 | 285.6 | 12 | derived Isp 337s differs from engines.tsv Isp 286s by +18%; derived Isp 337s exceeds the highest Isp of ANY Solid engine in engines.tsv (306s, SR120) - inputs (thrust, burn time or masses) are inconsistent |
| titan-ivb-s1 | LR87AJ11A | Titan IVB | hypergolic | 3.05 | 26.4 | 163,000 | 8,000 | 155,000 | 2,452.0 | 164.0 | LR87AJ11A x2 | 264.6 | 302.0 | 34 | derived Isp 265s differs from engines.tsv Isp 302s by -12% |
| titan-ivb-centaur-t | Centaur T | Titan IVB (401B/Centaur) | hydrolox | 4.30 | 9.0 | 23,800 | 2,775 | 21,025 | 146.0 | 600.0 | RL10A-3-3A x2 | 424.9 | 444.0 | 16 | — |
| energiya-blok-a | Energiya Blok A | Energiya | kerolox | 3.90 | 38.3 | 360,000 | 60,000 | 300,000 | 7,908.0 | 145.0 | RD-170 x1 | 389.8 | 337.0 | 1 | derived Isp 390s differs from engines.tsv Isp 337s by +16%; derived Isp 390s exceeds the highest Isp of ANY LOX/Kero engine in engines.tsv (362s, 11D58M (s)) - inputs (thrust, burn time or masses) are inconsistent |
| energiya-core | Energiya | Energiya | hydrolox | 7.75 | 58.1 | 780,000 | 80,000 | 700,000 | 7,850.0 | 480.0 | RD-0120 x4 | 548.9 | 455.0 | 2 | derived Isp 549s differs from engines.tsv Isp 455s by +21%; derived Isp 549s exceeds the highest Isp of ANY LOX/LH2 engine in engines.tsv (465.5s, RL10B-2) - inputs (thrust, burn time or masses) are inconsistent |
| cz-5-booster | CZ-5 Booster | Long March 5 | kerolox | 3.35 | 27.6 | 156,600 | 13,800 | 142,800 | 2,400.0 | 180.0 | YF-100 x2 | 308.5 | 305.0 | 18 | — |
| cz-5-s1 | CZ-5 Stage 1 | Long March 5 | hydrolox | 5.00 | 31.7 | 186,900 | 21,600 | 165,300 | 1,400.0 | 480.0 | YF-77 x2 | 414.5 | 438.0 | 18 | — |
| cz-5-s2 | CZ-5 Stage 2 | Long March 5 | hydrolox | 5.00 | 10.6 | 36,000 | 6,700 | 29,300 | 176.5 | 700.0 | YF-75D x2 | 430.0 | 442.0 | 11 | — |
| h-iia-srb-a | H-II SRB-A | H-IIA 202 | solid | 2.50 | 15.2 | 75,000 | 10,000 | 65,000 | 2,250.0 | 100.0 | H-II SRB-A x1 | 353.0 | 280.0 | 16 | derived Isp 353s differs from engines.tsv Isp 280s by +26%; derived Isp 353s exceeds the highest Isp of ANY Solid engine in engines.tsv (306s, SR120) - inputs (thrust, burn time or masses) are inconsistent |
| h-iia-s1 | H-IIA Stage 1 | H-IIA | hydrolox | 4.00 | 37.2 | 114,000 | 13,000 | 101,000 | 1,100.0 | 390.0 | LE-7A x1 | 433.1 | 440.0 | 50 | — |
| h-iia-s2 | H-IIA Stage 2 | H-IIA | hydrolox | 4.00 | 9.2 | 20,000 | 4,000 | 16,000 | 137.0 | 600.0 | LE-5B x1 | 523.9 | 447.0 | 55 | derived Isp 524s differs from engines.tsv Isp 447s by +17%; derived Isp 524s exceeds the highest Isp of ANY LOX/LH2 engine in engines.tsv (465.5s, RL10B-2) - inputs (thrust, burn time or masses) are inconsistent |
| electron-s1 | Electron Stage 1 | Electron | kerolox | 1.20 | 12.1 | 10,200 | 950 | 9,250 | 162.0 | — | Rutherford x9 | — | 311.0 | 97 | no burn duration in stages.tsv -> derived Isp not computable; stage thrust 162 kN vs NEng x engine thrust 9x20.3=182.7 kN (-11%) |
| electron-s2 | Electron Stage 2 | Electron | kerolox | 1.20 | 2.4 | 2,300 | 250 | 2,050 | 22.0 | — | Rutherford Vac x1 | — | 343.0 | 97 | no burn duration in stages.tsv -> derived Isp not computable |
| super-heavy-v1 | Super Heavy | Starship V1/V2 (Super Heavy booster) | methalox | 9.00 | 71.0 | 3,520,000 | 220,000 | 3,300,000 | 72,500.0 | 330.0 | Raptor SL x33 | 739.3 | — | 11 | derived Isp 739s exceeds the highest Isp of ANY LOX/Methane engine in engines.tsv (367s, Archimedes Vac) - inputs (thrust, burn time or masses) are inconsistent; stage thrust 72500 kN vs NEng x engine thrust 33x1950=64350 kN (+13%) |
| starship-v1-ship | Starship V1.0 | Starship V1 | methalox | 9.00 | 50.0 | 1,300,000 | 120,000 | 1,180,000 | 12,500.0 | 330.0 | Raptor 2 Vac x6 | 356.5 | — | 14 | stage thrust 12500 kN vs NEng x engine thrust 6x2500=15000 kN (-17%) |

Source for every row: https://planet4589.org/space/gcat/tsv/tables/stages.tsv (stage row) and https://planet4589.org/space/gcat/tsv/tables/engines.tsv (engine row). Composition comes from lvs.tsv and launch counts from https://planet4589.org/space/gcat/tsv/launch/launch.tsv. Data from GCAT (J. McDowell, planet4589.org/space/gcat), CC-BY-4.0.

### Derived Isp vs GCAT engine Isp: summary

- **Within 10% (good agreement, 25 of 44 stages that have both values):** S-IC, S-IVB, F9 B5 S1, Atlas CCB, Atlas V SRM, Delta CBC RS-68A, DCSS5-1, ET, SLS CS, ICPS, EPC H175, EPC H158, Soyuz Blok BVGD and Blok A, all three Proton-M stages, N1 Blok A and Blok V, Titan II S2, Centaur T, the three CZ-5 stages, H-IIA S1. Just over the line (10.1–10.8%): F9 v1.0 S2, Delta CBC (RS-68), Shuttle SRB, Titan II S1, N1 Blok B.
- **More than 10% off (19 stages, flagged as data issues):** S-II (−36%), S-IB (+22%), F9 v1.0 S1 (−24%), F9 v1.0 S2 (−10.4%), F9 B5 S2 (+24%), Centaur IIIB (−20%), Delta CBC (−10.1%), Shuttle SRB (+10.2%), Ariane EAP P240 (+35%), ESC-A (−16%), Soyuz Blok I 14S54 (+29%), N1 Blok B (+10.8%), Titan II S1 (−10.3%), SRMU (+18%), Titan IVB S1 (−12%), Energiya Blok A (+16%), Energiya core (+21%), H-II SRB-A (+26%), H-IIA S2 (+17%).
- **Physically inconsistent:** the derived Isp is above every engine of that propellant class in GCAT. Cases: F9 B5 S2 (429 s vs LOX/Kero max 362 s), Blok I 14S54 (464 s), N1 Blok B/V (383 s), Energiya Blok A (390 s), Energiya core (549 s vs LOX/LH2 max 465.5 s), H-IIA S2 (524 s), EAP P240 / SRMU / H-II SRB-A (371/337/353 s vs Solid max 306 s), and Super Heavy (739 s vs LOX/Methane max 367 s). For these stages, at least one of thrust, burn time or masses in stages.tsv is a rough placeholder. **Do not use the derived Isp; use `gcatIsp_s`.**
- **No engine Isp in GCAT:** RSRMV, which is low at 205 s (flagged); its own total impulse gives 204 s, so the masses look suspect. Also Raptor SL and Raptor 2 Vac, and the two Electron stages (no stage burn time).

## 6. Data quality findings

All observations come from the downloaded files.

**Units and format quirks**
1. **Mixed mass units in stages.tsv:** `Launch_Mass` is in tonnes and `Dry_Mass` in kg, as the docs state. Converting both to SI before subtracting is mandatory.
2. `Launch_Mass` has 0.1 t resolution, so small stages are coarse. Examples: Electron Stage 2 = 2.3 t; 94 stages read exactly `0.1`.
3. `0` and `0.0` are used as "unknown" in numeric columns: Launch_Mass 154 rows, Dry_Mass 71, Thrust 68, Duration 64, NEng 59. lv.tsv `LEO_Capacity`/`GTO_Capacity` are `0` for most rows. Treat 0 as null.
4. The sea-level thrust column (`ThrustSL`) is documented but **empty in all 1626 rows**. Stage thrust is vacuum only. engines.tsv `Thrust` does not say vac or SL; there is a per-row `TFlag` `s` on 14 rows (meaning not documented).
5. lvs.tsv timing, altitude and velocity columns are entirely empty. `Stage_Impulse` is documented as "not currently filled in" but has 248 values.
6. Cells are space-padded and there are free-text typos in propellant names (`N204`, `UMDH`, `IRFMA`). Use the `Group` column.

**Linkage and naming quirks**
7. **Falcon Heavy** is composed in lvs.tsv of `Falcon 9 St 1` (×2 as stage 0, ×1 as stage 1) and `Falcon 9 St 2`. Those are the v1.0 stage records with the `Merlin 1C` engine. launch.tsv shows the first Falcon Heavy on `2018 Feb 6` and the last Falcon 9 (variant `-`, i.e. v1.0) on `2013 Mar 1`. The FH mapping is therefore inconsistent with GCAT's own variant scheme: the v1.0 stage records end up with "launches" running to 2026. The lv.tsv FH launch mass is 1400.0 t, while the stage sum is 958.0 t.
8. **Name collision:** lv `N-1` is a different vehicle (stages `LT Thor N`, `LE-3`, `Castor 2`, `Star 37N`). The Soviet N1 is `N-1 11A52`.
9. **Energiya:** `Energiya` lists boosters as `Energiya Blok A` while `Energiya/Buran` lists `11S771`. These are two different stage records for the same booster type, with differing values (352.0 t / 33,900 kg dry / 140 s vs 360.0 t / 60,000 kg / 145 s).
10. The Saturn V variant `2` (the Skylab launch in launch.tsv) has only S-IC and S-II. S-IVB launch counts therefore cover Saturn V `-` plus Saturn IB and Uprated Saturn I.
11. The Falcon 9 stage-1 records `1D-FT`, `1D-4` and `1D-5` have identical length, launch mass, dry mass (`?`-flagged), stage thrust (6770 kN) and duration. Only the engine record differs (720/780/845 kN). The stage thrust does not track the engine upgrade: 9 × 845 = 7605 kN vs 6770.
12. The R-7 booster record `8K71` (used by R-7 and Vostok) has Launch_Mass 10.8 t, Dry_Mass 850 kg and Thrust 250 kN. Its engine `8D74PS` is listed at 1000 kN, and the later Soyuz booster `11S59` is 44.5 t. 8K71 looks like a wrong or placeholder record. I did not include it.

**Value inconsistencies (vehicle level, lv.tsv vs stage sums)**
13. **Long March 5:** lv.tsv `TO_Thrust = 1180` kN, but the stage records sum to 4 × 2400 + 1400 = 11000 kN. This looks like a missing digit. Also lv `Launch_Mass = 643.0` t vs stage sum 849.3 t.
14. **SLS Block 1:** lv `TO_Thrust = 39000` kN vs stage sum 29,114 kN; `LEO_Capacity = 0`.
15. Others match closely: Saturn V (2913.0 vs 2896.8 t), Shuttle (2040.0 vs 2038.0 t), H-IIA 202, Titan II GLV, Electron.

**Stage level**
16. S-II: stage thrust 4500 kN vs 5 × J-2 1023 kN, and derived Isp 274 s vs J-2 427 s. Thrust × duration is far too low for 451.8 t of propellant. The burn time (270 s) or the thrust is likely a placeholder.
17. S-IB: 8240 kN vs 8 × H-1 721 kN (+43%).
18. Ariane EAP P240: stage thrust 6719 kN vs engine 5000 kN. EAP stages sit in Stage_Family `Vega`.
19. Starship-family engines (Raptor SL, Raptor 2/3 Vac, BE-4) have no Isp in engines.tsv. Several Starship, Vulcan and New Glenn stage values carry `?` flags. New Glenn stages have no Duration. For Super Heavy, F·t/m gives an impossible 739 s.
20. Electron stages have no Duration, so no derived Isp.
21. Uncertainty `?` flags appear on 25% of stage launch masses and 15% of dry masses. They are passed through in the JSON `flags`.

## 7. Recommendations for the app

- For Isp, use `ispForApp_s` (GCAT engine Isp first). Show `derivedIsp_s` only as a consistency indicator.
- Treat masses as approximate (GCAT's own caution: "approximate nature of the numerical values").
- Show the CC-BY-4.0 attribution: "Data from GCAT (J. McDowell, planet4589.org/space/gcat)".
- For Falcon Heavy, do not reuse the GCAT `Falcon 9 St 1` record without a caveat (item 7).

## 8. Reproduction

Scripts are in `scratchpad/scripts/` and were run with `python3 -I <script> <download dir> ...`:
- `profile.py`: fill-rate and column profile.
- `show.py`: dumps stage plus engine rows.
- `build.py`: builds `gcat-stages.json` and the table above.
- `lvcheck.py`: lv.tsv vs stage-sum checks.
