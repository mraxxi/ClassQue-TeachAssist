# Product Requirements Document (PRD) — ClassQue-TeachAssist

## 1. Executive Summary
**ClassQue-TeachAssist** is an educator's personal operating system designed to eliminate fragmented administrative work. By consolidating scheduling, roll-call, lesson planning, CEFR milestone tracking, claim calculations, and parent reporting into a single high-efficiency cockpit, teachers save hours of administrative overhead weekly.

The entire system is architected to run seamlessly on **Cloudflare's 100% Free Tier** (Pages + Workers / Functions + D1 SQLite + KV).

---

## 2. Problem Statement & User Pain Points
Teachers juggle 5–8 disparate apps every single day:
1. **Attendance Sheets**: Paper sheets or cumbersome school LMSs.
2. **Lesson Notes & Scaffolds**: Scattered across Google Docs, Word files, or physical notebooks.
3. **Student Evaluations**: Manual grading spreadsheets with disconnected milestone frameworks.
4. **Teaching Claims / Honorariums**: Calculating teaching hours manually at the end of each month.
5. **Parent Communication**: Writing individual progress summaries from scratch for WhatsApp/email.

---

## 3. User Personas
- **Primary**: K-12 Teachers, Language Instructors (ESL/EFL/CEFR), After-school Tutors, Independent Educators.
- **Secondary**: Academic Coordinators managing multi-cohort schedules.

---

## 4. Key Product Domains & Functional Requirements

### 4.1. Domain 1: Today's Cockpit (Dashboard)
- **Immediate Focus**: Displays today's upcoming class session, classroom/link, and countdown.
- **1-Click Class Launch**: Launches live cockpit with preloaded lesson plan and student roster.
- **Stopwatch / Time Tracker**: Records exact start/stop teaching duration for claims.
- **Urgent Action Items**: Quick task list with deadlines.
- **Daily Hours Summary**: Live counter of teaching hours delivered today and this month.

### 4.2. Domain 2: Classes & Students Hub
- **Cohorts / Batches Management**:
  - Class name, target proficiency level (CEFR Pre-A1 to C2), schedule recurrence, location/room, rate code.
- **Student Profiles**:
  - Full name, nickname, guardian contact details, strengths/weaknesses, behavioral log.
- **Attendance & Roll-Call Engine**:
  - Fast status toggles: `Present`, `Absent`, `Late`, `Excused`.
  - Batch roll-call mode with instant completion timestamping.
  - Historic attendance statistics per student and cohort.
- **CEFR Milestone Gradebook**:
  - Built-in descriptors across 5 skills: Listening, Reading, Spoken Interaction, Spoken Production, Writing.
  - Micro-evaluations: 4-stage competency level (Emerging ➔ Developing ➔ Achieved ➔ Mastered).
  - Quick filtering by student or whole class.

### 4.3. Domain 3: Lesson Planner & Curriculum Scaffolder
- **Structured Lesson Templates**:
  - 5-stage pedagogical flow: Warm-up ➔ Concept Presentation ➔ Controlled Practice ➔ Free Production ➔ Wrap-up / Review.
- **Quick Vocabulary & Grammar Bank**:
  - Target words, pronunciation guides, example sentences.
- **Resource Vault**:
  - Attached links (Google Drive, PDFs, YouTube, interactive games).
- **Curriculum Archive**:
  - Searchable repository of past lesson plans for instant re-use across cohorts.

### 4.4. Domain 4: Claims & Reports Engine
- **Teaching Claims & Honorarium Tracking**:
  - Automatic calculation: `Completed Session Hours × Cohort Hourly Rate + Extra Allowances`.
  - Monthly summary breakdown (hours taught, total earnings, pending verification).
  - One-click export of formal claim invoices (PDF / CSV / Printable Sheet).
- **Parent Progress Report Generator**:
  - Aggregates attendance %, CEFR milestone achievements, and teacher notes into a polished narrative.
  - Dual Output Formats:
    1. **Printable / PDF A4 Report Card**: Clean, professional layout with school/tutor branding.
    2. **WhatsApp / Chat Format**: Ready-to-copy emoji-formatted text message for instant guardian updates.

### 4.5. Domain 5: Settings & Local-First Sync
- **Offline Mode**: Full functionality without internet connection via IndexedDB; changes queue up and auto-sync to Cloudflare D1 when online.
- **Data Export & Backup**: Complete JSON / SQLite backup export for data ownership.
- **Customizable CEFR / Grading Rubrics**: Ability to add custom competencies.

---

## 5. Non-Functional Requirements
- **Hosting**: 100% Free-tier Cloudflare architecture.
- **Performance**: Sub-100ms UI interactions; zero blocking spinners for local actions.
- **Responsiveness**: Fully responsive across Mobile (smartphones), Tablets (iPad/Android tablets for classroom use), and Desktops.
- **Privacy & Security**: Secure access with no unauthorized third-party telemetry.
