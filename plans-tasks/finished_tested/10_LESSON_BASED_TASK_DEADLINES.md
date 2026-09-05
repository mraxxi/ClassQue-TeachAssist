# 📋 Stage 10: Lesson-Based Task Deadlines (Due by Cohort Lesson)

**Lifecycle Stage**: `working_on`  
**Target Domain**: Domain 1: Today's Cockpit (`src/components/cockpit/UrgentTasksCard.tsx`)  
**Ubiquitous Language**: `Task Deadline` (Batas Waktu Tugas), `Cohort Lesson Due Date` (Batas Sesi Kelas Pengajar)

---

## 🎯 Objectives & Deliverables
Enable teachers to set task deadlines linked directly to upcoming teaching sessions (e.g., "Due before next class with Cambridge Flyers A2" or any future scheduled lesson slot) rather than only picking arbitrary calendar dates.

### 1. Data Model & Store Updates
- [ ] In `src/types/index.ts`:
  - Enhance `TaskItem` with:
    - `deadlineType?: 'date' | 'lesson'`
    - `cohortId?: string` (linked cohort)
    - `dueLessonLabel?: string` (e.g. `Flyers A2 • Mon, Sep 8 (14:00)`)
    - `dueTimestamp?: string` (ISO computed deadline)

### 2. Task Creator & Card UI Enhancements
- [ ] In `src/components/cockpit/UrgentTasksCard.tsx`:
  - Add deadline mode toggle button: `📅 Specific Date` ↔ `🎓 Cohort Lesson`.
  - When "Cohort Lesson" is selected:
    - Display cohort dropdown (select target class cohort).
    - Display upcoming lesson picker: dynamically lists the next upcoming scheduled sessions (e.g., `Next Session: Mon, 8 Sep 14:00`, `Following Session: Wed, 10 Sep 14:00`, or future slots).
    - Teachers can pick *any future lesson* of that cohort as the deadline.
  - Render a distinct badge on the task card: e.g. `🎓 Flyers A2 (Mon, 14:00)`.

---

## 🧪 Verification & Testing Checklist
- [ ] Create a task with "Cohort Lesson" deadline and select a future lesson slot.
- [ ] Verify the deadline badge shows the cohort name and chosen lesson time.
- [ ] Verify tasks can still be created with standard calendar dates.
- [ ] Verify completion toggle and task deletion work seamlessly.
