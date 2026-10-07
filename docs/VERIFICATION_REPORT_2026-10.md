# Verification Report — Stages 01–15 (re-test, 2026-10-06)

**Scope:** every plan in `plans-tasks/finished_tested/` was treated as untested and re-verified in a real
browser (Playwright + Chromium, clock pinned to Asia/Jakarta, fresh local D1 per run) against commit `8c9e05f`.
**Outcome:** the previous "[x] verified" checkboxes were not reliable. The shipped build was unusable and several
spec items were never implemented. All findings below are tracked and fixed by
[`plans-tasks/finished_tested/16_VERIFICATION_REMEDIATION.md`](../plans-tasks/working_on/16_VERIFICATION_REMEDIATION.md).

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

---

## Resolution (Stage 16, 2026-10-06)

All findings were fixed on branch `fix/stage-16-verification-remediation`; `npm run test:e2e` runs **270 checks in
10 files, all green**, against the production build + local D1. Each row names the test that proves it.

| Finding | Resolution | Proven by |
|---|---|---|
| F1 empty Dexie read layer | Layer removed; Zustand + `localStorage` is the only local source (also dropped 4 dependencies, bundle −120 kB) | every UI suite |
| F2 wrangler compat date | `compatibility_date = "2026-04-01"` in `wrangler.toml(.example)` | `run.sh` starts the server |
| F3 / BUG-03 notifications | `src/utils/notifications.ts` + store `refreshNotifications` (read/dismissed state kept) | `09` 13.x |
| F36 no authentication | `functions/api/_middleware.ts` bearer `SYNC_TOKEN`, constant-time, **fails closed**; token UI in Settings | `08`, `08b`, `06` A5–A9 |
| F37 `\|\| 100` defaults | `??` / `num()` helper; 0 stays 0 | `08` C1–C2 |
| F38 validation | 400 + problem list; `undefined→null` | `08` D1–D6 |
| F4 / F5 cascades | store cascades; confirmations state exact counts; sessions kept for billing history | `01` 7.x–8.x |
| F6 delete resurrection | tombstones → soft delete on D1; pull replaces collections | `01` 9.x |
| F26 restore lost | restore flagged for sync, replaces dataset (tombstones the rest) | `06` 8.3–8.5 |
| F27 malformed backup | `validateBackup()` before any state change | `06` 8.6 |
| F28 reset | honest "Reload from D1", double confirmation | `06` 8.7 |
| F23 / F24 / F25 reports | recorded data only, per-month, upsert; printed card has empty states | `05` 7.x |
| F9 / F10 attendance | unrecorded ≠ present, "Belum Dicatat" KPI, Enter saves note | `02` |
| F8 UTC dates | `src/utils/date.ts` local helpers used everywhere | `02` F8, `04` F8, `06` 8.1 |
| F7 WhatsApp | `src/utils/phone.ts` (`08…` → `628…`) | `01` 5.x, `05` 7.5 |
| F11 / F12 cockpit | no fake fallback; `getTodaySlots` (sorted, live/upcoming/missed), countdown | `04` 5.x |
| F13 / F22 hotkeys | `useEscapeKey` in every modal; `1–4` roll-call; Esc confirm in Live Cockpit | `01` 1.3d, `03`, `05`, `04` 5.17/5.19 |
| F14 live persistence | wall-clock stopwatch, persisted session + notes; focus follows the running class | `04` 7.x |
| F15 start time | real start/end time and local date | `04` F15, F8 |
| F16 / F31 tasks | overdue marker, ordering, `completedAt`, time-aware slots, clean label | `09` 10.x |
| F17–F21 claims | dynamic months, allowance persisted, timestamps, derived totals, edit session | `05` 6.x |
| F30 proximity | `data-proximity` + pulse only ≤ 30 min | `04` 9.x |
| F32 diagnostics | D1 counts, last-updated via `?summary=1` | `07` 11.x |
| F34 offline shell | `public/sw.js` | `07` 14.9 |
| F35 updatedAt | stamped on every entity mutation | `01`/`02`/`07` |
| Minor (CEFR note score, print leaks/2 pages, last-plan delete, file name) | fixed | `03`, `05`, `06` |

### Deliberate deviations / not done
- **F33 `cq_theme`** — no theme feature exists, so nothing to persist; deferred as FR-021 (plan 12 amended).
- **Database UUID in the diagnostics modal** — intentionally not exposed to the browser (name only).
- **Per-record merge / delta sync** — sync is still whole-dataset last-write-wins (documented in `ARCHITECTURE.md` §3); FR-020.
- **Billing history on cohort delete** — Teaching Sessions are kept (claims stay intact); the cohort name then shows as "Rombel dihapus".
- **Not verified here:** the live Cloudflare deployment and the *remote* D1 (no credentials used). Before deploying:
  set the `SYNC_TOKEN` secret (`docs/CLOUDFLARE_SETUP.md` §5), otherwise the edge API correctly answers 503.
- `deploy.sh` still auto-commits with `git add .`; consider replacing that with an explicit commit step.

## Reproducing the tests

See [`e2e/README.md`](../e2e/README.md). One command: `npm run test:e2e`.
