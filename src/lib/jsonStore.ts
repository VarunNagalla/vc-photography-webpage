import { Redis } from "@upstash/redis";
import { randomUUID } from "crypto";

// Storage backend for all site data (photos, content copy, settings).
//
// This used to be local JSON files on disk (see git history) — that
// worked fine for a single long-lived server process with a persistent
// disk, but breaks on Vercel: serverless Functions have a read-only
// filesystem at runtime, so writes from /admin would either fail or
// silently vanish on the next invocation. Redis (via the Upstash
// integration in the Vercel Marketplace) gives the same "small JSON
// blob per logical file" model without needing a real database, and
// works identically in local dev and in production as long as
// KV_REST_API_URL / KV_REST_API_TOKEN (or the UPSTASH_REDIS_REST_*
// equivalents) are set.
//
// The exported function names and signatures (readJson/writeJson/
// updateJson) are unchanged from the old file-backed version, so
// photos.ts / content.ts / settings.ts needed no changes at all.

const redis = Redis.fromEnv();

// Upstash Redis is reachable from anywhere (it's a REST API), so a
// single in-process write queue isn't enough to prevent two concurrent
// serverless invocations from interleaving a read-modify-write. A
// short-lived SET NX EX lock gives real cross-instance mutual exclusion
// for the rare case of two admin actions landing at the same moment —
// this is a single-admin site, so contention is expected to be
// essentially nonexistent, but the lock makes updateJson() correct
// rather than just "probably fine."
async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const lockKey = `lock:${key}`;
  const lockId = randomUUID();
  let acquired = false;

  for (let attempt = 0; attempt < 50; attempt++) {
    const result = await redis.set(lockKey, lockId, { nx: true, ex: 10 });
    if (result === "OK") {
      acquired = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  if (!acquired) {
    throw new Error(`Could not acquire lock for "${key}" — another write is in progress`);
  }

  try {
    return await fn();
  } finally {
    // Only clear the lock if we still own it, so a slow holder can
    // never delete a newer holder's lock after its own TTL expired.
    const current = await redis.get<string>(lockKey);
    if (current === lockId) {
      await redis.del(lockKey);
    }
  }
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  const data = await redis.get<T>(file);
  if (data === null || data === undefined) {
    await writeJson(file, fallback);
    return fallback;
  }
  return data;
}

export async function writeJson<T>(file: string, data: T): Promise<void> {
  await redis.set(file, data);
}

export async function updateJson<T>(
  file: string,
  fallback: T,
  updater: (current: T) => T
): Promise<T> {
  return withLock(file, async () => {
    const current = (await redis.get<T>(file)) ?? fallback;
    const updated = updater(current);
    await redis.set(file, updated);
    return updated;
  });
}
