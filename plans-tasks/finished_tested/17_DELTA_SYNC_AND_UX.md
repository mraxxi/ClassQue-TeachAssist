# 📋 Stage 17: Delta Sync (FR-020) & UX / Design Pass

**Lifecycle Stage**: `finished_tested` ✅
**Rule**: every box was ticked only after an automated check in `e2e/` passed against the real build
(`npm run test:e2e`: 12 files, 347 checks on 2026-10-06). Design rationale: `docs/UI_UX_SPECIFICATION.md` §6.

---

## A. Delta sync & per-record merge (FR-020)
- [x] Migration `0004_delta_sync.sql`: `client_updated_at`, ISO-ms `updated_at`, indexes.
- [x] `GET /api/sync?since=<cursor>` returns only changed rows + `deleted` ids; `cursor` on every response.
- [x] `POST` upserts/deletes are per-record last-write-wins; newer upsert revives a soft-deleted row; `rejected` reported.
- [x] Client pushes only dirty records (`dirty` map), timestamped tombstones, merges pulls per record.
- [x] Pull on visibility / every minute; pull right after a rejected push.
- [x] Two-device e2e (`10-delta-sync`): delta payload, incremental pull, offline edits on both, conflict, delete+cascade, edit-beats-delete.

## B. UX & design (screenshots + critique → changes)
Findings from the critique (desktop + 390 px phone):
1. Phone cockpit: the clock banner pushes the primary action ("start class") below the fold; the clock is duplicated in the header.
2. Roll-call controls are ~24 px text pills, `(H)(A)(T)(I)` in the live view is cryptic; unrecorded state is invisible.
3. Live cockpit on a phone is one long scroll; no sticky stopwatch/finish.
4. Destructive actions have confirmations but no **Undo**.
5. No first-run guidance; empty hubs show a bare message.
6. No dark mode (classroom projector / evening use) — FR-021.
7. Accessibility: unlabeled icon buttons, low-contrast helper text, no keyboard-shortcut discoverability.
8. Fonts load from Google (third party, fails offline, fallback font flashes).

Deliverables:
- [x] Shared touch-friendly attendance control (≥ 44 px, colour + icon + label, `aria-pressed`, progress "3/5 recorded") used in Attendance tab, cockpit card and live cockpit.
- [x] Cockpit redesign: greeting + context line instead of a second clock; "Now" card first on phones; compact KPIs.
- [x] Live cockpit on phones: sticky stopwatch/finish bar and tabs (Roll-call · Grading · Lesson · Notes).
- [x] Undo toast for deletes (student, cohort, session, task, lesson plan) incl. cascade, working across devices.
- [x] First-run onboarding checklist + purposeful empty states with a call to action.
- [x] Dark mode (`cq_theme`: light / dark / system), print always light.
- [x] Self-hosted fonts (offline-safe, no third-party request).
- [x] Accessibility pass with axe-core: **zero** violations (all impacts) on 10 screens × light / dark / phone, including modals; labelled icon buttons and inputs; `h1` per page; visible focus; reduced motion.
- [x] Keyboard shortcut help dialog (`?`).

## Verification
- [x] `npm run typecheck` · `npm run test:e2e` all green · plan moved to `finished_tested/`.

## Also delivered (found while reviewing screenshots)
- [x] `<body>` still carried hard-coded light colours (flash on overscroll / before mount) → theme variables.
- [x] Modal backdrops inverted to a light scrim in dark mode → `.scrim`.
- [x] Phone: cohort chips scroll horizontally, sub-tabs scroll, claims metrics in a 2-column grid, live-cockpit header no longer overlaps, full-height live sheet.
- [x] Self-hosted fonts; secondary hubs lazy-loaded (first-load JS 502 kB → 330 kB) and preloaded when idle so they open offline.

## Not done / notes
- Conflicts are still merged silently (FR-027 would surface "your edit lost to a newer one").
- Dark palette is generated from Tailwind's theme: re-run `node scripts/gen-dark-theme.mjs` after upgrading Tailwind.
- Migration `0004` must be applied to the remote D1 before deploying this build.
