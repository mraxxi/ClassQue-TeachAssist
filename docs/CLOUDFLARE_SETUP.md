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
# Execute initial schema on local emulator
npx wrangler d1 execute classque_db --local --file=./docs/DATABASE_SCHEMA.sql

# Execute initial schema on live Cloudflare edge D1
npx wrangler d1 execute classque_db --remote --file=./docs/DATABASE_SCHEMA.sql
```

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
