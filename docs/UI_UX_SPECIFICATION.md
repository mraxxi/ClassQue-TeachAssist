# UI/UX Specification & Design System — ClassQue-TeachAssist

## 1. Executive Summary & Design Principles

The UI/UX of **ClassQue-TeachAssist** is engineered around one core reality:
> **Teachers operate under high cognitive load and strict time pressure.** 
> Between back-to-back classes, a teacher needs zero-latency access to their current class, one-click attendance, and immediate peace of mind for claims and reporting.

### Core UX Tenets
1. **Action-First, Not Metric-Overload**: Show what needs to happen *now*, not 10 graphs of past data.
2. **Fitts's Law in the Classroom**: Large, thumb-friendly touch targets (min $48\times48\text{px}$) for tablet & mobile classroom use.
3. **Unified Daily Teaching Loop**: No jumping between separate pages during a class session.
4. **Calm Aesthetic**: Warm neutrals and soft contrast to prevent eye fatigue during evening grading.

---

## 2. Navigation Architecture: 5 Consolidated Domains

Instead of 12 fragmented sidebar items, navigation is consolidated into **5 intentional hubs**:

```
[ Primary Sidebar / Navigation ]
├── 📊 Today's Cockpit     (/cockpit)           -> Daily focal point & quick launcher
├── 👥 Classes & Students  (/classes-students)  -> Unified 4-in-1 academic hub
├── 📖 Lesson Planner      (/lesson-planner)    -> 5-stage planner & resource vault
├── 📑 Claims & Reports    (/claims-reports)    -> Honorariums & parent report cards
└── ⚙️ Settings            (/settings)          -> Profile, rates & offline D1 sync
```

---

## 3. Detailed Screen Anatomy

### 3.1. 📊 Today's Cockpit (Dashboard) — The 3-Zone Layout

```
+-------------------------------------------------------------------------------+
| TOP BAR: Greeting & Date | [ ⚡ Start Next Class ] | [ + Quick Task ] | 🌐 EN/ID|
+-------------------------------------------------------------------------------+
| ZONE 1: 4 Key Pulse Metrics (Compact Top Banner)                              |
| [ 🕒 Today: 3.5 hrs ]  [ 🏫 Next: YLB-3 (14:00) ]  [ 📝 2 Tasks Due ]  [ 💰 Rp 1.450k ] |
+---------------------------------------+---------------------------------------+
| ZONE 2 (Left 60%): NEXT / ACTIVE CLASS| ZONE 3 (Right 40%): ACTION QUEUE      |
| +-----------------------------------+ | +-----------------------------------+ |
| | 🏫 YLB-3 — Cambridge Flyers A2    | | | 📝 Urgent Tasks (2 Due Today)     | |
| | 🕒 14:00 - 15:30 (Room 204)       | | | [ ] Grade Writing Drafts (YLB-3)  | |
| | 📚 Lesson: Unit 4 - Past Animals  | | | [ ] Send WhatsApp brief to Grade 5| |
| |                                   | | +-----------------------------------+ |
| | [ ▶️ Launch Live Cockpit (Class) ] | | | 📅 Today's Schedule Timeline      | |
| +-----------------------------------+ | | 10:00 - 11:30 [Done]  Grade 4 Eng | |
|                                       | | 14:00 - 15:30 [Next]  YLB-3       | |
|                                       | | 16:00 - 17:00 [Later] Private Tute| |
|                                       | +-----------------------------------+ |
+-------------------------------------------------------------------------------+
```

---

### 3.2. ⚡ The "Live Cockpit" (In-Class Mode) — Classroom Ergonomics

When a teacher clicks **"Launch Live Cockpit"**, the app enters a focused view:

