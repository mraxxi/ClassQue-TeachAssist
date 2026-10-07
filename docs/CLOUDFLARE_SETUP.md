# Cloudflare Free-Tier Setup Guide

This guide details how to configure **Cloudflare Pages, Workers, D1 Database, and Custom Domains** entirely within the **100% Free Tier**.

---

## 1. Prerequisites & Login

Ensure you have Node.js 20+ installed, then verify or login to Cloudflare CLI:

```bash
# Authenticate Wrangler with your Cloudflare account
npx wrangler login

# Verify who you are logged in as
npx wrangler whoami
```

---

## 2. Cloudflare D1 (Edge SQLite) Setup

### Step 1: Create the D1 Database
```bash
npx wrangler d1 create classque_db
```
*Output will give you a `database_name` and `database_id` (UUID).*

### Step 2: Configure `wrangler.toml`
Paste the generated ID into `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "classque_db"
database_id = "<YOUR_DATABASE_ID_FROM_STEP_1>"
```

### Step 3: Run Database Migrations
```bash
# Apply ./migrations (schema + demo data + later changes) on the local emulator
npx wrangler d1 migrations apply classque_db --local

# ...and on the live Cloudflare edge D1
npx wrangler d1 migrations apply classque_db --remote
```
> **Migration `0005_multi_user_indexes.sql`** (teacher login) is schema only and safe on an existing database; see section 7.
> **Migration `0004_delta_sync.sql` must be applied to the remote D1 BEFORE deploying the delta-sync build** (it adds `client_updated_at` and the `updated_at` indexes the new API reads).
> `wrangler.toml` is git-ignored; copy `wrangler.toml.example` and fill in your `database_id`.
> `compatibility_date` is intentionally conservative (`2026-04-01`): a date newer than the installed wrangler
> supports makes `wrangler pages dev` refuse to start.

---

## 3. Cloudflare Pages & Custom Domain Setup

### Step 1: Create Pages Project
```bash
npx wrangler pages project create classque-teachassist --production-branch main
```

### Step 2: Bind Custom Domain
1. In the **Cloudflare Dashboard** -> **Workers & Pages** -> **classque-teachassist** -> **Custom Domains**.
2. Click **Set up a domain**, enter your subdomain (e.g. `teach.yourdomain.com` or root `yourdomain.com`).
3. Cloudflare will automatically configure the DNS CNAME and provision a free universal SSL certificate within seconds.

---

## 4. Local Development Workflow

Run the full local emulator with D1 SQLite bindings:

```bash
# Start Vite + Cloudflare Pages Functions edge emulator locally
npm run dev
# Or with Wrangler:
npx wrangler pages dev ./dist --d1 DB=classque_db --port 8788
```

---

## 5. Edge API Authentication — Cloudflare Access login

`/api/*` holds student and guardian data, so it needs a signed-in teacher and **fails closed** (`401` without a valid
login). The old shared `SYNC_TOKEN` is gone: there is nothing to paste into the app. Setup is in section 7.

## 6. Testing

```bash
npm run typecheck     # tsc (app) + tsc (functions)
npm run test:e2e      # builds, then runs every e2e/tests/*.test.mjs against a fresh local D1 each
npm run test:e2e -- 04 05   # only files whose name contains 04 or 05
```
Requires a Chromium binary (`CHROMIUM=/path/to/chromium`, default `/usr/bin/chromium`). See `e2e/README.md`.

## 7. Teacher Login (Cloudflare Access) — one account per login email

Several teachers can share one deployment. **Cloudflare Access** (Zero Trust) puts the login page in front of the
site and attaches a signed token to every request; the API verifies it and uses the email inside to pick that
teacher's own data. ClassQue stores no passwords and sends no emails itself. This login is the only protection of
the API (the old `SYNC_TOKEN` was removed), so **set it up before deploying**.

### Step 1: Create one Access application for the whole site
1. **Zero Trust** -> **Access controls** -> **Applications** -> **Add an application** -> **Self-hosted**.
2. Add **every hostname** teachers use, with **no path** so `/api/*` is covered too (your custom domain and `classque-teachassist.pages.dev`).
3. Add one **Allow** policy listing the teachers' emails (or **Emails ending in** `@yourschool.edu`). To onboard a teacher later, add their email here. Make sure **One-time PIN** is enabled under **Integrations -> Identity providers**.
4. Save, then copy the application's **Application Audience (AUD) tag**.

