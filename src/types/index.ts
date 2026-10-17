// CONTRACT: shared types for all four people. Frozen after Phase 0 (spec §6).
// All units SI, unit in the field name. Stage index 0 = bottom stage.

export type Propellant = "kerolox" | "methalox" | "hydrolox" | "hypergolic" | "solid";

export interface Engine {
  id: string; // "raptor-2"
  name: string;
  propellant: Propellant;
  thrustSL_kN: number;
  thrustVac_kN: number;
  ispSL_s: number;
  ispVac_s: number;
  mass_kg: number;
  diameter_m: number; // attach size, must match the tank
  source: string; // URL the numbers came from
}

export interface Tank {
  id: string;
  name: string;
  propellant: Propellant; // engine and tank propellant must match
  diameter_m: number;
  height_m: number;
  propellantMass_kg: number;
  dryMass_kg: number;
  source: string; // URL, or "derived: 5 percent of propellant mass"
}

export interface Payload {
  id: string;
  name: string;
  mass_kg: number;
  diameter_m: number;
  height_m: number;
}

export interface Mission {
  id: string;
  name: string;
  destination: string;
  requiredDeltaV_ms: number; // from Earth surface, includes gravity and drag losses
  source: string;
}

export interface ReferenceRocket {
  id: string;
  name: string;
  liftoffMass_kg: number;
  liftoffThrust_kN: number;
  payloadLEO_kg: number;
  stages: number;
  source: string;
}

export interface Livery {
  primary: string; // hex color
  accent: string; // hex color
  stripe: boolean;
  patch: string | null;
}

export interface StageBuild {
  engineId: string;
  engineCount: number; // 1 to 9
  tankId: string; // one tank per stage, keeps the math simple
}

export interface BuildState {
  missionId: string;
  stages: StageBuild[]; // index 0 = bottom stage
  payloadId: string;
  livery: Livery;
}

export interface StageResult {
  stageIndex: number;
  ispUsed_s: number; // SL for stage 0, vacuum for the rest
  startMass_kg: number;
  endMass_kg: number;
  deltaV_ms: number;
}

export interface Verdict {
  stages: StageResult[];
  totalDeltaV_ms: number;
  requiredDeltaV_ms: number;
  marginDeltaV_ms: number; // negative means short
  liftoffTWR: number;
  deltaVOk: boolean;
  twrOk: boolean; // TWR >= 1.2
  feasible: boolean; // deltaVOk && twrOk && no blocking warnings
  totalMass_kg: number;
  liftoffThrust_kN: number;
  closestRocketId: string;
  warnings: string[]; // e.g. "engine and tank propellant differ"
}

export type Suggestion =
  | { type: "swap_engine"; stageIndex: number; engineId: string }
  | { type: "set_engine_count"; stageIndex: number; engineCount: number }
  | { type: "swap_tank"; stageIndex: number; tankId: string }
  | { type: "add_stage"; engineId: string; tankId: string };

export interface AdviseRequest {
  build: BuildState;
  verdict: Verdict;
}
export interface AdviseResponse {
  message: string;
  suggestion: Suggestion | null;
}

export interface RenderRequest {
  build: BuildState;
  verdict: Verdict;
}
export interface RenderResponse {
  imageUrl: string;
  promptUsed: string;
  fallback: boolean;
}

export interface VoiceRequest {
  text: string;
} // response is an audio body
