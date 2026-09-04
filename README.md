# ClassQue-TeachAssist 📚
A centralized, single-panel personal operating system engineered specifically for teachers and educators to streamline daily classroom operations, planning, grading, claims, and reporting.

## 🌟 Mission
Teachers face immense cognitive friction switching between isolated tools for roll-call, lesson planning, student notes, milestone evaluations, parent reporting, and teaching claim calculations. ClassQue-TeachAssist provides a unified **Daily Teaching Loop**:
`Lesson Prep ➡️ Live Class Cockpit / Stopwatch ➡️ Roll-Call ➡️ CEFR Milestones ➡️ Parent Report / Claims`

## 🏗️ Architecture & Stack
Designed for **Cloudflare's 100% Free Tier**:
- **Frontend**: React 19, Vite, TailwindCSS v4, Zustand.
- **Backend/Data** (WIP): Cloudflare Pages Functions, Cloudflare D1 (Edge SQLite), Cloudflare KV.
- **Local-First Sync**: IndexedDB caching ensures classroom usage is offline-resilient.

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

### Build & Deploy
```bash
# Build for production
npm run build

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
