# 📋 Stage 15: Critical Bugfix — Full D1 Sync Completion & Dynamic Notifications

**Lifecycle Stage**: `working_on`  
**Target Domain**: Cross-Cutting (`functions/api/sync.ts`, `src/store/useTeacherStore.ts`, `src/components/layout/SideNav.tsx`, `migrations/`, `src/utils/i18n.ts`)  
**Ubiquitous Language**: `Central Source of Truth` (Cloudflare D1), `Local-First Buffer` (localStorage), `Sync Queue` (Antrian Sinkronisasi), `Notification Center` (Pusat Notifikasi)

---

## 🎯 Objectives & Deliverables

Fix **two critical data-loss bugs** found in the post-implementation audit (Stage 15 Review Report, 2026-09-05), complete the full bidirectional D1 sync for all 11 entity types, implement true dynamic notifications, and resolve all schema/type divergences.

> [!CAUTION]
> BUG-01 causes silent data loss: 8 of 11 entity types are sent by the client to `/api/sync` POST but are completely ignored by the edge function. A teacher relying on Cloudflare D1 as a backup **loses lesson plans, attendance, sessions, claims, evaluations, parent reports, tasks, and CEFR milestones** on every sync.

---

## 🐛 Bug Inventory (from Audit Report)

| ID | Severity | Description | File |
|----|----------|-------------|------|
| BUG-01 | 🔴 Critical | POST `/api/sync` only persists 3 of 11 entity types | `functions/api/sync.ts` |
| BUG-02 | 🔴 Critical | Attendance GET mapper outputs `date` but type uses `attendanceDate` | `functions/api/sync.ts` |
| BUG-03 | 🟡 Medium | Notifications use 3 hardcoded static strings; no dynamic generation | `src/store/useTeacherStore.ts` |
| BUG-04 | 🟡 Medium | D1 `tasks` table missing `deadline_type` and `due_lesson_label` columns | `migrations/`, `functions/api/sync.ts` |
| BUG-05 | 🟡 Medium | Plans 11, 13, 14 filed as `finished_tested` with unchecked verification checklists | `plans-tasks/finished_tested/` |
| BUG-06 | 🟢 Minor | ~10 hardcoded Indonesian strings bypassing i18n system | Various components |
| BUG-07 | 🟢 Minor | `SyncStatusBadge` invisible when sidebar is collapsed | `src/components/layout/SideNav.tsx` |

---

## 📐 Detailed Implementation Spec

### Fix 1: Complete `/api/sync` POST — All 8 Missing Entity Types

**File:** `functions/api/sync.ts` — extend `onRequestPost` starting after the existing `students` block.

Add `INSERT ... ON CONFLICT(id) DO UPDATE SET ...` prepared statements for each missing entity:

#### 1a. Lesson Plans
```sql
INSERT INTO lesson_plans (id, teacher_id, cohort_id, title, topic, cefr_level, duration_minutes,
  warm_up, presentation, practice, production, wrap_up,
  vocabulary_json, grammar_focus, materials_links, homework, is_template, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  cohort_id = excluded.cohort_id, title = excluded.title, topic = excluded.topic,
  cefr_level = excluded.cefr_level, duration_minutes = excluded.duration_minutes,
  warm_up = excluded.warm_up, presentation = excluded.presentation,
  practice = excluded.practice, production = excluded.production,
  wrap_up = excluded.wrap_up, vocabulary_json = excluded.vocabulary_json,
  grammar_focus = excluded.grammar_focus, materials_links = excluded.materials_links,
  homework = excluded.homework, is_template = excluded.is_template,
  updated_at = datetime('now')
```
Bindings: `l.id, l.teacherId||'teacher-1', l.cohortId||null, l.title, l.topic||null, l.cefrLevel||'A1', l.durationMinutes||60, l.warmUp||null, l.presentation||null, l.practice||null, l.production||null, l.wrapUp||null, JSON.stringify(l.vocabulary||[]), l.grammarFocus||null, JSON.stringify(l.materialsLinks||[]), l.homework||null, l.isTemplate?1:0`

#### 1b. Attendance Records
```sql
INSERT INTO attendance_records (id, cohort_id, student_id, attendance_date, status, note, updated_at)
VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  status = excluded.status, note = excluded.note, updated_at = datetime('now')
```
Bindings: `a.id, a.cohortId, a.studentId, a.attendanceDate, a.status, a.note||null`

