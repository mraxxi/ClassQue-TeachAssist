-- ==========================================================
-- ClassQue-TeachAssist: DEMO DATA (local development only)
-- ==========================================================
-- NOT a migration. It used to be migrations/0002_seed_demo_data.sql, which put a
-- demo teacher ('teacher-1') and sample classes into every database. Teachers now
-- sign in by email and each get their own empty account, so this is applied by hand:
--
--   npx wrangler d1 execute classque_db --local --file=./seeds/demo_data.sql
--
-- Run it only AFTER migrations (the evaluations below reference the CEFR milestones).
-- Never run it against production: INSERT OR REPLACE would overwrite real rows.
-- ==========================================================

PRAGMA foreign_keys = ON;

-- 1. Seed Teacher Profile
INSERT OR REPLACE INTO teachers (id, email, name, school_name, default_hourly_rate, currency, language_preference, theme_preference)
VALUES (
    'teacher-1',
    'sarah.jenkins@classque.edu',
    'Ms. Sarah Jenkins',
    'Garuda International Language Academy',
    150000.0,
    'IDR',
    'id',
    'light'
);

-- 2. Seed Cohorts
INSERT OR REPLACE INTO cohorts (id, teacher_id, name, cefr_level, schedule_days, start_time, duration_minutes, room_or_link, hourly_rate_override, is_active)
VALUES 
(
    'cohort-1',
    'teacher-1',
    'Cambridge Flyers A2',
    'A2',
    '["Mon", "Wed", "Fri"]',
    '14:30',
    60,
    'Room 204 (Building B)',
    175000.0,
    1
),
(
    'cohort-2',
    'teacher-1',
    'Cambridge Starters A1',
    'A1',
    '["Mon", "Wed"]',
    '13:15',
    60,
    'Room 102',
    NULL,
    1
),
(
    'cohort-3',
    'teacher-1',
    'IELTS Intensive Prep',
    'B2',
    '["Tue", "Thu"]',
    '17:00',
    90,
    'Virtual Lab (Meet)',
    200000.0,
    1
);

-- 3. Seed Students
INSERT OR REPLACE INTO students (id, cohort_id, full_name, nickname, gender, guardian_name, guardian_phone, notes, strengths, growth_areas, is_active)
VALUES
(
    'student-1',
    'cohort-1',
    'Liam Wong',
    'Liam',
    'M',
    'Mrs. Linda Wong',
    '+6281234567890',
    'Very enthusiastic speaker, working on past tense irregular verbs.',
    'Confident spoken interaction, good listening comprehension',
    'Spelling in writing assignments',
    1
),
(
    'student-2',
    'cohort-1',
    'Aisha Khan',
    'Aisha',
    'F',
    'Mr. Tariq Khan',
    '+6281298765432',
    'Excels in reading and grammar exercises.',
    'Rich vocabulary, fast reader',
    'Needs encouragement for spontaneous speaking',
    1
),
(
    'student-3',
    'cohort-1',
    'Eara Marn',
    'Eara',
    'F',
    'Mrs. Dewi Marn',
    '+6281311223344',
    'Consistent worker, loves storytelling activities.',
    'Creative storytelling, clear pronunciation',
    'Prepositions of place',
    1
),
(
    'student-4',
    'cohort-1',
    'Nanfa Shama',
    'Nanfa',
    'M',
    'Mr. Hadi Shama',
    '+6281555667788',
    'Quick learner, responds well to gamified drills.',
    'Fast reflexes in vocab games',
    'Punctuation in paragraphs',
    1
),
(
    'student-5',
    'cohort-1',
    'Budi Santoso',
    'Budi',
    'M',
    'Ibu Ratna Santoso',
    '+6281777889900',
    'Needs occasional pacing reminders.',
    'Friendly team player in group work',
    'Concentration during long reading texts',
    1
),
(
    'student-6',
    'cohort-2',
    'Siti Rahma',
    'Siti',
    'F',
    'Ibu Maryam',
    '+6281233445566',
    'Eager beginner, loves phonics songs.',
    'High motivation, rapid phonics absorption',
    'Alphabet writing stroke order',
    1
);

