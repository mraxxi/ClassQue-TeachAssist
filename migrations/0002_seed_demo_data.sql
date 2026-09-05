-- ==========================================================
-- ClassQue-TeachAssist: Migration 0002 — Seed Initial Demo Data
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

-- 4. Seed CEFR Milestones
INSERT OR REPLACE INTO cefr_milestones (id, cefr_level, skill_category, code, description_en, description_id, can_do_statement_en, can_do_statement_id)
VALUES
(
    'ms-a1-li-1',
    'A1',
    'listening',
    'A1.LI.1',
    'Recognize familiar words and basic phrases concerning self and family',
    'Mengenali kata-kata umum dan frasa dasar tentang diri dan keluarga',
    'Can recognize familiar words and very basic phrases spoken slowly and clearly.',
    'Mampu mengenali kata yang lazim dan frasa dasar saat diucapkan lambat dan jelas.'
),
(
    'ms-a1-rd-1',
    'A1',
    'reading',
    'A1.RD.1',
    'Understand familiar names, words, and simple sentences on notices',
    'Memahami nama-nama yang dikenal, kata sederhana pada poster atau papan pengumuman',
    'Can understand familiar names, words, and very simple sentences on notices and posters.',
    'Mampu memahami nama, kata, dan kalimat sangat sederhana pada poster atau petunjuk.'
),
(
    'ms-a1-si-1',
    'A1',
    'spoken_interaction',
    'A1.SI.1',
    'Interact in a simple way if the other person talks slowly',
    'Berinteraksi secara sederhana bila lawan bicara berbicara lambat dan membantu',
    'Can interact in a simple way provided the other person is prepared to repeat or rephrase.',
    'Mampu berinteraksi secara sederhana jika lawan bicara bersedia mengulang perlahan.'
),
(
    'ms-a1-sp-1',
    'A1',
    'spoken_production',
    'A1.SP.1',
    'Use simple phrases and sentences to describe where they live and people they know',
    'Menggunakan frasa sederhana untuk menceritakan tempat tinggal dan orang yang dikenal',
    'Can use simple phrases and sentences to describe where they live and people they know.',
    'Mampu memakai frasa sederhana untuk mendeskripsikan tempat tinggal dan kenalan.'
),
(
    'ms-a1-wr-1',
    'A1',
    'writing',
    'A1.WR.1',
    'Write short, simple postcards and fill in personal details in forms',
    'Menulis kartu pos pendek sederhana dan mengisi formulir biodata pribadi',
    'Can write a short, simple postcard and fill in forms with personal details.',
    'Mampu menulis pesan kartu pos pendek dan mengisi data formulir sederhana.'
),
(
    'ms-a2-li-1',
    'A2',
    'listening',
    'A2.LI.1',
    'Understand phrases and highest frequency vocabulary related to areas of personal relevance',
    'Memahami frasa dan kosakata frekuensi tinggi terkait informasi pribadi & keluarga',
    'Can understand phrases and highest frequency vocabulary related to areas of most immediate personal relevance.',
    'Mampu memahami frasa dan kosakata umum terkait kebutuhan pribadi dan lingkungan sekitar.'
),
(
    'ms-a2-rd-1',
    'A2',
    'reading',
    'A2.RD.1',
    'Understand short factual texts containing familiar vocabulary',
    'Memahami teks faktual pendek yang memuat kosakata umum',
    'Can understand short, simple texts containing the highest frequency vocabulary.',
    'Mampu memahami teks pendek sederhana dengan kosakata frekuensi tinggi.'
),
(
    'ms-a2-si-1',
    'A2',
    'spoken_interaction',
    'A2.SI.1',
    'Communicate in simple and routine tasks requiring a direct exchange of information',
    'Berkomunikasi dalam tugas rutin sederhana yang membutuhkan pertukaran informasi langsung',
    'Can communicate in simple and routine tasks requiring a simple and direct exchange of information.',
    'Mampu berkomunikasi dalam percakapan rutin dan pertukaran informasi langsung.'
),
(
    'ms-a2-sp-1',
    'A2',
    'spoken_production',
    'A2.SP.1',
    'Describe past events and activities using simple phrases',
    'Menceritakan kegiatan lampau dengan frasa sederhana',
    'Can give a short, basic description of events, past activities, and personal experiences.',
    'Mampu memberikan deskripsi singkat dan sederhana mengenai kejadian masa lampau.'
),
(
    'ms-a2-wr-1',
    'A2',
    'writing',
    'A2.WR.1',
    'Write short simple notes and messages relating to matters of immediate need',
    'Menulis catatan dan pesan pendek sederhana sesuai kebutuhan',
    'Can write short, simple notes and messages relating to everyday matters.',
    'Mampu menulis catatan dan pesan pendek mengenai hal sehari-hari.'
),
(
    'ms-b1-li-1',
    'B1',
    'listening',
    'B1.LI.1',
    'Understand the main points of clear standard speech on familiar matters',
    'Memahami poin utama tuturan standar yang jelas tentang topik yang biasa ditemui',
    'Can understand the main points of clear standard speech on familiar matters regularly encountered in school or leisure.',
    'Mampu memahami inti tuturan standar mengenai topik sekolah, hobi, atau pekerjaan.'
),
(
    'ms-b1-si-1',
    'B1',
    'spoken_interaction',
    'B1.SI.1',
    'Enter unprepared into conversation on familiar topics or personal interests',
    'Masuk tanpa persiapan ke dalam percakapan tentang topik yang dikenal atau minat pribadi',
    'Can enter unprepared into conversation on familiar topics, express personal opinions, and exchange information.',
    'Mampu berbicara secara spontan pada topik umum dan mengemukakan pendapat pribadi.'
),
(
    'ms-b2-sp-1',
    'B2',
    'spoken_production',
    'B2.SP.1',
    'Give clear, detailed descriptions on a wide range of subjects related to their field of interest',
    'Memberikan deskripsi yang jelas dan terperinci tentang berbagai topik minat',
    'Can give clear, systematically developed presentations with highlighting of significant points.',
    'Mampu menyampaikan presentasi terstruktur dengan penekanan pada poin-poin penting.'
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
