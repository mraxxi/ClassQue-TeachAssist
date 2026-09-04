# Ubiquitous Language & Terminology Standard — ClassQue-TeachAssist
### (English & Indonesian Bilingual Standard)

To prevent confusion, scattered synonyms, and inconsistent naming across code, UI labels, database schemas, parent progress reports, and documentation, this project enforces a single **Ubiquitous Language**.

All developers, agents, UI components, and export generators must adhere to the **Canonical Terms** and **Indonesian Translations** defined below.

---

## 📌 Quick Summary Table (Bilingual Standard)

| Domain | Canonical English Term | Standar Bahasa Indonesia | Deprecated / Banned Synonyms | Code / DB Representation |
|---|---|---|---|---|
| **Structure** | **Cohort** *(or Class Cohort)* | **Kelas / Rombel** *(Rombongan Belajar)* | *Batch, Group, Section, Grade Level, Room* | `cohort`, `cohort_id` |
| **People** | **Student** | **Siswa / Peserta Didik** | *Learner, Pupil, Kid, Child, User* | `student`, `student_id` |
| **People** | **Guardian** | **Wali Murid / Orang Tua** | *Parent, Mother/Father, Contact Person* | `guardian_name`, `guardian_phone` |
| **People** | **Teacher** | **Guru / Pengajar** | *Instructor, Tutor, Educator, Admin* | `teacher`, `teacher_id` |
| **Time & Flow** | **Teaching Session** | **Sesi Pembelajaran** | *Class Instance, Lecture, Call, Lesson Log* | `teaching_session`, `session_id` |
| **Time & Flow** | **Live Cockpit** | **Kokpit Kelas / Dasbor Kelas Langsung** | *Active View, Class Runner, Live Mode* | `LiveCockpit.tsx`, `live-cockpit` |
| **Time & Flow** | **Stopwatch** | **Stopwatch Sesi** | *Timer, Clock, Time Tracker, Punch-in* | `stopwatch`, `duration_minutes` |
| **Attendance** | **Roll-Call** *(Action)* | **Presensi / Mengisi Presensi** | *Check-in, Presence, Roster Call, Absen* | `takeRollCall()` |
| **Attendance** | **Attendance** *(Record)* | **Riwayat Kehadiran / Presensi** | *Check-in Sheet, Log Absen* | `attendance_record` |
| **Attendance** | **Present (P)** | **Hadir (H)** | *Here, Masuk* | `'present'` |
| **Attendance** | **Absent (A)** | **Alpa / Tanpa Keterangan (A)** | *Missing, Bolos* | `'absent'` |
| **Attendance** | **Late (L)** | **Terlambat (T)** | *Tardy, Telat* | `'late'` |
| **Attendance** | **Excused (E)** | **Izin / Sakit (I/S)** | *Permitted, Sick* | `'excused'` |
| **Pedagogy** | **Lesson Plan** | **Rencana Pembelajaran (RPP / Modul Ajar)** | *Syllabus, Scaffold, Agenda, Topic Note* | `lesson_plan`, `lesson_id` |
| **Pedagogy** | **Warm-up / Hook** *(Stage 1)* | **Pemanasan / Apersepsi** | *Intro, Opening, Ice Breaker* | `warm_up` |
| **Pedagogy** | **Presentation** *(Stage 2)* | **Penyampaian Materi / Presentasi** | *Lecture, Concept Intro* | `presentation` |
| **Pedagogy** | **Controlled Practice** *(Stage 3)* | **Latihan Terbimbing / Terpandu** | *Drill, Guided Exercise* | `practice` |
| **Pedagogy** | **Free Production** *(Stage 4)* | **Aplikasi Mandiri / Praktik Bebas** | *Project, Free Talk, Output* | `production` |
| **Pedagogy** | **Review & Wrap-up** *(Stage 5)* | **Refleksi & Penutup** | *Summary, Closure, Homework Call* | `wrap_up` |
| **Evaluation** | **CEFR Milestone** | **Capaian / Indikator Kemahiran CEFR** | *Grade, Rubric Item, Skill Standard* | `cefr_milestone`, `milestone_id` |
| **Evaluation** | **Competency Level** | **Tingkat Kemampuan / Capaian** | *Score, Nilai Huruf, Star Rating* | `competency_score` (`1`–`4`) |
| **Evaluation** | `1` — **Emerging** | **Mulai Berkembang (MB)** | *Poor, Kurang, Level 1* | `score: 1` |
| **Evaluation** | `2` — **Developing** | **Sedang Berkembang (SB)** | *Fair, Cukup, Level 2* | `score: 2` |
| **Evaluation** | `3` — **Achieved** | **Tercapai Sesuai Harapan (TC)** | *Good, Baik, Level 3* | `score: 3` |
| **Evaluation** | `4` — **Mastered** | **Mahir / Sangat Berkembang (M)** | *Excellent, Sangat Baik, Level 4* | `score: 4` |
| **Finance** | **Teaching Claim** *(Honorarium)* | **Klaim Honorarium Mengajar** | *Finance, Budget, Income, Expense, Gaji* | `teaching_claim`, `claims_record` |
| **Finance** | **Hourly Rate** | **Tarif Honor per Jam** | *Base Pay, Price, Fee, Tarif* | `hourly_rate` |
| **Reporting** | **Parent Progress Report** | **Laporan Perkembangan Siswa (Rapor)** | *Report Card, Summary, Bulletin* | `parent_report`, `progress_report` |
| **Reporting** | **Report Card (A4)** | **Lembar Rapor Cetak A4** | *Printable Sheet, PDF Export, Ijazah* | `PrintableReportCard.tsx` |
| **Reporting** | **WhatsApp Brief** | **Ringkasan Pesan WhatsApp Wali Murid** | *Chat Template, Message Copy, SMS* | `formatWhatsAppBrief()` |
| **System** | **Today's Cockpit** | **Dasbor Hari Ini / Kokpit Pengajar** | *Dashboard, Home Screen, Overview* | `DashboardCockpit.tsx`, `cockpit` |

