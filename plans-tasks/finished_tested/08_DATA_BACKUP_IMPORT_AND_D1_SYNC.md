# 📋 Stage 08: Data Backup, JSON Portability & Edge Sync

**Lifecycle Stage**: `finished_tested`  
**Target Domain**: Domain 5: Settings & Data Sync (`src/components/hub/SettingsHub.tsx`)  
**Ubiquitous Language**: `Local-First Storage` (Penyimpanan Lokal), `Data Backup` (Cadangan Data JSON), `Cloudflare D1 Sync` (Sinkronisasi D1)

---

## 🎯 Objectives & Deliverables
Ensure 100% data durability and teacher peace of mind by providing complete JSON export and restore capabilities, robust local storage with IndexedDB caching, and structured sync diagnostic interfaces.

### 1. JSON Backup Export & Restore
- [x] **One-Click JSON Data Export**:
  - Export full teacher database (Teacher profile, Cohorts, Students, Attendance Records, Lesson Plans, CEFR Evaluations, Sessions, Claims, Tasks, Reports) as a downloadable timestamped JSON file (e.g. `classque_backup_2026-09-05.json`).
- [x] **JSON Data Import / Restore Modal**:
  - File picker allowing upload of a valid backup JSON file.
  - Schema validation and sanity check before overwriting or merging data.
  - Success toast and instant UI reload with imported state.
- [x] **Reset to Default / Seed Data**:
  - Reset action with double confirmation modal to restore sample seed data for testing or demo purposes.

### 2. Robust Storage Layer & Edge Sync Diagnostics
- [x] Enhanced local storage manager with error handling and quota detection.
- [x] Visual Sync Status indicators (Online/Offline status, Local storage used KB, record counts breakdown).
- [x] Cloudflare D1 Sync simulation & API endpoint readiness check.

---

## 🧪 Verification & Testing Checklist
- [x] Add custom cohorts, students, and lesson plans.
- [x] Click "Export Complete JSON Backup", verify file downloads with complete data schema.
- [x] Modify or delete data in UI, then click "Restore Backup" and upload the exported JSON file.
- [x] Verify all cohorts, students, and lesson plans are restored with 100% fidelity.
- [x] Test "Reset to Demo Data" with confirmation dialog.
