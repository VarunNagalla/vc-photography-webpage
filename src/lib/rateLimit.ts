// In-memory rate limiter / lockout for the admin login route.
// Scoped per-process, which is sufficient for a single-instance deployment.
// Keyed by IP so a remote attacker can't lock out the real admin from
// somewhere else, and resets automatically after the lockout window.

interface Attempt {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

const attempts = new Map<string, Attempt>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 6;
const LOCKOUT_MS = 15 * 60 * 1000;

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry) return { allowed: true };

  if (entry.lockedUntil && entry.lockedUntil > now) {
    return { allowed: false, retryAfterMs: entry.lockedUntil - now };
  }

  if (entry.lockedUntil && entry.lockedUntil <= now) {
    attempts.delete(key);
    return { allowed: true };
  }

  if (now - entry.firstAttempt > WINDOW_MS) {
    attempts.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttempt: now, lockedUntil: null });
    return;
  }

  const count = entry.count + 1;
  if (count >= MAX_ATTEMPTS) {
    attempts.set(key, { count, firstAttempt: entry.firstAttempt, lockedUntil: now + LOCKOUT_MS });
  } else {
    attempts.set(key, { count, firstAttempt: entry.firstAttempt, lockedUntil: null });
  }
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}
