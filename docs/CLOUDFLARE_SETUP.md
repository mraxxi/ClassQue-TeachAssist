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

## 5. Edge API Authentication (`SYNC_TOKEN`) — required

`/api/sync` holds student and guardian data, so it is protected by a shared secret and **fails closed**
(`503 unconfigured` until the secret exists).

```bash
# 1. Generate a long random token
openssl rand -base64 32

# 2. Store it as a Pages secret (production). Redeploy is not needed; secrets apply to new requests.
npx wrangler pages secret put SYNC_TOKEN --project-name classque-teachassist

# 3. Local development: copy .dev.vars.example to .dev.vars (git-ignored) and paste the same value
cp .dev.vars.example .dev.vars
```

Then open the app → **Settings → Cloudflare D1 Edge & Offline Engine → Sync Token**, paste the token and press
*Save Token*. Each device you use needs the token once. Until it is entered the app works fully offline and the sync
badge reads **Perlu Token / Token Needed**; a wrong token reads **Token Ditolak / Token Rejected**.

## 6. Testing

```bash
npm run typecheck     # tsc (app) + tsc (functions)
npm run test:e2e      # builds, then runs every e2e/tests/*.test.mjs against a fresh local D1 each
npm run test:e2e -- 04 05   # only files whose name contains 04 or 05
```
Requires a Chromium binary (`CHROMIUM=/path/to/chromium`, default `/usr/bin/chromium`). See `e2e/README.md`.
