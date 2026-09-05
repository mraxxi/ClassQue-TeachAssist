# 📋 Stage 03: CEFR Gradebook & Micro-Evaluations

**Lifecycle Stage**: `finished_tested` ✅  
**Target Domain**: Domain 2: Classes & Students Hub (`src/components/hub/ClassesStudentsHub.tsx`, `src/components/hub/CefrGradebookTab.tsx`)  
**Ubiquitous Language**: `CEFR Milestone` (Capaian CEFR), `Competency Level` (`1: Emerging / MB`, `2: Developing / SB`, `3: Achieved / TC`, `4: Mastered / M`)

---

## 🎯 Objectives & Deliverables
Transform the static CEFR Gradebook sub-tab into a fully interactive pedagogical evaluation matrix with student selection, 4-point rating toggles, skill filtering, and teacher qualitative notes.

### 1. Interactive CEFR Evaluation Matrix (`CefrGradebookTab.tsx`)
- [x] **Target Student Selector Bar**:
  - Filter evaluation matrix by individual student or switch between cohort members smoothly.
- [x] **Skill Category & Level Filters**:
  - Filter buttons for: `All Skills`, `Listening`, `Reading`, `Spoken Interaction`, `Spoken Production`, `Writing`.
  - Level filter chips (`All Levels`, `Pre-A1`, `A1`, `A2`, `B1`, `B2`, `C1`, `C2`).
- [x] **Clickable 4-Point Rating Buttons**:
  - `1 • Emerging / MB` (1)
  - `2 • Developing / SB` (2)
  - `3 • Achieved / TC` (3)
  - `4 • Mastered / M` (4)
  - Real-time rating toggling with color coding and instant feedback.
- [x] **Milestone Teacher Notes Modal**:
  - Interactive popover modal to add/edit qualitative teacher observations per competency descriptor.

### 2. Student Profile CEFR Progress Card
- [x] In Student Detail profile:
  - Added CEFR Competency Summary Gauge (Count of Mastered & Achieved competencies vs evaluated).
  - Quick jump button directly to CEFR Gradebook.
- [x] Enriched canonical CEFR descriptors in `seedData.ts` across Listening, Reading, Spoken Interaction, Spoken Production, Writing.

### 3. Store State & Evaluation Actions
- [x] Implemented in `src/store/useTeacherStore.ts`:
  - `studentEvaluations: StudentMilestoneEvaluation[]`
  - `setStudentMilestoneScore(studentId, milestoneId, score, notes)`
  - Full local storage synchronization across all evaluation mutations.

---

## 🧪 Verification & Testing Completed
- [x] Select a student in CEFR Gradebook and click rating `4 • M` on `A1.SI.1` (Spoken Interaction).
- [x] Verify active score highlights immediately with color styling.
- [x] Switch to a different student, verify scores reflect that student's evaluations independently.
- [x] Filter by `Spoken Production` skill, verify only relevant descriptors appear.
- [x] Add a teacher note to an evaluation, verify it is saved and viewable.
- [x] Check student profile detail view: verify milestone competency count updates accurately.
- [x] Verified `npm run build` passes with zero TypeScript compile errors.
