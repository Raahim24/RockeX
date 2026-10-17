import enginesJson from "@/data/engines.json";
import missionsJson from "@/data/missions.json";
import payloadsJson from "@/data/payloads.json";
import referenceRocketsJson from "@/data/reference-rockets.json";
import tanksJson from "@/data/tanks.json";
import type { Engine, Mission, Payload, ReferenceRocket, Tank } from "@/types";

export interface Catalog {
  engines: Engine[];
  tanks: Tank[];
  payloads: Payload[];
  missions: Mission[];
  referenceRockets: ReferenceRocket[];
}

export const byId = <T extends { id: string }>(items: T[], id: string): T | undefined =>
  items.find((item) => item.id === id);

export const loadCatalog = (): Catalog => ({
  engines: enginesJson as Engine[],
  tanks: tanksJson as Tank[],
  payloads: payloadsJson as Payload[],
  missions: missionsJson as Mission[],
  referenceRockets: referenceRocketsJson as ReferenceRocket[],
});
