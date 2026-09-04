---
name: cf-wrangler-ops
description: >-
  Workflows for Cloudflare ecosystem operations using Wrangler CLI. Use this skill when configuring, deploying, debugging, or managing Cloudflare Pages, Workers, D1 SQL databases, KV bindings, or custom domains.
---

# Cloudflare & Wrangler Operations Skill

This skill provides standard procedures for building, running, and deploying **ClassQue-TeachAssist** on Cloudflare's free tier.

---

## 🛠️ Key Wrangler Commands

### 1. Local Development
```bash
# Start frontend + Pages Functions / Worker emulation locally
npx wrangler pages dev ./dist --d1 DB=classque_db --port 8788

# Run D1 migrations locally
npx wrangler d1 migrations apply classque_db --local

# Query local D1 database
npx wrangler d1 execute classque_db --local --command="SELECT * FROM cohorts;"
```

### 2. Remote Cloudflare D1 Management
```bash
# Create remote D1 database (one-time setup)
npx wrangler d1 create classque_db

# Apply migrations to remote production D1
npx wrangler d1 migrations apply classque_db --remote

# Inspect remote tables
npx wrangler d1 execute classque_db --remote --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### 3. Production Deployment to Cloudflare Pages
```bash
# Build frontend bundle
npm run build

# Deploy directly via Wrangler to Cloudflare Pages
npx wrangler pages deploy ./dist --project-name=classque-teachassist
```

---

## 🔒 Cloudflare Free-Tier Resource Constraints

Agents must ensure code complies with Cloudflare Free-Tier limits:
- **Cloudflare D1**: 5M rows read/day, 100k rows written/day, 500MB storage per database.
- **Cloudflare Pages / Workers**: 100k requests/day, 10ms CPU time per request.
- **Cloudflare KV**: 100k reads/day, 1k writes/day, 1GB stored data.

### Optimization Rules
1. **Batch Writes**: Group batch attendance updates or bulk student edits into single multi-row SQL transactions.
2. **Local Caching**: Store read-heavy static reference data (CEFR rubrics, vocabulary lists) in IndexedDB / local storage so queries don't hit D1 unnecessarily.
3. **Prepared Statements**: Always use parameter binding (`stmt.bind(...)`) to prevent SQL injection and enable edge execution caching.
