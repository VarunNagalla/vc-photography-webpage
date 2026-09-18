# Varun Nagalla — Photography Portfolio

https://vcphotography-portfolio.vercel.app/

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

The September 2026 recovery uses the connected `vc-portfolio-recovery` Redis
resource (`RECOVERY_KV_REST_API_URL` / `RECOVERY_KV_REST_API_TOKEN`). When those
variables are absent, the app uses the original Upstash/KV variables.
The public page falls back to built-in content during a storage outage; admin
writes still require working storage. Check this with
`node scripts/check-storage-outage.cjs`.

`node scripts/recover-storage.cjs` is an explicit disaster-recovery command,
not a normal build step. Run only when restoring missing metadata from the
existing Blob store, with its authorized environment credentials. It preserves
existing Redis keys, including an empty gallery. Reconstructed photos have blank
captions and upload-date order; missing settings use the newest matching upload.
It cannot recover original captions or custom text from deleted Redis data.

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
- **Logo** (`/admin/logo`) — one upload updates the website header and the image beside Let’s Connect (PNG, JPEG, WebP or GIF, up to 4 MB). Removing it clears both placements and restores VN in the header. Changes are saved immediately.

All changes appear on the public site immediately — pages are server-rendered on every request rather than cached at build time, specifically so admin edits never require a redeploy to show up.

## Security measures implemented

Run `npm run test:security` with the recovery Redis credentials available in
the environment or `.env.production.local`. The integration check creates one
unique, expiring login-limit test key and deletes it afterward. It does not
change site content, photos, or real login counters. Run `npm audit` to check
the locked dependencies against current advisories.

- Single hardcoded admin account via environment variables — no signup route exists anywhere in the app, no user database, nothing for an attacker to register against.
- Passwords hashed with bcrypt; the plaintext password is never stored.
- Login attempts share an atomic Redis limit of six attempts per IP per 15-minute window across all Vercel instances. Authentication fails closed if the limiter is unavailable.
- Every admin API handler independently checks the admin role. Mutations require a matching Origin header and reject cross-site requests.
- Successful login always opens `/admin`; untrusted callback URLs are not used for navigation.
- All `/admin` pages and `/api/admin/*` routes are protected twice: Next.js middleware blocks the request before it renders, and each route/layout independently re-checks the session server-side (defense in depth — neither check alone has to be perfect).
- Uploaded files are validated by inspecting actual file content (magic bytes), not by trusting the filename extension or the browser-supplied MIME type, which blocks disguised/malicious uploads.
- Background and About image replacement saves the new image metadata before deleting the old file.
- Per-file size cap (30MB) and server-side caption sanitization (control characters stripped, length capped).
- Captions are rendered through React's default escaping, so a caption containing `<script>` tags is displayed as harmless text, not executed.
- Security headers are set globally (`next.config.js`): Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Strict-Transport-Security, Referrer-Policy, Permissions-Policy, and `X-Powered-By` is removed.
- Dependencies pinned to patched versions (Next.js 15.5.19, next-auth 4.24.14, etc.) and regularly checked with `npm audit`; the only remaining advisories are moderate-severity issues bundled inside next-auth's own nested dependencies (not reachable through any input this app accepts) with no further upstream patch released yet.

## Testing performed

The full build (`npm run build`) and lint (`next lint`) are clean. A scripted end-to-end pass against a running server verified: unauthenticated visitors are redirected away from `/admin` and get `401`s from `/api/admin/*`; correct vs. incorrect admin credentials are handled correctly; a multi-file batch upload (6 valid images + 1 deliberately invalid file in the same request) succeeds for the valid files and reports the invalid one without blocking the batch; new uploads, caption edits, deletes, reordering, content edits, and background image changes all appear on the public site immediately with no server restart; and a caption containing a `<script>` payload is stored as plain text and rendered harmlessly as escaped text rather than executed.
