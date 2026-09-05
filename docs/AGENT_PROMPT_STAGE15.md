# 🤖 Agent Execution Prompt — Stage 15: Critical Bugfix & Full D1 Sync Completion

> **For:** Antigravity / Claude / GPT-class coding LLM agent  
> **Date composed:** 2026-09-05  
> **Trigger:** Post-implementation audit found 2 critical data-loss bugs and 5 medium/minor regressions  
> **Plan document:** `plans-tasks/working_on/15_CRITICAL_BUGFIX_AND_SYNC_COMPLETION.md`

---

## 🎯 Your Mission

You are a coding agent working on **ClassQue-TeachAssist**, an educator's personal operating system built with React 19 / Vite / TypeScript on the frontend and Cloudflare Pages Functions + Cloudflare D1 (SQLite at the edge) on the backend.

A post-implementation audit has identified **critical bugs that cause silent data loss** and several other functionality gaps. Your job is to implement all the fixes described in the Stage 15 plan document, verify each one, and mark the verification checklist items as `[x]` when done.

**Do not proceed beyond Stage 15.** Do not add new features. Fix what is broken.

---

## 📖 Mandatory Pre-Read (in order)

Before writing a single line of code, read these files:

1. **`docs/TERMINOLOGY.md`** — Canonical ubiquitous language. All code must use these exact terms.
2. **`docs/ARCHITECTURE.md`** — System overview: React SPA + localStorage offline buffer + Cloudflare D1 edge sync.
3. **`src/types/index.ts`** — All TypeScript entity types. **Never deviate from these interfaces.**
4. **`plans-tasks/working_on/15_CRITICAL_BUGFIX_AND_SYNC_COMPLETION.md`** — Your complete implementation spec with exact SQL, TypeScript code blocks, and file-level change instructions.
5. **`docs/LESSONS_LEARNED_REF.md`** — Anti-patterns to avoid.

---

## 🚨 Critical Bugs to Fix (P0 — Do These First)

### BUG-01: `/api/sync` POST only persists 3 of 11 entity types

**File:** `functions/api/sync.ts`

The `onRequestPost` edge function handler currently only saves `teachers`, `cohorts`, and `students` to Cloudflare D1. The client sends all 10 entity types in the payload but the edge ignores 8 of them: `lesson_plans`, `attendance_records`, `teaching_sessions`, `teaching_claims`, `student_milestone_evaluations`, `parent_reports`, `tasks`.

**What to do:**
- Open `functions/api/sync.ts`.
- Find the `onRequestPost` handler. After the existing `students` block (around line 336), add 7 new entity blocks following the exact same `INSERT ... ON CONFLICT(id) DO UPDATE SET ...` pattern.
- The Stage 15 plan document has the **complete SQL and TypeScript binding code** for each entity. Copy it precisely.
- The D1 SQLite `batch()` call at line ~340 will automatically pick up all new statements — you only need to push to `statements[]`.
- Pay attention to camelCase (TypeScript payload) vs snake_case (D1 columns). All mapping is already documented in the plan.

### BUG-02: Attendance `date` field should be `attendanceDate`

**File:** `functions/api/sync.ts` — the `onRequestGet` attendance mapper (~line 112).

The GET mapper currently outputs `date: a.session_date || a.date` but the TypeScript `AttendanceRecord` interface (`src/types/index.ts:68`) defines this field as `attendanceDate`. The UI `AttendanceHistoryTab` reads `record.attendanceDate` — so records pulled from D1 arrive with the wrong key name and are silently ignored.

**What to do:**
- Change `date:` to `attendanceDate:` in the attendance GET mapper.
- Also fix the source column: use `a.attendance_date` (the correct D1 column name from `docs/DATABASE_SCHEMA.sql`) with a fallback to `a.session_date`.
- Also change `notes:` to `note:` (singular) to match the `AttendanceRecord` interface.

---

## 🟡 Medium Bugs to Fix (P1 — Do After P0)

### BUG-03: Dynamic Notifications Generator

**File:** `src/store/useTeacherStore.ts`

Currently, `defaultNotifications` is 3 hardcoded Indonesian strings with fake timestamps. They never change and don't reflect the teacher's real state.

**What to do:**
- Add a `generateDynamicNotifications(cohorts, tasks, claims)` helper function above `useTeacherStore = create(...)`.
- The complete implementation is in the Stage 15 plan. Copy it exactly.
- It generates 3 alert categories: upcoming classes today (from `cohorts.scheduleDays`), overdue/due-today tasks, and draft claims in the current month.
- Replace the `defaultNotifications` fallback with a call to `generateDynamicNotifications(initialCohortList, initialTaskList, saved?.claims || initialClaims)`.
- Also wire it to re-generate on `setActiveTab('cockpit')` so notifications refresh when the teacher returns to the dashboard.

### BUG-04: D1 Schema Missing Task Deadline Fields

The `tasks` table in Cloudflare D1 does not have `deadline_type` or `due_lesson_label` columns, but the TypeScript `TaskItem` interface and UI `UrgentTasksCard.tsx` use both fields for lesson-based deadlines (FR-013).

**What to do:**
1. Create `migrations/0003_add_task_lesson_deadline.sql` with exactly this content:
   ```sql
   -- Migration 0003: Add lesson-based task deadline fields
   ALTER TABLE tasks ADD COLUMN deadline_type TEXT NOT NULL DEFAULT 'date'
     CHECK (deadline_type IN ('date', 'lesson'));
   ALTER TABLE tasks ADD COLUMN due_lesson_label TEXT;
   ```
