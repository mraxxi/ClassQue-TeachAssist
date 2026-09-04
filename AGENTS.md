# ClassQue-TeachAssist — Agent Guidelines & Project Principles

Welcome to **ClassQue-TeachAssist**, a centralized, single-panel personal operating system engineered specifically for teachers and educators to streamline daily classroom operations, planning, grading, claims, and reporting.

---

## 🎯 Project Core Mission

Teachers face immense cognitive friction switching between isolated tools for roll-call, lesson planning, student notes, milestone evaluations, parent reporting, and teaching claim calculations. 

**ClassQue-TeachAssist** provides a unified **Daily Teaching Loop**:
`Lesson Prep ➡️ Live Class Cockpit / Stopwatch ➡️ Roll-Call ➡️ CEFR Milestones ➡️ Parent Report / Claims`

---

## ☁️ Target Architecture & Cloudflare Free-Tier Hosting

The application is deployed entirely within **Cloudflare's 100% Free Tier** on a custom domain managed by Cloudflare:

1. **Frontend & Static Hosting**: Cloudflare Pages (Vite / React / TypeScript / Vanilla CSS or TailwindCSS).
2. **Backend & Serverless Compute**: Cloudflare Pages Functions / Cloudflare Workers.
3. **Database**: Cloudflare D1 (Serverless SQLite at the edge).
4. **Key-Value / Cache**: Cloudflare KV (for quick session tokens, cached lesson templates, or config).
5. **Asset Storage (Optional)**: Cloudflare R2 (for worksheet PDF uploads or report exports).
6. **CLI & Deployment**: All infrastructure and deployments are driven via `wrangler`.

---

## 🏛️ 5 Core Domain Modules (No Bloat Architecture)

Unlike prototype versions with 12+ fragmented navigation tabs, this project is structured into **5 Consolidated Domains**:

1. **📊 Today's Cockpit (Dashboard)**:
   - High-impact daily view: Next class, quick stopwatch/timer, urgent tasks, today's teaching hours summary.
2. **👥 Classes & Students Hub**:
   - Unified tabbed container: Class Cohorts ↔ Student Directory ↔ CEFR Milestone Gradebook ↔ Attendance / Roll-Call History.
3. **📖 Lesson Planner & Scaffolder**:
   - Structured curriculum plans, vocabulary banks, lesson scaffolds, and downloadable resources.
4. **📑 Claims & Reports**:
   - **Teaching Claims**: Hourly rates, completed class sessions, automated claim/invoice generation for institutions.
   - **Parent Reports**: AI-assisted milestone summaries, student progress narratives, printable A4 cards & WhatsApp message formatting.
5. **⚙️ Settings & Data Sync**:
   - Offline storage status (IndexedDB/local storage), Cloudflare D1 sync settings, class schedule presets, CEFR framework configuration.

---

## 🤖 Multi-Agent / Skill Specializations

When interacting with this repository, agents should leverage the specialized skills located in `.agents/skills/`:

- **`cf-wrangler-ops`**: Cloudflare D1 migrations, Pages Functions, Wrangler commands, and edge deployments.
- **`teacher-domain-architect`**: Pedagogical data models (CEFR rubrics, attendance tracking, lesson staging, honorarium rates).
- **`ui-ux-cockpit`**: Teacher-optimized UX design (distraction-free live class stopwatch, fast keyboard shortcuts, printable A4 exports).
- **`d1-schema-manager`**: Edge SQLite schema evolution, foreign key integrity, migrations, and local-first data sync strategies.

---

## 🛡️ Coding & Quality Guidelines

- **Ubiquitous Language & Terminology**: Adhere strictly to canonical terms defined in [docs/TERMINOLOGY.md](file:///home/archvan/development/ClassQue-TeachAssist/docs/TERMINOLOGY.md) (e.g. `Cohort`, `Teaching Session`, `Live Cockpit`, `Roll-Call`, `Teaching Claim`). Never scatter confusing synonyms across code or UI.
- **Maintainability & Modularity**: Keep components clean, typed with TypeScript, with single responsibility.
- **Local-First & Offline Resilience**: A teacher in a classroom must never lose attendance or notes due to flaky school Wi-Fi. All write operations must buffer locally and sync to Cloudflare D1.
- **Strict Free-Tier Efficiency**: Minimize unnecessary D1 read/write rounds by caching static frameworks (like CEFR rubrics) and batching updates.
- **Clean Styling**: Curated typography, accessible contrast, responsive layout for tablets/desktops/phones, smooth micro-interactions.
