import "server-only";

/**
 * Light, best-effort fixed-window rate limiter keyed by client IP.
 *
 * State lives in this server instance's memory, so on serverless hosting each
 * instance counts separately and counts reset on cold starts. Good enough to
 * blunt casual scraping of the public API.
 * TODO(Phase 4): move to a shared store (e.g. Upstash Redis / Vercel KV or a
 * Supabase table) or the host's firewall rules for real protection.
 */
type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();
let lastSweep = 0;

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Occasionally drop expired windows so the map can't grow without bound.
  if (now - lastSweep > windowMs) {
    for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
    lastSweep = now;
  }

  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (current.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
  }
  current.count++;
  return { ok: true };
}

/** Like rateLimit() but without counting this call — for "count only failures" limits. */
export function peekRateLimit(key: string, limit: number): RateLimitResult {
  const current = windows.get(key);
  const now = Date.now();
  if (!current || current.resetAt <= now || current.count < limit) return { ok: true };
  return { ok: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
}

/** Best-effort client IP from standard proxy headers (set by Vercel, Netlify, etc.). */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip") || "unknown";
}
