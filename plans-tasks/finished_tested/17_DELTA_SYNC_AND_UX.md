# 📋 Stage 17: Delta Sync (FR-020) & UX / Design Pass

**Lifecycle Stage**: `working_on` 🔧
**Rule**: every box is ticked only after an automated check in `e2e/` passes against the real build.

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
- [ ] Shared touch-friendly attendance control (≥ 44 px, colour + icon + label, `aria-pressed`, progress "3/5 recorded") used in Attendance tab, cockpit card and live cockpit.
- [ ] Cockpit redesign: greeting + context line instead of a second clock; "Now" card first on phones; compact KPIs.
- [ ] Live cockpit on phones: sticky stopwatch/finish bar and tabs (Roll-call · Grading · Lesson · Notes).
- [ ] Undo toast for deletes (student, cohort, session, task, lesson plan) incl. cascade, working across devices.
- [ ] First-run onboarding checklist + purposeful empty states with a call to action.
- [ ] Dark mode (`cq_theme`: light / dark / system), print always light.
- [ ] Self-hosted fonts (offline-safe, no third-party request).
- [ ] Accessibility pass with axe-core: no serious/critical violations on the main screens in light and dark; labelled icon buttons; visible focus; reduced motion.
- [ ] Keyboard shortcut help dialog (`?`).

## Verification
- [ ] `npm run typecheck` · `npm run test:e2e` all green · plan moved to `finished_tested/`.
