# 📋 Stage 05: Dynamic Today's Cockpit & Live Class Runner

**Lifecycle Stage**: `finished_tested` ✅  
**Target Domain**: Domain 1: Today's Cockpit & Live Modal (`src/components/cockpit/*`)  
**Ubiquitous Language**: `Today's Cockpit` (Dasbor Hari Ini), `Teaching Session` (Sesi Pembelajaran), `Live Cockpit` (Kokpit Kelas Langsung), `Stopwatch` (Stopwatch Sesi)

---

## 🎯 Objectives & Deliverables
Transform static/hardcoded dashboard elements into a dynamic, real-time educator cockpit with accurate schedule timelines, intelligent "Next Class" detection, live KPI calculations, and enhanced live stopwatch in-class runner.

### 1. Dynamic Schedule Timeline & Next Class Detection
- [x] In `src/components/cockpit/ScheduleTimeline.tsx`:
  - Dynamically compute today's sessions from `cohorts.scheduleDays` matching today's day of week (`Mon`, `Tue`, etc.).
  - Real-time status badge: `Completed` (if already taught today), `Upcoming` (next session with 1-click launch), and `Later`.
  - Display actual room, start/end time, and CEFR level badges.
- [x] In `src/components/cockpit/NextClassCard.tsx`:
  - Automatically detect upcoming cohort scheduled for today or allow quick cohort switching from dropdown.
  - Linked lesson plan preview with duration badge.
  - 1-Click Launch button connects to the exact detected cohort.

### 2. Live KPI Metric Cards Calculation
- [x] In `src/components/cockpit/DashboardCockpit.tsx`:
  - `Today's Hours`: Real sum of duration from today's completed teaching sessions.
  - `Next Class In`: Real calculated time / status string.
  - `Pending Tasks`: Dynamic count from uncompleted tasks.
  - `Monthly Claimable`: Dynamic sum of completed sessions in current month $\times$ cohort hourly rates.

### 3. Live Cockpit Modal Enhancements (`LiveCockpitModal.tsx`)
- [x] **Dynamic Stage Stepper**:
  - Clickable step indicator and Previous/Next buttons to advance through Warm-up ➔ Presentation ➔ Practice ➔ Production ➔ Wrap-up with suggested duration indicators.
- [x] **In-Class Quick Student Scratchpad & Micro-Grading**:
  - Real-time CEFR descriptor rating buttons directly for students during live class.
  - Scratchpad auto-saves into completed `TeachingSession` record on finish.
- [x] **Keyboard Shortcuts**:
  - `Space`: Toggle Stopwatch Play / Pause (ignored when typing in inputs).
  - `Esc`: Modal dismissal confirmation.

---

## 🧪 Verification & Testing Completed
- [x] Check DashboardCockpit: verify KPIs show accurate numbers computed from store data.
- [x] Launch Live Cockpit from Next Class Card or Timeline.
- [x] Verify stopwatch ticks accurately every second and Spacebar toggles pause/resume.
- [x] Advance stages 1 to 5, verify stage contents load from the linked lesson plan.
- [x] Mark student attendance in modal, test in-class micro-grading, and type scratchpad notes.
- [x] Click "Finish Teaching Session", verify new session record is saved, claim total increases on Dashboard KPI, and modal closes cleanly.
- [x] Verified `npm run build` passes with zero TypeScript compile errors.