```
+-------------------------------------------------------------------------------+
| [ ✖ Exit Cockpit ]  YLB-3 (Unit 4: Past Animals)       [ ⏸️ Pause ] [ ⏹️ Finish ]|
| LIVE STOPWATCH:  00:34:18  (Auto-calculates claim on finish)                  |
+---------------------------------------+---------------------------------------+
| LEFT PANEL (50%): 1-CLICK ROLL-CALL   | RIGHT PANEL (50%): LESSON & SCRATCHPAD|
| +-----------------------------------+ | +-----------------------------------+ |
| | Student Name        Status Toggle | | | 📌 Active Stage: Controlled Practice| |
| | 1. Budi Santoso     [ H ][A][T][I]| | | Focus: Worksheet Page 24 (Past Simple)|
| | 2. Siti Rahma       [H][ A ][T][I]| | | 🔑 Key Vocab: dinosaur, extinct...  |
| | 3. Kevin Wijaya     [ H ][A][T][I]| | +-----------------------------------+ |
| | 4. Amanda Putri     [H][A][ T ][I]| | | 📝 Quick Student Scratchpad       | |
| | [ ✅ Mark All Present ]           | | | "Kevin struggled with -ed endings" | |
| +-----------------------------------+ | +-----------------------------------+ |
+-------------------------------------------------------------------------------+
```

---

### 3.3. 👥 Classes & Students Hub (4-in-1 Container)

Inside `/classes-students`, a clean top segmented bar switches between tabs without full page reloads:

```
[ 🏫 Cohorts / Classes ] | [ 👤 Student Directory ] | [ 🎯 CEFR Gradebook ] | [ 📅 Attendance Log ]
```

- **Master-Detail Flow**: Selecting a cohort on the left sidebar immediately filters the student roster, CEFR progress bars, and recent attendance for that specific class.

---

### 3.4. 📑 Claims & Reports Hub (Clean Separation)

```
[ 💰 Teaching Claims & Honorariums ]  |  [ 👨‍👩‍👧 Parent Progress Reports ]
```

1. **Teaching Claims Tab**:
   - Filter by Month (e.g. `September 2026`).
   - Summary Card: Total Sessions (`18`), Total Hours (`27.0 hrs`), Total Estimated Honorarium (`Rp 4.050.000`).
   - Action Button: **[ 🖨️ Export Invoice / Claim Slip (PDF) ]**.
2. **Parent Reports Tab**:
   - Select Student ➔ Auto-populates attendance percentage, CEFR milestone badges, and teacher feedback draft.
   - Dual Action Buttons:
     - **[ 📋 Copy WhatsApp Message ]** (Formats with emojis and greetings).
     - **[ 🖨️ Print A4 Report Card ]** (Generates formal certificate-style layout).

---

## 4. UI Button & Interaction Guidelines

| Action Type | Visual Styling | Placement Rule | Touch Target |
|---|---|---|---|
| **Primary Action** *(Launch Class, Finish Session)* | Solid Emerald/Teal `#0F766E`, bold text, subtle shadow | Top-right or bottom sticky bar | $\ge 48\text{px}$ height |
| **Roll-Call Toggles** *(H / A / T / I)* | Segmented chip group with state colors (H=Green, A=Red, T=Amber, I=Blue) | Inline with student list | $\ge 44\times44\text{px}$ per button |
| **Secondary Action** *(Filter, New Plan, Add Student)* | Outlined with warm neutral border `#E5E7EB` | Header toolbar above lists | $\ge 40\text{px}$ |
| **Quick Copy** *(WhatsApp brief)* | Vibrant WhatsApp green `#25D366` chip | Card footer with checkmark feedback | $\ge 44\text{px}$ |

---

## 5. Color Palette & Aesthetics (Warm Slate & Emerald)

- **Canvas Background**: `#F8F9FA` (Day) / `#0F172A` (Night)
- **Card Background**: `#FFFFFF` with `1px solid #E2E8F0` and `box-shadow: 0 1px 3px rgba(0,0,0,0.05)`
- **Primary Educational Accent**: `#0F766E` (Deep Teal) / `#14B8A6` (Light Teal)
- **Secondary Accent**: `#4F46E5` (Indigo) for Lesson Planning & CEFR
- **Neutral Typography**: `#1E293B` (Headings), `#64748B` (Secondary text)

