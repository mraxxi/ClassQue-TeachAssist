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
Migrations live in `./migrations` (schema, shared CEFR milestones, multi-user indexes). Apply all of them:
```bash
# Local emulator
npx wrangler d1 migrations apply classque_db --local

# Live Cloudflare edge D1
npx wrangler d1 migrations apply classque_db --remote
```
New databases start with **no teachers and no demo data**. For a local sandbox with sample classes only, load the optional seed (never on production, it uses `INSERT OR REPLACE`):
```bash
npx wrangler d1 execute classque_db --local --file=./seeds/demo_data.sql
```
`docs/DATABASE_SCHEMA.sql` is a read-only reference copy of the full schema.

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

## 4. Teacher Login (Cloudflare Access)

Every teacher signs in with their email. **Cloudflare Access** (Zero Trust) shows the login page in front of the whole site and attaches a signed token to each request; the API verifies it and uses the email inside to pick that teacher's own data. ClassQue stores no passwords and sends no emails itself.

### Step 1: Pick a login method
In **Zero Trust** -> **Integrations** -> **Identity providers**, make sure **One-time PIN** is added (Cloudflare emails the teacher a one-time code). New Zero Trust accounts default to "Cloudflare" as the login method, which only suits people who are members of your Cloudflare account, so teachers will need One-time PIN (or Google, etc.).

### Step 2: Create one Access application for the whole site
1. **Zero Trust** -> **Access controls** -> **Applications** -> **Add an application** -> **Self-hosted**.
2. Add **every hostname** teachers use, with **no path** so `/api/*` is protected too:
   - your custom domain (e.g. `teach.yourdomain.com`)
   - `classque-teachassist.pages.dev`
   - optionally `*.classque-teachassist.pages.dev` for preview deployments
3. Add one **Allow** policy: **Include** -> **Emails** -> the teachers' addresses (or **Emails ending in** `@yourschool.edu`). To onboard a teacher later, just add their email here.
4. Save, then open the application and copy its **Application Audience (AUD) tag**.

Use a single application for all hostnames: the API checks one AUD value. Free-plan user limits are on Cloudflare's Zero Trust pricing page (50 users when this was written).

### Step 3: Tell the API how to verify the login
In the **Pages project** -> **Settings** -> **Variables and Secrets** (Production, and Preview if you use it):

| Variable | Value |
| --- | --- |
| `CF_ACCESS_TEAM_DOMAIN` | `<your-team-name>.cloudflareaccess.com` (the team name is the first part of the address on your Access login page, and is shown in Zero Trust settings) |
| `CF_ACCESS_AUD` | the AUD tag from Step 2 |
| `LEGACY_OWNER_EMAIL` | *(only if you already used the app before logins existed)* your own login email |

Never set `DEV_USER_EMAIL` in production. It is ignored once `CF_ACCESS_AUD` is set, but it exists for local development only.

### Step 4: Keep your existing data (only if you used ClassQue before logins)
Everything saved before logins lives under a placeholder teacher called `teacher-1`. The person named in `LEGACY_OWNER_EMAIL` becomes that teacher the **first** time they sign in, so their cohorts, lessons, claims and tasks are all still there.
1. `npx wrangler d1 migrations apply classque_db --remote`
2. Set `LEGACY_OWNER_EMAIL` (Step 3), deploy.
3. Sign in as that person **before anyone else does**. Everyone else starts with an empty account of their own.

If you signed in *before* setting `LEGACY_OWNER_EMAIL`, you got a new empty account and the old data is still under `teacher-1`. Fix: delete the empty account (`DELETE FROM teachers WHERE email = 'you@example.com';` while it has no data), set the variable, and sign in again.

### How it behaves
- **Separate data**: every sync read and write is limited to the signed-in teacher. IDs or teacher fields sent by the browser are ignored for ownership.
- **Offline classrooms**: each teacher's offline copy is stored in the browser under their email. If the connection drops, the app keeps working as the last signed-in teacher and syncs only after the server confirms that same email again. A different teacher signing in on the same browser gets their own copy.
- **Sign out**: Settings -> *Sign out* (goes to `/cdn-cgi/access/logout`).
- **Remove a teacher**: delete their email from the Access policy. To also block the account, set `deleted_at` on their `teachers` row (the API then answers 403).

### Troubleshooting
| Symptom | Likely cause |
| --- | --- |
| Settings says "Not verified yet" and nothing syncs | `/api/me` returns 401: `CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_AUD` missing or wrong, or the hostname is not covered by the Access application |
| Login page loops or the AUD check fails on `*.pages.dev` | That hostname belongs to a different Access application (different AUD); put all hostnames in one application |
| Old data is missing after login | See Step 4: the owner logged in before `LEGACY_OWNER_EMAIL` was set |

---

## 5. Local Development Workflow

Run the full local emulator with D1 SQLite bindings. Locally there is no Access login page, so create a git-ignored `.dev.vars` file that says who you are:

```bash
# .dev.vars  (never commit; used only when CF_ACCESS_AUD is not set)
DEV_USER_EMAIL=you@example.com
```

```bash
# Build the frontend, then start the Pages Functions emulator with D1
npm run build
npx wrangler pages dev ./dist --d1 DB=classque_db --port 8788
```

Without `DEV_USER_EMAIL` the API answers 401 and the app runs as a local-only guest (nothing syncs).
