-- Migration 0004: delta sync support
--  * client_updated_at : the client's own edit timestamp (ISO). Used for per-record last-write-wins:
--                        an upsert/delete only applies if it is newer than what is stored.
--  * updated_at        : normalised to ISO-8601 with milliseconds so it can be used as a pull cursor
--                        (`GET /api/sync?since=<cursor>` returns rows with updated_at > cursor).
--  * indexes on updated_at keep delta pulls cheap on the D1 free tier.

ALTER TABLE cohorts ADD COLUMN client_updated_at TEXT;
ALTER TABLE students ADD COLUMN client_updated_at TEXT;
ALTER TABLE lesson_plans ADD COLUMN client_updated_at TEXT;
ALTER TABLE attendance_records ADD COLUMN client_updated_at TEXT;
ALTER TABLE teaching_sessions ADD COLUMN client_updated_at TEXT;
ALTER TABLE teaching_claims ADD COLUMN client_updated_at TEXT;
ALTER TABLE student_milestone_evaluations ADD COLUMN client_updated_at TEXT;
ALTER TABLE parent_reports ADD COLUMN client_updated_at TEXT;
ALTER TABLE tasks ADD COLUMN client_updated_at TEXT;

UPDATE cohorts SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at IS NOT NULL AND updated_at NOT LIKE '%T%';
UPDATE students SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at IS NOT NULL AND updated_at NOT LIKE '%T%';
UPDATE lesson_plans SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at IS NOT NULL AND updated_at NOT LIKE '%T%';
UPDATE attendance_records SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at IS NOT NULL AND updated_at NOT LIKE '%T%';
UPDATE teaching_sessions SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at IS NOT NULL AND updated_at NOT LIKE '%T%';
UPDATE teaching_claims SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at IS NOT NULL AND updated_at NOT LIKE '%T%';
UPDATE student_milestone_evaluations SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at IS NOT NULL AND updated_at NOT LIKE '%T%';
UPDATE parent_reports SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at IS NOT NULL AND updated_at NOT LIKE '%T%';
UPDATE tasks SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at IS NOT NULL AND updated_at NOT LIKE '%T%';

CREATE INDEX IF NOT EXISTS idx_cohorts_updated ON cohorts(updated_at);
CREATE INDEX IF NOT EXISTS idx_students_updated ON students(updated_at);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_updated ON lesson_plans(updated_at);
CREATE INDEX IF NOT EXISTS idx_attendance_updated ON attendance_records(updated_at);
CREATE INDEX IF NOT EXISTS idx_sessions_updated ON teaching_sessions(updated_at);
CREATE INDEX IF NOT EXISTS idx_claims_updated ON teaching_claims(updated_at);
CREATE INDEX IF NOT EXISTS idx_evaluations_updated ON student_milestone_evaluations(updated_at);
CREATE INDEX IF NOT EXISTS idx_reports_updated ON parent_reports(updated_at);
CREATE INDEX IF NOT EXISTS idx_tasks_updated ON tasks(updated_at);
