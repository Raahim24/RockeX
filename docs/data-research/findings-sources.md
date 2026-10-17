# Rocket Configurator: open data source survey (with licenses)

Checked 2026-10-17 (about 19:00–19:40 UTC). Everything below was fetched during this session unless it is marked **UNVERIFIED**. Raw downloads are in `/private/tmp/claude-501/-Users-bhumishdayal-Desktop-Harvard-Space/a67f1169-0a3d-4bc9-8c15-8deda7d16544/scratchpad/downloads/`.

Copyright background: US law does not protect facts themselves, such as "Merlin 1D thrust = 845 kN". It can protect a creative selection or arrangement of facts and any prose. The EU also has a separate database right. So taking individual numbers and citing them is low risk. Bulk-copying a whole table, or copying page text, means following that source's license or terms. This is general background, not legal advice.

---

## 1. Comparison table

| # | Source | URL | License / terms | Format / access | Fields covered | Reliability | Scrape difficulty |
|---|---|---|---|---|---|---|---|
| 1 | r/SpaceX API | github.com/r-spacex/SpaceX-API, api.spacexdata.com/v4/rockets | Code: Apache-2.0. The data itself has no separate license. | REST JSON, no auth for GET. **The live API returned HTTP 522 (down) at check time.** | Engine thrust SL/vac, Isp SL/vac, engine count, engine T/W; stage thrust, propellant mass ("fuel_amount_tons"), burn time; rocket mass, height, diameter, stages, LEO/GTO/Mars payload, first flight, success %. **No stage dry mass, no engine mass.** Only 4 rockets: F1, F9, FH, Starship. | Secondary and **stale**. The repo is archived, its last commit was 2022-09-19, and its Starship data is wrong (first_flight 2021-12-01, success 0%). | Easy if the API were up. In practice, use the Wayback copy or the repo's docs JSON. |
| 2 | GCAT (J. McDowell) | planet4589.org/space/gcat/ | **CC-BY-4.0** ("Licence: CC-BY-4.0") | Static TSV and fixed-width text plus a tables.tar.gz; no auth | **engines.tsv**: thrust (one "typical" value), Isp ("vacuum where available"), solid motor loaded mass, burn time, chambers, first-flight date. **stages.tsv**: length, diameter, full mass (t), dry mass (kg), vac thrust, SL thrust, burn time, engine name and count. **lv.tsv**: length, diameter, launch mass (t), LEO and GTO capacity, liftoff thrust, min/max stage. **lvs.tsv**: stage stack per LV. **launch.tsv**: every launch with a success/failure code, from which launch counts, failures and first launch can be derived. | Expert secondary source, updated daily ("Data Update 2026 Oct 16"). The author warns the values are "approximate". Has `?` uncertainty flags. **No liquid-engine dry mass.** | Easy (tab-separated, `#` comment header rows) |
| 3 | Launch Library 2 (The Space Devs) | ll.thespacedevs.com/2.3.0/ | TSD Terms of use: free to use; "refrain from forwarding it without adding value"; attribution "not mandatory, but is encouraged". The OpenAPI file says "Apache License 2.0". | REST JSON (OpenAPI at /2.3.0/json). **15 requests/hour** without auth. lldev.thespacedevs.com has stale data and no rate limit. | `launcher_configurations`: length, diameter, launch_mass (t), to_thrust (kN), leo/gto/geo/sso capacity, min/max stage, maiden_flight, total_launch_count, successful/failed/pending launches, landings, cost. **No engine or stage propellant data.** | Secondary, curated by hand, kept current (F9 Block 5: 640 launches). | Easy (paginated JSON), but plan around the 15/h limit. |
| 4 | Wikidata | query.wikidata.org/sparql | Structured data **CC0** | SPARQL and REST; no auth; aggressive 429 rate limiting from shared IPs | P2228 max thrust (with P1013 "sea level"/"vacuum" qualifiers), P10107 specific impulse, P2067 mass, P2386 diameter, P2048 height, P4519 payload mass | Coverage is **sparse** (only 298 items have any P2228 and 78 have any P10107). RS-25 is well populated; Merlin, Raptor, RL-10 and BE-4 are mostly empty. | Medium (SPARQL plus rate limits plus inconsistent modelling) |
| 5 | NASA NTRS and NASA pages | ntrs.nasa.gov, nasa.gov | US Gov works "not protected by copyright in the U.S. (17 U.S.C. §105)". Contractor and third-party works are excluded. NASA insignia is not public domain. | NTRS JSON search API (`/api/citations/search`), PDFs | Primary engine and stage data for NASA-heritage hardware (RS-25, J-2, F-1, RL10, Saturn, Shuttle, SLS), SP-8xxx design monographs | Primary or authoritative, but often historical | Hard (PDF extraction); the search API is easy |
| 6 | Manufacturer pages | spacex.com, l3harris.com, blueorigin.com, ariane.group | © the manufacturer; facts usable with citation | HTML or JS-rendered | Varies; see §6 | Primary but selective and marketing-rounded. Isp and mass are often missing. | Medium to hard (JS apps, 404s, bot blocking) |
| 7 | Norbert Brügge "Spacerockets" | b14643.eu (old b14643.de **now a casino spam domain**); GitHub fjmoeller/b14643 | **No license file** (GitHub license = null). No copyright notice found on the pages checked, so default all-rights-reserved applies. | Static HTML tables | Engine thrust SL/vac, Isp SL/vac, chamber pressure, area ratio, mixture ratio, mass flow; stage data | Secondary, detailed; the US engines page says "last update: 12.03.2023". RO configs cite it. | Medium (messy HTML tables) |
| 8 | Ed Kyle Space Launch Report | spacelaunchreport.com | **Domain is now a gambling spam site.** No copyright or license text found in the last real Wayback capture. | Wayback only | Launch logs and reliability statistics, LV data sheets | **Discontinued March 2022** ("Updates will cease at the end of March") | Hard (Wayback only) |
| 9 | Encyclopedia Astronautica (Mark Wade) | astronautix.com | "© 1997-2019 Mark Wade". "Written material on this site, except for 'fair use' excerpts in reviews or articles, may not be reproduced." | HTML | Engine thrust, gross mass, Isp vac/SL, burn time, chamber pressure; vehicle data | Secondary, **stale** (© ends 2019). Its Merlin 1D entry is the 2013-era 716 kN version. | Medium |
| 10 | Realism Overhaul (KSP-RO) | github.com/KSP-RO/RealismOverhaul | README and RO_Readme: **"CC-BY-SA"**, **version not stated**. No LICENSE file (GitHub license = null). ROEngines: **CC BY-NC-ND 4.0**. RealFuels: "CC-BY-SA" (no version). | Text .cfg files (ModuleManager syntax) on GitHub | Per-engine dry mass, vac thrust, Isp vac/SL (an atmosphereCurve), chamber pressure, mixture ratio, area ratio, burn time, ignitions, throttle; in-file source citations | Tertiary (game balance, but with cited real sources). Active (pushed 2026-10-16). Some values are flagged "???" or "calculated with RPA". | Medium (custom cfg syntax) |
| 11a | Wikipedia "Comparison of orbital rocket engines" | en.wikipedia.org/wiki/Comparison_of_orbital_rocket_engines | **CC BY-SA 4.0** (page footer) | HTML/Parsoid tables (REST API) | Isp (vac and SL), thrust (vac and SL, in N), chamber pressure, engine mass, T/W, O/F, cycle, status | Tertiary; edited 2026-09-26. Mixed variants; some cells are blank or "goal". | Medium (cells mix vac and SL values in one string) |
| 11b | Wikipedia "Comparison of orbital launch systems" | en.wikipedia.org/wiki/Comparison_of_orbital_launch_systems | **CC BY-SA 4.0** | HTML tables | Height, payload to LEO/GTO/other, orbital launch count (including failures), first and latest flight dates | Tertiary; edited 2026-10-17 | Medium |
| 11c | Kaggle datasets | see §11 | Mostly CC0 as labelled, but built from scraped sources | CSV | LV characteristics and launch lists | Low (derived from scrapes) | Easy (the Kaggle API needs a free token to download) |
| 12a | Gunter's Space Page | space.skyrocket.de | Page footer: "Gunter Dirk Krebs 1996-2026"; "AI Usage Notice: This page may not be used for training or improving machine learning models…" | HTML | LV, stage and engine data | Secondary, current ("Last update: 04.04.2026") | Medium; the terms discourage automated use |
| 12b | Braeunig "Rocket & Space Technology" | braeunig.us/space/ | No copyright notice or license found on index_top.htm, specs pages or delta.htm, so default copyright applies | HTML (frames) | LV and stage specs for older vehicles; propellant and propulsion tutorials | **Stale**: last changelog entry November 2017. No Falcon or modern vehicles. | Medium |
| 12c | loggger101/spacecost (GitHub) | github.com/loggger101/spacecost | MIT | Python package and CSV | LV $/kg, payload, propellants, delta-v tables (each row cited) | Very new (created 2026-09-07), 1 star; not checked in depth | Easy |

