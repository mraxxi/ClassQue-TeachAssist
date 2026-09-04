---
name: teacher-domain-architect
description: >-
  Educational and pedagogical domain modeling skill. Use this skill when designing, refining, or implementing features related to class cohorts, student profiles, attendance workflows, CEFR milestone grading, lesson plan scaffolding, parent reports, or teaching claim calculations.
---

# Teacher Domain Architect Skill

This skill defines the pedagogical workflows, business logic, and domain models that power **ClassQue-TeachAssist**.

> **Note**: Always follow the canonical terms documented in [docs/TERMINOLOGY.md](file:///home/archvan/development/ClassQue-TeachAssist/docs/TERMINOLOGY.md).

---

## 📚 Core Domain Models & Concepts

### 1. Cohorts & Classes
- Represents a teaching class/batch (e.g., "YLB-3", "Cambridge A2 Flyers", "Grade 10 English").
- Key attributes: Name, level (CEFR target), schedule day/time, room/link, student roster, hourly rate code.

### 2. Students & Academic Records
- Profile: Name, preferred name/nickname, date of birth, guardian contacts (Phone/WhatsApp/Email), notes (strengths, learning difficulties, behavioral notes).
- Attendance: `present`, `absent`, `late`, `excused` + timestamp & optional note.
- Academic Evaluations: Milestone achievements mapped against standard frameworks (CEFR Pre-A1 to C2).

### 3. CEFR Milestone Gradebook
- Standard European Framework descriptors broken down into discrete micro-competencies across:
  - `Listening`, `Reading`, `Spoken Interaction`, `Spoken Production`, `Writing`.
- Scoring scale: `Emerging` (1), `Developing` (2), `Achieved` (3), `Mastered` (4).
- Provides instant snapshot of student progression without cumbersome standard letter grading.

### 4. Structured Lesson Planning
- Framework:
  1. **Warm-up / Hook** (5-10m)
  2. **Presentation / Concept Introduction** (15-20m)
  3. **Controlled Practice** (15-20m)
  4. **Free Production / Application** (20-25m)
  5. **Review & Wrap-up** (5-10m)
- Includes target vocabulary, grammar focus, homework assignment, and material links.

### 5. Teaching Claims & Honorarium Calculation
- Differentiates strictly between **teaching claims/honorariums** and personal finance.
- Calculates session duration $\times$ cohort hourly rate $\pm$ travel or preparation allowances.
- Exports monthly claim sheets ready to submit to schools or learning centers.

### 6. Parent Progress Reports
- Generates professional, compassionate progress reports.
- Formats:
  - Printable A4 PDF / Clean HTML report card with school branding header.
  - Quick-copy WhatsApp summary for instant messaging to guardians.