---

## 🏛️ Detailed Bilingual Definitions by Domain

### 1. Structure & People (Struktur & Pengguna)
- **Cohort (`cohort`) / Kelas (Rombel)**:
  - *Definition (EN)*: A recurring class group taught by a teacher (e.g., "YLB-3 Saturday Morning", "Cambridge Flyers A2").
  - *Definisi (ID)*: Kelompok rombongan belajar yang memiliki jadwal rutin, target capaian kurikulum, dan daftar siswa tetap.
- **Student (`student`) / Siswa (Peserta Didik)**:
  - *Definition (EN)*: An enrolled individual learner within one or more cohorts.
  - *Definisi (ID)*: Murid yang terdaftar dalam satu atau lebih kelas/rombel.
- **Guardian (`guardian`) / Wali Murid (Orang Tua)**:
  - *Definition (EN)*: The parent, sponsor, or legal guardian responsible for the student and receiving communications.
  - *Definisi (ID)*: Orang tua atau wali penanggung jawab siswa yang menerima laporan perkembangan dan presensi.
- **Teacher (`teacher`) / Guru (Pengajar)**:
  - *Definition (EN)*: The instructor managing classroom operations and claims.
  - *Definisi (ID)*: Pendidik yang mengampu sesi, mengelola presensi, penilaian, dan klaim honorarium.

---

### 2. Time, Classroom Execution & Attendance (Waktu & Presensi)
- **Teaching Session (`teaching_session`) / Sesi Pembelajaran**:
  - *Definition (EN)*: A single concrete class meeting with a start time, end time, verified duration, and attendance log.
  - *Definisi (ID)*: Satu pertemuan tatap muka/daring aktual yang dicatat durasi waktu dan presensinya.
- **Live Cockpit / Kokpit Kelas Langsung**:
  - *Definition (EN)*: The focused, distraction-free in-class screen containing the live stopwatch, 1-click roll-call list, active lesson plan stage, and student scratchpad.
  - *Definisi (ID)*: Panel kendali saat kelas berlangsung dengan stopwatch aktif, tombol presensi cepat, alur RPP, dan catatan kilat siswa.
- **Roll-Call & Attendance (`attendance_record`) / Presensi & Kehadiran**:
  - `present` ➔ **Hadir (H)**: Hadir tepat waktu saat sesi dimulai.
  - `absent` ➔ **Alpa (A)**: Tidak hadir tanpa keterangan resmi.
  - `late` ➔ **Terlambat (T)**: Hadir setelah batas toleransi jam mulai.
  - `excused` ➔ **Izin / Sakit (I/S)**: Tidak hadir dengan pemberitahuan izin atau surat sakit.

---

### 3. Pedagogy, Curriculum & Evaluation (Pedagogi & Penilaian CEFR)
- **Lesson Plan (`lesson_plan`) / Rencana Pembelajaran (RPP / Modul Ajar)**:
  - *Definition (EN)*: A structured guide for a teaching session following the 5 pedagogical stages.
