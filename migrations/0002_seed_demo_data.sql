-- ==========================================================
-- ClassQue-TeachAssist: Migration 0002 - CEFR Milestone Reference Data
-- ==========================================================
-- This file was originally named "seed demo data" and also inserted a demo teacher
-- and sample classes. Those now live in seeds/demo_data.sql (local development only)
-- so every teacher who signs in starts with an empty account of their own.
--
-- The file name is kept on purpose: D1 records applied migrations by name, and
-- renaming it would make wrangler apply it again.
-- CEFR milestones are shared by all teachers; INSERT OR IGNORE keeps this safe to
-- run on a database that already has them (INSERT OR REPLACE would delete and
-- re-insert each row, cascading to student evaluations).
-- ==========================================================

PRAGMA foreign_keys = ON;

-- 4. Seed CEFR Milestones
INSERT OR IGNORE INTO cefr_milestones (id, cefr_level, skill_category, code, description_en, description_id, can_do_statement_en, can_do_statement_id)
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
