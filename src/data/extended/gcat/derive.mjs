// Derives two JSON tables from GCAT (J. McDowell, General Catalog of Artificial Space Objects, CC BY 4.0):
//   ../gcat-rockets.json       orbital-class launch vehicles with a known launch mass AND launch thrust
//                               (what the closest-rocket lookup needs), joined with their launch record
//   ../gcat-launch-stats.json  launches / failures / first and last year per (vehicle, variant) for every
//                               orbital launch attempt in the GCAT launch log
// Inputs: lv.tsv (this folder, snapshot) and launch.tsv (14 MB, not committed: pass its path as argv[2] or it is
// downloaded from planet4589.org into the OS temp directory and reused from there).
// Run from the repo root:  node src/data/extended/gcat/derive.mjs [path/to/launch.tsv]
// GCAT conventions handled here (see docs/data-research/findings-gcat.md):
//   - header line starts with "#", other "#" lines are comments, "-" means missing, numeric 0 means unknown;
//   - lv.tsv Launch_Mass is in tonnes, TO_Thrust in kN, LEO/GTO capacity in kg; flags "?" mark uncertain values;
//   - launch.tsv LaunchCode: first letter = category (O orbital), second = outcome (S success, F fail, U unknown);
//   - join key is (LV_Name, LV_Variant) in lv.tsv = (LV_Type, Variant) in launch.tsv.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const GCAT_URL = "https://planet4589.org/space/gcat/tsv/tables/";
const SOURCE =
  "https://planet4589.org/space/gcat/tsv/tables/lv.tsv + launch.tsv; GCAT (J. McDowell, planet4589.org/space/gcat), CC BY 4.0";

function readTsv(path) {
  const lines = readFileSync(path, "utf8").split("\n");
  const header = lines[0].replace(/^#/, "").split("\t").map((h) => h.trim());
  const rows = [];
  for (const line of lines.slice(1)) {
    if (!line || line.startsWith("#")) continue;
    const cells = line.split("\t").map((c) => c.trim());
    const row = {};
    header.forEach((h, i) => (row[h] = cells[i] ?? ""));
    rows.push(row);
  }
  return rows;
}

const num = (s) => {
  if (s === undefined || s === "" || s === "-") return null;
  const v = Number(s);
  return Number.isFinite(v) && v !== 0 ? v : null; // GCAT writes 0 for unknown
};
// GCAT uses "+" for upgraded variants ("Ariane 5ECA+"); keep it as "-plus" so ids stay unique.
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/\+/g, "-plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function loadLaunchLog(argPath) {
  const target = join(tmpdir(), "gcat-launch.tsv");
  const candidates = [argPath, target].filter(Boolean);
  for (const p of candidates) if (existsSync(p)) return readTsv(p);
  process.stdout.write(`downloading ${GCAT_URL}launch.tsv ...\n`);
  const res = await fetch(GCAT_URL + "launch.tsv", { headers: { "User-Agent": "rocket-configurator-data-script" } });
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  writeFileSync(target, await res.text());
  return readTsv(target);
}

const launches = await loadLaunchLog(process.argv[2]);
const orbital = launches.filter((l) => l.LaunchCode.startsWith("O"));
const stats = new Map();
for (const l of orbital) {
  const key = `${l.LV_Type}|${l.Variant || "-"}`;
  const year = Number(l.Launch_Date.slice(0, 4));
  const s = stats.get(key) ?? { lvName: l.LV_Type, variant: l.Variant || "-", launches: 0, successes: 0, failures: 0, unknown: 0, firstYear: year, lastYear: year };
  s.launches++;
  const outcome = l.LaunchCode[1];
  if (outcome === "S") s.successes++;
  else if (outcome === "F") s.failures++;
  else s.unknown++;
  if (year < s.firstYear) s.firstYear = year;
  if (year > s.lastYear) s.lastYear = year;
  stats.set(key, s);
}

const lv = readTsv(join(here, "lv.tsv"));
const rockets = [];
for (const r of lv) {
  if (!["O", "D"].includes(r.Class)) continue; // orbital and deep-space launch vehicles only
  const mass_t = num(r.Launch_Mass);
  const thrust = num(r.TO_Thrust);
  if (mass_t === null || thrust === null) continue; // closest-rocket lookup needs both
  const variant = r.LV_Variant || "-";
  const s = stats.get(`${r.LV_Name}|${variant}`);
  const flags = [];
  if (r.MFlag === "?") flags.push("launch mass uncertain (GCAT ?)");
  if (r.LFlag === "?") flags.push("length uncertain (GCAT ?)");
  if (r.DFlag === "?") flags.push("diameter uncertain (GCAT ?)");
  rockets.push({
    id: slug(variant === "-" ? r.LV_Name : `${r.LV_Name} ${variant}`),
    name: r.LV_Name,
    variant: variant === "-" ? null : variant,
    family: r.LV_Family,
    manufacturer: r.LV_Manufacturer,
    class: r.Class,
    stages: num(r.LV_Max_Stage),
    length_m: num(r.Length),
    diameter_m: num(r.Diameter),
    liftoffMass_kg: Math.round(mass_t * 1000),
    liftoffThrust_kN: thrust,
    payloadLEO_kg: num(r.LEO_Capacity),
    payloadGTO_kg: num(r.GTO_Capacity),
    launches: s?.launches ?? null,
    failures: s?.failures ?? null,
    firstLaunchYear: s?.firstYear ?? null,
    lastLaunchYear: s?.lastYear ?? null,
    flags,
    source: SOURCE,
  });
}
rockets.sort((a, b) => a.name.localeCompare(b.name) || (a.variant ?? "").localeCompare(b.variant ?? ""));

const statRows = [...stats.values()].map((s) => ({ ...s, source: SOURCE })).sort((a, b) => b.launches - a.launches || a.lvName.localeCompare(b.lvName));

writeFileSync(join(here, "..", "gcat-rockets.json"), JSON.stringify(rockets, null, 2) + "\n");
writeFileSync(join(here, "..", "gcat-launch-stats.json"), JSON.stringify(statRows, null, 2) + "\n");

const flown = rockets.filter((r) => r.launches);
process.stdout.write(
  [
    `lv.tsv rows: ${lv.length}`,
    `rockets with mass + thrust (class O/D): ${rockets.length}, of which with launches in the log: ${flown.length}`,
    `launch log rows: ${launches.length}, orbital attempts: ${orbital.length}, failures: ${orbital.filter((l) => l.LaunchCode[1] === "F").length}`,
    `vehicle/variant launch-stat rows: ${statRows.length}`,
    "",
  ].join("\n"),
);