#### 1c. Teaching Sessions
```sql
INSERT INTO teaching_sessions (id, teacher_id, cohort_id, lesson_plan_id, session_date,
  start_time, duration_minutes, hourly_rate, total_claim_amount, status, scratchpad_notes, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  duration_minutes = excluded.duration_minutes, hourly_rate = excluded.hourly_rate,
  total_claim_amount = excluded.total_claim_amount, status = excluded.status,
  scratchpad_notes = excluded.scratchpad_notes, updated_at = datetime('now')
```
Bindings: `s.id, s.teacherId||'teacher-1', s.cohortId, s.lessonPlanId||null, s.sessionDate, s.startTime, s.durationMinutes, s.hourlyRate, s.totalClaimAmount, s.status||'completed', s.scratchpadNotes||null`

#### 1d. Teaching Claims
```sql
INSERT INTO teaching_claims (id, teacher_id, claim_period, claim_number, total_sessions,
  total_hours, base_amount, allowance_amount, total_claim_amount, currency, status,
  submitted_at, paid_at, notes, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  total_sessions = excluded.total_sessions, total_hours = excluded.total_hours,
  base_amount = excluded.base_amount, allowance_amount = excluded.allowance_amount,
  total_claim_amount = excluded.total_claim_amount, status = excluded.status,
  submitted_at = excluded.submitted_at, paid_at = excluded.paid_at,
  notes = excluded.notes, updated_at = datetime('now')
```
Bindings: `cl.id, cl.teacherId||'teacher-1', cl.claimPeriod, cl.claimNumber||null, cl.totalSessions||0, cl.totalHours||0, cl.baseAmount||0, cl.allowanceAmount||0, cl.totalClaimAmount||0, cl.currency||'IDR', cl.status||'draft', cl.submittedAt||null, cl.paidAt||null, cl.notes||null`

#### 1e. Student Milestone Evaluations
```sql
INSERT INTO student_milestone_evaluations (id, student_id, milestone_id, competency_score,
  evaluated_at, teacher_notes, updated_at)
VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  competency_score = excluded.competency_score, teacher_notes = excluded.teacher_notes,
  evaluated_at = excluded.evaluated_at, updated_at = datetime('now')
```
Bindings: `ev.id, ev.studentId, ev.milestoneId, ev.competencyScore, ev.evaluatedAt||new Date().toISOString(), ev.teacherNotes||null`

#### 1f. Parent Reports
```sql
INSERT INTO parent_reports (id, student_id, cohort_id, report_period, attendance_rate,
  total_sessions_count, present_count, milestone_summary_json,
  teacher_narrative_feedback, whatsapp_brief_text, is_sent, sent_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  attendance_rate = excluded.attendance_rate, total_sessions_count = excluded.total_sessions_count,
  present_count = excluded.present_count, milestone_summary_json = excluded.milestone_summary_json,
  teacher_narrative_feedback = excluded.teacher_narrative_feedback,
  whatsapp_brief_text = excluded.whatsapp_brief_text, is_sent = excluded.is_sent,
  sent_at = excluded.sent_at, updated_at = datetime('now')
```
Bindings: `rp.id, rp.studentId, rp.cohortId, rp.reportPeriod, rp.attendanceRate||100, rp.totalSessionsCount||0, rp.presentCount||0, rp.milestoneSummaryJson||null, rp.teacherNarrativeFeedback||null, rp.whatsappBriefText||null, rp.isSent?1:0, rp.sentAt||null`

#### 1g. Tasks
```sql
INSERT INTO tasks (id, teacher_id, cohort_id, title, priority, due_date,
  deadline_type, due_lesson_label, is_completed, completed_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  title = excluded.title, priority = excluded.priority, due_date = excluded.due_date,
  deadline_type = excluded.deadline_type, due_lesson_label = excluded.due_lesson_label,
  is_completed = excluded.is_completed, completed_at = excluded.completed_at,
  updated_at = datetime('now')
```
Bindings: `tk.id, tk.teacherId||'teacher-1', tk.cohortId||null, tk.title, tk.priority||'medium', tk.dueDate||null, tk.deadlineType||'date', tk.dueLessonLabel||null, tk.isCompleted?1:0, tk.completedAt||null`

---

### Fix 2: Attendance GET Mapper Field Name (`attendanceDate`)

**File:** `functions/api/sync.ts` — line ~116.

Change the `attendanceRecords` GET mapping from:
```ts
// BEFORE (broken):
const attendanceRecords = (rawAttendance.results || []).map((a: any) => ({
  id: a.id,
  cohortId: a.cohort_id,
  studentId: a.student_id,
  date: a.session_date || a.date || '2026-09-05',   // ← WRONG key name
  status: a.status || 'present',
  notes: a.notes || undefined,
}));
```
To:
```ts
// AFTER (correct — matches AttendanceRecord type):
const attendanceRecords = (rawAttendance.results || []).map((a: any) => ({
  id: a.id,
  cohortId: a.cohort_id,
  studentId: a.student_id,
  attendanceDate: a.attendance_date || a.session_date || '2026-09-05',  // ← CORRECT
  status: a.status || 'present',
  note: a.note || undefined,  // ← also fix: 'note' not 'notes' (matches AttendanceRecord type)
}));
```

