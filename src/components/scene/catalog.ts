// Owner: P1. Typed read-only view of P4's data files for the scene.
import type { Engine, Payload, Tank } from "@/types";
import enginesJson from "@/data/engines.json";
import tanksJson from "@/data/tanks.json";
import payloadsJson from "@/data/payloads.json";
import type { PartCatalog } from "./geometry";

export const catalog: PartCatalog = {
  engines: enginesJson as Engine[],
  tanks: tanksJson as Tank[],
  payloads: payloadsJson as Payload[],
};
