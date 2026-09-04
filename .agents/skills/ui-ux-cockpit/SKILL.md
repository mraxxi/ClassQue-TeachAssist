---
name: ui-ux-cockpit
description: >-
  Teacher-centric UI/UX design patterns, layouts, and interaction workflows. Use this skill when designing front-end interfaces, live class cockpits, stopwatch components, attendance roll-call cards, keyboard navigation, or print/export layouts.
---

# UI/UX Cockpit Skill (Teacher-Centric Design)

This skill provides guidelines for crafting a high-efficiency, beautiful, and distraction-free user experience for teachers.

---

## 🎨 Aesthetic & Layout Philosophy

1. **Clean & Calming Palette**:
   - Backgrounds: Warm neutrals (`#F8F9FA` or soft cream `#F6F4EF`) to reduce eye strain during long grading/planning sessions.
   - Accents: Deep slate, educational emerald/teal, muted indigo.
   - Dark mode support for evening prep sessions.

2. **Zero Clutter Philosophy**:
   - The teacher's home screen must not be a wall of 10 disparate widgets.
   - Focus on what matters **right now**: "What is my next class?", "Start Stopwatch / Roll-Call", "Tasks due today".

3. **Live Class Mode (Full-Screen Cockpit)**:
   - When a class is in session:
     - Large timer / stopwatch with pause/resume.
     - 1-click attendance toggle buttons (P / A / L / E) with rapid key navigation (e.g., Space to cycle status).
     - Live lesson plan viewer (quick access to current stage & vocab words).
     - Fast scratchpad for quick behavioral/achievement notes on students.

4. **Tabbed Hub Architecture**:
   - Group related domains into unified hubs with sub-tabs instead of cluttering the primary navigation bar.
   - Keep primary navigation to **5 clean tabs**:
     1. 📊 Cockpit
     2. 👥 Classes & Students
     3. 📖 Lesson Planner
     4. 📑 Claims & Reports
     5. ⚙️ Settings

5. **A4 & Mobile Print Styles**:
   - All report cards and claim summaries must include `@media print` CSS rules formatted for standard A4 pages with zero UI chrome (no sidebars or navigation bars on print).
