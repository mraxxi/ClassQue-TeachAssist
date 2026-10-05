# 📋 Stage 09: Live Timezone Clock Header Widget

> **Re-verified 2026-10-06 (Stage 16).** The checkboxes below were previously unchecked or unreliable; each item is now backed by an automated browser check in `e2e/tests/04-cockpit-live.test.mjs` (clock, proximity) — clock itself also visible in every suite. See `docs/VERIFICATION_REPORT_2026-10.md`.


**Lifecycle Stage**: `working_on`  
**Target Domain**: Domain 1: Today's Cockpit (`src/components/cockpit/DashboardCockpit.tsx`) & Navigation Header  
**Ubiquitous Language**: `Live Classroom Clock` (Jam Kelas Real-Time), `Timezone Indicator` (Zona Waktu Pengajar)

---

## 🎯 Objectives & Deliverables
Provide educators with an accessible, high-precision live digital clock in the dashboard/header that automatically reflects their local timezone (e.g. `WIB / GMT+7`), displays formatted dates, and updates continuously every second.

### 1. Clock Component Features
- [x] **Real-Time Clock Display (`ClassroomClock.tsx`)**:
  - Live 1-second interval ticking clock (hours, minutes, seconds) with monospaced typography to prevent text jitter.
  - Formatted day and date (e.g., `Sabtu, 5 September 2026` in Indonesian, `Saturday, September 5, 2026` in English).
  - Timezone detection via `Intl.DateTimeFormat().resolvedOptions().timeZone` with friendly acronym / GMT offset badge (e.g., `Asia/Jakarta • WIB (GMT+7)`).
  - Clean placement in the Today's Cockpit greeting bar and desktop top-bar.

### 2. Time Synchronization with Daily Teaching Loop
- [x] Visual indicators matching next class proximity (e.g. subtle green/amber pulse when a class is scheduled within 30 minutes).

---

## 🧪 Verification & Testing Checklist
- [x] Verify the clock ticks smoothly every second without layout shifts.
- [x] Verify switching languages between `ID` and `EN` updates the date format appropriately.
- [x] Verify the correct timezone offset and name display for the user's system timezone.