Also update the GET mapper's Tasks section to include the new fields:
```ts
const tasks = (rawTasks.results || []).map((tk: any) => ({
  id: tk.id,
  teacherId: tk.teacher_id,
  cohortId: tk.cohort_id || undefined,
  title: tk.title,
  priority: tk.priority || 'medium',
  dueDate: tk.due_date || '',
  deadlineType: tk.deadline_type || 'date',            // ← ADD
  dueLessonLabel: tk.due_lesson_label || undefined,    // ← ADD
  isCompleted: Boolean(tk.is_completed),
  completedAt: tk.completed_at || undefined,
}));
```

---

### Fix 3: D1 Schema Migration — Add Task Deadline Fields

**New file:** `migrations/0003_add_task_lesson_deadline.sql`

```sql
-- Migration 0003: Add lesson-based task deadline fields to tasks table
-- Introduced in Stage 10: Lesson-Based Task Deadlines (FR-013)

ALTER TABLE tasks ADD COLUMN deadline_type TEXT NOT NULL DEFAULT 'date' 
  CHECK (deadline_type IN ('date', 'lesson'));
ALTER TABLE tasks ADD COLUMN due_lesson_label TEXT;
```

Apply locally with:
```bash
npx wrangler d1 migrations apply classque_db --local
```
Apply to remote with:
```bash
npx wrangler d1 migrations apply classque_db --remote
```

---

### Fix 4: Dynamic Notifications Generator

**File:** `src/store/useTeacherStore.ts`

Replace the static `defaultNotifications` block with a `generateDynamicNotifications()` helper function. Place it **above** the `useTeacherStore = create(...)` call.

```ts
const generateDynamicNotifications = (
  cohorts: Cohort[],
  tasks: TaskItem[],
  claims: TeachingClaim[]
): NotificationItem[] => {
  const notifications: NotificationItem[] = [];
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const todayDayCode = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()];
  const currentMonth = now.toISOString().slice(0, 7); // "YYYY-MM"

  // 1. Schedule alerts: cohorts scheduled for today
  cohorts
    .filter(c => c.isActive && c.scheduleDays.includes(todayDayCode))
    .forEach(c => {
      notifications.push({
        id: `notif-schedule-${c.id}-${todayStr}`,
        category: 'schedule',
        title: 'Sesi Kelas Hari Ini',
        message: `${c.name} dijadwalkan hari ini pukul ${c.startTime}.`,
        timestamp: now.toISOString(),
        isRead: false,
        actionTab: 'cockpit',
      });
    });

  // 2. Task alerts: tasks due today or overdue and not completed
  tasks
    .filter(t => !t.isCompleted && t.dueDate <= todayStr)
    .slice(0, 3) // cap at 3 task alerts
    .forEach(t => {
      const isOverdue = t.dueDate < todayStr;
      notifications.push({
        id: `notif-task-${t.id}`,
        category: 'task',
        title: isOverdue ? 'Tugas Terlambat' : 'Tugas Jatuh Tempo Hari Ini',
        message: t.title,
        timestamp: now.toISOString(),
        isRead: false,
        actionTab: 'cockpit',
      });
    });

  // 3. Claim alerts: draft claims in the current month
  claims
    .filter(cl => cl.status === 'draft' && cl.claimPeriod === currentMonth)
    .forEach(cl => {
      notifications.push({
        id: `notif-claim-${cl.id}`,
        category: 'claim',
        title: 'Klaim Honor Belum Diajukan',
        message: `Klaim honorarium ${cl.claimPeriod} masih berstatus draft.`,
        timestamp: now.toISOString(),
        isRead: false,
        actionTab: 'claims-reports',
      });
    });

  return notifications;
};
```

Then in the store initializer, replace:
```ts
// BEFORE:
const initialNotifications: NotificationItem[] = (saved?.notifications && Array.isArray(saved.notifications))
  ? saved.notifications
  : defaultNotifications;
```
With:
```ts
// AFTER:
const _freshNotifications = generateDynamicNotifications(
  initialCohortList,
  initialTaskList,
  saved?.claims || initialClaims
);
const initialNotifications: NotificationItem[] = (saved?.notifications && Array.isArray(saved.notifications))
  ? saved.notifications
  : _freshNotifications;
```