-- 5. Seed Lesson Plans
INSERT OR REPLACE INTO lesson_plans (id, teacher_id, cohort_id, title, topic, cefr_level, duration_minutes, warm_up, presentation, practice, production, wrap_up, vocabulary_json, grammar_focus, materials_links, homework, is_template)
VALUES
(
    'lesson-1',
    'teacher-1',
    'cohort-1',
    'Unit 4: Prehistoric Animals & Past Events',
    'Dinosaurs, Fossils, and Simple Past Tense',
    'A2',
    60,
    'Flashcard dinosaur guessing game (5 mins) to activate schema and energy.',
    'Introduce key vocabulary (fossil, extinct, herbivore, carnivore) and past irregular verbs (ate, lived, hunted).',
    'Pair work: Worksheet page 24. Match the dinosaur facts with the correct past verb forms.',
    'Students invent their own dinosaur and describe in 4 sentences what it looked like and what it ate.',
    'Exit ticket: Each student shares 1 fact using past simple before leaving.',
    '[{"word":"extinct","pos":"adj","definitionEn":"No longer existing in the world","definitionId":"Punah / sudah tidak ada lagi","example":"Dinosaurs became extinct millions of years ago."},{"word":"fossil","pos":"noun","definitionEn":"Preserved remains of ancient organisms","definitionId":"Fosil / sisa makhluk purba yang membatu","example":"The scientist found a T-Rex fossil."},{"word":"herbivore","pos":"noun","definitionEn":"An animal that feeds on plants","definitionId":"Hewan pemakan tumbuhan","example":"Brachiosaurus was a giant herbivore."},{"word":"carnivore","pos":"noun","definitionEn":"An animal that feeds on other animals","definitionId":"Hewan pemakan daging","example":"Velociraptor was a fast carnivore."}]',
    'Past Simple with irregular verbs (eat/ate, see/saw, find/found)',
    '["https://drive.google.com/example-worksheet.pdf"]',
    'Activity Book page 18 (Exercises 1 to 3)',
    0
);

-- 6. Seed Task Items
INSERT OR REPLACE INTO tasks (id, teacher_id, cohort_id, title, priority, due_date, is_completed)
VALUES
(
    'task-1',
    'teacher-1',
    'cohort-1',
    'Grade Assignment ''Flyers Unit 4''',
    'urgent',
    '2026-09-05',
    0
),
(
    'task-2',
    'teacher-1',
    'cohort-2',
    'Review ''Level 3 Materials'' for Cambridge Starters',
    'high',
    '2026-09-05',
    0
),
(
    'task-3',
    'teacher-1',
    'cohort-1',
    'Prepare CFA2 printable flashcards',
    'medium',
    '2026-09-06',
    0
),
(
    'task-4',
    'teacher-1',
    'cohort-1',
    'Send WhatsApp progress summary to Liam Wong guardian',
    'medium',
    '2026-09-07',
    0
);

-- 7. Seed Teaching Sessions
INSERT OR REPLACE INTO teaching_sessions (id, teacher_id, cohort_id, lesson_plan_id, session_date, start_time, end_time, duration_minutes, hourly_rate, total_claim_amount, status, scratchpad_notes)
VALUES
(
    'session-prev-1',
    'teacher-1',
    'cohort-2',
    'lesson-1',
    '2026-09-05',
    '13:15',
    '14:15',
    60,
    150000.0,
    150000.0,
    'completed',
    'Great energy today on phonics games.'
);

-- 8. Seed Teaching Claims
INSERT OR REPLACE INTO teaching_claims (id, teacher_id, claim_period, claim_number, total_sessions, total_hours, base_amount, allowance_amount, total_claim_amount, currency, status)
VALUES
(
    'claim-1',
    'teacher-1',
    '2026-09',
    'CLM-202609-001',
    18,
    27.0,
    4050000.0,
    200000.0,
    4250000.0,
    'IDR',
    'draft'
);

-- 9. Seed Student Evaluations
INSERT OR REPLACE INTO student_milestone_evaluations (id, student_id, milestone_id, competency_score, evaluated_at, teacher_notes)
VALUES
('eval-1', 'student-1', 'ms-a2-sp-1', 4, datetime('now'), 'Very fluent in speaking'),
('eval-2', 'student-1', 'ms-a2-li-1', 3, datetime('now'), 'Understands teacher prompts accurately'),
('eval-3', 'student-2', 'ms-a2-rd-1', 4, datetime('now'), 'Fast and accurate reading'),
('eval-4', 'student-3', 'ms-a2-si-1', 3, datetime('now'), 'Good turn taking in discussions');
