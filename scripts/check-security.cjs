const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { randomUUID, createHash } = require("node:crypto");

function load(file, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, Buffer, URL, Request, File, process,
    setTimeout, console, require: name => name in mocks ? mocks[name] : require(name) });
  return exports;
}

async function main() {
  let session = null;
  const { authorizeAdmin } = load("src/lib/adminAccess.ts", {
    "next-auth": { getServerSession: async () => session }, "./auth": { authOptions: {} },
  });
  const request = (method, origin) => new Request("https://portfolio.example/api/admin/photos", {
    method, headers: origin ? { origin } : {},
  });
  assert.equal((await authorizeAdmin(request("GET"))).status, 401);
  session = { user: { role: "viewer" } };
  assert.equal((await authorizeAdmin(request("GET"))).status, 401);
  session = { user: { role: "admin" } };
  assert.equal(await authorizeAdmin(request("GET")), null);
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    assert.equal((await authorizeAdmin(request(method))).status, 403);
    assert.equal((await authorizeAdmin(request(method, "https://evil.example"))).status, 403);
    assert.equal(await authorizeAdmin(request(method, "https://portfolio.example")), null);
  }

  const { sniffImage, isWithinSizeLimit } = load("src/lib/fileValidation.ts");
  for (const hex of ["89504e470d0a1a0a00000000", "474946383961000000000000", "ffd8ff000000000000000000"]) {
    assert.equal(sniffImage(Buffer.from(hex, "hex")).valid, true);
  }
  for (const hex of ["89504e470000000000000000", "474946380000000000000000"]) {
    assert.equal(sniffImage(Buffer.from(hex, "hex")).valid, false);
  }
  for (const size of [NaN, Infinity, -1, 0, 1.5, 31 * 1024 * 1024]) assert.equal(isWithinSizeLimit(size), false);
  assert.equal(isWithinSizeLimit(1024), true);

  // Every exported admin handler must reject without invoking its data layer,
  // even when called directly without middleware.
  const paths = fs.readdirSync("src/app/api/admin", { recursive: true })
    .filter(p => p.endsWith("route.ts"));
  for (const path of paths) {
    const source = fs.readFileSync(`src/app/api/admin/${path}`, "utf8");
    const mocks = { "@/lib/adminAccess": { authorizeAdmin: async () => new Response(null, { status: 401 }) } };
    for (const [, name] of source.matchAll(/from "(@\/lib\/[^\"]+)"/g)) {
      if (!(name in mocks)) mocks[name] = new Proxy({}, { get() { return () => { throw new Error("Unauthorized data access"); }; } });
    }
    const handlers = load(`src/app/api/admin/${path}`, mocks);
    for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
      if (handlers[method]) assert.equal((await handlers[method](request(method), { params: Promise.resolve({ id: randomUUID() }) })).status, 401);
    }
  }

  // Upload and metadata failures must not delete the previous image.
  for (const [route, field, setter] of [["background", "backgroundImage", "setBackgroundImage"], ["about-photo", "aboutImage", "setAboutImage"], ["logo", "logoImage", "setLogoImage"]]) {
    for (const failure of ["upload", "metadata", null]) {
      const events = [];
      const handlers = load(`src/app/api/admin/${route}/route.ts`, {
        "@/lib/adminAccess": { authorizeAdmin: async () => null },
        "@/lib/fileValidation": { sniffImage, isWithinSizeLimit },
        "@/lib/settings": {
          getSettings: async () => ({ [field]: "https://old.example/photo.jpg" }),
          [setter]: async () => { events.push("save"); if (failure === "metadata") throw new Error("metadata failed"); return {}; },
        },
        "@vercel/blob": {
          put: async () => { events.push("upload"); if (failure === "upload") throw new Error("upload failed"); return { url: "https://new.example/photo.jpg" }; },
          del: async () => { events.push("delete"); },
        },
      });
      const file = new File([Buffer.from("89504e470d0a1a0a00000000", "hex")], "photo.png");
      const operation = handlers.POST({ formData: async () => ({ get: () => file }) });
      if (failure) {
        await assert.rejects(operation);
        assert.ok(!events.includes("delete"));
      } else {
        assert.equal((await operation).status, 200);
        assert.deepEqual(events, ["upload", "save", "delete"]);
      }
    }
  }

  // Existing settings predate the logo field; changing it preserves the others.
  let stored = { aboutImage: "https://example.com/about.jpg", backgroundImage: "" };
  const settings = load("src/lib/settings.ts", { "./jsonStore": {
    readJson: async () => stored,
    updateJson: async (_key, _fallback, update) => (stored = update(stored)),
  } });
  assert.equal((await settings.getSettings()).logoImage, "");
  const logoHandlers = load("src/app/api/admin/logo/route.ts", {
    "@/lib/adminAccess": { authorizeAdmin: async () => null },
    "@/lib/fileValidation": { sniffImage },
    "@/lib/settings": settings,
    "@vercel/blob": { put: async () => ({ url: "https://example.com/logo.png" }), del: async () => {} },
  });
  const upload = file => logoHandlers.POST({ formData: async () => ({ get: () => file }) });
  assert.equal((await upload(new File([Buffer.alloc(4 * 1024 * 1024 + 1)], "large.png"))).status, 400);
  assert.equal((await upload(new File(["not an image"], "fake.png"))).status, 400);
  assert.equal((await upload(new File([Buffer.from("89504e470d0a1a0a00000000", "hex")], "logo.png"))).status, 200);
  assert.equal(stored.logoImage, "https://example.com/logo.png");
  assert.equal(stored.aboutImage, "https://example.com/about.jpg");
  assert.equal((await logoHandlers.DELETE(request("DELETE"))).status, 200);
  assert.equal(stored.logoImage, "");
  assert.equal(stored.aboutImage, "https://example.com/about.jpg");

  // Exercise the actual Redis Lua script with a unique expiring test key.
  require("@next/env").loadEnvConfig(process.cwd());
  const { Redis } = require("@upstash/redis");
  const redis = new Redis({ url: process.env.RECOVERY_KV_REST_API_URL, token: process.env.RECOVERY_KV_REST_API_TOKEN });
  const key = `security-check:${randomUUID()}`;
  const redisKey = `login-attempts:${createHash("sha256").update(key).digest("hex")}`;
  try {
    const first = load("src/lib/rateLimit.ts", { "./jsonStore": { redis } });
    const second = load("src/lib/rateLimit.ts", { "./jsonStore": { redis } });
    const results = await Promise.all(Array.from({ length: 12 }, (_, i) =>
      (i % 2 ? first : second).checkRateLimit(key)));
    assert.equal(results.filter(r => r.allowed).length, 6);
    const ttl = await redis.ttl(redisKey);
    assert.ok(ttl > 0 && ttl <= 900);
  } finally {
    await redis.del(redisKey);
  }
  console.log("Security checks passed: role/origin guards, all admin routes, image signatures, safe image replacement, shared concurrent login limit.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
