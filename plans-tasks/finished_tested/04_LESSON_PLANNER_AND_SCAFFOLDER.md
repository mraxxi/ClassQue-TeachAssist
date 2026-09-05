# 📋 Stage 04: Structured Lesson Planner & Scaffolder

**Lifecycle Stage**: `finished_tested` ✅  
**Target Domain**: Domain 3: Lesson Planner & Curriculum Scaffolder (`src/components/hub/LessonPlannerHub.tsx`, `src/components/hub/LessonPlanModal.tsx`, `src/components/hub/PrintableLessonModal.tsx`)  
**Ubiquitous Language**: `Lesson Plan` (RPP / Modul Ajar), `5 Lesson Stages` (Warm-up, Presentation, Practice, Production, Wrap-up)

---

## 🎯 Objectives & Deliverables
Deliver a complete lesson plan authoring and scaffolding experience with interactive 5-stage inputs, dynamic vocabulary/grammar bank editor, resource link vault, and printable lesson scaffold view.

### 1. Lesson Plan Authoring & Editing Modal (`LessonPlanModal.tsx`)
- [x] **Create / Edit Lesson Plan Modal**:
  - **Basic Info**: Title, Topic, CEFR Level, Target Cohort assignment, Duration in minutes.
  - **The 5 Pedagogical Stages**:
    1. `Stage 1: Warm-up / Hook` (5–10 min)
    2. `Stage 2: Presentation` (15–20 min)
    3. `Stage 3: Controlled Practice` (15–20 min)
    4. `Stage 4: Free Production` (20–25 min)
    5. `Stage 5: Review & Wrap-up` (5–10 min)
  - **Interactive Vocabulary Bank Builder**:
    - Add/remove target words with `Word`, `Part of Speech (POS)`, `Definition (EN/ID)`, `Example Sentence`.
  - **Grammar Focus & Homework Assignment**:
    - Target structure explanation and student homework task.
  - **Resource Links / Vault**:
    - Add Google Drive, YouTube, worksheet PDF links with labels.

### 2. Lesson Plan Library Management (`LessonPlannerHub.tsx`, `PrintableLessonModal.tsx`)
- [x] **Duplicate / Save as Template Action**: Clone existing plan with `(Copy)` suffix for instant reuse across cohorts.
- [x] **Delete Lesson Plan**: Safe confirmation modal with state cleanup.
- [x] **Search & Filter**: Real-time search filter for saved lesson plans by title, topic, or CEFR level.
- [x] **Printable Lesson Scaffold Layout**: One-click printable A4 layout for physical classroom binder use with `@media print` styling.

### 3. State & Store Methods
- [x] Implemented in `src/store/useTeacherStore.ts`:
  - `addLessonPlan(plan: LessonPlan)`
  - `updateLessonPlan(id: string, data: Partial<LessonPlan>)`
  - `deleteLessonPlan(id: string)`
  - `duplicateLessonPlan(id: string)`
  - Full persistence to `localStorage` across all lesson plan changes.

---

## 🧪 Verification & Testing Completed
- [x] Click "Create New" in Lesson Planner Hub, fill in a new lesson plan with 5 stages and vocab items.
- [x] Save the plan and verify it appears immediately in the left sidebar list.
- [x] Click "Edit", modify Stage 3 practice instructions, verify updates take effect immediately.
- [x] Test "Duplicate Plan" feature, verify clone is created with `(Copy)` suffix.
- [x] Test the Printable view, verify layout renders cleanly with zero UI buttons in print preview.
- [x] Verified `npm run build` passes with zero TypeScript compile errors.
