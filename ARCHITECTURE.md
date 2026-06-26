# Architecture

## Overview

This is a single Next.js 14 application (App Router, TypeScript) that serves both the public-facing photography site and the admin dashboard used to manage it. There is no separate backend service and no traditional database — content lives in small JSON files on disk, and uploaded images live in `public/uploads/`. This is a deliberate choice for a single-admin personal site: it removes an entire category of database setup/operational complexity while still being safe, atomic, and easy to back up (it's just files).

```
Browser ──▶ Next.js (App Router)
              ├── Public pages (/, /gallery, /about, /contact)      — server-rendered every request
              ├── Admin pages (/admin/...)                          — server-rendered, session-gated
              ├── API routes (/api/...)                              — REST-style JSON endpoints
              └── Middleware                                         — runs before all of the above
                       │
                       ▼
              src/lib (data layer)
              ├── jsonStore.ts   — generic read/write/update with a write queue + atomic writes
              ├── photos.ts      — photo CRUD on top of jsonStore
              ├── content.ts     — site copy CRUD
              ├── settings.ts    — background image setting
              ├── auth.ts        — NextAuth config (Credentials provider)
              ├── fileValidation.ts — magic-byte image sniffing, size limits
              └── rateLimit.ts   — in-memory login throttling
                       │
                       ▼
              data/*.json  +  public/uploads/**
```

## Request flow and rendering strategy

By default, Next.js's App Router tries to statically pre-render any page or API route that doesn't call a dynamic API, baking its output in at build time. That's wrong for this site: the entire point of the admin panel is that uploading a photo, editing the hero text, or changing the background should show up for visitors immediately, not after a rebuild.

Every page and API route that reads site data (`/`, `/gallery`, `/about`, `/contact`, `/api/photos`, and all of `/api/admin/*`) explicitly sets:

```ts
export const dynamic = "force-dynamic";
```

This forces Next.js to render that route fresh on every request, reading the current JSON files from disk each time. The admin-protected pages under `/admin/(protected)` get this automatically anyway, because their shared layout calls `getServerSession()`, which Next.js already treats as dynamic.

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
4. Write the file to `public/uploads/photos/` under a randomly generated filename (the original filename is never trusted or used on disk) and append a record to `data/photos.json` via the write-queued JSON store.

There is no cap on how many files can be included in one request — each is evaluated on its own, so a batch of 50 files with one bad one will still save the other 49 and report the one rejection back to the admin UI. This was an explicit requirement: uploads are not artificially limited.

## Why a JSON file instead of a real database

`src/lib/jsonStore.ts` provides `readJson`/`writeJson`/`updateJson` on top of plain files, with two safeguards that matter once you have concurrent requests:

- **A write queue** (`enqueue`) — all writes to a given file are chained through a promise queue, so two simultaneous admin actions can't interleave and corrupt the file.
- **Atomic writes** — every write goes to a temp file first, then is renamed over the real file, so a crash mid-write can never leave a half-written, corrupted JSON file behind.

For a single-admin personal site this gives the durability properties that matter without the operational overhead of running a database server.

## Security hardening summary

See the README's "Security measures implemented" section for the full list (headers, rate limiting, file-content validation, escaping, dependency pinning, etc.). The short version: there is nothing for an outside attacker to register or brute-force beyond one rate-limited login form, all admin surface area is checked twice, uploaded content is validated by its actual bytes rather than trusted metadata, and user-supplied text (captions, site copy) is never rendered as anything other than escaped text.

## The 3D hero

`src/components/Hero3D.tsx` is loaded client-side only (via `next/dynamic` with `ssr: false`, since WebGL has no meaningful server-side render) and composes two pieces under `src/components/three/`:

- `ParticleField.tsx` — an ambient particle backdrop
- `FloatingFrames.tsx` — the uploaded photos rendered as floating textured planes in 3D space, with a camera rig that responds to mouse movement for the parallax effect

Because it's dynamically imported, the rest of the page (which is server-rendered for content/SEO) doesn't wait on or get blocked by the WebGL bundle.