Also add an `addNotification` call mechanism: wire `generateDynamicNotifications` to be re-invoked in `setActiveTab('cockpit')` so notifications refresh when the teacher returns to the dashboard.

---

### Fix 5: SyncStatusBadge — Visible in Collapsed Sidebar

**File:** `src/components/layout/SideNav.tsx` — line ~90.

Change:
```tsx
// BEFORE (badge hidden in collapsed mode):
{isExpanded && <SyncStatusBadge language={language} />}
```
To:
```tsx
// AFTER (icon-only badge in collapsed mode):
<SyncStatusBadge language={language} compact={!isExpanded} />
```

Then in `SyncStatusBadge.tsx`, accept a `compact?: boolean` prop and conditionally hide text spans:
```tsx
// In each state branch, change:
<span className="hidden sm:inline">D1 Synced</span>
// to:
{!compact && <span className="hidden sm:inline">D1 Synced</span>}
```
Apply same pattern to all other text spans in the badge.

---

### Fix 6: i18n Coverage for Hardcoded Strings

**File:** `src/utils/i18n.ts`

Add the following keys to both `en` and `id` translation objects:

```ts
// Under cockpit section, add:
priorityLabel: 'Priority',   // id: 'Prioritas'
deadlineMethod: 'Deadline Method',  // id: 'Metode Batas Waktu'
calendarDate: 'Calendar Date',  // id: 'Tanggal Kalender'
cohortLesson: 'Cohort Lesson',  // id: 'Sesi Kelas'
targetCohort: 'Target Cohort',  // id: 'Target Kelas'
lessonSlot: 'Lesson Slot',  // id: 'Pilih Jadwal'
pickDate: 'Pick Date:',  // id: 'Pilih Tanggal:'
```

Update `UrgentTasksCard.tsx` to use `t.cockpit.priorityLabel` instead of `'Prioritas:'`.

---

## 🧪 Verification & Testing Checklist

- [x] **BUG-01 — POST Sync Coverage**: Add a lesson plan, attendance record, and task in the UI. Wait 1.5s for auto-sync. Query D1:
  ```bash
  npx wrangler d1 execute classque_db --remote --command "SELECT COUNT(*) FROM lesson_plans;"
  npx wrangler d1 execute classque_db --remote --command "SELECT COUNT(*) FROM tasks;"
  npx wrangler d1 execute classque_db --remote --command "SELECT COUNT(*) FROM attendance_records;"
  ```
  Verify counts match the local UI counts.

- [x] **BUG-02 — Attendance Round-Trip**: Mark attendance for a student. Trigger a "Pull from D1" via the Sync Diagnostics Modal. Verify the `AttendanceHistoryTab` still shows the correct status.

- [x] **BUG-03 — Dynamic Notifications**: On a day when a cohort is scheduled, verify the Notification Center bell shows at least 1 unread item with the correct cohort name and time. Add an overdue task; verify a task notification appears.

- [x] **BUG-04 — Migration**: Run `npx wrangler d1 migrations apply classque_db --remote`. Confirm no SQL errors. Then sync a task with `deadlineType: 'lesson'` and verify it appears correctly on a `SELECT * FROM tasks` query.

- [x] **BUG-07 — Collapsed SyncBadge**: Collapse the sidebar. Verify the colored status dot + cloud icon is still visible in the sidebar footer.

- [x] **i18n**: Switch language to English; verify no Indonesian strings remain in `UrgentTasksCard` deadline UI.

- [x] **Build Gate**: Run `npm run build` — must pass with 0 TypeScript errors.

---

## 📁 Files to Create / Modify

| Action | File | Change |
|--------|------|--------|
| **MODIFY** | `functions/api/sync.ts` | Add 7 entity blocks to `onRequestPost`; fix `attendanceDate` in GET mapper; add `deadlineType`/`dueLessonLabel` to tasks GET mapper |
| **CREATE** | `migrations/0003_add_task_lesson_deadline.sql` | `ALTER TABLE tasks` to add 2 new columns |
| **MODIFY** | `src/store/useTeacherStore.ts` | Replace `defaultNotifications` with `generateDynamicNotifications()` |
| **MODIFY** | `src/components/layout/SideNav.tsx` | Pass `compact={!isExpanded}` to `SyncStatusBadge` |
| **MODIFY** | `src/components/layout/SyncStatusBadge.tsx` | Accept `compact` prop; hide text labels when compact |
| **MODIFY** | `src/utils/i18n.ts` | Add ~7 missing keys to both `en` and `id` objects |
| **MODIFY** | `src/components/cockpit/UrgentTasksCard.tsx` | Replace `'Prioritas:'` and deadline-mode labels with `t.cockpit.*` keys |