- **The 5 Lesson Stages (5 Tahap Pembelajaran)**:
  1. `Warm-up / Hook` ➔ **Pemanasan / Apersepsi**: Mengaitkan materi sebelumnya, ice breaking, fokus awal (5–10 mnt).
  2. `Presentation` ➔ **Penyampaian Materi**: Pengenalan kosakata, konsep grammar, atau topik baru (15–20 mnt).
  3. `Controlled Practice` ➔ **Latihan Terpandu**: Latihan terstruktur berpasangan, drill, worksheet terarah (15–20 mnt).
  4. `Free Production` ➔ **Aplikasi Mandiri**: Praktik berbicara bebas, menulis kreatif, proyek mini siswa (20–25 mnt).
  5. `Review & Wrap-up` ➔ **Refleksi & Penutup**: Evaluasi singkat, rangkuman kesimpulan, tugas mandiri (5–10 mnt).
- **CEFR Milestone (`cefr_milestone`) / Capaian Kemahiran CEFR**:
  - *Definition*: Deskriptor standar kemahiran bahasa Eropa (Pre-A1 s.d. C2) untuk 5 keterampilan:
    - `listening` (Mendengarkan), `reading` (Membaca), `spoken_interaction` (Interaksi Lisan), `spoken_production` (Produksi Lisan/Bicara), `writing` (Menulis).
- **Competency Levels (Tingkat Capaian)**:
  - **1 — Emerging / Mulai Berkembang (MB)**: Baru mengenal konsep, memerlukan bimbingan penuh.
  - **2 — Developing / Sedang Berkembang (SB)**: Mulai memahami konsep dengan bantuan arahan berkala.
  - **3 — Achieved / Tercapai Sesuai Harapan (TC)**: Menunjukkan penguasaan kompetensi secara konsisten dan mandiri.
  - **4 — Mastered / Mahir / Sangat Berkembang (M)**: Menguasai keterampilan dengan sangat fasih dan mampu menerapkannya pada konteks baru.

---

### 4. Teaching Claims & Reporting (Klaim Honor & Laporan Wali Murid)
- **Teaching Claim (`teaching_claim`) / Klaim Honorarium Mengajar**:
  - *Definition*: Rekapitulasi penghitungan jam mengajar untuk pengajuan honor ke lembaga:
    $$\text{Total Honor} = (\text{Durasi Jam Mengajar} \times \text{Tarif Honor per Jam}) + \text{Tunjangan/Transport}$$
  - *Strict Rule*: Dilarang mencampuradukkan dengan pencatatan keuangan pribadi (pengeluaran harian, belanja, dll).
- **Parent Progress Report (`parent_report`) / Laporan Perkembangan Siswa**:
  - **Report Card (A4)** ➔ **Lembar Rapor Cetak A4**: Format dokumen cetak/PDF formal dengan kop lembaga dan grafik capaian.
  - **WhatsApp Brief** ➔ **Ringkasan Pesan WhatsApp**: Format teks ringkas siap kirim via WhatsApp lengkap dengan emoji dan catatan personal guru.

---

## 🌐 Frontend i18n Dictionary Blueprint (`id.json` / `en.json`)

When implementing multi-language (i18n) support in the UI, use these standard message keys:

```json
{
  "navigation": {
    "cockpit": "Dasbor Hari Ini",
    "classesStudents": "Kelas & Siswa",
    "lessonPlanner": "Rencana Mengajar",
    "claimsReports": "Klaim & Laporan",
    "settings": "Pengaturan"
  },
  "attendance": {
    "rollCall": "Isi Presensi",
    "present": "Hadir",
    "absent": "Alpa",
    "late": "Terlambat",
    "excused": "Izin/Sakit"
  },
  "competency": {
    "emerging": "Mulai Berkembang (MB)",
    "developing": "Sedang Berkembang (SB)",
    "achieved": "Tercapai Sesuai Harapan (TC)",
    "mastered": "Mahir (M)"
  },
  "claims": {
    "title": "Klaim Honorarium",
    "hourlyRate": "Tarif Honor / Jam",
    "totalHours": "Total Jam Mengajar",
    "exportInvoice": "Cetak Lembar Klaim"
  },
  "reports": {
    "parentReport": "Laporan Wali Murid",
    "copyWhatsApp": "Salin Format WhatsApp",
    "printA4": "Cetak Rapor A4"
  }
}
```