Use a single application for all hostnames: the API checks one AUD value.

### Step 2: Tell the API how to verify the login
**Pages project** -> **Settings** -> **Variables and Secrets** (Production, and Preview if used):

| Variable | Value |
| --- | --- |
| `CF_ACCESS_TEAM_DOMAIN` | `<your-team-name>.cloudflareaccess.com` |
| `CF_ACCESS_AUD` | the AUD tag from Step 1 |
| `LEGACY_OWNER_EMAIL` | *(only if you used ClassQue before logins existed)* your own login email |

Never set `DEV_USER_EMAIL` in production (it is ignored once `CF_ACCESS_AUD` is set, and exists for local development only).

### Step 3: Keep the data you already have
Everything saved before logins is stored under a placeholder teacher, `teacher-1`. The person named in
`LEGACY_OWNER_EMAIL` becomes that teacher the **first** time they sign in, so their cohorts, lessons, claims and tasks are still there.
1. `npx wrangler d1 migrations apply classque_db --remote` (applies `0005`, schema only).
2. Set `LEGACY_OWNER_EMAIL`, deploy.
3. Sign in as that person **before anyone else does**. Everyone else starts with an empty account of their own.

If you signed in *before* setting `LEGACY_OWNER_EMAIL` you got a new empty account and the old data is still under `teacher-1`.
Fix: delete the empty account (`DELETE FROM teachers WHERE email = 'you@example.com';` while it has no data), set the variable, sign in again.
A fresh database still gets the demo classes from migration `0002` under `teacher-1`; with no `LEGACY_OWNER_EMAIL` nobody sees them.

### How it behaves
- **Separate data**: every sync read and write is limited to the signed-in teacher. Ids or `teacherId` values sent by the browser never decide ownership; a record whose id belongs to someone else is refused (counted in `rejected`).
- **Offline classrooms**: each teacher's offline copy is stored in the browser under their email. If the connection drops, the app keeps working as the last signed-in teacher and syncs only after the server confirms that same email. A different teacher signing in on the same browser gets their own copy.
- **Sign out**: Settings -> *Sign out* (goes to `/cdn-cgi/access/logout`).
- **Remove a teacher**: delete their email from the Access policy. To also block the account, set `deleted_at` on their `teachers` row (the API then answers 403).

| Symptom | Likely cause |
| --- | --- |
| Badge says **Sign-in Needed / Perlu Masuk** | `/api/me` answers 401 "unauthenticated": `CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_AUD` missing or wrong, or the hostname is not covered by the Access application |
| Badge says **Sign-in Needed** right after a deploy that used to work | The deploy replaced the Pages variables. `wrangler pages deploy` with a `wrangler.toml` that has a `[vars]` block overwrites the dashboard variables, so `CF_ACCESS_*` vanish. See "Deploying safely" below |
| Old data is missing after login | The owner signed in before `LEGACY_OWNER_EMAIL` was set (Step 3) |

### Deploying safely (variables)
`npx wrangler pages deploy` reads `wrangler.toml` and **replaces the project's production variables with its `[vars]`
block**. If `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD` and `LEGACY_OWNER_EMAIL` are only set in the dashboard, a deploy from a
folder that has a `wrangler.toml` silently removes them and every login then fails with 401. Pick one way and keep to it:
- **Recommended:** write the three variables into the `[vars]` block of your local `wrangler.toml` (they are not secrets; keep that file out of git), or
- deploy from a folder without `wrangler.toml`, so the dashboard values stay.

After a deploy, check the variables are still on the latest deployment (Pages -> Deployments -> the deployment -> Variables).
Also keep the real `database_id` in `wrangler.toml`; the example file contains a placeholder that makes the deploy fail.

### Local development
Locally there is no Access login page. Put `DEV_USER_EMAIL=you@example.com` in `.dev.vars` (see `.dev.vars.example`).
Without it the API answers 401 and the app runs as a local-only guest. The e2e suite signs in as `e2e.teacher@classque.test` and loads a second
teacher from `e2e/tests/13-multi-user.seed.sql` to prove the two cannot see or change each other's rows.
