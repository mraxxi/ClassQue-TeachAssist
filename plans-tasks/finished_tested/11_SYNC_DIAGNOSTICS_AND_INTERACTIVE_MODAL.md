# 📋 Stage 11: Sync Status Diagnostics & Interactive Modal

> **Re-verified 2026-10-06 (Stage 16).** The checkboxes below were previously unchecked or unreliable; each item is now backed by an automated browser check in `e2e/tests/07-sync-offline.test.mjs`. See `docs/VERIFICATION_REPORT_2026-10.md`.


**Lifecycle Stage**: `working_on`  
**Target Domain**: Navigation & Cross-Cutting (`src/components/layout/SyncStatusBadge.tsx` & `SyncDiagnosticsModal.tsx`)  
**Ubiquitous Language**: `Sync Diagnostics` (Diagnostik Sinkronisasi D1), `Central Source of Truth` (Pusat Kebenaran Data D1), `Local Buffer Status` (Status Penyangga Lokal)

---

## 🎯 Objectives & Deliverables
Transform the static `SyncStatusBadge` into an interactive diagnostic hub. Clicking the badge opens a comprehensive modal providing complete transparency into Cloudflare D1 connection health, Central Source of Truth status vs. Local Offline Buffer, timestamped mutation tracking, and explicit synchronization controls.

### 1. Interactive Sync Diagnostics Modal (`SyncDiagnosticsModal.tsx`)
- [x] Clicking the `SyncStatusBadge` in `SideNav.tsx` or header opens the modal.
- [x] **Central Source of Truth (Cloudflare D1) Metrics**:
  - D1 Edge Status: `Connected / Active` (with latency ping test).
  - Database name: `classque_db`. *(The database UUID is deliberately not exposed to the browser; Stage 16 decision.)*
  - Remote record count matrix (shown next to the local counts via `GET /api/sync?summary=1`): Cohorts, Students, Lesson Plans, Attendance, Tasks, Teaching Sessions, Teaching Claims.
  - Remote Last Updated timestamp.
- [x] **Local-First Buffer Status**:
  - Local state status: `In-Sync` or `Pending Sync (X unsaved mutations)`.
  - Timestamp of most recent local edit.
  - Offline brownout safety indicator ("Local storage persists all edits safely during network disconnects").
- [x] **Interactive Direct Controls**:
  - `🔄 Push Local Changes to D1`: Immediately syncs local buffered mutations to remote D1.
  - `📥 Pull Central Truth from D1`: Re-fetches the authoritative truth from Cloudflare D1.
  - Informative toast feedback with success/error details.

---

## 🧪 Verification & Testing Checklist
- [x] Click the `SyncStatusBadge` and verify the diagnostics modal opens with rich status indicators.
- [x] Verify accurate record counts for both local state and remote D1.
- [x] Verify "Push to D1" and "Pull from D1" execute cleanly with real-time feedback.
