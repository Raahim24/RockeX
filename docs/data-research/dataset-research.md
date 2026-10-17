# Dataset research: Rocket Configurator (HackHarvard, SpaceX track)

Compiled 2026-10-17 for the head chat (harvard-space-b3) and the team. It is aimed at P4 (data) and P2 (physics and integration).

**Nothing has been committed or pushed, and nothing in `SpaxeX/` was edited.** Every number below was read from a page, PDF, API response or data file fetched this session. Each per-value table shows the URL and a verbatim quote. Values with no source are marked `TODO(source)`.

What is in `research/`:
- `dataset-research.md`: this report.
- `data-drafts/`: draft JSON in the exact contract shape, plus sidecars. See §11.
- `findings/`: the six raw evidence files, with a verbatim quote for every value. Go there when you need the full quote.
- `validate_drafts.py`: checks the drafts against the contract and the spec rules, then recomputes the demo builds.
- `build_drafts.py`: regenerates the drafts from the findings.

---

## 0. TL;DR

1. **No single open dataset covers the contract, so you have to curate.** The best mix:
   - **Engines:** hand-curated from manufacturer and NASA sheets.
   - **Stages and historic stages:** GCAT (CC BY 4.0).
   - **Vehicle stats:** Launch Library 2 (free, attribution encouraged).
   - **Mission Δv:** computed from cited textbook and NASA increments. There is no open Δv dataset.
2. **Several sources in the brief are dead or unusable.**
   - The **SpaceX-API is dead.** It returns HTTP 522, and the repo was archived in Sep 2022.
   - **spacelaunchreport.com and b14643.de are now gambling-spam domains.** Brügge's site survives at b14643.eu.
   - **Astronautix forbids reproduction.**
   - **ROEngines (KSP) is CC BY-NC-ND**, so we can't redistribute its data.
3. **Ready to drop in:**
   - 11 engines, 12 tanks, 6 missions, 5 payloads and 5 core reference rockets in contract shape.
   - 20 extended reference rockets for U1, with launches, failures, first-launch year and roast facts.
   - 49 GCAT historic stages for U3.
   - The head chat's ids are kept: `merlin-1d`, `rl10c-1`, `falcon9-s1-tank`, `centaur-iii-tank`, `nova-c`, `leo`, `moon-transfer`, `falcon-9`.
4. **The demo as written in ARCHITECTURE.md doesn't hold with real numbers.**
   - **The placeholder numbers don't reproduce the spec's own claim.** With the documented formula they give 11.79 / 13.41 km/s, not 11.56 / 13.08.
   - **Real hydrolox upper stages lower Δv.** Swapping a real kerolox upper stage for a real hydrolox one (S-IVB, Delta IV upper stage, ICPS, Centaur) *reduces* Δv in this model, because real hydrolox upper stages carry much less propellant.
   - **The suggestion type can't express the swap.** `Suggestion` can't change engine *and* tank in one step, and changing propellant needs both.
   - **Recommended replacement, legal under the current rules:**
     - **Red build:** 9× Merlin 1D on the F9 first-stage tank, plus 1× RL10B-2 on the Delta IV 5 m upper-stage tank. With JWST (6.2 t) on Moon transfer it is **−905 m/s** at TWR 1.64.
     - **Grok's fix:** one `add_stage` (RL10C-1 on the Centaur III tank) brings it to **+497 m/s** at TWR 1.57.
     - If Moon transfer stays at 12,500 m/s, it goes from −805 to +597. See §6.
5. **The rules in ARCHITECTURE.md reject the real Falcon 9.**
   - **4 % dry-mass floor:** the F9 second stage is 3.2 % and fails. So does the Shuttle External Tank, a real pure tank, at 3.7 %.
   - **Engine-fit rule:** `floor(0.6·(D/d)²)` gives 0 engines for MVac on the F9 second stage and for the RD-180 on the Atlas core. It also forbids the S-IC's 5 F-1s and Super Heavy's 33 Raptors.
   - The rule does give 9 for Merlin on a 3.66 m tank, but only using Merlin's 0.92 m nozzle, which is uncited on Wikipedia.
   - Suggested changes for P2: a 3 % floor and `max(1, floor(c·(D/d)²))`. See §7.

---

## 1. Source comparison (licenses verified by fetching the license or terms text)

