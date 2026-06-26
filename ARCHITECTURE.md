# Architecture

## Overview

This is a single Next.js 15 application (App Router, TypeScript) that serves both the public-facing photography site and the admin dashboard used to manage it. There is no separate backend service and no traditional SQL database — content lives as small JSON blobs in Upstash Redis, and uploaded images live in Vercel Blob storage. Both are reached over plain HTTPS REST calls from any Function instance, which is what makes this work at all on Vercel: serverless Functions have a read-only filesystem at runtime, so anything the admin panel writes (a caption edit, a new photo, a background image) has to live somewhere other than local disk or it would vanish the moment the Function's instance recycled.

```
Browser ──▶ Next.js (App Router)
              ├── Public pages (/, /gallery, /about, /contact)      — server-rendered every request
              ├── Admin pages (/admin/...)                          — server-rendered, session-gated
              ├── API routes (/api/...)                              — REST-style JSON endpoints
              └── Middleware                                         — runs before all of the above
                       │
                       ▼
              src/lib (data layer)
              ├── jsonStore.ts   — generic read/write/update, backed by Redis (was local files pre-Vercel)
              ├── photos.ts      — photo CRUD on top of jsonStore
              ├── content.ts     — site copy CRUD
              ├── settings.ts    — background image setting
              ├── auth.ts        — NextAuth config (Credentials provider)
              ├── fileValidation.ts — magic-byte image sniffing, size limits
              └── rateLimit.ts   — in-memory login throttling
                       │
                       ▼
              Upstash Redis (photos.json/content.json/settings.json as keys)
              Vercel Blob (photos/**, backgrounds/** — actual image files)
```

## Request flow and rendering strategy

By default, Next.js's App Router tries to statically pre-render any page or API route that doesn't call a dynamic API, baking its output in at build time. That's wrong for this site: the entire point of the admin panel is that uploading a photo, editing the hero text, or changing the background should show up for visitors immediately, not after a rebuild.

Every page and API route that reads site data (`/`, `/gallery`, `/about`, `/contact`, `/api/photos`, and all of `/api/admin/*`) explicitly sets:

```ts
export const dynamic = "force-dynamic";
```

This forces Next.js to render that route fresh on every request, reading current data from Redis/Blob each time instead of a build-time snapshot. The admin-protected pages under `/admin/(protected)` get this automatically anyway, because their shared layout calls `getServerSession()`, which Next.js already treats as dynamic.

## Authentication

There is exactly one account, defined entirely by two environment variables: `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` (a bcrypt hash). NextAuth's Credentials provider (`src/lib/auth.ts`) compares the submitted username/password against those env vars using bcrypt — there is no signup endpoint, no users table, and nothing in the codebase that could create a second account. Sessions are JWT-based (no server-side session store needed) and the JWT/session callbacks attach a `role: "admin"` claim that downstream checks rely on.

Login attempts are throttled by `src/lib/rateLimit.ts`: repeated failures from the same source trip a temporary lockout, which blunts brute-force attempts against the single account.

Authorization is checked in two independent places, intentionally:

1. **`middleware.ts`** runs before any matched route renders at all (`/admin`, `/admin/((?!login).*)`, `/api/admin/:path*`) and redirects/blocks unauthenticated requests immediately.
2. **Each protected layout/route also calls `getServerSession()` itself** and re-checks the session server-side.

If one layer ever had a bug or got bypassed, the other still holds — this is standard defense-in-depth rather than relying on a single gate.

## Photo upload pipeline

`POST /api/admin/photos` accepts a `multipart/form-data` request with any number of `files` entries (and a parallel `captions` entry per file). For each file, independently:

1. Check the declared size against a 30MB-per-file cap.
2. Read the actual file bytes and check the **magic bytes** (file signature) against known JPEG/PNG/GIF/WEBP headers — this is what actually determines whether it's treated as an image, not the filename extension or the `Content-Type` the browser sent. A `.jpg` that isn't really a JPEG is rejected here.
3. Sanitize the caption (strip control characters, cap length).
4. Upload the file to Vercel Blob (`put("photos/<uuid>.<ext>", buffer, { access: "public" })`) under a randomly generated filename (the original filename is never trusted or used as a key) and append a record — including the blob's public CDN URL — to the `photos.json` key in Redis via `jsonStore`.

There is no cap on how many files can be included in one request — each is evaluated on its own, so a batch of 50 files with one bad one will still save the other 49 and report the one rejection back to the admin UI. This was an explicit requirement: uploads are not artificially limited.

Deleting a photo (`DELETE /api/admin/photos/[id]`) removes its Redis record and calls Blob's `del(url)` on its file; `del()` is idempotent (no error if already gone) and free of charge. The background image route (`/api/admin/background`) follows the same upload/delete pattern for a single image instead of a list.

## Why Redis + Blob instead of local files

The very first version of this site (pre-Vercel) used `src/lib/jsonStore.ts` on top of plain files in `data/*.json`, with a write queue and atomic temp-file-then-rename writes. That worked well for a long-lived server process with a real disk, but Vercel's Functions have a **read-only filesystem at runtime** — any `fs.writeFile` either throws or, worse, appears to succeed and then is gone on the next invocation, since each invocation can land on a fresh instance.

`jsonStore.ts` now wraps Upstash Redis instead, but keeps the exact same exported signatures (`readJson`/`writeJson`/`updateJson`) so `photos.ts`/`content.ts`/`settings.ts` needed zero changes. Two things replace the old local-file safeguards:

- **A per-key Redis lock** (`SET key value NX EX 10`) inside `updateJson` — since Redis is reachable from every Function instance (unlike an in-process queue, which only protects writes within the same warm instance), a short-lived lock is what actually prevents two concurrent admin actions on the same record from interleaving.
- **Redis's own per-key write atomicity** — a `SET` either fully lands or doesn't; there's no equivalent of a half-written file to worry about.

For a single-admin personal site, write contention is essentially never going to happen in practice, but the lock makes `updateJson` correct rather than merely "probably fine."

## Security hardening summary

See the README's "Security measures implemented" section for the full list (headers, rate limiting, file-content validation, escaping, dependency pinning, etc.). The short version: there is nothing for an outside attacker to register or brute-force beyond one rate-limited login form, all admin surface area is checked twice, uploaded content is validated by its actual bytes rather than trusted metadata, and user-supplied text (captions, site copy) is never rendered as anything other than escaped text.

## The 3D hero

`src/components/Hero3D.tsx` is loaded client-side only via `src/components/Hero3DLoader.tsx`, a small `"use client"` wrapper that calls `next/dynamic(..., { ssr: false })` (Next.js 15 requires `ssr: false` to be set from a Client Component, not from the Server Component page itself, since WebGL has no meaningful server-side render). It composes two pieces under `src/components/three/`:

- `ParticleField.tsx` — an ambient particle backdrop
- `FloatingFrames.tsx` — the uploaded photos rendered as floating textured planes in 3D space, with a camera rig that responds to mouse/pointer movement, gently parallaxing the camera toward the cursor position each frame.
