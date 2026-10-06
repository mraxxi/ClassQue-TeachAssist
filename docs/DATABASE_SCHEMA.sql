-- ==========================================================
-- ClassQue-TeachAssist: Cloudflare D1 Database Schema
-- Edge SQLite Relational Schema (Synchronized with Terminology & UI/UX Specs)
-- ==========================================================

PRAGMA foreign_keys = ON;

-- ==========================================================
-- 1. Teachers / Users Table (Profil Guru / Pengajar)
-- ==========================================================
CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    school_name TEXT,
    school_logo_url TEXT,
    default_hourly_rate REAL DEFAULT 0.0,
    currency TEXT DEFAULT 'IDR', -- 'IDR', 'USD', etc.
    language_preference TEXT DEFAULT 'id' CHECK (language_preference IN ('id', 'en')),
    theme_preference TEXT DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark', 'system')),
    sync_version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
);

-- ==========================================================
-- 2. Cohorts Table (Kelas / Rombongan Belajar)
-- ==========================================================
CREATE TABLE IF NOT EXISTS cohorts (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL,
    name TEXT NOT NULL, -- e.g. "YLB-3 Saturday Morning"
    cefr_level TEXT NOT NULL DEFAULT 'A1', -- Pre-A1, A1, A2, B1, B2, C1, C2
    schedule_days TEXT, -- JSON array e.g. ["Mon", "Wed", "Fri"]
    start_time TEXT, -- e.g. "14:00"
    duration_minutes INTEGER DEFAULT 90,
    room_or_link TEXT, -- e.g. "Room 204" or "https://meet.google.com/..."
    hourly_rate_override REAL, -- optional override if cohort pays different rate
    is_active INTEGER NOT NULL DEFAULT 1,
    sync_version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cohorts_teacher ON cohorts(teacher_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_active ON cohorts(is_active);

-- ==========================================================
-- 3. Students Table (Siswa / Peserta Didik)
-- ==========================================================
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    cohort_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    nickname TEXT,
    gender TEXT CHECK (gender IN ('M', 'F', 'other')),
    date_of_birth TEXT, -- "YYYY-MM-DD"
    guardian_name TEXT, -- Nama Orang Tua / Wali
    guardian_phone TEXT, -- WhatsApp number for 1-click reports
    guardian_email TEXT,
    notes TEXT, -- Catatan umum guru
    strengths TEXT, -- Kelebihan siswa
    growth_areas TEXT, -- Area yang perlu ditingkatkan
    is_active INTEGER NOT NULL DEFAULT 1,
    sync_version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_students_cohort ON students(cohort_id);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active);

-- ==========================================================
-- 4. Lesson Plans Table (Rencana Pembelajaran / RPP)
-- ==========================================================
CREATE TABLE IF NOT EXISTS lesson_plans (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL,
    cohort_id TEXT, -- nullable if shared across cohorts
    title TEXT NOT NULL, -- e.g. "Unit 4: Prehistoric Animals"
    topic TEXT,
    cefr_level TEXT,
    duration_minutes INTEGER DEFAULT 90,
    -- 5 Pedagogical Stages
    warm_up TEXT, -- Stage 1: Pemanasan / Apersepsi (5-10m)
    presentation TEXT, -- Stage 2: Penyampaian Materi (15-20m)
    practice TEXT, -- Stage 3: Latihan Terpandu (15-20m)
    production TEXT, -- Stage 4: Aplikasi Mandiri / Bebas (20-25m)
    wrap_up TEXT, -- Stage 5: Refleksi & Penutup (5-10m)
    vocabulary_json TEXT, -- JSON array [{word, pos, def, example, def_id}]
    grammar_focus TEXT,
    materials_links TEXT, -- Google Drive / PDF / Video links
    homework TEXT,
    is_template INTEGER NOT NULL DEFAULT 0,
    sync_version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher ON lesson_plans(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lessons_cohort ON lesson_plans(cohort_id);

-- ==========================================================
-- 5. Teaching Sessions Table (Sesi Pembelajaran & Stopwatch Cockpit)
-- ==========================================================
CREATE TABLE IF NOT EXISTS teaching_sessions (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL,
    cohort_id TEXT NOT NULL,
    lesson_plan_id TEXT,
    session_date TEXT NOT NULL, -- "YYYY-MM-DD"
    start_time TEXT NOT NULL, -- ISO timestamp or "14:00"
    end_time TEXT, -- ISO timestamp or "15:30"
    duration_minutes REAL NOT NULL DEFAULT 0.0,
    hourly_rate REAL NOT NULL DEFAULT 0.0,
    total_claim_amount REAL NOT NULL DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    scratchpad_notes TEXT, -- In-class quick notes
    sync_version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON teaching_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_cohort ON teaching_sessions(cohort_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON teaching_sessions(status);

-- ==========================================================
-- 6. Attendance Records Table (Riwayat Presensi Siswa)
-- ==========================================================
CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    cohort_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    attendance_date TEXT NOT NULL, -- "YYYY-MM-DD"
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    note TEXT, -- Optional note e.g. "Izin sakit demam"
    sync_version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES teaching_sessions(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique ON attendance_records(student_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_cohort_date ON attendance_records(cohort_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);

-- ==========================================================
-- 7. CEFR Milestones Table (Capaian & Indikator Kemahiran Standar)
-- ==========================================================
CREATE TABLE IF NOT EXISTS cefr_milestones (
    id TEXT PRIMARY KEY,
    cefr_level TEXT NOT NULL, -- Pre-A1, A1, A2, B1, B2, C1, C2
    skill_category TEXT NOT NULL CHECK (skill_category IN ('listening', 'reading', 'spoken_interaction', 'spoken_production', 'writing')),
    code TEXT UNIQUE NOT NULL, -- e.g. "A1.SI.1"
    description_en TEXT NOT NULL,
    description_id TEXT NOT NULL,
    can_do_statement_en TEXT NOT NULL,
    can_do_statement_id TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_milestones_level_skill ON cefr_milestones(cefr_level, skill_category);

-- ==========================================================
-- 8. Student Milestone Evaluations (Penilaian Capaian Siswa)
-- ==========================================================
CREATE TABLE IF NOT EXISTS student_milestone_evaluations (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    milestone_id TEXT NOT NULL,
    competency_score INTEGER NOT NULL CHECK (competency_score BETWEEN 1 AND 4),
    -- 1: Emerging / Mulai Berkembang (MB)
    -- 2: Developing / Sedang Berkembang (SB)
    -- 3: Achieved / Tercapai Sesuai Harapan (TC)
    -- 4: Mastered / Mahir (M)
    evaluated_at TEXT NOT NULL DEFAULT (datetime('now')),
    teacher_notes TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (milestone_id) REFERENCES cefr_milestones(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_eval_student_milestone ON student_milestone_evaluations(student_id, milestone_id);

-- ==========================================================
-- 9. Teaching Claims Invoices (Klaim Honorarium & Invoice Lembaga)
-- ==========================================================
CREATE TABLE IF NOT EXISTS teaching_claims (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL,
    claim_period TEXT NOT NULL, -- "YYYY-MM" e.g. "2026-09"
    claim_number TEXT UNIQUE, -- e.g. "CLM-202609-001"
    total_sessions INTEGER NOT NULL DEFAULT 0,
    total_hours REAL NOT NULL DEFAULT 0.0,
    base_amount REAL NOT NULL DEFAULT 0.0,
    allowance_amount REAL NOT NULL DEFAULT 0.0,
    total_claim_amount REAL NOT NULL DEFAULT 0.0,
    currency TEXT DEFAULT 'IDR',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'paid')),
    submitted_at TEXT,
    paid_at TEXT,
    notes TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_claims_period ON teaching_claims(teacher_id, claim_period);

-- ==========================================================
-- 10. Parent Progress Reports (Laporan Perkembangan Wali Murid)
-- ==========================================================
CREATE TABLE IF NOT EXISTS parent_reports (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    cohort_id TEXT NOT NULL,
    report_period TEXT NOT NULL, -- e.g. "September 2026" or "Term 1 - 2026"
    attendance_rate REAL NOT NULL DEFAULT 100.0,
    total_sessions_count INTEGER NOT NULL DEFAULT 0,
    present_count INTEGER NOT NULL DEFAULT 0,
    milestone_summary_json TEXT, -- JSON summary of CEFR scores
    teacher_narrative_feedback TEXT,
    whatsapp_brief_text TEXT,
    is_sent INTEGER NOT NULL DEFAULT 0,
    sent_at TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reports_student ON parent_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_reports_cohort ON parent_reports(cohort_id);

-- ==========================================================
-- 11. Tasks Table (Daftar Tugas / Action Items)
-- ==========================================================
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL,
    cohort_id TEXT,
    title TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TEXT, -- "YYYY-MM-DD"
    is_completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_teacher ON tasks(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(is_completed);

-- ==========================================================
-- 12. Multi-user (migration 0003): login by email
-- ==========================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_email_lower ON teachers(lower(email));
CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON teaching_sessions(teacher_id);
