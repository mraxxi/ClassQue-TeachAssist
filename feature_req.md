# 💡 Feature Requests & Backlog Tracker — ClassQue-TeachAssist

This document tracks user-requested features, enhancements, and pedagogical workflows to be prioritized and integrated into development stages.

---

## 📥 Submitting a New Feature Request
To add a feature request, add an entry to the **Incoming Requests** table below with:
- **ID**: `FR-XXX`
- **Domain**: One of `Today's Cockpit`, `Classes & Students`, `Lesson Planner`, `Claims & Reports`, `Settings & Data Sync`, or `Cross-Cutting`
- **Description**: User story or problem statement
- **Priority**: `P0 (Urgent/Blocker)`, `P1 (High Impact)`, `P2 (Nice to Have)`, `P3 (Future Consideration)`
- **Status**: `Proposed`, `Approved (Moved to Plan)`, `In Progress`, `Completed`, `Rejected`

---

## 📋 Incoming & Tracked Feature Requests

| ID | Domain | Title & Description | Priority | Target Stage | Status |
|---|---|---|---|---|---|
| **FR-001** | Classes & Students | **Cohort & Student CRUD Modals**: Full ability to add, edit, archive cohorts and add/edit student profiles with guardian contact details. | P0 | Stage 01 | Completed ✓ |
| **FR-002** | Classes & Students | **Attendance History & Roster Matrix**: Dedicated cohort attendance calendar/matrix sub-tab with percentage statistics and date filters. | P0 | Stage 02 | Completed ✓ |
| **FR-003** | Classes & Students | **Interactive CEFR Milestone Evaluations**: Clickable 4-point qualitative scale (`MB`, `SB`, `TC`, `M`) tied to student profiles and skill filters. | P0 | Stage 03 | Completed ✓ |
| **FR-004** | Lesson Planner | **5-Stage Pedagogical Lesson Builder**: Interactive form to draft, edit, and duplicate lesson plans with target vocabularies and grammar focus. | P0 | Stage 04 | Completed ✓ |
| **FR-005** | Today's Cockpit | **Dynamic Schedule Timeline & Next Class Auto-Detect**: Real-time schedule calculation from cohort timings + responsive stopwatch live mode. | P0 | Stage 05 | Completed ✓ |
| **FR-006** | Claims & Reports | **Claims Honorarium Calculator & Printable Invoice**: Completed sessions aggregation, rate multipliers, allowance inputs, and A4 invoice export. | P0 | Stage 06 | Completed ✓ |
| **FR-007** | Claims & Reports | **Parent Progress Report Generator (A4 + WhatsApp)**: Dynamic narrative aggregation, 1-click WhatsApp copy format, and printable A4 report cards. | P0 | Stage 07 | Completed ✓ |
| **FR-008** | Settings & Data Sync | **JSON Full Backup & Restore / Data Portability**: 1-click export and import of full teacher database for total offline safety. | P0 | Stage 08 | Completed ✓ |
| **FR-009** | Today's Cockpit | **AI Pedagogical Prompt / Lesson Assistant**: Quick generative suggestions for warm-up activities, vocab drills, and student feedback phrasing. | P2 | Backlog | Proposed |
| **FR-010** | Classes & Students | **Bulk Student CSV Import**: Allow teachers to import whole class rosters from Excel/CSV spreadsheets. | P2 | Backlog | Proposed |
| **FR-011** | Cross-Cutting | **Keyboard Shortcuts Bar (Hotkeys)**: Spacebar for timer pause/play, `1-4` for quick roll-call status, `Esc` for modal dismissal. | P2 | Stage 05+ | Completed ✓ |
| **FR-012** | Today's Cockpit | **Live Timezone Clock Widget**: Real-time ticking clock with timezone indicator (WIB/GMT) and formatted local date. | P1 | Stage 09 | Completed ✓ |
| **FR-013** | Today's Cockpit | **Lesson-Based Task Deadlines**: Set task deadlines by upcoming cohort lesson instead of only calendar dates. | P1 | Stage 10 | Completed ✓ |
| **FR-014** | Cross-Cutting | **Sync Status Diagnostics Modal**: Interactive modal on clicking sync badge showing D1 status, record counts, and manual sync. | P1 | Stage 11 | Completed ✓ |
| **FR-015** | Cross-Cutting | **Cookie Storage for Language & Preferences**: Store language, theme, and sidebar preferences in persistent cookies. | P1 | Stage 12 | Completed ✓ |
| **FR-016** | Cross-Cutting | **Interactive Notifications Center**: Functional notification bell with unread badge, popover list, and class/task alerts. | P1 | Stage 13 | Completed ✓ |
| **FR-017** | Settings & Data Sync | **Continuous Local-to-D1 Auto-Sync**: Automatically reflect app mutations in Cloudflare D1 with offline queuing. | P0 | Stage 14 | Completed ✓ |

---

## 🔄 Lifecycle of a Feature Request
```
[User Request in feature_req.md] 
       ⬇
[Decomposed into Stage Plan in /plans-tasks/working_on/*.md] 
       ⬇ (User review & comment in/out)
[Implemented & Moved to /plans-tasks/implemented_testing/*.md] 
       ⬇ (Interactive testing & verification)
[Finished & Moved to /plans-tasks/finished_tested/*.md]
```
