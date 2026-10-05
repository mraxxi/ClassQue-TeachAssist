# 📋 Stage 16: Verification Remediation

**Lifecycle Stage**: `finished_tested` ✅
**Source**: [`docs/VERIFICATION_REPORT_2026-10.md`](../../docs/VERIFICATION_REPORT_2026-10.md) (findings F1–F38)
**Rule**: no new features. Fix what is broken or falsely marked done. Every box below was ticked **only** after
the matching Playwright check in `e2e/` passed against the real build (`npm run test:e2e`: 270/270 on 2026-10-06).
The per-finding mapping to tests is in `docs/VERIFICATION_REPORT_2026-10.md` → *Resolution*.

---

## Workstreams

### W1 — Make the app usable again (F1, F2, F3)
- [x] Remove the Dexie/React-Query read layer; Zustand + `localStorage` is the single local source of truth (`facade.ts`, `src/db`, `useDataHooks.ts`, unused deps).
- [x] `wrangler.toml(.example)` compatibility date lowered so current wrangler runs.
- [x] `generateDynamicNotifications()` implemented (upcoming class today, overdue/due-today tasks, draft claim), recomputed on cockpit entry and data change, read-state preserved.

### W2 — Secure the edge API (F36, F38, F37)
- [x] `functions/api/_middleware.ts`: bearer `SYNC_TOKEN` (constant-time compare), fail closed when unset, 401 otherwise.
- [x] Client stores the token (Settings), sends `Authorization`, surfaces "token required/invalid" in the sync badge/diagnostics.
- [x] Payload validation → 400 on bad JSON/shape; `undefined → null` binding; `||` → `??` defaults (0 % attendance stays 0).
- [x] Docs: `CLOUDFLARE_SETUP.md` (`wrangler pages secret put SYNC_TOKEN`, `.dev.vars`).

### W3 — Deletes, cascade and sync integrity (F4, F5, F6, F26, F27, F28, F35)
- [x] Cascade: deleting a student removes attendance/evaluations/reports; deleting a cohort removes its students (+cascade), sessions/plans/tasks re-linked or removed.
- [x] Tombstones: deletions are sent to D1 (`deleted` map in POST) and removed server-side; no resurrection after pull.
- [x] Import: full schema validation **before** any `set()`, then mark unsynced + schedule sync.
- [x] "Reset" renamed/reworked to honest behaviour (discard local, re-download from D1) with double confirmation.
- [x] `updatedAt` stamped on every entity mutation.

### W4 — Honest data in reports & attendance (F23, F24, F25, F9)
- [x] Parent report: no fabricated attendance/CEFR/notes; empty-state when no data; attendance filtered by selected month; saving the same student+period updates instead of duplicating.
- [x] Attendance tab: unrecorded ≠ present; KPI/matrix computed from recorded rows only.

### W5 — Dates, schedule and cockpit correctness (F8, F11, F12, F15, F16, F30, F31)
- [x] `src/utils/date.ts` local-date helpers; all UTC-date uses replaced.
- [x] Time-aware, sorted timeline with Completed / Live / Upcoming / Later; Next-class KPI with countdown; no fake fallbacks.
- [x] Proximity pulse (≤ 30 min); overdue marker; lesson-slot picker skips finished classes; `completedAt`.
- [x] `finishLiveSession` stores the real start time.

### W6 — Claims & billing (F17, F18, F19, F20, F21)
- [x] Month selector derived from data + current month; defaults to current month.
- [x] Claim record created/updated for any month; allowance persisted from the record; totals always refreshed.
- [x] `submittedAt` / `paidAt` set on transitions; edit-session duration.

### W7 — Live class resilience & hotkeys (F13, F14, F22)
- [x] Live session persisted (start timestamp, accumulated pause time, scratchpad) and restored after reload; stopwatch derived from wall-clock.
- [x] Esc dismisses every modal (Live Cockpit asks for confirmation); `1–4` set roll-call status in the Live Cockpit.

### W8 — Offline shell & diagnostics (F34, F32)
- [x] Service worker caches the app shell; app opens when reloaded offline.
- [x] Sync diagnostics shows remote D1 counts and remote last-updated (the database UUID is intentionally not exposed).

### W9 — Smaller items (F7, F10, F29, F33)
- [x] WhatsApp phone normalisation (`08…` → `628…`).
- [x] Enter saves attendance note; printed A4 sheets hide toasts; export filename per spec.
- [x] `cq_theme`: documented as deferred (no theme feature yet) — FR-021.

---

## 🧪 Verification

- [x] `npm run build` — 0 TypeScript errors.
- [x] `npm run test:e2e` — all checks green (see `e2e/README.md`).
- [x] Plans 09–15 checkboxes corrected to reflect actual verification.
- [x] `feature_req.md` + `docs/ROADMAP.md` updated; this plan moved to `finished_tested/` only when everything above is ticked.
