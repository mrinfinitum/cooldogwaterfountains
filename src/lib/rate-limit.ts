/**
 * Best-effort, in-memory rate limiting (fixed window per client and bucket).
 *
 * Each server instance keeps its own counts, so this slows down scripted abuse
 * from one address (password guessing, email bombing, fake PO orders) rather
 * than guaranteeing an exact limit. For a hard limit across all instances, add
 * a Vercel Firewall rate-limit rule for the same paths.
 */
type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();
let lastSweep = 0;

/** Counts one hit; returns how many seconds to wait when over `limit`, else 0. */
export function hit(key: string, limit: number, windowSeconds: number, now = Date.now()): number {
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
  }
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return 0;
  }
  current.count += 1;
  return current.count > limit ? Math.ceil((current.resetAt - now) / 1000) : 0;
}
