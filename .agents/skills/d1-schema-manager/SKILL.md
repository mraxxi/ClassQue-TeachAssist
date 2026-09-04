---
name: d1-schema-manager
description: >-
  Database architecture, migrations, and query optimization skill for Cloudflare D1 (Edge SQLite). Use this skill when creating or modifying database schemas, writing SQL migrations, optimizing queries, or setting up client-side synchronization.
---

# Cloudflare D1 Schema & Sync Manager Skill

This skill governs data architecture, edge SQLite tables, migrations, and local-first data synchronization patterns for **ClassQue-TeachAssist**.

---

## 🗄️ D1 Migration Standards

1. **Migration Files**:
   - Location: `migrations/` folder at project root.
   - Naming: `0001_initial_schema.sql`, `0002_add_cefr_milestones.sql`, etc.
   - All migrations must be idempotent or cleanly forward-migrating.

2. **SQLite Constraints & Types**:
   - Primary Keys: Use `TEXT` UUIDs (v4) or ULIDs for client-generated offline creation, preventing ID collisions during sync.
   - Timestamps: ISO-8601 strings in UTC (`TEXT NOT NULL DEFAULT (datetime('now'))`).
   - Foreign Keys: Always enforce `PRAGMA foreign_keys = ON;`.

3. **Data Integrity & Sync Metadata**:
   - Every syncable entity must include:
     - `id TEXT PRIMARY KEY`
     - `created_at TEXT NOT NULL`
     - `updated_at TEXT NOT NULL`
     - `deleted_at TEXT` (soft deletes for conflict-free multi-device sync)
     - `sync_version INTEGER NOT NULL DEFAULT 1`

4. **Query Performance at the Edge**:
   - Add targeted indexes on frequently filtered columns (`cohort_id`, `student_id`, `session_date`, `status`).
   - Avoid `SELECT *` across large join sets; query specific columns.
