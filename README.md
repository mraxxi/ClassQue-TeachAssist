# ClassQue-TeachAssist 📚
A centralized, single-panel personal operating system engineered specifically for teachers and educators to streamline daily classroom operations, planning, grading, claims, and reporting.

## 🌟 Mission
Teachers face immense cognitive friction switching between isolated tools for roll-call, lesson planning, student notes, milestone evaluations, parent reporting, and teaching claim calculations. ClassQue-TeachAssist provides a unified **Daily Teaching Loop**:
`Lesson Prep ➡️ Live Class Cockpit / Stopwatch ➡️ Roll-Call ➡️ CEFR Milestones ➡️ Parent Report / Claims`

## 🏗️ Architecture & Stack
Designed for **Cloudflare's 100% Free Tier**:
- **Frontend**: React 19, Vite, TailwindCSS v4, Zustand; light / dark / system themes, phone-first layouts, self-hosted fonts.
- **Backend/Data**: Cloudflare Pages Functions (`functions/api/sync.ts`, bearer-token protected), Cloudflare D1 (Edge SQLite).
- **Local-First Sync**: every edit is written to `localStorage` immediately and pushed to D1 in the background; a service worker lets the app open offline; sync is incremental (delta) with per-record conflict resolution. See `docs/ARCHITECTURE.md` §3.

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v20+)
- npm

### Setup
```bash
git clone https://github.com/yourusername/ClassQue-TeachAssist.git
cd ClassQue-TeachAssist
npm install
npm run dev
```

### Run the full stack locally (Pages Functions + D1)
```bash
cp wrangler.toml.example wrangler.toml      # then set your d1 database_id
cp .dev.vars.example .dev.vars              # SYNC_TOKEN for the edge API
npx wrangler d1 migrations apply classque_db --local
npm run build && npx wrangler pages dev ./dist --d1 DB=<database_id>
```
Enter the same token in **Settings → Sync Token**. Without a token the app still works (offline-only).

### Test
```bash
npm run typecheck
npm run test:e2e        # Playwright suite, fresh local D1 per file (see e2e/README.md)
```

### Build & Deploy
```bash
# Build for production
npm run build

# One-time: protect the edge API (see docs/CLOUDFLARE_SETUP.md §5)
npx wrangler pages secret put SYNC_TOKEN --project-name classque-teachassist

# Deploy to Cloudflare Pages (Requires Wrangler authenticated)
npm run deploy
```

## 📖 Core Domains
Unlike prototype versions with fragmented tabs, this OS is structured into **5 Consolidated Domains**:
1. 📊 **Today's Cockpit**: High-impact daily view (next class, stopwatch, tasks, hours).
2. 👥 **Classes & Students Hub**: Unified tabbed container for Cohorts, Directory, CEFR Grades, and Roll-Call.
3. 📖 **Lesson Planner**: Structured curriculum plans, vocabulary banks, and scaffolds.
4. 📑 **Claims & Reports**: Automated honorarium claim generation and parent report templates.
5. ⚙️ **Settings**: Data sync, presets, and profile configuration.

## 🤝 Contributing
Please read the internal `.agents/README-AGENT.md` and `docs/` folder to understand our strict UI/UX and architectural guidelines before making structural changes.
