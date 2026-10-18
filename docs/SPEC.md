# Rocket Configurator: working spec

The 44-page build spec is the source of truth. Until it is exported here in full, **Architecture §3–4 is the working contract**. If this file and [`ARCHITECTURE.md`](./ARCHITECTURE.md) disagree, Architecture wins until the full export lands. Types live in `src/types/index.ts` and are frozen after Phase 0.

All units SI. Stage index 0 = bottom stage, first to fire. Code decides the verdict; Grok only narrates.

## Data contract (Architecture §3)

- **Part data:** `Engine`, `Tank`, `Payload`, `Mission`, `ReferenceRocket`, each with `source`.
- **Build:** `BuildState { missionId, stages: StageBuild[], payloadId, livery }`; `StageBuild { engineId, engineCount (1-9), tankId }` (one tank per stage).
- **Derived:** `Verdict { stages: StageResult[], totalDeltaV_ms, requiredDeltaV_ms, marginDeltaV_ms, liftoffTWR, deltaVOk, twrOk, feasible, totalMass_kg, liftoffThrust_kN, closestRocketId, warnings[] }`.
- **AI:** `Suggestion` (`swap_engine` | `set_engine_count` | `swap_tank` | `add_stage`), `AdviseRequest/Response`, `RenderRequest/Response`, `VoiceRequest`.

### Store API (P2)

`useBuild()`, `useVerdict()` (derived, not stored), `setMission`, `setStageEngine`, `setEngineCount`, `setStageTank`, `addStage`, `removeStage`, `setPayload`, `setLivery`, `applySuggestion` (ignores unknown ids), `loadDemoBuild`, `reset`.

## Physics (Architecture §4)

- Stage mass = `n·m_engine + m_tank_dry + m_propellant`.
- `m_start,i = Σ_{j≥i} m_stage,j + m_payload`; `m_end,i = m_start,i − m_propellant,i` (upper stages are dead weight).
- `Δv_i = Isp_i · g0 · ln(m_start/m_end)`, `g0 = 9.80665`. Total = sum.
- **Isp:** stage 0 uses sea-level, upper stages vacuum.
- `TWR = n0·F_SL,0·1000 / (m_start,0 · g0)`, stage 0 only.
- **Losses** are already inside each mission's `requiredDeltaV_ms`. Never subtract again.

| Rule | Effect |
|---|---|
| margin ≥ 0 | `deltaVOk` |
| TWR ≥ 1.15 (was 1.2; lowered 2026-10-18: real rockets lift off at about 1.15–1.2, e.g. Saturn V 1.18, Atlas V 401 1.17) | `twrOk`; below 1.0 is a blocking warning |
| engine propellant = tank propellant | else blocking warning |
| max engines = `floor(0.6 · (tankD/engineD)²)`, tune so 3.66 m tank + Merlin = 9 | `setEngineCount` clamps |
| vacuum-only engines not on stage 0 | blocking warning, UI disallows |
| tank dry mass ≥ 3% of propellant (was 4%; lowered 2026-10-18 so every real stage in the data passes, e.g. Falcon 9 S2 at 3.23%) | else blocking warning |
| `feasible = deltaVOk && twrOk && no blocking warnings` | drives the green bar |

**Closest real rocket:** `d = √(ln(m_b/m_r)² + ln(F_b/F_r)²)`, pick min. Code picks, Grok only phrases.

**Seven required unit tests (Phase 1 DoD):** worked example within 50 m/s; empty build returns infeasible without throwing; one-stage + zero payload; propellant mismatch → blocked; TWR 0.9 → `twrOk:false` + blocking; Falcon-9-sized build → Falcon 9; `applySuggestion` ignores unknown ids.

### Canonical demo scenario

Moon transfer, 12.5 km/s, 5 t payload. Stage 1 kerolox 400 t / 25 t dry / Isp 290; stage 2 kerolox 100 t / 6 t dry / Isp 348 → ~11.56 km/s, **red, ~940 m/s short**. Swap stage 2 to hydrolox (Isp ~450, 8 t dry) → ~13.08 km/s, **green, ~580 m/s margin**. Masses are placeholders: P4 + P2 re-tune with real engines so stage-0 TWR ≈ 1.3. **Never weaken the TWR rule to make the demo pass.**
