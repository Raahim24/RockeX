"use client";

import { useVerdict } from "@/store/buildStore";
import { formatMarginLabel } from "./format";

export function FeasibilityBar() {
  const { feasible, marginDeltaV_ms } = useVerdict();
  return (
    <div className="flex flex-col gap-1">
      <div
        role="status"
        aria-label={feasible ? "feasible" : "not feasible"}
        className={`h-2 w-full rounded-full ${feasible ? "bg-emerald-500" : "bg-red-500"}`}
      />
      <p className={`text-xs font-medium ${feasible ? "text-emerald-600" : "text-red-600"}`}>
        {feasible ? "Feasible" : "Not feasible"} · {formatMarginLabel(marginDeltaV_ms)}
      </p>
    </div>
  );
}
