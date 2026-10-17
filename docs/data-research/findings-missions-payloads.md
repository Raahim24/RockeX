# Mission delta-v budgets and payload dimensions (sourced)

Compiled 2026-10-17. Every number below comes from a page or PDF fetched in this session, given with its URL and a short verbatim quote. Values I computed from sourced numbers are labeled **derived**, and the arithmetic is shown. Values read off a chart, not from text, are labeled **chart-read**. Anything I could not source is marked `TODO(source)`.

Unit conversions: 1 lb = 0.45359237 kg; 1 ft = 0.3048 m.

---

## PART A: Missions

### A.0 Approach

`requiredDeltaV_ms` = (surface → LEO, including gravity, drag and steering losses) + (LEO → target, impulsive/high-thrust, Oberth burn at LEO perigee).

**Chosen baseline for surface → LEO: 9,400 m/s.** Sources below give a range of about 8.8–10.2 km/s. 9.4 km/s sits inside every quoted range, and the Humble/Henry/Larson real-vehicle data brackets it: about 9.09–9.27 km/s net of Earth-rotation help, and 9.48–9.62 km/s gross.

### A.1 Surface → LEO (including losses): every sourced figure

| # | Value | What it includes | Source (URL) | Verbatim quote |
|---|---|---|---|---|
| S1 | **9.3–10 km/s** | Earth → LEO (table cell) | Wikipedia "Delta-v budget", rev 1362285519 (2026-07-02), https://en.wikipedia.org/wiki/Delta-v_budget (raw wikitext fetched) | Table row "Earth \| 9.3–10" (spans LEO-Ken and LEO-Eq columns). The cell has **no citation** in the wikitext. |
| S2 | **~9.4 km/s** | to ~300 km ISS initial orbit | same Wikipedia page | "To reach the initial low Earth orbit of the International Space Station of 300 km (now 400 km), the delta-v is over six times higher, about 9.4 km/s." **No citation** on that sentence. |
| S3 | **+1.5–2 km/s losses** over 7.8 km/s | gravity + drag | same Wikipedia page | "this not only requires an increase of velocity from 0 to 7.8 km/s, but also typically 1.5–2 km/s for atmospheric drag and gravity drag" followed by `{{Citation needed|date=May 2018}}` |
| S4 | **9–10 km/s** (1.5–2 km/s of losses) | gravity + steering + drag | Wikipedia "Gravity loss", rev 1364549710, https://en.wikipedia.org/wiki/Gravity_loss | "to reach a speed of 7.8 km/s in low Earth orbit requires a delta-v of between 9 and 10 km/s. The additional 1.5 to 2 km/s delta-v is due to gravity losses, steering losses and atmospheric drag." also tagged `{{Citation needed}}` |
| S5 | **9.7 km/s** | ground → LEO | C. Hirata (Caltech), "Rockets and Space Transportation" (cited by Wikipedia as ref `marsdeltavs`), archived at https://web.archive.org/web/20070701211813/http://www.pma.caltech.edu/~chirata/deltav.html | "To get into Low Earth Orbit (LEO) from the ground requires a Delta-V of 9.7 km/s". The chart image dvchart.jpg on the same page also labels Earth surface → LEO "9.7". |
| S6 | **9.8–10.2 km/s** | all ascent losses (thrust, gravity, drag, steering) | M. D. Griffin, "Rocket Fundamentals", U. Wisconsin NEEP 533 guest lecture, 9 Apr 2004, slide p.18, https://fti.neep.wisc.edu/fti.neep.wisc.edu/neep533/SPRING2004/lecture32.pdf | "Launch vehicle must actually supply 25-30% higher ideal ∆V than Vcirc; i.e., 9.8 – 10.2 km/s – due to various losses: Thrust Loss … Gravity … Drag … Steering Loss". Same slide set: "a 185 km (100 n. mi.) altitude circular LEO orbit has a circular velocity of approximately 7.8 km/s." |
| S7 | **8.8–9.3 km/s** (net of Earth rotation) | per-vehicle breakdown, see A.2 | Humble, Henry & Larson, *Space Propulsion Analysis and Design* (McGraw-Hill 1995), Table 2.10, reproduced in J. Seitzman, Georgia Tech AE4451 notes "Vehicle Acceleration" p.4, https://seitzman.gatech.edu/classes/ae4451/vehicle_acceleration.pdf | "Ascent varies between 8.8 and 9.3 km/s for these selected launch vehicles." and "From Table 2.10 in "Space Propulsion Analysis and Design," Humble, Henry and Larson, McGraw Hill, 1995." |
| S8 | 8.6 km/s | surface → LEO, from an old NASA study (probably excludes some losses) | Wikipedia "Delta-v budget" footnote on the Strout Delta-V Calculator ref | "Gives figures of 8.6 from Earth's surface to LEO … Figures come from Chapter 2 of Space Settlements: A Design Study on the NASA website." I did **not** confirm 8.6 in the NASA chapter text I fetched (it is in that chapter's Fig. 2-2 image, which I did not read). It is an outlier, so I did not use it. |

**Disagreement:** quoted totals run from 8.8 to 10.2 km/s. Part of the spread is bookkeeping. H&L subtract the Earth-rotation benefit (~0.35–0.41 km/s at 28.5°). Griffin's "25–30 % above Vcirc" and the 9.3–10 range look like gross figures. Altitude and vehicle T/W cause the rest.

### A.2 Real-world loss breakdowns (Humble/Henry/Larson Table 2.10, via Georgia Tech AE4451)

Source: https://seitzman.gatech.edu/classes/ae4451/vehicle_acceleration.pdf, p.4, slide "LEO Velocity Budgets". Column header (verbatim): "Vehicle Orbit: hp ha (km) inclination (deg) uLEO ugrav udrag usteering urot* u=ui". Footnote: "*Negative sign indicates beneficial effect of rotation." Units are m/s. The PDF text extraction dropped the minus signs on urot. I confirmed the sign by checking that each row sums to its total, e.g. Saturn V: 7798 + 1534 + 40 + 243 − 348 = 9267.

| Vehicle | Orbit (km), incl. | v_LEO | gravity loss | drag loss | steering loss | Earth rotation | **Total Δv** | Gross (no rotation credit) **derived** |
|---|---|---|---|---|---|---|---|---|
| Saturn V | 176×176, 28.5° | 7798 | **1534** | **40** | 243 | −348 | **9267** | 9615 |
| Space Shuttle | 196×278, 28.5° | 7794‡ | **1222** | **107** | 358 | −395 | **9086**\*\* | 9481 |
| Ariane 44L | 170×170†, 7° | 7802 | 1576 | 135 | 38 | −413 | 9138 | 9551 |
| Atlas I | 149×607, 27.4° | 7946 | 1395 | 110 | 167 | −375 | 9243 | 9618 |
| Delta 7925 | 175×319, 33.9° | 7842 | 1150 | 136 | 33 | −347 | 8814 | 9161 |
| Titan IV/Centaur | 157×463, 28.6° | 7896 | 1442 | 156 | 65 | −352 | 9207 | 9559 |

Footnotes, verbatim: "‡Injection occurs at 111 km." "\*\*An additional u= 144 m/s is required to circularize at apogee." "†The third stage of Ariane 44L uses a continuous burn into a geosynch. transfer orbit; arbitrarily terminated burn at 170 km to give better comparison with other vehicles." The Ariane 44L inclination digit appears as "70" in the extracted text, which is probably a garbled "7.0". Treat it as uncertain.

- **Gravity loss is ~1.2–1.6 km/s and drag loss ~0.04–0.16 km/s.** This confirms the "~1.5 km/s gravity, ~0.1–0.2 km/s drag" rule of thumb (Saturn V drag is only 40 m/s).
- **Earth-rotation benefit at Cape Canaveral / KSC (28.5°): 348 m/s (Saturn V), 395 m/s (Shuttle).** It **is included** (subtracted) in the H&L totals.
- Cross-check from NASA flight data: NASA SP-4029 *Apollo by the Numbers*, "Earth Orbit Data" table, https://history.nasa.gov/SP-4029/Apollo_18-24_Translunar_Injection.htm (redirects to https://www.nasa.gov/wp-content/uploads/2023/04/sp-4029.pdf). Apollo 11 Earth orbit insertion: "Earth Fixed Velocity (ft/sec) … 24,243.9" and "Space-Fixed Velocity (ft/sec) … 25,567.9". **Derived** difference: 1,324.0 ft/s = 403.6 m/s. This roughly matches the rotation credit; it is an approximation because the insertion point is at 32.5°N and the headings differ.
- Ariane 5: **TODO(source)**. I found no Ariane 5 loss breakdown. H&L list Ariane 44L only.

### A.3 LEO → target increments: every sourced figure

| Target | Value (km/s) | Source (URL) | Verbatim quote / note |
|---|---|---|---|
| **GTO** | **2.5** | Hirata chart (archived page above), image https://web.archive.org/web/20070701211813im_/http://www.pma.caltech.edu/~chirata/dvchart.jpg | **chart-read**: arrow "Low Earth Orbit (LEO)" → "Geosynchronous Transfer Orbit (GTO)" labeled "2.5". The page text defines GTO as "low point at 250 miles altitude and its high point at 22,300 miles". |
| GTO (alt.) | 2.3 (from a ~700 km LEO) | Wikipedia "Delta-v budget" footnote | "the speed of a GTO at perigee can be just 9.8 km/s. This corresponds to an LEO at about 700 km altitude, where its speed would be 7.5 km/s, giving a delta-v of 2.3 km/s." Also: "The figures for LEO to GTO, GTO to GEO, and LEO to GEO are inconsistent." |
| GTO → GEO | 1.6 | Hirata chart | **chart-read**: GTO ↔ GEO "1.6" |
| **GEO** (LEO→GEO) | 4.1 (**derived** 2.5+1.6) / 4.33 (LEO-Ken) / 3.90 (LEO-Eq) / 3.8 | Hirata chart; Wikipedia table; NASA *Space Settlements* ch. 2, archived at https://web.archive.org/web/20100616095904/http://settlement.arc.nasa.gov//75SummerStudy/Chapt.2.html | Wikipedia table row "Low Earth orbit (LEO-Ken) \| \| 4.24 \| 4.33 …" (GEO column = 4.33; LEO-Eq row = 3.90). NASA: "the [Δv] to go from low Earth orbit … to lunar orbit is 4100 m/s, which is only 300 m/s more than to go to geosynchronous orbit (note that these numbers are not additive)", which gives 3.8 km/s (**derived**). |
| **TLI / Moon transfer** | **3.20** | Wikipedia "Delta-v budget", "Earth Lunar Gateway—high thrust" table | "Low Earth orbit (LEO) \|\| Trans-Lunar Injection (TLI) \|\| 3.20", cited to Whitley & Martinez 2015, https://ntrs.nasa.gov/api/citations/20150019648/downloads/20150019648.pdf. **Caveat:** I fetched that NASA PDF, and its extractable text does **not** contain "3.20" or any LEO→TLI number. The value may come from a figure, or it may be uncited. |
| TLI (Apollo range) | 3.05–3.25 (10,000–10,600 ft/s) | Wikipedia "Trans-lunar injection", rev 1380607279, https://en.wikipedia.org/wiki/Trans-lunar_injection | "This particular TLI burn lasted approximately 350 seconds, providing 3.05 to 3.25 km/s (10,000 to 10,600 ft/s) of change in velocity". Cited to *Apollo by the Numbers*, but the SP-4029 TLI table I fetched has **no Δv column** (see next row). |
| TLI (Apollo 11, NASA data) | 3.04 (**derived**) | NASA SP-4029 PDF (above), "Translunar Injection" and "Earth Orbit Data" tables | TLI "Space-Fixed Velocity (ft/sec) … 35,545.6" (Apollo 11 column); EOI "Space-Fixed Velocity (ft/sec) … 25,567.9". **Derived:** 9,977.7 ft/s = 3,041 m/s. This is a speed difference, so it slightly understates the burn Δv (gravity loss during the burn, small altitude/flight-path differences). Same table, Apollo 11: "S-IVB Second Burn Duration (sec) … 346.83". |
| TLI (NASA 1966 chart) | ~10,000 ft/s ≈ 3.05 | NASA MSC 1966, "Energy Requirements for Lunar Landing Mission", NASA-S-66-6074 (Maynard & Sevier, Apollo Lunar Landing Mission Symposium, Fig. 2), image on Wikimedia Commons: https://commons.wikimedia.org/wiki/File:ApolloEnergyRequirementsMSC1966.png | **chart-read**: the hatched "ΔV FPS" bar at TRANS LUNAR INJECTION reaches ~10,000 ft/s; the LUNAR ORBIT INSERTION bar is ~3,200 ft/s (≈0.98 km/s). |
| **LEO → C3=0 (escape)** | **3.2** | Hirata chart (**chart-read**: LEO→GTO 2.5 + GTO→C3=0 "0.7"); ULA (Zegler & Kutter 2010), archived at https://web.archive.org/web/20111020010301/http://www.ulalaunch.com/site/docs/publications/DepotBasedTransportationArchitecture2010.pdf | ULA: "Every interesting place in the solar system beyond Earth orbit requires us to first push the payload up to escape velocity. This demands a further 3.2 km/sec of energy investment". Wikipedia table: LEO-Ken → C3=0 "3.22". |
| **LLO** (low lunar orbit) | **TLI→LLO 0.90** (so LEO→LLO ≈ 4.1) | Wikipedia Gateway table; Whitley & Martinez 2015 (NASA JSC) | Wikipedia: "Trans-Lunar Injection (TLI) \|\| Low (polar) lunar orbit (LLO) \|\| 0.90". Whitley & Martinez text: "In the scenarios with minimum plane change with a 3-5 day transfer from Earth, the ∆V is at minimum around 900 m/s." |
| LLO (alt.) | LEO→LLO 4.1 / 4.04 / 3.9 | NASA *Space Settlements* ch. 2; Wikipedia table; Hirata chart | NASA: "to go from low Earth orbit (an orbit just above the atmosphere) to lunar orbit is 4100 m/s". Wikipedia LEO-Ken row, LLO column = "4.04". Hirata (**chart-read**): C3=0 ↔ Low Lunar Orbit "0.7", so LEO→LLO = 2.5+0.7+0.7 = 3.9 (**derived**). FISO's table puts LEO→LLO at "8.0", which disagrees with everything else. I ignored it. |
| **TMI** (Mars transfer) | **3.8** (**derived**, minimum-energy) | Hirata chart | **chart-read**: LEO→GTO 2.5, GTO→C3=0 0.7, Earth C3=0 → "Mars Low-energy Transfer Orbit" "0.6". Sum = 3.8. Wikipedia repeats "Earth escape velocity (C3=0) \| Mars transfer orbit \| 0.6". |
| TMI (alt.) | **4.3** ("typical", not minimal) | ULA Zegler & Kutter 2010 (above) | "A typical Mars departure ΔV of 4.3 km/sec (from LEO) is obtained with a perigee burn of less than 1 km/sec." Wikipedia: "LEO \| Mars transfer orbit \| 4.3 ("typical", not minimal)". |

### A.4 Per-mission derivations (`requiredDeltaV_ms` = surface→LEO + LEO→target)

Surface→LEO term for every row: **9,400 m/s** (S2, Wikipedia "about 9.4 km/s"). It is bracketed by S7 (H&L 9,086–9,267 net / 9,481–9,615 gross), S5 (Hirata 9.7) and S1 (9.3–10).

| id | Destination | Surface→LEO | LEO→target (source) | **requiredDeltaV_ms** | Range if the alternative sources are used |
|---|---|---|---|---|---|
| `leo` | LEO ~200 km | 9,400 | 0 | **9,400** | 8,814 (Delta 7925, H&L) to 10,200 (Griffin) |
| `gto` | GTO | 9,400 | 2,500 (Hirata) | **11,900** | 11,700 (2.3 km/s from 700 km LEO) to 12,400 (with 9.7 base) |
| `tli` | Moon transfer (TLI) | 9,400 | 3,200 (Wikipedia Gateway table 3.20; ULA/Hirata 3.2 to escape) | **12,600** | 12,441 (9,400 + 3,041 Apollo 11 derived) to 12,650 (9,400 + 3,250) |
| `llo` | Low lunar orbit | 9,400 | 3,200 + 900 = 4,100 (Wikipedia TLI→LLO 0.90 / Whitley ~900 m/s; NASA Space Settlements 4,100 m/s LEO→lunar orbit) | **13,500** | 13,300 (Hirata 3.9) to 13,500 |
| `tmi` | Mars transfer (TMI) | 9,400 | 3,800 (Hirata 2.5+0.7+0.6, minimum-energy) | **13,200** | up to 13,700 (ULA "typical" 4.3) |
| `escape` | Earth escape, C3 = 0 | 9,400 | 3,200 (ULA "further 3.2 km/sec"; Hirata 2.5+0.7; Wikipedia 3.22) | **12,600** | 12,600–12,620 |
| *(optional)* `geo` | GEO, direct | 9,400 | 4,100 (Hirata 2.5+1.6) | *13,500* | 13,200 (NASA 3.8) to 13,730 (Wikipedia LEO-Ken 4.33). Not in the JSON. |

Note that TLI and escape come out almost equal. Apollo TLI was slightly *below* escape energy: *Apollo by the Numbers* gives Apollo 11 "C3 … -14,979,133" (the column is labeled "(ft/sec)" but C3 is really in ft²/s²). A negative C3 means a bound orbit.

### A.5 Check on the demo's "Moon transfer ≈ 12.5 km/s from the surface"

**Consistent.** Using the sourced terms:
- 9.4 (Wikipedia) + 3.1 → 12.5 km/s. "3.1" falls in the Apollo TLI band of 3.05–3.25 km/s (Wikipedia TLI article) and between the Apollo 11 derived 3.04 and the Gateway-table 3.20.
- 9.4 + 3.20 = 12.6 km/s; 9.4 + 3.04 = 12.44 km/s.
- H&L Saturn V real ascent 9.267 + 3.20 = 12.47 km/s (**derived**).

So 12.5 km/s is within ±0.1–0.2 km/s of every sourced combination. It is a fair rounded value. It counts surface→LEO losses and the Cape rotation credit only implicitly, and assumes an impulsive TLI from LEO. It does **not** include lunar orbit insertion, which adds about 0.9 km/s more (→ ~13.5 km/s for LLO).

### A.6 Wikipedia "Delta-v budget" (CC BY-SA 4.0): what its numbers rest on

Fetched raw wikitext, rev 1362285519 (2026-07-02T23:47:35Z).
- **9.3–10 km/s (Earth→LEO)**: no citation. The related prose has `{{Citation needed|date=May 2018}}`. The "about 9.4 km/s" sentence has no ref.
- **Earth–Moon high-thrust table** (LEO-Ken/LEO-Eq/GEO/EML/LLO/C3): the only inline ref is Farquhar 1972 (EML-2 column header). The note above the table is wrapped in `{{citation needed span|date=October 2021}}`. The table is effectively unsourced.
- **LEO→TLI 3.20, TLI→LLO 0.90**: cites `Gateway_Orbit` = Whitley & Martinez, "Options for Staging Orbits in Cis-Lunar Space" (NASA NTRS 20150019648). I fetched it: it confirms ~900 m/s for LLO insertion, but I found **no 3.20 in its text**.
- **LEO→Mars transfer 4.3, Mars transfer→LMO 2.7**: cites `Zegler` = ULA 2010 depot paper. I fetched it and **confirmed** both 4.3 and 2.7 verbatim ("execute a 2.7 km/sec insertion burn at Mars").
- **C3=0→Mars transfer 0.6 and the other Mars values**: cites `marsdeltavs` = Hirata, Caltech. I fetched the page and chart and **confirmed** 0.6, 0.9, 0.2, 0.7, 0.3, 0.5, 4.1 on the chart.
- **Strout calculator note** (8.6 / 4.1 / 3.8): points to NASA *Space Settlements* ch. 2. I fetched the chapter: the text **confirms** "4100 m/s" LEO→lunar orbit and "300 m/s more than … geosynchronous orbit".
- **FISO 2010 table** (LEO→GEO 6.0, LEO→LLO 8.0): cites a usurped FISO PDF (archived). I fetched it, but the extractable text does not show these numbers. They also disagree with every other source. I did not use them.
- CC BY-SA note: if the app reproduces Wikipedia table text, it must give attribution and use the same license. Bare numbers taken from the primary sources (Hirata, ULA, NASA) avoid that question.

---

## PART B: Payloads

Contract: `Payload { id, name, mass_kg, diameter_m, height_m }`.

| id | Name | Mass (original → kg) | Diameter (original → m) | Height (original → m) | Source + verbatim |
|---|---|---|---|---|---|
| `goes-r` | GOES-R series weather satellite (GTO comsat-class, **~5 t**) | 11,446 lb → **5,192 kg** (NOAA gives both) | box 20 ft × 18.4 ft × 12.8 ft → **6.1 × 5.6 × 3.9 m** (NOAA gives both) | see left | https://www.nesdis.noaa.gov/our-satellites/currently-flying/goes-east-west/goes-r-series-spacecraft-instruments (redirected from goes-r.gov): "GOES-R, S, T mass at launch (fueled): 11,446 lbs (5,192 kg)"; "GOES-R, S, and T dry mass: 6,299 lbs (2,857 kg)"; "Dimensions: 20 ft x 18.4 ft x 12.8 ft (6.1 m x 5.6 m x 3.9 m)". GOES-U: "11,023 lbs (5,000 kg)". **Caveat:** NOAA does not say which axis is height, or whether these are stowed or deployed dimensions. In the JSON I used height = 6.1 and diameter = 3.9 (smallest side) as a stand-in, marked `TODO(source)` for the stowed envelope. |
| `jwst` | James Webb Space Telescope (stowed) | "Approx 6200 kg" → **6,200 kg** | **4.472 m** (alt. "4.7") | **10.661 m** (alt. "10.6m") | Mass: NASA Webb fact sheet, https://science.nasa.gov/mission/webb/fact-sheet/: "Total Payload Mass … Approx 6200 kg, including observatory, on-orbit consumables and launch vehicle adaptor". Dimensions: ArianeGroup (Rongier), EUCASS 2022 plenary, https://www.eucass.eu/images/eucass2022/plenaries/P0-9_ArianeGroup_-_Rongier.pdf, "JWST Observatory Summary" slide, Stowed Configuration figure labels "10.661 m" and "4.472 m". A later slide says "JWST in stowed configuration • 6.2t, 10.6m high, 4.7 diameter". Fairing: "17-m high, 5.4m diameter". **Disagreement:** 4.472 vs 4.7 m diameter (4.7 may be an envelope). |
| `hubble` | Hubble Space Telescope | "~24,000 lbs. (10,886 kg)" → **10,886 kg** | "14 feet (4.2 meters)" → **4.2 m** (14 ft × 0.3048 = 4.267 m) | "43.5 feet (13.3 m)" → **13.3 m** (43.5 ft × 0.3048 = 13.259 m) | NASA, "A NASA Refresher on Hubble Facts for the 25th Anniversary", https://science.nasa.gov/missions/hubble/a-nasa-refresher-on-hubble-facts-for-the-25th-anniversary: "Length: 43.5 feet (13.3 m)"; "Maximum Diameter: 14 feet (4.2 meters)"; "Weight: At Launch: ~24,000 lbs. (10,886 kg)"; "Post SM4: ~27,000 lbs. (~12,247 kg)". NASA's own metric values are rounded slightly differently from exact conversion. |
| `crew-dragon` | SpaceX Crew Dragon + trunk | 27,600 lb → **12,519 kg** (**derived** conversion) | "4 m / 13 ft" → **4.0 m** | "8.1m / 26.7 ft" → **8.1 m** (capsule + trunk) | Dimensions: SpaceX Dragon page data, in the JS bundle served for https://www.spacex.com/vehicles/dragon/ (file https://www.spacex.com/3850.6a270eb20a4c2080.js): `{label:"Height",value:"8.1m",secondValue:" / 26.7 ft"},{label:"Diameter",value:"4 m",secondValue:" / 13 ft"}`, plus "Launch payload mass","6,000 kg"/"13,228 lbs" and "Trunk volume","37 m³". Mass: NASA, "Top 10 Things to Know for NASA's SpaceX Demo-2 Return", https://www.nasa.gov/feature/top-10-things-to-know-for-nasa-s-spacex-demo-2-return: "At the time of undock, Dragon Endeavour and its trunk weigh approximately 27,600 pounds." and "the Crew Dragon capsule weighs approximately 21,200 pounds" (→ 9,616 kg). **Caveat:** 27,600 lb is the mass at *undocking*, not at launch. Launch mass with full propellant is `TODO(source)`; SpaceX does not publish it. |
| `orion-artemis1` | NASA Orion (crew module + service module), Artemis I, at TLI | "53,000 lbs" → **24,040 kg** | "16.5 ft" → **5.03 m** | "26 ft" (CM/SM height) → **7.92 m** | NASA Orion Quick Facts PDF, https://www.nasa.gov/wp-content/uploads/2015/06/fs-2014-08-004-jsc-orion_quickfacts-web.pdf (the content covers Artemis I/II): "TRANS-LUNAR INSERTION MASS 53,000 lbs [Artemis I] 58,500 lbs [Artemis II]"; "CREW MODULE / SERVICE MODULE HEIGHT 26 ft"; crew module "HEIGHT … 11 ft", "DIAMETER … 16.5 ft"; service module "HEIGHT … 15.7 ft", "DIAMETER … 16.5 ft"; "GROSS LIFTOFF MASS 72,000 lbs" (includes the launch abort system). Crew module alone "WEIGHT AT LIFTOFF 20,600 lbs" (→ 9,344 kg; my attribution to the CM is based on the PDF text order and the "NOMINAL LANDED MASS" line). Above the 2–20 t band; include only as an extra. |

Not completed:
- **Perseverance / Mars 2020:** JPL press kit pages give only the rover mass, "About 2,260 pounds (1,025 kilograms)", and size, "About 10 feet long (not including the arm), 9 feet wide and 7 feet tall" (https://www.jpl.nasa.gov/news/press_kits/mars_2020/launch/quick_facts/). The full launch mass with cruise stage and aeroshell, and the aeroshell diameter, are `TODO(source)`. A search snippet attributed "15 feet in diameter" to a Lockheed Martin release, but I did not fetch that release.
- Starlink stack, Europa Clipper, ISS module, Apollo CSM+LM: not attempted, `TODO(source)`.
- Orion "by the numbers 2022" PDF (nasa.gov/wp-content/uploads/2023/03/orion-by-the-numbers-2022.pdf) returned HTTP 404.

---

## JSON

### Missions (exact contract shape; `source` is a field in the contract)

```json
[
  {
    "id": "leo",
    "name": "Low Earth Orbit (~200 km)",
    "destination": "LEO",
    "requiredDeltaV_ms": 9400,
    "source": "Wikipedia 'Delta-v budget' rev 1362285519 ('about 9.4 km/s' to ~300 km ISS orbit; table 9.3–10 km/s, uncited); bracketed by Humble/Henry/Larson Table 2.10 via https://seitzman.gatech.edu/classes/ae4451/vehicle_acceleration.pdf (Saturn V 9,267 m/s net incl. losses; 'Ascent varies between 8.8 and 9.3 km/s') and Hirata (Caltech) 9.7 km/s"
  },
  {
    "id": "gto",
    "name": "Geostationary Transfer Orbit",
    "destination": "GTO",
    "requiredDeltaV_ms": 11900,
    "source": "9,400 surface->LEO (see leo) + 2,500 LEO->GTO from Hirata (Caltech) delta-v chart, https://web.archive.org/web/20070701211813/http://www.pma.caltech.edu/~chirata/deltav.html"
  },
  {
    "id": "tli",
    "name": "Moon transfer (Trans-Lunar Injection)",
    "destination": "TLI",
    "requiredDeltaV_ms": 12600,
    "source": "9,400 surface->LEO + 3,200 LEO->TLI (Wikipedia 'Delta-v budget' Gateway table 'LEO -> TLI 3.20'; ULA Zegler & Kutter 2010 'further 3.2 km/sec' to escape; Apollo TLI 3.05–3.25 km/s per Wikipedia 'Trans-lunar injection'; Apollo 11 derived 3,041 m/s from NASA SP-4029)"
  },
  {
    "id": "llo",
    "name": "Low Lunar Orbit",
    "destination": "LLO",
    "requiredDeltaV_ms": 13500,
    "source": "9,400 surface->LEO + 3,200 LEO->TLI + 900 TLI->LLO (Wikipedia Gateway table 0.90; Whitley & Martinez 2015 NASA JSC 'at minimum around 900 m/s'); cf. NASA Space Settlements ch.2 'low Earth orbit ... to lunar orbit is 4100 m/s'"
  },
  {
    "id": "tmi",
    "name": "Mars transfer (Trans-Mars Injection)",
    "destination": "TMI",
    "requiredDeltaV_ms": 13200,
    "source": "9,400 surface->LEO + 3,800 LEO->Mars minimum-energy transfer (Hirata chart: LEO->GTO 2.5 + GTO->C3=0 0.7 + C3=0->Mars transfer 0.6); ULA 2010 gives 'typical' 4.3 km/s from LEO (-> 13,700)"
  },
  {
    "id": "escape",
    "name": "Earth escape (C3 = 0)",
    "destination": "C3=0",
    "requiredDeltaV_ms": 12600,
    "source": "9,400 surface->LEO + 3,200 LEO->C3=0 (ULA Zegler & Kutter 2010 'This demands a further 3.2 km/sec'; Hirata chart 2.5+0.7; Wikipedia table LEO-Ken->C3=0 3.22)"
  }
]
```

### Payloads (contract shape **plus an extra `source` field, which is not in the contract**; remove it if needed)

```json
[
  {
    "id": "goes-r",
    "name": "GOES-R weather satellite (~5 t, GTO)",
    "mass_kg": 5192,
    "diameter_m": 3.9,
    "height_m": 6.1,
    "source": "https://www.nesdis.noaa.gov/our-satellites/currently-flying/goes-east-west/goes-r-series-spacecraft-instruments — 'mass at launch (fueled): 11,446 lbs (5,192 kg)'; 'Dimensions: 20 ft x 18.4 ft x 12.8 ft (6.1 m x 5.6 m x 3.9 m)'. TODO(source): stowed envelope / axis mapping not stated by NOAA"
  },
  {
    "id": "jwst",
    "name": "James Webb Space Telescope (stowed)",
    "mass_kg": 6200,
    "diameter_m": 4.472,
    "height_m": 10.661,
    "source": "Mass: https://science.nasa.gov/mission/webb/fact-sheet/ ('Approx 6200 kg, including observatory, on-orbit consumables and launch vehicle adaptor'); stowed dims: https://www.eucass.eu/images/eucass2022/plenaries/P0-9_ArianeGroup_-_Rongier.pdf ('10.661 m', '4.472 m'; also '6.2t, 10.6m high, 4.7 diameter')"
  },
  {
    "id": "hubble",
    "name": "Hubble Space Telescope",
    "mass_kg": 10886,
    "diameter_m": 4.2,
    "height_m": 13.3,
    "source": "https://science.nasa.gov/missions/hubble/a-nasa-refresher-on-hubble-facts-for-the-25th-anniversary ('Length: 43.5 feet (13.3 m)'; 'Maximum Diameter: 14 feet (4.2 meters)'; 'At Launch: ~24,000 lbs. (10,886 kg)')"
  },
  {
    "id": "crew-dragon",
    "name": "SpaceX Crew Dragon (capsule + trunk)",
    "mass_kg": 12519,
    "diameter_m": 4.0,
    "height_m": 8.1,
    "source": "Dims: SpaceX Dragon page bundle https://www.spacex.com/3850.6a270eb20a4c2080.js ('Height' '8.1m' / '26.7 ft'; 'Diameter' '4 m' / '13 ft'). Mass: https://www.nasa.gov/feature/top-10-things-to-know-for-nasa-s-spacex-demo-2-return ('Dragon Endeavour and its trunk weigh approximately 27,600 pounds' at undock; 27,600 x 0.45359237 = 12,519 kg). TODO(source): launch mass"
  },
  {
    "id": "orion-artemis1",
    "name": "NASA Orion CM+SM (Artemis I, at TLI)",
    "mass_kg": 24040,
    "diameter_m": 5.03,
    "height_m": 7.92,
    "source": "https://www.nasa.gov/wp-content/uploads/2015/06/fs-2014-08-004-jsc-orion_quickfacts-web.pdf ('TRANS-LUNAR INSERTION MASS 53,000 lbs' -> 24,040 kg; 'CREW MODULE / SERVICE MODULE HEIGHT 26 ft' -> 7.92 m; 'DIAMETER ... 16.5 ft' -> 5.03 m)"
  }
]
```

---

## TODO list

1. `TODO(source)` Ariane 5 ascent loss breakdown (only Ariane 44L found, in H&L Table 2.10).
2. `TODO(source)` Locate the primary source behind Wikipedia's "LEO → TLI 3.20". It is not in the text of the cited Whitley & Martinez PDF; check that paper's figures.
3. `TODO(source)` SSO / ISS-orbit specific Δv (only Wikipedia's ISS "about 9.4 km/s", which is uncited, was found).
4. `TODO(source)` GOES-R stowed envelope (which axis is height; whether the NOAA box is stowed or deployed).
5. `TODO(source)` Crew Dragon launch mass (27,600 lb is the undock mass).
6. `TODO(source)` Perseverance/Mars 2020 total launch mass and aeroshell diameter; Starlink stack; Europa Clipper; ISS module.
7. Optional: confirm the 1.6 / 2.5 / 0.7 / 0.6 Hirata values against a second primary source for GTO (all GTO numbers here are chart-read from one source, plus Wikipedia's 2.3 km/s footnote).
