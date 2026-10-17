// Owner: P4. Typed entry point for src/data. Import data from here, never the JSON files directly.
import type { Engine, Mission, Payload, Propellant, ReferenceRocket, Tank } from "@/types";
import enginesJson from "./engines.json";
import missionsJson from "./missions.json";
import payloadsJson from "./payloads.json";
import referenceRocketsJson from "./reference-rockets.json";
import tanksJson from "./tanks.json";

// JSON imports widen string unions to string. This shape checks every other field at compile time.
type FromJson<T> = { [K in keyof T]: T[K] extends Propellant ? string : T[K] };

const PROPELLANTS: readonly string[] = ["kerolox", "methalox", "hydrolox", "hypergolic", "solid"] satisfies Propellant[];

const isPropellant = (p: string): p is Propellant => PROPELLANTS.includes(p);

function withPropellant<T extends { id: string; propellant: Propellant }>(rows: FromJson<T>[]): T[] {
  return rows.map((row) => {
    if (!isPropellant(row.propellant)) throw new Error(`${row.id}: unknown propellant "${row.propellant}"`);
    return { ...row, propellant: row.propellant } as T;
  });
}

const engineRows: FromJson<Engine>[] = enginesJson;
const tankRows: FromJson<Tank>[] = tanksJson;

export const engines: Engine[] = withPropellant<Engine>(engineRows);
export const tanks: Tank[] = withPropellant<Tank>(tankRows);
export const payloads: Payload[] = payloadsJson;
export const missions: Mission[] = missionsJson;
export const referenceRockets: ReferenceRocket[] = referenceRocketsJson;
