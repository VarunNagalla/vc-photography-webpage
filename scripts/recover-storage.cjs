// Explicit disaster recovery: reconstruct missing metadata from existing public
// uploads. SET NX never replaces existing records, including an empty gallery.
const { list } = require("@vercel/blob");
const { Redis } = require("@upstash/redis");
const { randomUUID } = require("node:crypto");

async function main() {
  const redis = new Redis({
    url: process.env.RECOVERY_KV_REST_API_URL,
    token: process.env.RECOVERY_KV_REST_API_TOKEN,
  });
  const blobs = [];
  let cursor;
  do {
    const page = await list({ cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const photos = blobs.filter(b => b.pathname.startsWith("photos/"))
    .sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt))
    .map((b, order) => ({ id: randomUUID(), filename: b.pathname,
      url: b.url, caption: "", order, createdAt: new Date(b.uploadedAt).toISOString() }));
  const newest = prefix => blobs.filter(b => b.pathname.startsWith(prefix))
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0]?.url || "";
  const saved = await redis.set("photos.json", photos, { nx: true });
  await redis.set("settings.json", {
    backgroundImage: newest("backgrounds/"), aboutImage: newest("about/"),
  }, { nx: true });
  console.log(`Recovery: ${blobs.length} files found; ${photos.length} gallery photos; ${saved ? "metadata restored" : "existing metadata preserved"}.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