| Source | URL | License / terms | Format / access | Contract fields covered | Reliability | Scrape difficulty |
|---|---|---|---|---|---|---|
| **GCAT** (J. McDowell) | planet4589.org/space/gcat (data: `tsv/tables/{engines,stages,lv,lvs}.tsv`, `tsv/launch/launch.tsv`) | **CC BY 4.0**: "Licence: CC-BY-4.0 … may be freely reproduced as long as you cite it". Cite as "data from GCAT (J. McDowell, planet4589.org/space/gcat)" | TSV, no auth. Updated daily (2026 Oct 16). | Stage length, diameter, full and dry mass, vac thrust, burn time, engine and count. Engine "typical" thrust and Isp (vac where available). LV launch mass, LEO, liftoff thrust. Full launch log, so launches, failures and first year can be derived. | Expert secondary source. The author calls the values "approximate". 25 % of stage masses carry `?` flags. No liquid-engine mass, no separate SL/vac Isp, and the SL thrust column is empty. | Easy |
| **Launch Library 2** (The Space Devs) | ll.thespacedevs.com/2.3.0/launcher_configurations/ | Terms: free to use; "refrain from forwarding it without adding value"; attribution "not mandatory, but is encouraged" | REST JSON. **15 req/h** without a key. `lldev` is unlimited but stale. | launch_mass (t), to_thrust (kN), leo_capacity, min/max stage, total_launch_count, failed_launches, maiden_flight | Secondary, current (F9 Block 5: 640 launches). **Known errors:** counts the Apollo 1 pad fire as a Saturn IB launch failure and Energia's 1987 flight as failed. Starship V3 launch_mass equals propellant only. | Easy, but cache at build time |
| **NASA** (NTRS, fact sheets, SP-4029) | ntrs.nasa.gov, nasa.gov | US Gov works "not protected by copyright in the U.S. (17 U.S.C. §105)". Contractor works and insignia are excluded. | PDF; NTRS JSON search API | Primary for RS-25, F-1, J-2, Saturn V stages (Apollo 11 actuals), SLS, Shuttle ET/SRB, Orion, Hubble | Primary | Hard (PDF and scans), but the most trustworthy |
| **Manufacturers** | spacex.com, l3harris.com, rocket.com (archived), blueorigin.com, ESA/ArianeGroup, npoenergomash (archived), ULA user's guides | © the manufacturer. Individual facts may be cited. | spacex.com keeps its specs in JS bundles. blueorigin.com and npoenergomash return 429/403, so use Wayback. The L3Harris RL10 sheet is 404 live and on Wayback. | Thrust nearly always. Isp and mass only sometimes. SpaceX publishes **no Isp, no engine mass, no stage masses.** | Primary, but marketing-rounded | Medium–hard |
| **FAA environmental documents** | faa.gov (Falcon EA 2020; Starship EA, Appendix G) | US Gov | PDF | **F9 propellant loads per stage**, Super Heavy and Starship propellant, Raptor nozzle exit radius | Primary | Medium |
| **Wikipedia** (engine and LV pages, "Comparison of orbital rocket engines" / "launch systems", "Delta-v budget") | en.wikipedia.org | **CC BY-SA 4.0**; citing single facts is fine | HTML / raw wikitext / REST | Almost everything, but key cells are often **uncited** (F9 stage dry masses, Merlin diameter, the Δv table) | Tertiary | Easy–medium (vac and SL packed into one cell) |
| **Wikidata** | query.wikidata.org | **CC0** | SPARQL; heavy 429 rate limiting | P2228 thrust (with SL/vac qualifiers), **P10107 Isp** (P2230 is torque, not Isp), P2067 mass | **Sparse:** 298 items with thrust, 78 with Isp. RS-25 is full; Merlin, Raptor, RL10 and BE-4 are almost empty. | Medium |
| **Realism Overhaul** (KSP mod) | github.com/KSP-RO/RealismOverhaul | **"CC-BY-SA", version unstated**, no LICENSE file. **ROEngines is CC BY-NC-ND 4.0: don't use.** | .cfg text | Engine dry mass, vac thrust, Isp SL/vac. Configs cite SpaceX, b14643, Sutton, NASA CRs. | Tertiary (game balance). Some values are marked "???" or "RPA-calculated". | Medium |
| r/SpaceX API | github.com/r-spacex/SpaceX-API | Code Apache-2.0; no data license | **Dead** (HTTP 522; last good Wayback 2026-02-06). Repo archived, last commit 2022-09-19. | F9/FH/Starship engine thrust and Isp (288/312, 2022-era), fuel tons | Stale; its Starship data is wrong | n/a |
| Ed Kyle, Space Launch Report | spacelaunchreport.com | **Domain is now gambling spam.** Updates stopped March 2022. | Wayback only | Launch logs | Discontinued | Hard |
| Norbert Brügge "Spacerockets" | b14643.eu (**b14643.de is now spam**) | **No license**, so all rights reserved by default | HTML | Detailed engine and stage tables | Secondary | Medium |
| Astronautix | astronautix.com | "Written material … **may not be reproduced**" | HTML | Engines and LVs | Stale (© to 2019; Merlin is the 2013 version) | Avoid |
| braeunig.us | braeunig.us/space | No license notice found, so default copyright applies; last updated 2017 | HTML | Older LV and stage masses (Delta IV, Atlas, Saturn) | Secondary | Medium |
| Kaggle / GitHub | various | Kaggle's "CC0" LV sets were **scraped from Astronautix or NextSpaceflight**, so the license is doubtful. The one "propulsion" set is **synthetic**. | CSV | — | Low | Avoid |
| Gunter's Space Page | space.skyrocket.de | Notice forbids ML use; terms page unreadable | HTML | LV, stage, engine | Secondary | Avoid |

Full per-source notes, with the license sentences quoted, are in `findings/sources.md`.

## 2. Recommended source per field

