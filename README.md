# Varun Nagalla — Photography Portfolio

A 3D-animated personal photography portfolio with a single hardened admin account. The admin can upload an unlimited number of photos (with captions), edit all site copy, and change the background image — all live, with no rebuild required. No one else can log in or register; there is no public account system at all.

Live architecture and security details are in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Tech stack

- **Next.js 15** (App Router, TypeScript) — full-stack framework, server-rendered on every request
- **Tailwind CSS** — styling
- **React Three Fiber / drei / three.js** — the animated 3D hero (particle field + floating photo planes that respond to mouse movement)
- **NextAuth.js (Credentials provider)** — admin-only authentication, JWT sessions, no database of users
- **bcryptjs** — password hashing
- **Upstash Redis** (via Vercel's Marketplace integration) for site data (photos/content/settings) and **Vercel Blob** for uploaded files — chosen because Vercel's serverless Functions have a read-only filesystem at runtime, so anything written by the admin panel has to live somewhere other than local disk

## Getting started

```bash
npm install
cp .env.example .env.local   # then edit .env.local, see below
npm run dev
```

Visit `http://localhost:3000` for the public site and `http://localhost:3000/admin/login` to sign in as admin.

For a production-style run:

```bash
npm run build
npm start
```

## Environment variables (`.env.local`)

| Variable | Purpose |
|---|---|
| `ADMIN_USERNAME` | The only account that can log in (an email or username you choose) |
| `ADMIN_PASSWORD_HASH` | A **bcrypt hash** of the admin password — never the plain password |
| `NEXTAUTH_SECRET` | Random secret NextAuth uses to sign session tokens |
| `NEXTAUTH_URL` | The base URL of the site (`http://localhost:3000` locally) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store token — auto-set when you connect a Blob store to the project |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash Redis REST credentials — auto-set when you connect the Upstash-for-Redis Marketplace integration |

**Important — the one gotcha you can hit:** bcrypt hashes start with `$2a$` or `$2b$`. Next.js's env loader treats a bare `$` followed by a name as a variable reference and will silently mangle the hash, breaking login. Always escape every `$` as `\$` in `.env.local`, e.g.:

```
ADMIN_PASSWORD_HASH=\$2a\$12\$PsOQjBFDZxVUvkBIzIzQCOOqX8goL/uAu8hQUlKwwB.Utevwd.1Sm
```

To generate a properly escaped hash for a new password, use the included script — it does the escaping for you:

```bash
npm run hash-password -- "YourNewPassword"
```
Copy its output straight into `ADMIN_PASSWORD_HASH` in `.env.local` and restart the server.

`.env.local` is git-ignored and must never be committed.

## Where things are stored

- Site content (hero text, about copy, contact info): Redis key `content.json`
- Photo metadata (captions, order, URLs): Redis key `photos.json`
- Background image setting: Redis key `settings.json`
- Uploaded photo files: Vercel Blob, under `photos/`
- Uploaded background image: Vercel Blob, under `backgrounds/`

Nothing is stored on local disk in production — both Redis and Blob are reachable over HTTPS from any serverless Function instance, which is what makes this work on Vercel. (`src/lib/jsonStore.ts` keeps the exact same `readJson`/`writeJson`/`updateJson` interface a file-backed version would have had, so the rest of the data layer — `photos.ts`, `content.ts`, `settings.ts` — doesn't know or care that the backend is Redis instead of files.)

## Admin capabilities

Everything lives under `/admin` (redirects to `/admin/login` if you're not authenticated):

- **Photos** (`/admin/photos`) — upload any number of photos in a single batch, each with its own caption; edit captions, delete, and reorder existing photos. There is no artificial limit on file count; each file is still validated independently (real image-content check, 30MB size cap per file) so one bad file in a large batch doesn't block the rest.
- **Content** (`/admin/content`) — edit the hero title/subtitle, about section, and contact details shown on the public site.
- **Background** (`/admin/background`) — upload a new full-site background image, or reset to the default animated backdrop.

All changes appear on the public site immediately — pages are server-rendered on every request rather than cached at build time, specifically so admin edits never require a redeploy to show up.

## Security measures implemented

- Single hardcoded admin account via environment variables — no signup route exists anywhere in the app, no user database, nothing for an attacker to register against.
- Passwords hashed with bcrypt; the plaintext password is never stored.
- Login attempts are rate-limited (lockout after repeated failures from the same source) to resist brute-forcing.
- All `/admin` pages and `/api/admin/*` routes are protected twice: Next.js middleware blocks the request before it renders, and each route/layout independently re-checks the session server-side (defense in depth — neither check alone has to be perfect).
- Uploaded files are validated by inspecting actual file content (magic bytes), not by trusting the filename extension or the browser-supplied MIME type, which blocks disguised/malicious uploads.
- Per-file size cap (30MB) and server-side caption sanitization (control characters stripped, length capped).
- Captions are rendered through React's default escaping, so a caption containing `<script>` tags is displayed as harmless text, not executed.
- Security headers are set globally (`next.config.js`): Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Strict-Transport-Security, Referrer-Policy, Permissions-Policy, and `X-Powered-By` is removed.
- Dependencies pinned to patched versions (Next.js 15.5.19, next-auth 4.24.14, etc.) and regularly checked with `npm audit`; the only remaining advisories are moderate-severity issues bundled inside next-auth's own nested dependencies (not reachable through any input this app accepts) with no further upstream patch released yet.

## Testing performed

The full build (`npm run build`) and lint (`next lint`) are clean. A scripted end-to-end pass against a running server verified: unauthenticated visitors are redirected away from `/admin` and get `401`s from `/api/admin/*`; correct vs. incorrect admin credentials are handled correctly; a multi-file batch upload (6 valid images + 1 deliberately invalid file in the same request) succeeds for the valid files and reports the invalid one without blocking the batch; new uploads, caption edits, deletes, reordering, content edits, and background image changes all appear on the public site immediately with no server restart; and a caption containing a `<script>` payload is stored as plain text and rendered harmlessly as escaped text rather than executed.