---

## 2. Per-source notes

### 1. r-spacex/SpaceX-API
- **Repo metadata** (`gh api repos/r-spacex/SpaceX-API`): `archived: true`, `license: Apache-2.0`, `pushed_at: 2024-08-17`. The latest commit is **2022-09-19**, "parser fix for upcoming launches".
- **License**: LICENSE begins "Apache License Version 2.0, January 2004". It covers the code. The README has no separate data license. Disclaimer: "We are not affiliated, associated, authorized, endorsed by, or in any way officially connected with Space Exploration Technologies Corp (SpaceX)…"
- **Live status**: three calls to `https://api.spacexdata.com/v4/rockets`, `/v5/launches/latest` and `/v4/rockets/:id` all returned **HTTP 522** from Cloudflare (origin unreachable). `backups.spacexdata.com` also returned 522. The Wayback CDX for `api.spacexdata.com/v4/rockets` shows the **last HTTP 200 on 2026-02-06**, followed by HTTP 525 errors from 2026-06-14 onward. In practice the live API is dead.
- **Auth and rate limits**: per docs/README.md, auth is needed only for destructive routes (`spacex-key` header). Caching is "**dragons**, **rockets** - 24 hours". Rate limit: **UNVERIFIED** (no rate-limit code in app.js or middleware/; none documented).
- **Sample** (Wayback capture `http://web.archive.org/web/20260206123459id_/https://api.spacexdata.com/v4/rockets`):
  - Falcon 9: engines `{"isp":{"sea_level":288,"vacuum":312},"thrust_sea_level":{"kN":845},"thrust_vacuum":{"kN":914},"number":9,"type":"merlin","version":"1D+","thrust_to_weight":180.1}`; first_stage `{thrust_sea_level 7607 kN, thrust_vacuum 8227 kN, fuel_amount_tons 385, burn_time_sec 162}`; second_stage `{thrust 934 kN, fuel_amount_tons 90, burn_time_sec 397}`; mass 549,054 kg, height 70 m, diameter 3.7 m; payload LEO 22,800 / GTO 8,300 / Mars 4,020 kg; first_flight 2010-06-04; success_rate_pct 98.
  - Falcon Heavy: 27 Merlins, mass 1,420,788 kg, LEO 63,800 kg.
  - Starship: Raptor isp 330/380, 37 engines, first_flight "2021-12-01", active false, success 0. **This is stale or wrong.**
  - **Staleness check**: the second-stage thrust (934 kN) does not match SpaceX's current website value of 981 kN (§6). There is no Merlin engine mass field and no stage dry mass field.
