"use client";

import { byId, loadCatalog } from "@/lib/physics/catalog";
import { useBuild, useVerdict } from "@/store/buildStore";
import { FeasibilityBar } from "./FeasibilityBar";
import { formatDeltaV, formatMass, formatThrust, formatTwr } from "./format";

export function SpecPanel() {
  const build = useBuild();
  const verdict = useVerdict();
  const catalog = loadCatalog();
  const closest = byId(catalog.referenceRockets, verdict.closestRocketId);
  const closestLabel = closest?.name ?? (verdict.closestRocketId || "—");
  const mission = byId(catalog.missions, build.missionId);

  return (
    <aside className="flex w-full flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">Verdict</h2>
        <p className="text-xs text-zinc-500">{mission?.name ?? (build.missionId || "No mission")}</p>
      </div>
      <FeasibilityBar />
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <dt className="text-zinc-500">Delta-v</dt>
        <dd className="text-right font-medium">{formatDeltaV(verdict.totalDeltaV_ms)}</dd>
        <dt className="text-zinc-500">Required</dt>
        <dd className="text-right font-medium">{formatDeltaV(verdict.requiredDeltaV_ms)}</dd>
        <dt className="text-zinc-500">Margin</dt>
        <dd className="text-right font-medium">{formatDeltaV(verdict.marginDeltaV_ms)}</dd>
        <dt className="text-zinc-500">Liftoff TWR</dt>
        <dd className="text-right font-medium">{formatTwr(verdict.liftoffTWR)}</dd>
        <dt className="text-zinc-500">Mass</dt>
        <dd className="text-right font-medium">{formatMass(verdict.totalMass_kg)}</dd>
        <dt className="text-zinc-500">Thrust</dt>
        <dd className="text-right font-medium">{formatThrust(verdict.liftoffThrust_kN)}</dd>
        <dt className="text-zinc-500">Closest rocket</dt>
        <dd className="text-right font-medium">{closestLabel}</dd>
      </dl>
      {verdict.warnings.length > 0 ? (
        <ul className="list-disc space-y-1 pl-4 text-xs text-red-600 dark:text-red-400">
          {verdict.warnings.map((warning, i) => (
            <li key={`${i}-${warning}`}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}
