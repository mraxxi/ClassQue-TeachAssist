# 📋 Stage 02: Attendance Engine & Historic Log Matrix

**Lifecycle Stage**: `finished_tested` ✅  
**Target Domain**: Domain 2: Classes & Students Hub (`src/components/hub/ClassesStudentsHub.tsx`, `src/components/hub/AttendanceHistoryTab.tsx`)  
**Ubiquitous Language**: `Roll-Call` (Presensi), `Attendance Record` (Riwayat Presensi), `Present (H)`, `Absent (A)`, `Late (T)`, `Excused (I)`

---

## 🎯 Objectives & Deliverables
Build a comprehensive Attendance sub-tab inside **Classes & Students Hub** to let teachers inspect cohort-wide attendance trends, historic attendance matrices, per-student absence rates, and mark attendance for past/future dates.

### 1. Attendance Hub Sub-Tab (`AttendanceHistoryTab.tsx`)
- [x] Dedicated third sub-tab navigation button: **Presensi & Riwayat / Attendance Log**.
- [x] **Date Navigator & Picker**:
  - Quick Day Navigator (`< Previous Day`, `Today`, `Next Day >`).
  - Native date picker with direct jump to any session date.
- [x] **Cohort Attendance Matrix & Daily Views**:
  - Daily roll-call roster with 1-click status pills (`Hadir`, `Alpa`, `Terlambat`, `Izin`).
  - Inline note editor per student (e.g. "Izin sakit flu", "Traffic").
  - 7-Day historic matrix view showing recent dates with interactive 1-click cycle toggles.
- [x] **Attendance KPI Summary for Cohort**:
  - Cohort Overall Attendance % (e.g. `94%`).
  - Present, Absent, Late, Excused breakdown count for selected date.
  - Quick "Mark All Present" batch action.

### 2. Student Individual Attendance Breakdown
- [x] In Student Detail profile view:
  - Added "Student Attendance Rate" summary gauge (Present, Absent, Late, Excused, calculated rate %).
  - Quick link jumping directly into the Attendance sub-tab.

### 3. State & Utility Methods
- [x] Implemented in `src/store/useTeacherStore.ts`:
  - `setAttendance(studentId, cohortId, date, status, note)`
  - `batchMarkAllPresent(cohortId, date)`
  - Full local storage synchronization across all attendance mutations.

---

## 🧪 Verification & Testing Completed
- [x] Navigate to Attendance Sub-Tab in Classes & Students Hub.
- [x] Toggle date backwards to previous session dates and mark a student as "Late" or "Excused" with a note.
- [x] Verify attendance matrix updates instantly and persists across reloads.
- [x] Check student profile detail view: verify calculated attendance % matches recorded records.
- [x] Verify "Mark All Present" button works for any selected date.
- [x] Verified `npm run build` passes with zero TypeScript compile errors.
