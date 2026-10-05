# Verification Report — Stages 01–15 (re-test, 2026-10-06)

**Scope:** every plan in `plans-tasks/finished_tested/` was treated as untested and re-verified in a real
browser (Playwright + Chromium, clock pinned to Asia/Jakarta, fresh local D1 per run) against commit `8c9e05f`.
**Outcome:** the previous "[x] verified" checkboxes were not reliable. The shipped build was unusable and several
spec items were never implemented. All findings below are tracked and fixed by
[`plans-tasks/working_on/16_VERIFICATION_REMEDIATION.md`](../plans-tasks/working_on/16_VERIFICATION_REMEDIATION.md).

Severity: **S0** blocker / security / data loss · **S1** wrong or fabricated data, spec feature missing · **S2** minor.

## Blockers

| ID | Sev | Finding |
|----|-----|---------|
| F1 | S0 | `src/store/facade.ts` made every screen read an **empty Dexie DB** while all writes went to Zustand → every hub showed 0 rows. |
| F2 | S1 | Installed wrangler 4.84 cannot run `compatibility_date = "2026-09-01"`; `wrangler pages dev` fails to start. |
| F3 | S1 | Stage 15 BUG-03 `generateDynamicNotifications()` was **never implemented** (notifications are 3 hardcoded strings). |
| F36 | S0 | `/api/sync` has **no authentication**: anonymous GET leaks all students/guardian contacts; anonymous POST overwrites data. |

## Data loss / integrity

| ID | Sev | Finding |
|----|-----|---------|
| F4 | S1 | Deleting a student leaves orphan attendance + evaluations (UI promises removal). |
| F5 | S1 | Deleting a cohort leaves orphan students. |
| F6 | S0 | Deletes never reach D1 (POST is upsert-only) and are resurrected by the next pull. |
| F26 | S0 | JSON restore is not flagged for sync → overwritten by D1 on next load (silent data loss). |
| F27 | S0 | A malformed backup passes weak validation, corrupts local state and crashes the app. |
| F28 | S1 | "Reset to Demo" shows success but leaves user data (re-pulls D1); single confirmation instead of double. |
| F23 | S0 | Parent report **fabricates** data: "100% (8/8)" with no records; invented CEFR scores/notes. |
| F37 | S1 | `|| 100` / `|| 150000` falsy defaults in `sync.ts`: 0 % attendance stored as 100 %. |
| F38 | S1 | No payload validation: bad JSON / undefined fields → HTTP 500 and the whole batch fails. |
| F14 | S1 | Live class (stopwatch + scratchpad) is not persisted; reload loses it. Stopwatch counts ticks, not wall-clock. |
| F25 | S2 | Saving the same student+period report twice creates duplicates. |

## Wrong behaviour vs spec

| ID | Sev | Finding |
|----|-----|---------|
| F8 | S1 | UTC date (`toISOString().split('T')[0]`) used in ~11 places → before 07:00 WIB the app uses yesterday. |
| F7 | S1 | WhatsApp link for local-format phone `0812…` is invalid (needs `62`). |
| F9 | S1 | Unrecorded attendance defaults to "present": KPI shows 100 % with zero records; matrix shows H on non-class days. |
| F11 | S1 | Dashboard "Klaim bulan ini" falls back to hardcoded `Rp 4.250.000`. |
| F12 | S1 | Next-class KPI/timeline not time-aware, unsorted, shows all cohorts when none is scheduled today. |
| F15 | S2 | `finishLiveSession` stores the *end* time as `startTime`. |
| F17 | S1 | Claim allowance is component state defaulting to `200000`; lost on reload; `updateClaimAllowances` missing. |
| F18 | S1 | `submittedAt` / `paidAt` never set on claim status transitions. |
| F19 | S1 | Claim/report month selector is hardcoded (Jun–Sep 2026); current month unselectable. |
| F20 | S2 | Stored claim record is a stale seed; only refreshed when a status button is clicked. |
| F21 | S2 | No way to edit a session's duration (spec: "delete or adjust"). |
| F22 | S1 | FR-011: Esc-to-dismiss and `1–4` roll-call hotkeys not implemented (only Space). |
| F13 | S1 | Esc not handled in the Live Cockpit modal (spec: dismissal confirmation). |
| F24 | S1 | Report period hardcoded to `2026-09`; attendance not filtered by period. |
| F30 | S2 | Stage 09 §2 proximity pulse (class within 30 min) not implemented. |
| F31 | S2 | Lesson-slot picker not time-of-day aware; stored label has a "• +3" artifact; `completedAt` not stamped. |
| F16 | S2 | No overdue marker on past-due tasks. |
| F32 | S2 | Sync diagnostics modal shows local counts only (no D1 counts / DB id / remote last-updated). |
| F33 | S2 | `cq_theme` cookie key has no feature behind it (deferred). |
| F34 | S1 | No service worker: app cannot load when reloaded offline. |
| F35 | S2 | Only tasks are stamped with `updatedAt`; sync is whole-state last-write-wins. |
| F10,F25b,F29 | S2 | Enter doesn't save attendance note; A4 report prints on 2 pages; export file name differs from spec. |

## What passed (after F1 is bypassed)

Cohort/student CRUD & search, attendance engine, CEFR gradebook, lesson planner CRUD/duplicate/search/print,
claim maths & invoice, WhatsApp copy/link formatting, clock/timezone, lesson-based deadlines, sync diagnostics,
cookie persistence, notification UI mechanics, debounced auto-sync, offline queue + reconnect push, the 10-entity
POST/GET round-trip, migration 0003, parameterised SQL, `tsc -b` + `vite build` (0 errors).

## Reproducing the tests

See [`e2e/README.md`](../e2e/README.md).
