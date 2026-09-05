-- Migration 0003: Add lesson-based task deadline fields
ALTER TABLE tasks ADD COLUMN deadline_type TEXT NOT NULL DEFAULT 'date'
  CHECK (deadline_type IN ('date', 'lesson'));
ALTER TABLE tasks ADD COLUMN due_lesson_label TEXT;