| Contract field | Use | Fallback / cross-check |
|---|---|---|
| Engine thrustSL / thrustVac | Manufacturer or NASA sheet (L3Harris RS-25 / RL10, MSFC F-1 / J-2, Energomash, Aerojet RS-68A, spacex.com) | Wikipedia; GCAT (one value only) |
| Engine ispSL / ispVac | Manufacturer or NASA where published | Archived spacex.com (Merlin, dated); Wikipedia; RO as a cross-check only |
| Engine mass_kg | Manufacturer or NASA sheet | Wikipedia; RO. GCAT has no liquid-engine mass. |
| Engine diameter_m | Nozzle exit from NASA or manufacturer sheet | Wikipedia. Some sources give only overall diameter (RD-180, RD-191, RS-68A). |
| Tank (all fields) | Real flown stage: primary stage mass sheets (NASA SP-4029, ULA user's guides, FAA EA, NASA fact sheets) minus catalog engine mass (§4) | GCAT stages.tsv (approximate) |
| Mission requiredDeltaV | 9,400 m/s to LEO + sourced increment (§5) | — |
| Payload | Agency fact sheets (NASA, NOAA, SpaceX Dragon page) | — |
| ReferenceRocket mass / thrust / LEO / stages | Manufacturer or NASA page | LL2 `launcher_configurations`; GCAT lv.tsv (rough: its F9 FT5 is 480 t / 5,886 kN) |
| launches / failures / firstLaunchYear (U1) | LL2, with manual fixes (§8) | Wikipedia infobox; GCAT launch.tsv |
| Historic stages (U3) | GCAT stages.tsv + engines.tsv, using GCAT engine Isp, not F·t/m (§9) | — |

---

## 3. Engines

### 3a. App-ready (`data-drafts/engines.json`, 11 records, every field filled)

Vacuum-only engines use the head chat's convention: `thrustSL_kN = 0` and `ispSL_s = 0`. Per-field URL, tier and quote are in `data-drafts/field-sources.json`.

| id | prop | SL / vac thrust (kN) | Isp SL / vac (s) | mass (kg) | diameter (m) | weakest field |
|---|---|---|---|---|---|---|
| merlin-1d | kerolox | 845 / 914.1 (vac derived: stage 8,227 ÷ 9) | 282 / 311 | 467.2 | 0.92 | **Isp** is from SpaceX's 2013 page (older 147 klbf engine). **Mass** is Wikipedia, citing a Mueller Quora post. **Diameter** is uncited Wikipedia. |
| merlin-1d-vac | kerolox | 0 / 981 | 0 / 348 | **490** | 3.3 | **Mass comes from the RO game config (placeholder).** Diameter is uncited Wikipedia. |
| rs-25 | hydrolox | 1,859.4 / 2,278.8 | 366 / 452.3 | 3,526.2 | 2.286 (nozzle exit, NASA) | all primary (L3Harris 2024 sheet) |
| rl10c-1 | hydrolox | 0 / 101.82 | 0 / 449.7 | 190.5 | 1.448 | all primary (L3Harris 2024 sheet via Wayback) |
| rl10c-1-1 | hydrolox | 0 / 105.98 | 0 / 453.8 | 188.2 | 1.575 | all primary |
| rl10b-2 | hydrolox | 0 / 110.09 | 0 / 465.5 | 301.2 | 2.146 (extended nozzle) | all primary |
| f-1 | kerolox | 6,770.2 / 7,766.6 | 260 / 304 | 8,391.5 | 3.531 (nozzle exit) | Vac thrust and vac Isp are uncited Wikipedia. The rest comes from the MSFC 1968 fact sheet. |
| j-2 | hydrolox | 486.2 / 1,023.1 | 200 / 424 | 1,578.5 | 1.956 | **SL thrust and SL Isp are Wikipedia only**; no primary source found |
| rd-180 | kerolox | 3,826.6 / 4,152.1 | 311.9 / 338.4 | 5,480 | 3.2 (**overall**, 2 nozzles) | all primary (Energomash) |
| rd-191 | kerolox | 1,922.1 / 2,084.9 | 311.2 / 337.5 | 2,200 | 2.1 (overall) | all primary (Energomash) |
| rs-68a | hydrolox | 3,136.0 / 3,558.6 | 362 / 411 | 6,686.0 | 2.438 (engine "Diameter") | all primary (Aerojet 2019 sheet) |

Disagreements we resolved (details in `findings/engines.md`):
- **Merlin SL thrust:** the 2020 user's guide says 854 kN, but its own 190,000 lbf converts to 845 kN. We chose **845 kN**, which matches spacex.com.
- **RS-25 mass:** 7,774 lb (spec sheet), 7,775 lb (web page), 7,004 lb (Wikipedia). We chose 7,774 lb.
- **F-1 SL Isp:** 260 s (primary minimum) vs 263 s (Wikipedia). We chose 260 s.
- **J-2 mass:** 3,480 lb (primary) vs 3,942 lb (Wikipedia). We chose 3,480 lb.
- **RD-180 Isp:** Energomash and ULA disagree by 0.6 s. We chose Energomash.

### 3b. Pending (`data-drafts/engines.pending.json`)

These records have `null` fields, so they **cannot ship until the TODOs are filled.**

| id | missing (TODO(source)) | what is sourced |
|---|---|---|
| raptor-2 | thrustVac, ispSL. Wikipedia's 327 s SL Isp is **not** supported by its own citation. | 230 tf SL (SpaceX V3 update, May 2026); 1,630 kg; 1.3 m (spacex.com, unclear what is measured); ~350 s vac (2019 Musk tweet) |
| raptor-vacuum | mass | 258 tf; 2.3 m; ~380 s (tweet) |
| raptor-3 / raptor-3-vacuum | thrustVac, ispSL / Isp, mass | 250 tf SL, 275 tf vac, 1,525 kg (SpaceX V3 update) |
| be-4 | everything except "640,000 lbf (2,846 kN)", which doesn't say SL or vac | Blue Origin publishes no Isp, mass or diameter. blueorigin.com blocks bots. |
| vulcain-2 / vulcain-2-1 | SL thrust, SL Isp (and vac Isp for 2.1) | 1,359 kN / 429 s (Astrium); 1,371 kN (ESA); ~2 t, 2.5 m |
| be-3u | vac Isp, mass, diameter | 175,000 lbf (778 kN) vac |

If the team wants a methalox engine in the MVP, the cheapest honest option is to fill Raptor 2's ispSL and thrustVac from a cited secondary source (for example Wikipedia's comparison table, CC BY-SA) and mark them `secondary`. That is a team call.

