# Development Roadmap — ClassQue-TeachAssist

---

## 🗺️ Milestone Breakdown

```mermaid
gantt
    title Development Phases
    dateFormat  YYYY-MM-DD
    section Phase 1: Foundation
    Agents & Skills Setup        :done, 2026-09-05, 1d
    Docs & Schema Blueprints     :done, 2026-09-05, 1d
    Project Init & D1 Config     :active, 2026-09-06, 2d
    section Phase 2: Core Hubs
    Classes & Students Hub       :2026-09-08, 3d
    Attendance & Live Stopwatch  :2026-09-11, 3d
    section Phase 3: Pedagogy
    CEFR Milestone Gradebook     :2026-09-14, 3d
    Structured Lesson Planner    :2026-09-17, 3d
    section Phase 4: Reports & Claims
    Claims & Honorarium Engine   :2026-09-20, 2d
    Parent Progress Report (A4)  :2026-09-22, 2d
    section Phase 5: Deploy
    Local-first Offline Sync     :2026-09-24, 2d
    Cloudflare Pages & Custom Domain :2026-09-26, 1d
```

---

## 🎯 Phase Descriptions

### Phase 1: Foundation & Infrastructure (Completed / In Progress)
- [x] Multi-agent skill setup (`.agents/skills/`).
- [x] Comprehensive PRD, Architecture, and Lessons Learned reference docs.
- [x] Production-grade D1 SQL schema definition (`docs/DATABASE_SCHEMA.sql`).
- [x] Initialize frontend bundle & Wrangler configuration.

### Phase 2: Core Teacher Hub & Live Cockpit
- [x] Build **Today's Cockpit** (Dashboard with next class, stopwatch, active tasks).
- [x] Build **Classes & Students Hub** (Cohorts management, student profiles, notes).
- [x] Build **Attendance Engine** (Fast 1-click status toggling, history log).

### Phase 3: CEFR Gradebook & Lesson Planner
- [x] Implement CEFR Competency framework & 4-stage micro-evaluations.
- [x] Implement 5-stage Lesson Planner with vocabulary/grammar banks and resource attachments.

### Phase 4: Claims & Parent Reporting
- [x] Build Teaching Claims calculation & invoice/claim sheet export.
- [x] Build Parent Progress Report generator with printable A4 styling and WhatsApp copy formats.

### Phase 5: Cloudflare Edge Deployment & Offline Sync
- [x] Integrate local-first IndexedDB buffer with Cloudflare Pages Functions & D1 sync.
- [ ] Deploy live to Cloudflare Pages on custom domain via Wrangler. *(Before the next deploy: set the `SYNC_TOKEN` secret — see `docs/CLOUDFLARE_SETUP.md` §5 — otherwise the edge API answers 503.)*

### Phase 6: Verification & Remediation (Stage 16) — see `docs/VERIFICATION_REPORT_2026-10.md`
- [x] Re-verify stages 01–15 in a real browser; document findings F1–F38.
- [x] Fix blockers, data-loss and security findings; add the `e2e/` suite (9 files, ~250 checks).
- [ ] Deploy Stage 16 (set `SYNC_TOKEN`, apply migrations, `npm run deploy`).
