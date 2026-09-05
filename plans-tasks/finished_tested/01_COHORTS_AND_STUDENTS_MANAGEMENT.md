# 📋 Stage 01: Cohorts & Student Profile Management

**Lifecycle Stage**: `finished_tested` ✅  
**Target Domain**: Domain 2: Classes & Students Hub (`src/components/hub/ClassesStudentsHub.tsx`)  
**Ubiquitous Language**: `Cohort` (Kelas / Rombel), `Student` (Siswa / Peserta Didik), `Guardian` (Wali Murid)

---

## 🎯 Objectives & Deliverables
Enable complete CRUD operations for Cohorts and Students with rich modal forms, validation, and instant state persistence.

### 1. Cohort Management
- [x] **Add Cohort Modal** (`src/components/hub/CohortModal.tsx`): Form with fields:
  - Cohort Name (e.g. `Cambridge Starters A1`)
  - Target CEFR Level (`Pre-A1` to `C2`)
  - Schedule Days (Multi-select: Mon, Tue, Wed, Thu, Fri, Sat, Sun)
  - Start Time (e.g. `14:00`) & Duration (`45`, `60`, `90`, `120` mins)
  - Room or Virtual Link (e.g. `Room 102` or `https://meet.google.com/...`)
  - Custom Hourly Rate Override (optional)
- [x] **Edit Cohort Modal**: Ability to modify cohort details.
- [x] **Archive / Delete Cohort**: Safe confirmation modal with cascading warnings.

### 2. Student Directory & Profile Management
- [x] **Add Student Modal** (`src/components/hub/StudentModal.tsx`): Form with fields:
  - Full Name & Nickname
  - Cohort Assignment
  - Gender (`M`, `F`, `other`) & Date of Birth
  - Guardian Contact (Guardian Name, WhatsApp Phone Number, Email)
  - Initial Pedagogical Notes, Academic Strengths, and Growth Areas
- [x] **Edit Student Profile**: Modal editing of all student attributes.
- [x] **Student Profile Quick Actions**:
  - Direct WhatsApp link opening `wa.me/<phone>` with formatted greeting.
  - Transfer student to another Cohort (`transferStudent`).
  - Active/Inactive status toggle.

### 3. State Management & Store Methods
- [x] Implemented in `src/store/useTeacherStore.ts`:
  - `deleteCohort(cohortId: string)`
  - `deleteStudent(studentId: string)`
  - `transferStudent(studentId: string, newCohortId: string)`
  - Automated persistence to `localStorage` across all mutations.

---

## 🧪 Verification & Testing Completed
- [x] Create a new cohort "IELTS Master B2", verify it appears in cohort chip selectors across all hubs.
- [x] Edit the cohort's schedule time and room link, verify updates persist.
- [x] Add new students into the cohort with guardian phone numbers.
- [x] Verify search filter correctly finds students by full name and nickname.
- [x] Test WhatsApp direct button correctly opens phone with clean digits formatting.
- [x] Delete a student, verify toast notification and updated roster count.
- [x] Verified `npm run build` passes with zero TypeScript compile errors.
