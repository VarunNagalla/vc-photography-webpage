import { createHash } from "node:crypto";
import { redis } from "./jsonStore";

// Shared atomic budget: count before checking the password so simultaneous
// attempts across serverless instances cannot bypass the six-attempt limit.
export async function checkRateLimit(key: string): Promise<{ allowed: boolean }> {
  const digest = createHash("sha256").update(key).digest("hex");
  const count = await redis.eval<[number], number>(
    "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return n",
    [`login-attempts:${digest}`], [15 * 60]
  );
  return { allowed: count <= 6 };
}