---

## 6. Stage 17 — Implemented Design Decisions (2026-10)

Derived from a screenshot critique at 1400 px and 390 px (phone) and verified by `e2e/tests/11-ux.test.mjs`.

### 6.1 Roll-call (`AttendanceControl`)
- One shared component for the Attendance tab, the Cockpit card and the Live Cockpit.
- **State is never colour-only**: colour + icon + label (`Hadir (H)`); phones show the letter, the full word stays the accessible name.
- Rendered as a **radio group** (`role=radiogroup/radio`, `aria-checked`), ≥ 44 px targets on touch, keyboard operable.
- **Unrecorded is a visible state** (nothing selected) plus a `3/5 tercatat` progress bar; there is no silent "present".

### 6.2 Phone-first Cockpit
- A greeting + **one sentence about what happens next** replaces the second big clock (the live clock is in the header; phones get a compact one). The primary action ("start class") stays inside the first screen at 390 × 844.
- KPIs are compact on phones (2 × 2, no decorative icons, smaller values).
- Live Cockpit on phones is a **full-height sheet with four tabs** (Presensi · Nilai · Pelajaran · Catatan); the stopwatch and *Finish* stay pinned in the header; roll-call rows stack with full-width controls; micro-grade buttons are 40 px.

### 6.3 Safety: Undo instead of only "Are you sure?"
Deleting a student, cohort, session, task or lesson plan shows a toast with **Urungkan / Undo** (8 s). Undo restores the records *and their cascade*, re-stamps them so the server revives them, and therefore works across devices (see ARCHITECTURE §3 "edit beats delete").

### 6.3b First run & empty states
A setup checklist on the Cockpit (cohort → students → lesson plan → first roll-call → optional sync) appears only while there is no cohort or no student and can be dismissed permanently. Empty hubs state *what the thing is* and offer the next action (`EmptyState`).

### 6.4 Dark mode (`cq_theme`: light / dark / system)
- Implemented as a **remap of Tailwind's colour variables** (`src/dark-theme.css`, generated by `scripts/gen-dark-theme.mjs` from Tailwind's own theme), so no component carries `dark:` classes and `position: fixed` modals keep working (a CSS `filter: invert` would break them).
- `white` becomes the card surface, so `bg-teal-800 text-white` becomes a readable pale button with dark text.
- `.theme-original` keeps intentionally dark blocks (stopwatch header, D1 card, primary CTA) dark; `.print-sheet` keeps paper previews white; the whole palette lives in `@media screen`, so **printing is always light**.
- Applied by an inline script before first paint (no flash) and follows the OS live while the preference is "system". Modal backdrops use `.scrim` (always dark).
- Re-generate after upgrading Tailwind: `node scripts/gen-dark-theme.mjs`.

### 6.5 Accessibility bar
- axe-core is part of the suite: **zero violations** on 10 screens × (light, dark, phone), including modals.
- Light-mode `stone-400/500` were darkened to meet WCAG AA (4.5 : 1) for small text; coloured small text/solid buttons use the `-700` shade.
- Every icon-only button has an accessible name; every input/select has a label; each page has an `h1` (visually hidden) and a sane heading order; `aria-live` toasts; visible focus rings; `prefers-reduced-motion` respected for pulsing indicators.
- Keyboard: `Space` (stopwatch), `1–4` (roll-call), `Esc`, and `?` opens a shortcut reference.

### 6.6 Performance & offline
Fonts are self-hosted (no Google request; cached by the service worker). Secondary hubs are lazy chunks (first-load JS 502 kB → 330 kB) and are preloaded when the browser is idle so they also open offline.
