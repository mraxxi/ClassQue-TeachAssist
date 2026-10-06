-- ==========================================================
-- ClassQue-TeachAssist: Migration 0005 - Multi-user (login by email)
-- ==========================================================
-- Schema-only: adds no data and moves no rows. Safe to run on an existing database.
-- (Existing 'teacher-1' data is claimed by its owner at first login, see
--  LEGACY_OWNER_EMAIL in docs/CLOUDFLARE_SETUP.md.)

PRAGMA foreign_keys = ON;

-- Teachers are found by login email regardless of letter case ("Ana@School.id" ==
-- "ana@school.id"); this makes the database enforce what the API already assumes.
CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_email_lower ON teachers(lower(email));

-- Every sync read now filters teaching_sessions by teacher_id.
CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON teaching_sessions(teacher_id);
