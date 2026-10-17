import { engines, missions, payloads, referenceRockets, tanks } from "@/data";
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

const CATALOG: Catalog = { engines, tanks, payloads, missions, referenceRockets };

export const loadCatalog = (): Catalog => CATALOG;
