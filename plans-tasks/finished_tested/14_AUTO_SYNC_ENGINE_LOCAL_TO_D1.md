# 📋 Stage 14: Local-First Auto-Sync Engine & Cloudflare D1 Persistence

> **Re-verified 2026-10-06 (Stage 16).** The checkboxes below were previously unchecked or unreliable; each item is now backed by an automated browser check in `e2e/tests/07-sync-offline.test.mjs`. See `docs/VERIFICATION_REPORT_2026-10.md`.


**Lifecycle Stage**: `working_on`  
**Target Domain**: Domain 5: Settings & Data Sync (`src/store/useTeacherStore.ts`, `src/components/layout/SyncStatusBadge.tsx`)  
**Ubiquitous Language**: `Central Source of Truth` (Pusat Kebenaran Cloudflare D1), `Local-First Buffer` (Penyangga Offline Lokal), `Timestamped Mutation Sync` (Sinkronisasi Bertanda Waktu)

---

## 🎯 Objectives & Deliverables
Establish Cloudflare D1 as the **authoritative Central Source of Truth** while guaranteeing **100% offline classroom brownout resistance** via local-first state persistence. Every local mutation is signed with an ISO timestamp (`updated_at`), committed immediately to browser `localStorage` for zero-latency classroom operations, and automatically synchronized to Cloudflare D1 via a debounced edge sync engine.

### 1. Timestamped Local-First Mutations
- [x] Every entity update (`updateTask`, `addTask`, `setAttendance`, `updateStudent`, `addCohort`, etc.) signs the mutation with a local `updatedAt: new Date().toISOString()` timestamp.
- [x] All mutations commit immediately to `localStorage` under `classque_teacher_os_v1`, ensuring that even if the internet drops completely (classroom brownout), no roll-call, note, or lesson edit is ever lost.
- [x] Maintain a `hasUnsyncedChanges: boolean` and `lastLocalMutationAt: string` flag in store state.

### 2. Debounced Auto-Sync Dispatcher (`scheduleAutoSync`)
- [x] Implement an automatic debounced sync mechanism (~1500ms after the last mutation).
- [x] When triggered, if network is online, dispatches `POST /api/sync` with the current state payload.
- [x] On successful D1 commit:
  - Updates `lastSyncedAt: new Date().toISOString()`.
  - Sets `hasUnsyncedChanges: false`.
  - Sets `syncStatus: 'synced'`.
- [x] If offline or edge returns an error:
  - Preserves local mutations untouched in `localStorage`.
  - Sets `syncStatus: 'offline'` or `'error'`.
  - Retains `hasUnsyncedChanges: true`.

### 3. Edge-to-Client Reconciliation & Offline Recovery
- [x] **Network Event Listeners**:
  - `window.addEventListener('online')`: Detects network reconnection after a brownout and immediately triggers sync of pending changes.
  - `window.addEventListener('offline')`: Immediately sets status to `'offline'`.
- [x] **Initial App Boot Reconciliation**:
  - If local storage has zero pending changes and remote D1 is reachable, remote D1 serves as the central truth.
  - If local storage has pending unsaved changes from an offline session, the local state takes precedence and is pushed to D1.

---

## 🧪 Verification & Testing Checklist
- [x] Perform a data mutation (e.g., add or toggle a task, update a student).
- [x] Verify `localStorage` updates synchronously with zero UI delay.
- [x] Verify that within ~1.5s, a background `POST /api/sync` fires and updates `lastSyncedAt`.
- [x] Query remote D1 via `npx wrangler d1 execute classque_db --remote --command "SELECT * FROM tasks;"` and confirm the row exists in remote SQLite.
- [x] Simulate offline brownout (disconnect network), perform edits, and verify that upon reconnecting, changes are automatically pushed to D1 without data loss.
