// Owner: P3. Basic protection for the AI routes, which spend money on every call: only this app's own pages may
// call them, requests have a size limit, and each visitor has a per-minute budget per route.
// The rate limit is per server instance (in memory): enough to stop a runaway script, not a determined attacker.

const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

/** Browsers send Origin on every POST; it must be this site. Scripts and other websites are refused. */
export const sameOrigin = (req: Request): boolean => {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
};

const visitor = (req: Request): string =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";

/** True when this visitor has used up the route's budget for the last minute (and records this call otherwise). */
const overLimit = (key: string, perMinute: number, now = Date.now()): boolean => {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= perMinute) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear(); // keep memory bounded
  return false;
};

export interface GuardOptions {
  /** Which budget this call counts against, e.g. "advise". */
  bucket: string;
  perMinute: number;
  maxBytes: number;
}

/** Null when the request may go ahead; otherwise the response to send instead. */
export const guard = (req: Request, { bucket, perMinute, maxBytes }: GuardOptions): Response | null => {
  if (!sameOrigin(req)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > maxBytes) {
    return Response.json({ error: "request too large" }, { status: 413 });
  }
  if (overLimit(`${bucket}:${visitor(req)}`, perMinute)) {
    return Response.json({ error: "slow down" }, { status: 429, headers: { "Retry-After": "60" } });
  }
  return null;
};

/** For tests: forget all budgets. */
export const resetGuard = (): void => hits.clear();
