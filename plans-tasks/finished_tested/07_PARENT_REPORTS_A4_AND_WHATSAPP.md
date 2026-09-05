# 📋 Stage 07: Parent Progress Reports (A4 & WhatsApp Formats)

**Lifecycle Stage**: `finished_tested`  
**Target Domain**: Domain 4: Claims & Reports Hub (`src/components/hub/ClaimsReportsHub.tsx`)  
**Ubiquitous Language**: `Parent Progress Report` (Laporan Perkembangan Wali Murid / Rapor), `Report Card (A4)` (Lembar Rapor Cetak A4), `WhatsApp Brief` (Ringkasan WhatsApp)

---

## 🎯 Objectives & Deliverables
Create an automated, pedagogical report generator that aggregates attendance percentage, CEFR milestone achievements, and teacher narrative feedback into two polished formats: a printable A4 Report Card and an emoji-formatted WhatsApp message.

### 1. Dynamic Data Aggregation
- [x] For any selected student and reporting period (e.g. `September 2026` or `Term 1 - 2026`):
  - Automatically calculate attendance rate % from recorded sessions.
  - Fetch evaluated CEFR milestones across the 5 language skills.
  - Pull student strengths, growth areas, and general observations.

### 2. Dual Output Formats
- [x] **1. Printable A4 Report Card (`PrintableReportCard.tsx`)**:
  - School/Tutor branding header with school name, logo placeholder, teacher name.
  - Student identity block (Full name, nickname, cohort, reporting period).
  - Attendance summary gauge (Present vs Total sessions).
  - CEFR competency breakdown table with qualitative level indicators (`MB`, `SB`, `TC`, `M`).
  - Teacher narrative comments box.
  - Teacher signature line.
  - `@media print` optimized CSS for single-page A4 printing without browser headers/clutter.
- [x] **2. WhatsApp Brief Formatter & 1-Click Action**:
  - Dynamic markdown/emoji template formatted specifically for messaging apps.
  - One-click copy with visual toast confirmation.
  - Direct WhatsApp button launching `https://wa.me/<guardianPhone>?text=<encodedBrief>`.

### 3. Report History & Custom Feedback Editor
- [x] Ability for teacher to edit narrative feedback directly in the UI before generating report.
- [x] Save generated parent report to store history (`parentReports`).
- [x] Toggle `isSent` status with timestamp.

---

## 🧪 Verification & Testing Checklist
- [x] Select a student with attendance records and evaluated CEFR milestones.
- [x] Verify attendance rate and CEFR scores populate dynamically in the report preview.
- [x] Edit teacher narrative notes in the live preview editor.
- [x] Click "Copy WhatsApp Format", verify clipboard contains properly formatted message with emojis and student details.
- [x] Click "Print A4 Report Card", verify browser print preview displays a clean, single-page professional report card layout.
- [x] Click "Open WhatsApp", verify correct phone number and pre-filled message URL.