---

## 4. Tanks: method and data

**Method.** This matches the head chat's convention and makes the app round-trip a real stage exactly.

```
tank.propellantMass_kg = loaded fuel + oxidizer (exclude "other": ullage-motor propellant, helium, APS)
tank.dryMass_kg        = stage dry mass − engineCount × (catalog engine mass_kg)   // same number as engines.json
tank.diameter_m        = stage diameter
tank.height_m          = published stage length (usually excludes the interstage)
```

Why: the app computes stage mass = n·m_engine + tankDry + propellant. Using the catalog engine mass in the subtraction means picking the real engine and count reproduces the real stage's dry and wet mass. Caveats:
- Some sources don't say whether the published "empty" mass includes the engines (SLS core, Ariane 6 LLPM, F9).
- Loaded propellant includes residuals.
- Recovery hardware (legs, grid fins) counts as tank structure.

Alternatives considered:
- (a) **The Shuttle External Tank as a literal tank**, the only flown part that *is* just a tank.
- (b) A **per-propellant structural coefficient** fitted from the table below, for procedural tanks:
  - kerolox 4.1–5.5 %
  - hydrolox boosters 6.4–13.6 %
  - hydrolox upper stages 9–12 %

**`data-drafts/tanks.json` (12 records):**

| id | prop | D × H (m) | propellant (kg) | tank dry (kg) | dry/prop | 4 % rule | main source (others in field-sources.json) |
|---|---|---|---|---|---|---|---|
| falcon9-s1-tank | kerolox | 3.66 × 41.2 | 409,583 | 21,395 | 5.22 % | pass | FAA 2020 EA, both-stage total 1,135,925 lbm minus S2 232,950 lb. Dry 25,600 kg is **uncited Wikipedia**. |
| falcon9-s2-tank | kerolox | 3.66 × 13.8 | 105,664 | 3,410 | **3.23 %** | **FAIL** | FAA EA "168,000 pounds of LOX and 64,950 pounds of RP-1". Dry 3,900 kg is uncited Wikipedia. MVac mass is a placeholder. |
| centaur-iii-tank | hydrolox | 3.05 × 12.68 | 20,830 | 2,052.5 | 9.85 % | pass | ULA Atlas V user's guide 2010: inert 2,243 kg |
| saturn-v-s-ic-tank | kerolox | 10.058 × 42.06 | 2,145,798 | 88,464 | 4.12 % | pass (barely) | NASA SP-4029 (Apollo 11 actuals) + SA-503 flight manual |
| saturn-v-s-ii-tank | hydrolox | 10.058 × 24.84 | 443,235 | 28,265 | 6.38 % | pass | SP-4029. The scan's fuel and oxidizer rows are swapped; the column sum was verified. |
| saturn-v-s-ivb-tank | hydrolox | 6.614 × 18.07 | 107,095 | 9,694 | 9.05 % | pass | SP-4029 |
| atlas-v-ccb-tank | kerolox | 3.81 × 32.46 | 284,089 | 15,574 | 5.48 % | pass | ULA user's guide 2010 |
| sls-core-tank | hydrolox | 8.4 × 64.6 | 987,471 | 83,830 | 8.49 % | pass | NASA core-stage page. The weighed mass of 215,910 lb comes via Wikipedia citing @NASAGroundSys. |
| icps-tank | hydrolox | 5.1 × 13.7 | 28,948 | 3,499 | 12.09 % | pass | NASA ICPS sheet for size. Masses are **uncited Wikipedia**. |
| delta-iv-cbc-tank | hydrolox | 5.0 × 40.8 | 199,640 | 20,074 | 10.06 % | pass | braeunig (secondary); GCAT agrees |
| dcss-5m-tank | hydrolox | 5.0 × 13.7 | 27,200 | 3,189 | 11.72 % | pass | ULA Delta IV user's guide (propellant); braeunig (stage mass) |
| shuttle-et-tank | hydrolox | 8.41 × 46.94 | 725,521 | 26,943 | **3.71 %** | **FAIL** | NASA propulsion fact sheet. No engines. |