2. Run locally: `npx wrangler d1 migrations apply classque_db --local`
3. Run remotely: `npx wrangler d1 migrations apply classque_db --remote`
4. In the `onRequestGet` tasks GET mapper in `sync.ts`, add `deadlineType: tk.deadline_type || 'date'` and `dueLessonLabel: tk.due_lesson_label || undefined`.
5. In `onRequestPost`, the `tasks` entity block you added in BUG-01 already includes `deadline_type` and `due_lesson_label` bindings — confirm they are there.

---

## 🟢 Minor Bugs to Fix (P2 — Do After P1)

### BUG-07: SyncStatusBadge Hidden in Collapsed Sidebar

**Files:** `src/components/layout/SideNav.tsx` and `src/components/layout/SyncStatusBadge.tsx`

When the sidebar is collapsed (`isExpanded === false`), `SyncStatusBadge` is entirely hidden. Teachers have no sync status visibility in compact mode.

**What to do:**
- In `SideNav.tsx`, change `{isExpanded && <SyncStatusBadge language={language} />}` to `<SyncStatusBadge language={language} compact={!isExpanded} />` (always render it).
- In `SyncStatusBadge.tsx`:
  - Add `compact?: boolean` to the props interface.
  - Wrap each text `<span>` with `{!compact && <span>...</span>}`.
  - Keep icons and status dots visible regardless of `compact`.

### BUG-06: Hardcoded i18n Strings

**Files:** `src/utils/i18n.ts` and `src/components/cockpit/UrgentTasksCard.tsx`

Several strings in `UrgentTasksCard.tsx` bypass the i18n system (e.g., `'Prioritas:'`, `'Metode Batas Waktu:'`, `'Tanggal Kalender'`, `'Sesi Kelas'`, `'Target Kelas:'`, `'Pilih Jadwal:'`, `'Pilih Tanggal:'`).

**What to do:**
- Add 7 new keys to **both** `en` and `id` blocks in `src/utils/i18n.ts` under `cockpit:`. The exact keys and values are in the Stage 15 plan.
- In `UrgentTasksCard.tsx`, replace all hardcoded strings with `t.cockpit.<key>`.

---

## ⚙️ Architecture Rules (Do Not Break These)

1. **TypeScript strict mode is on.** The build must pass `npm run build` with zero errors at the end.
2. **Never use raw string SQL.** All D1 queries must use `env.DB.prepare(...).bind(...)`.
3. **Offline-first contract.** Do not change `commitMutation` or `persistState` behavior. localStorage is always the primary write target; D1 is a background sync.
4. **Ubiquitous language.** Use canonical terms: `Cohort` (not class/batch), `Teaching Session` (not lesson/lecture), `Roll-Call` (not check-in), `Teaching Claim` (not invoice/payment).
5. **No new dependencies.** All fixes should use existing packages (`zustand`, `lucide-react`, `react`, TypeScript).
6. **Do not modify `src/types/index.ts` or `docs/DATABASE_SCHEMA.sql` unless strictly necessary** to add something clearly missing. Any schema changes go through a numbered migration file.

---

## ✅ Completion Criteria

You are done when **all of the following are true**:

1. `npm run build` runs with **zero TypeScript errors**.
2. `functions/api/sync.ts` `onRequestPost` handler contains `INSERT ... ON CONFLICT` blocks for all 7 missing entity types (lesson plans, attendance, sessions, claims, evaluations, reports, tasks).
3. The attendance GET mapper outputs `attendanceDate` (not `date`) and `note` (not `notes`).
4. `migrations/0003_add_task_lesson_deadline.sql` exists and has been applied (`--local` and `--remote`).
5. The tasks GET mapper includes `deadlineType` and `dueLessonLabel`.
6. `generateDynamicNotifications()` replaces the `defaultNotifications` array in the store.
7. `SyncStatusBadge` accepts a `compact` prop and renders icon-only when collapsed.
8. `UrgentTasksCard.tsx` uses `t.cockpit.*` for all label strings.
9. The Stage 15 plan verification checklist items are all marked `[x]`.
10. Move `plans-tasks/working_on/15_CRITICAL_BUGFIX_AND_SYNC_COMPLETION.md` to `plans-tasks/finished_tested/15_CRITICAL_BUGFIX_AND_SYNC_COMPLETION.md` after all verification passes.

---

## 🗂️ Key File Map

```
functions/
  api/
    sync.ts              ← PRIMARY TARGET: fix POST handler + GET mappers

migrations/
  0001_initial_schema.sql
  0002_seed_demo_data.sql
  0003_add_task_lesson_deadline.sql   ← CREATE THIS

src/
  store/
    useTeacherStore.ts   ← Add generateDynamicNotifications()
  components/
    layout/
      SideNav.tsx        ← Pass compact prop to SyncStatusBadge
      SyncStatusBadge.tsx ← Accept compact prop
    cockpit/
      UrgentTasksCard.tsx ← Use t.cockpit.* for all labels
  utils/
    i18n.ts              ← Add 7 missing translation keys

plans-tasks/
  working_on/
    15_CRITICAL_BUGFIX_AND_SYNC_COMPLETION.md  ← Your spec document
```

---

## 💡 Tips for Success

- **Work P0 bugs first**: BUG-01 and BUG-02 in `functions/api/sync.ts` are entirely in one file and have zero UI surface — do them first, run `npm run build`, confirm it passes, then move on.
- **The Stage 15 plan has complete code blocks**: Do not re-derive the SQL. Copy it exactly from the plan document.
- **Test sync round-trip**: After fixing BUG-01, the most critical test is to trigger a full sync and then query D1 directly with `wrangler` to confirm rows appear. The plan checklist has the exact commands.
- **Mark checklist items as you go**: After verifying each fix, update the `[ ]` items to `[x]` in `15_CRITICAL_BUGFIX_AND_SYNC_COMPLETION.md`. This is the source of truth for completion.