- Field schema verified in `models/rockets.js` and `docs/rockets/v4/one.md`.

### 2. GCAT (Jonathan McDowell)
- **License** (https://planet4589.org/space/gcat/): "GCAT is released under the Creative Commons CC-BY licence. You are free to use the data in GCAT as long as you include a citation to it. A suitable short citation is 'data from GCAT (J. McDowell, planet4589.org/space/gcat)'." Further down: "COPYRIGHT NOTICE (c) 2020-2026 Jonathan McDowell **Licence: CC-BY-4.0** Creative Commons/Attribution This data may be freely reproduced as long as you cite it." It links to https://creativecommons.org/licenses/by/4.0. **So the license is CC BY 4.0. Commercial use is allowed with attribution.**
- **Version**: "GCAT Release 1.8.8 (2026 Sep 3) | Data Update 2026 Oct 16". The TSV headers say "# Updated 2026 Oct 16 2334:11".
- **The URLs from the request are wrong**: `/space/gcat/tables.html`, `/data.html` and `/lvs.html` all return 404. The correct URLs are:
  - Docs: https://planet4589.org/space/gcat/web/lvs/index.html and the column pages `web/lvs/{engines,stages,lv,lvstages,family}/index.html`
  - Data: `https://planet4589.org/space/gcat/tsv/tables/{engines,stages,lv,lvs,family,orgs,refs}.tsv`, also as `data/tables/*.html` (fixed width) and `data/tables.tar.gz`
  - Launch list: `https://planet4589.org/space/gcat/tsv/launch/launch.tsv` (13.8 MB)
- **Column units** (from the column-description pages):
  - Engines: "Mass, kg, loaded (solids only); Total impulse, kNs; Typical thrust (kN); Typical Isp (s), (vacuum Isp where available); Typical burn duration (s); Number of engine chambers; Date of first flight".
  - Stages: "Length (m) Diameter (m) Full mass (tonne) Dry mass (kg) Typical thrust (vacuum) (kN) Typical sea level thrust (kN) Typical burn duration (s) Main engine name Main engine multiplicity".
  - LV: "Length (metres)… Diameter (metres) Launch mass, (tonnes) LEO payload capacity in kg, approximate… GTO… Launch thrust, kN".
- **Caveat** (LV page): "these approximate values are intended to give a general idea of the differences between variants - but the data is not necessarily the most accurate available and parameters given in other sources may be more reliable." Each numeric column has a flag column; `?` means uncertain.
- **Counts**: engines.tsv has 1,488 data rows; thrust is populated in 1,200, Isp in 745 and Mass in 907 (mass is loaded mass for solids only). stages.tsv has about 1,625 rows, lv.tsv about 1,836 and lvs.tsv about 4,744.
- **Sample engine rows** (thrust kN / Isp s / burn s):
  - Merlin 1D-5: 845 / 304.8 / 169
  - Merlin 1D-Vac: 801 / 345 / 372
  - RS-25: 2100 / 452.5 / 516
  - RL10C-1-1A: 106.0 / 449.7
  - RL10B-2: 110.1 / 465.5
  - BE-4: 2447 / –; BE-4 V2: 2846 / –
  - Raptor 3 SL: 2450 / –
  - Vulcain 2.1: 1324 / 434
  - RD-180: 4152 / 337.8
- **Sample stage rows**:
  - `Falcon 9 St 1/1D-5`: 43.5 m, 3.65 m, 390.0 t full (`?`), 18,000 kg dry (`?`), 6,770 kN vac, SL "-", 180 s, Merlin 1D-5 ×9
  - `Falcon 9 St 2/1D-5`: 12.6 m, 75.7 t full, 4,900 kg dry, 801 kN, 372 s, Merlin 1D-Vac ×1
  - Others: `SLS CS`, `Super Heavy V3`, `Centaur V`, `Ariane 6 LLPM`, and so on
  - Note: the stage thrust (6,770) does not equal 9 × the engine thrust (845). The values are approximate, so check consistency.
- **Sample LV rows** (`Falcon 9`, variant FT4): 71.0 m, 3.65 m, 480.0 t, LEO 22,800, GTO 8,300, TO thrust 5,886 kN.
- **Launch counts**: computed from launch.tsv with LV_Type == "Falcon 9": LaunchCode prefixes `OS` 682, `DS` 11, `OF` 2, `OE` 1, `AS` 1; first launch "2010 Jun 4". Success scoring is explained at https://planet4589.org/space/gcat/web/intro/success.html.
- **Not covered**: engine diameter, liquid-engine dry mass, separate SL and vac Isp.

### 3. Launch Library 2 / The Space Devs
- **Current version**: 2.3.0. The OpenAPI file (https://ll.thespacedevs.com/2.3.0/json) marks 2.0.0, 2.1.0 and 2.2.0 "Unsupported" and 2.3.0 "Supported… Recommended for all production integrations"; 2.4.0 is "Unreleased".
- **Endpoint**: `https://ll.thespacedevs.com/2.3.0/launcher_configurations/?search=Falcon%209&mode=detailed` returned 200. Note that `/launchers/` lists individual boosters (serial numbers, flights, landings), not vehicle types.
- **Fields** (verified on F9 Block 5, id 164): `length 70.0`, `diameter 3.65`, `launch_mass 549.0`, `to_thrust 7607.0`, `leo_capacity 22800.0`, `gto_capacity 8300.0`, `geo_capacity null`, `sso_capacity null`, `min_stage 2`, `max_stage 2`, `maiden_flight "2018-05-11"`, `total_launch_count 640`, `successful_launches 639`, `failed_launches 1`, `pending_launches 119`, `consecutive_successful_launches 342`, `attempted_landings 630`, `successful_landings 625`, `launch_cost 52000000`, `reusable true`, `apogee 200.0`.
- **Units** (OpenAPI titles): length "Length (m)", diameter "Max Diameter (m)", launch_mass "Mass at Launch (T)", to_thrust "Thrust at Liftoff (kN)", leo_capacity "LEO Capacity (kg)".
- **No engine, Isp, or stage propellant or dry-mass data.**
- **Rate limits** (OpenAPI description): "While this API is **free to use**, it is subject to **rate limiting** (15 calls per hour) for non-authenticated requests. → Please use https://lldev.thespacedevs.com for development testing. The development endpoint has stale and limited data but is not subject to any rate limits." The `/2.3.0/api-throttle/` endpoint returned `{"your_request_limit":15,"limit_frequency_secs":3600,...}`. On lldev it also reports 15/3600, but the docs say lldev is not limited. Higher limits come through Patreon API keys. Also confirmed at https://thespacedevs.com/llapi: "all the API data is available at no cost for up to 15 non-authenticated requests per hour".
- **License/ToS**: the OpenAPI `info.license` is `{"name": "Apache License 2.0"}`. The TSD FAQ (https://github.com/TheSpaceDevs/Tutorials/blob/main/faqs/faq_TSD.md#terms-of-use) says: "By using any service provided by The Space Devs, you agree to the following terms… You are free to use the data in any way, shape, or form, and share what you create with it. Please refrain from forwarding it without adding value. Due to the large amount of manual labor involved, we cannot however guarantee a 100% accuracy… Attribution is not mandatory, but is encouraged and appreciated." So redistribution is allowed but bulk mirroring "without adding value" is discouraged.
- Images carry their own per-image licenses (for example "Rocket Lab Image Use Policy"). Do not assume those images are free to reuse.

### 4. Wikidata
- **License** (https://www.wikidata.org/wiki/Wikidata:Licensing, via WebFetch): "All structured data … is released into the public domain under Creative Commons Zero." Text in other namespaces is CC BY-SA 4.0.
- **Properties** (verified via `wbgetentities`):
  - **P2228** = "maximum thrust" (quantity)
  - **P2230 = "torque"**: NOT Isp. Your guess was wrong.
  - **Specific impulse is P10107**, "specific impulse by weight"
  - **P2067** mass, **P2386** diameter, **P2043** length, **P2048** height, **P4519** payload mass
  - Thrust and Isp statements use the qualifier **P1013 "criterion used"** = "sea level" or "vacuum" (verified on RS-25).
  - No properties were found for launch mass, number of stages, dry mass, propellant mass or delta-v. Those searches returned nothing or were rate-limited, so absence is not fully verified.
- **Coverage check** (SPARQL, 2026-10-17):
  - Only **298** items have any P2228 and **78** have any P10107.
  - RS-25 (Q1030042): thrust 1860 kN (sea level) and 2279 kN (vacuum), Isp 366 (SL) and 452 (vac), mass 3526.7 kg, diameter 2.44.
  - Merlin 1D (Q19923939): mass 470 kg only; no thrust or Isp.
  - Merlin 1D Vacuum (Q18646644): mass 470 only (likely copied).
  - Merlin family (Q76148), Raptor (Q4135025), Vulcain (Q44532, Q9369180) and Vulcain 2 (Q65276603): no values.
  - RL-10 (Q967724): no values. The label "BE-4" resolves to a disambiguation page (Q27796003).
  - RD-180 (Q731319): mass 5480, diameter 3.15, no thrust.
  - Falcon 9 (Q249091): only height 70 and diameter 3.7 among P2067, P4519, P2386, P2048 and P2228.
- **Rate limiting**: WDQS and the wbsearch API returned HTTP 429 repeatedly from this network (shared IP); it took up to 4 retries with backoff. Policy: https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits (linked in the 429 body).
- Verdict: CC0 is ideal, but the data is too sparse to be a primary source. Use it only as a cross-check or for IDs.

### 5. NASA NTRS and NASA fact sheets
- **NASA media guidelines** (https://www.nasa.gov/nasa-brand-center/images-and-media/, via WebFetch): NASA material "generally are not subject to copyright in the United States"; "NASA should be acknowledged as the source of the material"; third-party material: "NASA's use does not convey any rights to others to use the same material"; "The NASA Insignia, Logotype, identifiers, and imagery are not in the public domain"; commercial use "must not explicitly or implicitly convey NASA's endorsement".
- **NASA STI disclaimers** (https://sti.nasa.gov/disclaimers/, linked from NTRS): "Generally, United States government works … are not protected by copyright in the U.S. (17 U.S.C. §105) and may be used without obtaining permission from NASA." Also: "not all materials … are U.S. government works… contractors and grantees are not considered Government employees; generally, they hold copyright to works they produce for the Government."
- **NTRS API**: `https://ntrs.nasa.gov/api/citations/search?q=...` returns JSON with no auth. A query for "liquid rocket engine specific impulse" returned 84 results. Each record has a `copyright.determinationType` field (for example `GOV_PUBLIC_USE_PERMITTED`, `PUBLIC_USE_PERMITTED`), `distribution: PUBLIC` and PDF links under `downloads[].links.pdf`. The OpenAPI endpoint `/api/openapi/` returned 200. Rate limits: **UNVERIFIED**.
- **SP-8xxx monographs**: for example NASA SP-8107 "Turbopump systems for liquid rocket engines" (NTRS 19750012398), `GOV_PUBLIC_USE_PERMITTED`, PDF at `/api/citations/19750012398/downloads/19750012398.pdf`.
- **NASA RS-25 reference page** (https://www.nasa.gov/reference/space-launch-system-rs-25-core-stage-engine/): fetched. The text found says "over two million lbs. of vacuum thrust" for four engines. The per-engine figures "512,300 lbs vacuum / 416,300 lbs sea level / 3.49 t" came from a search snippet and were **not found in the fetched HTML, so they are UNVERIFIED**.
- Coverage: primary data for NASA hardware (RS-25, J-2, F-1, H-1, RL10 history, Saturn and Shuttle stages). Commercial engines are not covered.

### 6. Manufacturer pages
- **SpaceX** (https://www.spacex.com/vehicles/falcon-9/): an Angular app; the HTML has no data. Values are hard-coded in JS chunk `https://www.spacex.com/2343.25ddd7bb77e7b318.js` (the chunk hash will change):
  - Height "70 m", Diameter "3.7 m", Mass "549,054 kg"
  - Payload to LEO "22,800 kg", GTO "8,300 kg", Mars "4,020 kg"
  - First stage: Number of engines "9", Thrust at sea level "7,607 kN / 1,710,000 lbs", Thrust in vacuum "8,227 kN"
  - Second stage: "1 vacuum" engine, Burn time "397 sec", Thrust "981 kN / 220,500 lbf"
  - Merlin: Propellant "LOX / RP-1", Thrust "845 kN / 190,000 lbf"; Merlin Vacuum: Thrust "981 kN / 220,500 lbf"
  - **No Isp, no engine mass, no propellant or dry mass.**
  - Live launch stats JSON: `https://content.spacex.com/api/spacex-website/falcon-nine-stats` returned `{"totalLaunches":694,"totalLandings":647,"totalReflights":613}`. Copyright footer text: **UNVERIFIED** (JS-rendered).
- **L3Harris RS-25** (https://www.l3harris.com/all-capabilities/rs-25-engine, curl and WebFetch): "Mixture Ratio (O/F): 6.0 Thrust (109% Power Level) Vacuum: 512,300 lb. Sea Level: 418,000 lb. Chamber Pressure: 2,994 psia Specific Impulse (109% Power Level) Vacuum: 452 sec. Sea Level: 366 sec. Dimensions Length: 168 in. Diameter: 96 in. Weight: 7,775 lb. Area Ratio: 69:1". Footer: "© 2026 L3Harris Technologies, Inc."
- **L3Harris RL10**: `https://www.l3harris.com/all-capabilities/rl10-engine` and both spec-sheet PDFs (`/sites/default/files/2024-07/l3harris-ar-rl10-spec-sheet.pdf`, `/2024-01/AJRD-LHX_RL10_SpecSheet_...pdf`) now return **404**, and there is no Wayback snapshot. The RL10 numbers from a search snippet (RL10B-2 24,750 lbf / 465.5 s; RL10C-1 22,890 lbf / 449.7 s) are **UNVERIFIED** from the manufacturer.
- **Blue Origin BE-4**: blueorigin.com returned **HTTP 429** to both curl and WebFetch (bot protection). The figure "550,000 lbf" is **UNVERIFIED** from the primary site (search snippet only).
- **ArianeGroup Vulcain 2.1** (https://www.ariane.group/en/news/video-chaud-chaud-test-du-moteur-vulcain2-1-destine-au-premier-vol-dariane-6/): "This cryogenic engine delivers 135 metric tons of thrust in a vacuum." Footer "© Arianegroup 2026". No Isp or mass on the page. No dedicated spec page was found.
- Takeaway: manufacturers give thrust (often rounded) but rarely Isp or mass. They are a good primary check for thrust and LV-level numbers only.

### 7. Norbert Brügge (b14643 / "spacerockets")
- **The old domain is gone**: `http://www.b14643.de/...` redirects to `https://b14643.com/`, a German online-casino page ("Beste Online Casinos…"). `www.spacerockets.de` fails TLS (the certificate is for r27.hallo.cloud).
- **Live mirror**: http://b14643.eu/ says "Attention: This website is now open source! Help us maintain it on Github Norbert Brügge, Germany". It links to https://github.com/fjmoeller/b14643, whose README says: "As Norbert didn't want to continue the website anymore, it is now with his permission available Open Source!"
- **License**: GitHub `license: null`; the repo contents are `.github .gitignore CNAME README.md b14643`, with no LICENSE file. No copyright notice was found on the index, Spacerockets index or US engines page. **Treat it as all rights reserved.** "Open source" was announced, but no license was granted.
- **Sample** (http://b14643.eu/Spacerockets/Specials/U.S._Rocket_engines/engines.htm, "last update: 12.03.2023"):
  - Merlin-1D+ row (per 9-engine cluster): thrust SL 7,606.6 kN, Isp SL 288.5 s, thrust vac 8,226.6 kN, Isp vac 312 s, chamber pressure 10.8 MPa, O/F 2.36
  - Merlin-1DV+: 934.1 kN vac, Isp 348
  - SSME (P1): SL 1,668.1 kN / 363.2 s, vac 2,090.7 kN / 455.2 s
- RO configs cite this site as a source (§10).

### 8. Ed Kyle Space Launch Report
- spacelaunchreport.com now serves Indonesian slot-gambling spam. Wayback captures were spam from 2022-05-16 onward.
- The last real capture (http://web.archive.org/web/20220406013704/https://www.spacelaunchreport.com/) says: "Updates will cease at the end of March. The pages will likely dissappear a few days later. I started Space Launch Report in 1998 to track launch vehicle reliability…" and is signed "Ed Kyle, March 20, 2022".
- License or copyright statement: none found on the archived home page, so **UNVERIFIED** and default copyright applies.
- Not usable as a live source. Historical reliability stats are available through Wayback only.

### 9. Encyclopedia Astronautica (astronautix.com)
- Footer: "© 1997-2019 Mark Wade - Contact © / Conditions for Use".
- Conditions (http://www.astronautix.com/c/conditionsolfromthissite.html): images credited to Mark Wade may be reused with credit and a link. "**Written material on this site, except for 'fair use' excerpts in reviews or articles, may not be reproduced.**" "All other images used on the site are believed to be in the public domain. However no warranty is made…"
- **Sample** (http://www.astronautix.com/m/merlin1d.html): "Thrust : 716.00 kN (160,963 lbf). Gross mass : 490 kg. Specific impulse : 311 s. Specific impulse sea level : 282 s. Burn time : 180 s… Chamber Pressure: 96 bar. Area Ratio: 16. Thrust to Weight Ratio: 150." These are **v1.1-era values (stale)**, while the current Merlin is 845 kN.
- Reliability: a well-known secondary source, good for historical and Soviet hardware. Not maintained since about 2019; it mixes paper projects with flown hardware. The Kaggle "Launch Vehicle Characteristics" dataset was built partly from it (§11).

### 10. Realism Overhaul (KSP-RO)
- **RealismOverhaul** (https://github.com/KSP-RO/RealismOverhaul): GitHub `license: null` with no LICENSE file. README.md line 16: "**License: CC-BY-SA**". GameData/RealismOverhaul/RO_Readme.txt: "License CC BY-SA". RealismOverhaul.netkan: `license: CC-BY-SA`. **The version is not stated anywhere checked**, so it is UNVERIFIED (CKAN's "CC-BY-SA" is ambiguous). ShareAlike means a derived dataset must carry the same license. Last push 2026-10-16.
- **ROEngines** (https://github.com/KSP-RO/ROEngines/blob/master/LICENSE.md): "This work is licensed under **CC BY-NC-ND 4.0**". Non-commercial, no derivatives. Do not extract data from it into a redistributed dataset.
- **RealFuels** (https://github.com/KSP-RO/RealFuels): NetKAN `license: CC-BY-SA`; Readme_RF.txt: "License remains CC-BY-SA as modified by ialdabaoth." No version given.
- **Sample: `GameData/RealismOverhaul/Engine_Configs/Merlin1_Config.cfg`** (last commit 2024-09-15):
  - Header for "Merlin 1D++ / Falcon 9 Block 5": "Dry Mass: 470 Kg; Thrust (SL): ??? kN; Thrust (Vac): 914.22 kN; ISP: 282 SL / 311 Vac; Chamber Pressure: 10.8 MPa; Prop Ratio: 2.36; Throttle: 100% to 39%; Nozzle Ratio: 21.4".
  - Config block `name = Merlin1D++`, `maxThrust = 914.12 // [3]`, `atmosphereCurve key = 0 311 / key = 1 288.5`, with the comment `// FIXME: M1D+ Isp is not same as M1D, exact spec difficult to pin down.`
  - Merlin1DVac+: `maxThrust = 934.12 // [2]`, Isp 348 vac, 227 SL ("SL calculated with RPA").
  - Sources listed in the file: "[1] http://spaceflight101.com/spacerockets/falcon-9-v1-1-f9r/ [2] http://www.spacex.com/falcon9 (2015-09-21) [3] http://www.spacex.com/falcon9 (2016-05-14) [4] quora.com … [5] twitter.com/elonmusk/status/728753234811060224 … [8] youtube … (eyeballed burn times) [9] http://www.b14643.de/Spacerockets/Specials/U.S._Rocket_engines/engines.htm".
- **Sample: `SSME_Config.cfg`**:
  - Block II: "Dry Mass: 3753 Kg; Thrust (Vac): 2319.9 kN; ISP: 366.3 SL / 452.3 Vac"
  - Phase I: 2090 kN vac, 363.2 / 455.2
  - Sources: "[1] web.archive.org/…/pwr_SSME.pdf [2] alternatewars.com … [3][4] b14643.de … [5] History of Liquid Propellant Rocket Engines, George P. Sutton [6] NASA-CR3321 [7] doi:10.2514/6.1978-976". Note: "Using source [4] as master reference".
- Verdict: the cited per-engine data is rich (dry mass and an SL/vac Isp curve), but quality varies and the license (CC-BY-SA, unversioned) is ShareAlike. Use it as a cross-check, or copy individual facts with citations.

### 11. Kaggle and GitHub datasets
Found via the Kaggle public API, `https://www.kaggle.com/api/v1/datasets/list?search=...` (no auth for listing):

| Dataset | License (Kaggle label) | Updated | Notes |
|---|---|---|---|
| williecosta/launch-vehicle-characteristics (`lv.csv`) | CC0 | 2023-01-30 | "engineering properties of over 400 launch vehicles… sourced from… Encyclopedia Astronautica, Spaceflight Now, and… Wikipedia". **The CC0 label conflicts with Astronautix's no-reproduction terms.** |
| akhilram7/allrocketsfrom1957 (`all-rockets-from-1957.csv`) | Unknown | 2020-08-25 | "scraped from https://nextspaceflight.com… data is solely belongs to https://nextspaceflight.com" |
| maccaroo/rocket-launch-industry (Companies, Configs, Families, Launches, Missions, Locations CSVs) | CC0 | 2022-02-20 | "majority… scraped from https://nextspaceflight.com/"; "heavily edited (maybe dodgy)" |
| sergionefedov/space-missions-and-7500-launches-1957-2024 | Apache 2.0 | 2026-04-10 | Launch list; contents not checked |
| scoleman/spacex-launch-data, heyrobin/space-x-launches-falcon9-and-falcon-heavy | CC BY-SA 3.0 | 2018 / 2023 | SpaceX launch lists (Wikipedia-derived, judging by the license) |
| niladriroy0/performance-limits-in-rocket-propulsion-systems | CC0 | 2025-12-27 | "**synthetic** rocket propulsion configurations": not real engines, do not use |

- No Kaggle dataset dedicated to real rocket-engine specs was found. Column lists were not returned by the unauthenticated API, so exact columns are UNVERIFIED.
- GitHub repository search ("rocket engines dataset", "rocket engine database", "launch vehicle dataset", "rocket engines csv") found no maintained open engine dataset. Results were mostly ML telemetry or test-stand projects. The marginal hits are loggger101/spacecost (MIT; cited LV, propellant and delta-v tables; created 2026-09-07) and the-beating-light-of-the-nail/OrbitAtlas-public (NOASSERTION; "Phase 0", no real data).
- **Wikipedia tables** (footer: "Text is available under the Creative Commons Attribution-ShareAlike 4.0 License; additional terms may apply"):
  - *Comparison of orbital rocket engines* (modified 2026-09-26). Headers: Engine, Origin, Designer, Vehicle, Status, Use, Propellant, Power cycle, Specific impulse (s), Thrust (N), Chamber pressure (bar), Mass (kg), Thrust:weight ratio, Oxidizer:fuel ratio. Sample rows:
    - Merlin 1D FT: Isp "311", thrust "914,000 845,000 (SL)", 108.0 bar, 470 kg, T/W 194.5
    - RS-25: "452.3 366 (SL)", "2,279,000 1,860,000 (SL)", 3,526 kg
    - BE-4: 340, 2,846,900, 138 bar, mass blank
    - Raptor: "350 327 (SL)", "2,750,000 (SL)", 1,525 kg
    - RL10C-1: 450, 101,820 N, 191 kg
    - Vulcain 2.1: Isp blank, 1,324,000 N, 2,000 kg
    - Vacuum and SL values are packed into one cell and need parsing.
  - *Comparison of orbital launch systems* (modified 2026-10-17). Headers: Vehicle, Origin, Manufacturer, Height, Maximum payload mass (kg) [LEO, GTO, Other], Reusable/Expendable, Orbital launches including failures, Launch site(s), Dates of flight [First, Latest].
  - Fetch with `https://en.wikipedia.org/api/rest_v1/page/html/<Title>`. Using it requires attribution and ShareAlike.

### 12. Others
- **Gunter's Space Page** (https://space.skyrocket.de/): footer "Last update: 04.04.2026 Gunter Dirk Krebs 1996-2026 | Contact | Legal Disclosure | Privacy Statement | Terms of Use". It also carries an AI usage notice: no use for training ML models; summarization or retrieval only with attribution and a link. The Terms page body was not readable (terms.htm 404, JS-rendered), so it is UNVERIFIED. Not recommended for scraping.
- **Braeunig** (http://www.braeunig.us/space/): the frameset index_top.htm changelog's newest entry is "November-2017". The specs pages (`specs/delta.htm`, `atlas.htm`, `saturn.htm`, `sls.htm`, `ariane.htm`, `proton.htm`, …) contain vehicle descriptions. No copyright or license notice was found (only a SciLinks "copyright 2001" badge). The old link `specs/engines.htm` returns 404.
- **NASA SP-8xxx "Space Vehicle Design Criteria" monographs**: available in NTRS (see §5). They are public-use, but they are design-method references, not a specs database.

---

## 3. Recommendation: which source to use for each field

Cite GCAT as "data from GCAT (J. McDowell, planet4589.org/space/gcat)" and LL2 as "Launch Library 2, The Space Devs" (encouraged, not required). Copy individual numbers from manufacturer, NASA and Wikipedia pages with a per-value citation.

| Field | Primary pick | Cross-check / fallback | Why |
|---|---|---|---|
| Engine thrust SL / vac | Manufacturer page (SpaceX JS chunk, L3Harris), else NASA for NASA hardware | GCAT engines.tsv (one "typical" value only); Wikipedia engines table (SL and vac); RO cfg | Manufacturers are primary. GCAT has only one thrust number per engine. |
| Isp SL / vac | Manufacturer or NASA where published (L3Harris RS-25: 366/452) | Wikipedia comparison table (CC BY-SA); GCAT (vac only); RO atmosphereCurve | SpaceX and Blue Origin do not publish Isp, so fall back to cited secondary sources and flag the value as estimated |
| Engine dry mass | Manufacturer or NASA where published (RS-25 7,775 lb) | Wikipedia "Mass (kg)"; RO "Dry Mass"; Wikidata P2067 (sparse) | GCAT has no liquid-engine mass |
| Engine diameter | Manufacturer or NASA (RS-25 96 in) | Wikidata P2386 (rare); RO cfg (nozzle sizes, not checked) | Weakly covered everywhere; consider making it optional |
| Stage propellant mass / dry mass | **GCAT stages.tsv** (full mass minus dry mass) | SpaceX API fuel_amount_tons (stale, 4 vehicles); Brügge pages | GCAT is the only open, licensed, machine-readable stage-mass table |
| Stage diameter / length | **GCAT stages.tsv** | Manufacturer pages | Same reason |
| Rocket liftoff mass, liftoff thrust, LEO payload, stages | **LL2 launcher_configurations** (launch_mass, to_thrust, leo_capacity, min/max_stage) | GCAT lv.tsv; manufacturer pages (SpaceX F9 549,054 kg / 7,607 kN / 22,800 kg) | LL2 is current and clean JSON. GCAT is CC-BY and downloadable in bulk. |
| Launch counts, failures, first launch year | **LL2** (total_launch_count, failed_launches, maiden_flight) | GCAT launch.tsv (derive per LV_Type, CC-BY) | LL2 already aggregates. GCAT is authoritative and handles partial-failure nuance. |
| Mission delta-v | Not in any of these sources. Compute it in-app (Tsiolkovsky equation plus standard budgets: LEO about 9.3–9.5 km/s including losses, LEO→GTO about 2.4 km/s, and so on). Cite NASA or textbook values. | loggger101/spacecost delta-v table (MIT, new, unvetted) | No open per-mission delta-v dataset was found |

**Avoid** (licensing or reliability problems):
- Astronautix text: no reproduction allowed.
- ROEngines: CC BY-NC-ND.
- Kaggle CC0 datasets scraped from Astronautix or NextSpaceflight: provenance is unclear.
- spacelaunchreport.com and b14643.de: dead domains taken over by spam.
- Gunter's: restrictive usage notice.
- The live SpaceX API: down and archived. Its values are frozen in 2022.

**Practical plan for a hackathon**:
1. Download GCAT `engines.tsv`, `stages.tsv`, `lv.tsv` and `lvs.tsv` once (CC BY 4.0) and ship them with attribution.
2. Hand-curate about 15–30 headline engines (Merlin 1D/MVac, Raptor 2/3, RS-25, RL10C, BE-4, BE-3U, Vulcain 2.1, Vinci, RD-180, RD-191, YF-100, LE-9, Rutherford, …). Use manufacturer, NASA or Wikipedia values with a citation per value, and mark any value without a primary source as estimated.
3. Fetch LL2 `launcher_configurations` at build time, not at runtime (15/h limit). Use lldev during development.