Not included as tanks:
- **Shuttle SRB:** solid, and the app has no solid "engine".
- **Delta II stage 2:** no complete hypergolic engine record.
- **Ariane 6 core:** Vulcain 2.1 is incomplete.
- **Super Heavy, Starship, Centaur V, Vulcan booster, New Glenn:** **no published dry mass.**

**Engine-fit rule check:** `floor(0.6·(tankD/engineD)²)`. Diameters are nozzle exit unless noted.

| case | (D/d)² | rule gives | real |
|---|---|---|---|
| F9 S1 3.66 m / Merlin 0.92 m (uncited) | 15.83 | **9** ✓ (any coefficient from 0.569 to 0.632 gives 9) | 9 |
| S-IC 10.058 / F-1 3.531 (NASA) | 8.12 | **4** ✗ | 5 |
| Super Heavy 9.0 / Raptor 1.306 (FAA Appendix G) | 47.5 | **28** ✗ | 33 |
| SLS core 8.4 / RS-25 2.286 | 13.5 | 8 ✓ | 4 |
| Atlas CCB 3.81 / RD-180 3.2 (overall) | 1.42 | **0** ✗ | 1 |
| F9 S2 3.66 / MVac 3.3 | 1.23 | **0** ✗ | 1 |

No single coefficient gives exactly 9 for F9 *and* allows 33 for Super Heavy. Suggested formula: `max(1, floor(c·(D/d)²))`, with c = 0.6 to keep the "3.66 m + Merlin = 9" tuning, or c = 0.70 to allow S-IC and Super Heavy (F9 would then allow 11).

---

## 5. Missions (`data-drafts/missions.json`)

`requiredDeltaV_ms` = surface→LEO including losses + the LEO→target impulsive increment.

**Surface→LEO = 9,400 m/s.** Quoted values range from 8.8 to 10.2 km/s:

