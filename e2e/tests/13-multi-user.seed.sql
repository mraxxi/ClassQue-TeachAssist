-- Seed for 13-multi-user.test.mjs: a SECOND teacher with data of every kind, so the test (signed in as the
-- first teacher) can prove none of it is visible or changeable. Applied by e2e/run.sh after the migrations.
INSERT INTO teachers (id, email, name) VALUES ('teacher-b', 'b.teacher@classque.test', 'Teacher B');
INSERT INTO cohorts (id, teacher_id, name, cefr_level) VALUES ('b-cohort', 'teacher-b', 'B Cohort', 'B1');
INSERT INTO students (id, cohort_id, full_name, guardian_phone) VALUES ('b-student', 'b-cohort', 'B Student', '+6281200000000');
INSERT INTO attendance_records (id, cohort_id, student_id, attendance_date, status) VALUES ('b-att', 'b-cohort', 'b-student', '2026-10-01', 'present');
INSERT INTO lesson_plans (id, teacher_id, cohort_id, title) VALUES ('b-lesson', 'teacher-b', 'b-cohort', 'B Lesson');
INSERT INTO teaching_sessions (id, teacher_id, cohort_id, session_date, start_time, duration_minutes, hourly_rate, total_claim_amount) VALUES ('b-session', 'teacher-b', 'b-cohort', '2026-10-01', '09:00', 60, 100000, 100000);
INSERT INTO teaching_claims (id, teacher_id, claim_period, claim_number) VALUES ('b-claim', 'teacher-b', '2026-10', 'CLM-B');
INSERT INTO student_milestone_evaluations (id, student_id, milestone_id, competency_score, evaluated_at) SELECT 'b-eval', 'b-student', id, 3, '2026-10-01T00:00:00Z' FROM cefr_milestones LIMIT 1;
INSERT INTO parent_reports (id, student_id, cohort_id, report_period) VALUES ('b-report', 'b-student', 'b-cohort', '2026-10');
INSERT INTO tasks (id, teacher_id, title) VALUES ('b-task', 'teacher-b', 'B Task');
