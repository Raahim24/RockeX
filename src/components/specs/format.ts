// Display formatting only. Every number shown comes straight from the Verdict.
export const formatDeltaV = (ms: number): string => `${(ms / 1000).toFixed(2)} km/s`;
export const formatTwr = (twr: number): string => twr.toFixed(2);
export const formatMass = (kg: number): string => `${(kg / 1000).toFixed(1)} t`;
export const formatThrust = (kN: number): string => `${kN.toFixed(0)} kN`;

export const formatMarginLabel = (margin_ms: number): string =>
  margin_ms < 0 ? `${Math.round(-margin_ms)} m/s short` : `${Math.round(margin_ms)} m/s margin`;