| source | value | note |
|---|---|---|
| Wikipedia "Delta-v budget" | "about 9.4 km/s"; table 9.3–10 | both uncited |
| Hirata (Caltech, Wikipedia's ref) | 9.7 km/s | |
| Griffin lecture (Wisconsin 2004) | 9.8–10.2 km/s | |
| **Humble/Henry/Larson Table 2.10** (via Georgia Tech AE4451 notes) | 8.8–9.3 km/s | net of Earth rotation |

Humble/Henry/Larson real-vehicle loss breakdown (m/s):

| vehicle | gravity | drag | steering | Earth rotation (Cape) | total |
|---|---|---|---|---|---|
| Saturn V | 1,534 | 40 | 243 | −348 | 9,267 |
| Shuttle | 1,222 | 107 | 358 | −395 | 9,086 |

| id | Δv (m/s) | derivation (sources in the JSON `source` field) |
|---|---|---|
| leo | 9,400 | see above |
| gto | 11,900 | + 2,500 (Hirata chart, chart-read; only one primary found) |
| moon-transfer | 12,600 | + 3,200 (Wikipedia Gateway table "3.20"; Apollo TLI 3.05–3.25 km/s; Apollo 11 SP-4029 data gives 3,041 by subtraction) |
| lunar-orbit | 13,500 | + 3,200 + 900 (Whitley & Martinez, NASA JSC: "at minimum around 900 m/s") |
| mars-transfer | 13,200 | + 3,800 (Hirata chart, minimum energy). ULA's "typical" 4.3 km/s gives 13,700. |
| earth-escape | 12,600 | + 3,200 (ULA 2010: "a further 3.2 km/sec") |

**Is the 12.5 km/s Moon-transfer figure right?** Yes, within the spread. 9.4 + 3.05–3.25 gives 12.45–12.65, and Saturn V's real 9.267 + 3.20 gives 12.47. The head chat's stub has 9,300 (bottom of the range) + 3,200 = 12,500, which is also defensible. **Pick one and use it everywhere.** We recommend 9,400 / 12,600. The demo works with either; see §6.

Caveat: Wikipedia's "LEO→TLI 3.20" is **not** in the text of the NASA paper it cites. It may be in a figure, or it may be unsourced. Apollo's 3.05–3.25 km/s range is the safer citation.

## 6. Demo scenario check

**(a) The spec's placeholder numbers don't reproduce its own claim.** Stage 1 400 t / 25 t / Isp 290, stage 2 100 t / 6 t / Isp 348, 5 t payload, with the ARCHITECTURE.md formula:
- **Kerolox stage 2:** gives **11,789** m/s, not 11,560.
- **Hydrolox stage 2:** swapping to Isp 450 with 8 t dry gives **13,412**, not 13,080.

The claimed figures match only if about 2 t and 1 t of engine mass are added on top of "dry". So the spec counted engines separately, which is consistent with stage mass = n·m_engine + dry + propellant.

**(b) A real Falcon 9 is already almost a Moon-transfer vehicle in this model.**
- **Build:** 9× merlin-1d on falcon9-s1-tank, plus 1× merlin-1d-vac on falcon9-s2-tank.
- **Result:** with GOES-R (5,192 kg, a real ~5 t payload) it reaches 12,421 m/s at TWR 1.41. That is only **79 m/s short of 12,500** (179 short of 12,600), not ~940.
- **It is also illegal under today's rules:** the S2 tank is under 4 % and MVac fits 0 engines.

**(c) The "swap stage 2 to hydrolox" fix doesn't work with real parts, and it can't be one suggestion.**
- **Every real hydrolox upper stage we sourced lowers Δv** on top of the F9 first stage with 5 t: S-IVB+J-2 12,078; DCSS+RL10B-2 12,196; ICPS 12,207; Centaur III 11,924. They are either heavy or carry only 20–30 t of propellant.
- **It needs two suggestions:** changing propellant means changing engine *and* tank. `Suggestion` allows one change, so this would be two `swap_*` suggestions.

**(d) Recommended demo: legal under the current rules (4 % floor, 0.6 fit), all flown hardware.** It is in `data-drafts/demo-build.candidates.json` and verified by `validate_drafts.py`.

| | build | Moon transfer @12,600 | @12,500 | liftoff TWR | closest rocket |
|---|---|---|---|---|---|
| **red** | 9× Merlin 1D on F9 S1 tank → 1× RL10B-2 on Delta IV 5 m upper-stage tank; payload JWST 6,200 kg | 11,695 m/s → **−905** | −805 | **1.64** | falcon-9 |
| **Grok fix** | `{type: "add_stage", engineId: "rl10c-1", tankId: "centaur-iii-tank"}` | 13,097 → **+497** | +597 | 1.57 | falcon-9 |

Story: "A Falcon 9 booster with a Delta IV upper stage can't throw JWST to the Moon. Add a Centaur kick stage." The three stages flew on real rockets and each upper stage keeps its real engine. Note that TWR is 1.64, not the spec's target of about 1.3. The spec only *requires* at least 1.2. Seven Merlins would bring TWR down, at the cost of a different margin.

**(e) The "real Falcon 9" variant** (needs P2 to adopt a 3 % floor and `max(1, …)`):
- **Red:** real F9 + JWST → mars-transfer: **−1,114**, TWR 1.41.
- **Fix:** `add_stage` Centaur III → **+626**, TWR 1.35. This is the closest match to the spec's −940 / +580.

**(f) Sanity checks** (`validate_drafts.py`):
- **Closest rocket:** the F9-sized build maps to `falcon-9` (closest-rocket test ✓).
- **Real F9 + Crew Dragon to LEO:** +1,119 m/s.
- **Saturn V** (S-IC + S-II + S-IVB tanks and real engines) with an illustrative 45 t payload: 12,683 m/s, TWR 1.18.
- **The model is conservative on stage 0**, because it uses SL Isp for the whole first-stage burn.

**Model gap to flag to P2:** upper-stage TWR is never checked. The optimizer will happily put one RL10 on a huge tank; for example, swapping the S-IVB's J-2 for an RL10B-2 "fixes" a build. Grok could suggest absurd builds unless P2 adds a minimum upper-stage thrust-to-weight check, which needs its own source.

## 7. Physics-rule findings for P2 (the decisions are P2's, not ours)

1. **4 % tank floor:** two real articles fail it. The Shuttle ET, a pure tank, is 3.7 %, and the F9 S2 is 3.2 %. A **3 % floor** admits every real stage sourced so far. If you keep 4 %, drop `falcon9-s2-tank` and `shuttle-et-tank` from the catalog (no kerolox upper stage remains), and use demo §6d.
2. **Engine fit:** use `max(1, floor(c·(D/d)²))`. See §4. *Update 2026-10-17: P2's `maxEngineCount` on main already applies `max(1, …)` with c = 0.6, so MVac on the F9 S2 tank gets 1, and only the 4 % floor still blocks the real Falcon 9.*
3. **Vacuum-only:** J-2 has SL values only from Wikipedia. If they are removed, J-2 becomes vacuum-only, which is historically accurate since it never flew as a first-stage engine.
4. **`diameter_m` semantics:** sources mix nozzle-exit diameter (RS-25, RL10, F-1, J-2, Vulcain 2) and overall diameter (RD-180, RD-191, RS-68A). The fit rule treats both the same.

## 8. Reference rockets

**Core 5 (`data-drafts/reference-rockets.json`, contract shape):**

| id | liftoff mass (kg) | liftoff thrust (kN) | LEO (kg) | stages | caveat |
|---|---|---|---|---|---|
| falcon-9 | 549,054 | 7,607 | 22,800 | 2 | LEO is **expendable** (spacex.com JS bundle). Reusable is about 17,500 per Wikipedia. |
| falcon-heavy | 1,420,788 | 22,819 | 63,800 | 2 | Fully expendable. Stages = core stages only (+2 side boosters). |
| saturn-v | 2,800,000 | 34,500 | 118,000 | 3 | NASA. The record 140 t includes the S-IVB stage itself. |
| starship | 5,500,000 | 80,807 | 100,000 | 2 | Payload is SpaceX's "100+ t" **target**. Mass is GCAT (`?`-flagged); LL2's 5,250 t is propellant only. **No official gross mass.** |
| sls-block-1 | 2,603,000 | 36,786 | 95,000 | 2 | NASA "launch thrust". The famous 39,144 kN (8.8 Mlbf) is *maximum* thrust. |

**Extended 20 (`data-drafts/reference-rockets.extended.json`).** Each record has launches, failures, firstLaunchYear, 1–3 sourced roastFacts and asOf = 2026-10-17. `failures` includes partial failures.

| id | mass (kg) | thrust (kN) | LEO (kg) | stages | launches | failures | first |
|---|---|---|---|---|---|---|---|
| falcon-9 | 549,054 | 7,607 | 22,800 | 2 | 640 | 1 | 2018 |
| falcon-heavy | 1,420,788 | 22,819 | 63,800 | 2 | 14 | 0 | 2018 |
| saturn-v | 2,800,000 | 34,500 | 118,000 | 3 | 13 | 1 | 1967 |
| starship | 5,500,000 | 80,807 | 100,000 | 2 | 14 | 5 | 2023 |
| sls-block-1 | 2,603,000 | 36,786 | 95,000 | 2 | 2 | 0 | 2022 |
| **n1** | 2,750,000 | 45,780 | 95,000 | 5 | **4** | **4** | 1969 |
| space-shuttle | 2,041,166 | 28,580 | 27,500 | 1 | 135 | 2 | 1981 |
| atlas-v-551 | 573,000 | 12,269 | 18,850 | 2 | 23 | 0 | 2006 |
| delta-iv-heavy | 733,000 | 9,411 | 28,370 | 2 | 16 | 1 | 2004 |
| ariane-5-eca | 780,000 | 11,400 | **TODO** | 2 | 84 | 2 | 2002 |
| ariane-64 | 860,000 | 15,000 (low confidence) | 21,600 | 2 | 9 | 1 | 2024 |
| vulcan-vc2s | 663,000 | 9,303 | 19,000 | 2 | 4 | 0 | 2024 |
| new-glenn | 1,050,000 (GCAT `?`) | 17,126 | 45,000 | 2 | 3 | 1 | 2025 |
| soyuz-2-1b | 312,000 | 4,150 | 8,200 | 2 | 88 | 2 | 2006 |
| proton-m | 705,000 | 10,532 | 23,000 | 4 | 116 | 11 | 2001 |
| long-march-5b | 837,000 | 10,565 | 25,000 | 1 | 18 | 1 | 2016 |
| h3-24 | 574,000 | 12,142 | 16,000 | 2 | 9 | 2 | 2023 |
| electron | 13,000 | 224.3 | 300 | 2 | 97 | 4 | 2017 |
| saturn-ib | 589,770 | 7,117 | 20,865 | 2 | 9 | 0 | 1966 |
| energia | 2,400,000 | 35,129 | 100,000 | 1 | 2 | 0 | 1987 |

- **N1 verified:** 4 launches, 4 failures, from LL2, Wikipedia and RussianSpaceWeb ("the N1's catastrophic failures during four test launches on Feb. 21 and July 3, 1969, June 27, 1971, and Nov. 23, 1972").
- **LL2 traps, fixed by hand:**
  - Saturn IB: LL2 says 10 launches / 1 failure, but that "failure" is the Apollo 1 pad fire. The real figure is 9 / 0.
  - Energia 1987: LL2 marks it failed. The rocket worked; the Polyus payload failed.
  - Falcon 9 Block 5: LL2 640 vs Wikipedia 638. SpaceX publishes only the all-version total of 694.
- **Family-wide stats:** for Ariane 6, Vulcan, LM-5 and H3, the specs describe the named variant but the launch stats cover the whole family.

## 9. Historic stages for U3 (`data-drafts/historic-stages.gcat.json`)

**What it is:** 49 stages from 19 programs, curated from GCAT (CC BY 4.0, data update 2026 Oct 16). The column report is in `findings/gcat.md`.

**Programs:** Saturn V/IB, F9 v1.0 and Block 5, Atlas V, Delta IV, Shuttle, SLS, Ariane 5, Soyuz-2.1b, Proton-M, N1, Titan II/IVB, Energiya, LM-5, H-IIA, Electron, Starship.

**Format notes:**
- Stage launch mass is in **tonnes** and dry mass in **kg**.
- GCAT's sea-level thrust column is empty in all 1,626 rows, so stage thrust is vacuum only.
- `0` means unknown.

**Derived Isp = F·t/(m·g0) is unreliable.** 19 of 44 stages are more than 10 % off GCAT's own engine Isp, and 10 are physically impossible: F9 B5 S2 429 s, Energiya core 549 s, Super Heavy 739 s, and the solid boosters. **Use `ispForApp_s`, which is GCAT engine Isp first.** Treat the derived value as a consistency flag only.

**GCAT gotchas:**
- Falcon Heavy maps to the v1.0 (Merlin 1C) stage records.
- LM-5's vehicle thrust has a missing digit (1,180 vs about 11,000 kN).
- The S-II burn time and thrust are placeholders (derived Isp 274 s vs 427 s).
- "N-1" is a different vehicle. The Soviet N1 is "N-1 11A52".

**Hand-checks:** the curated primary-source stages in §4 (S-IC, S-II, S-IVB, Atlas CCB, Centaur, SLS core, ICPS, DCSS, Delta CBC, ET, SRB) double as the "10 hand-checks" the roadmap asks for. GCAT is within a few percent on most of them. S-II is the exception, for the reason above.

## 10. Gaps / TODO(source)

**Engines**
- **Merlin 1D:** primary source for nozzle-exit diameter (0.92 m is uncited Wikipedia) and mass (1,030 lb comes via Mueller on Quora). Current Full Thrust Isp; SpaceX hasn't published it since 2013.
- **Merlin Vacuum:** mass (490 kg is an RO game value) and diameter (3.3 m uncited).
- **Raptor 2 / 3 and their vacuum versions:** vac thrust, SL Isp, RVac mass, Raptor 3 Vac Isp.
- **BE-4:** vac thrust, Isp, mass, diameter. Is the 640,000 lbf SL or vac?
- **Vulcain 2 / 2.1:** SL thrust, Isp. Arianespace manuals return 410; the archived PDFs can't be parsed.
- **BE-3U:** Isp, mass, diameter.
- **Rutherford:** vac thrust, diameter.
- **J-2:** primary SL thrust and SL Isp.
- **F-1:** primary vac thrust and vac Isp (MSFC chart MSFC-9801771, not retrieved).

**Stages**
- **Falcon 9:** primary S1 and S2 dry masses (only uncited Wikipedia).
- **Starship family:** Super Heavy and Starship dry masses; current lengths.
- **Vulcan:** Centaur V dry mass; Vulcan booster dry mass and exact propellant.
- **New Glenn:** everything.
- **ICPS:** NASA/ULA masses.
- **Delta IV:** CBC and DCSS masses from a primary source (now braeunig).
- **SLS core and Ariane 6 core:** do their published "empty" masses include engines?
- **Other:** Saturn IB S-IVB dimensions; Ariane 6 upper stage; Ariane 5 core; residual-propellant fraction.

**Missions**
- Primary source for LEO→TLI 3.20 (Wikipedia's citation doesn't contain it).
- A second source for LEO→GTO 2.5 (only one chart-read primary).
- Ariane 5 loss breakdown.
- SSO / ISS-orbit-specific Δv.

**Payloads**
- GOES-R stowed envelope and which axis is height.
- Crew Dragon *launch* mass (we have mass at undock).
- Perseverance launch mass and aeroshell diameter; Starlink stack; Europa Clipper.
- `nova-c` was carried over from the head chat's stub and **not re-verified here**.

**Rockets**
- Ariane 5 ECA LEO.
- Official Starship gross liftoff mass.
- Falcon Heavy reusable LEO (Wikipedia's figure is tagged citation needed).
- Primary liftoff masses for Atlas V 551, Delta IV Heavy and Vulcan.
- Ariane 64 liftoff thrust (15,000 vs 20,490 kN).
- Electron thrust (Wikipedia 224.3 vs LL2 162 kN; rocketlabcorp.com returned 403).
- NASA source for Shuttle LEO 27,500 kg.
- GCAT cross-check of launch counts.

## 11. Files in `research/data-drafts/`

| file | shape | ships as-is? |
|---|---|---|
| engines.json | `Engine[]` (11) | yes |
| engines.pending.json | `Engine`-like with `null`s and a `_todo` | no; the TODOs must be filled first |
| tanks.json | `Tank[]` (12) | yes. 2 rows fail the 4 % floor (§7). |
| missions.json | `Mission[]` (6) | yes |
| payloads.json | `Payload[]` (5) + extra `source` | yes |
| reference-rockets.json | `ReferenceRocket[]` (5) | yes |
| reference-rockets.extended.json | 20 records + launches, failures, firstLaunchYear, roastFacts, asOf | for contract v2 (U1). `ariane-5-eca.payloadLEO_kg` is `null`. |
| historic-stages.gcat.json | 49 GCAT stages (U3) | for contract v2 |
| field-sources.json | per-field URL, tier and quote for engines; derivation note and dry% for tanks | for SOURCES.md and the validator |
| demo-build.candidates.json | `BuildState` (recommended + real-F9 variant) + `Suggestion` | candidate for `src/data/demo-build.json` (P2 + P4 decision) |

Rebuild and check with:
```
cd research
python3 -I validate_drafts.py data-drafts
python3 -I build_drafts.py findings data-drafts
```

## 12. Process notes

- **No commits, no pushes, no edits in `SpaxeX/`.** The repo was read from a read-only clone, and the head chat's local p4 stubs were only read.
- **Personal data:** one research subagent briefly sent the user's email address in the User-Agent header of a batch of Wikipedia raw-wikitext requests, then switched to a generic User-Agent. No other personal data was sent anywhere.
- **Raw downloads:** PDFs, the GCAT TSVs and the LL2 snapshot are in the session scratchpad, not in `research/`. They are not needed to use the drafts, and every value cites its URL.
