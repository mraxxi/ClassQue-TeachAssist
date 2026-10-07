import { Language } from '../types';

export const translations = {
  en: {
    brandName: 'ClassQue',
    brandSubtitle: 'TeachAssist',
    nav: {
      cockpit: "Today's Cockpit",
      classesStudents: 'Classes & Students',
      lessonPlanner: 'Lesson Planner',
      claimsReports: 'Claims & Reports',
      settings: 'Settings',
    },
    kpi: {
      todayHours: "Today's Hours",
      nextClassIn: 'Next Class in',
      pendingTasks: 'Pending Tasks',
      monthlyClaim: 'Monthly Claim',
    },
    cockpit: {
      nextClass: 'NEXT CLASS',
      launchLive: 'Launch Live Cockpit',
      liveRunning: 'Live Class in Session',
      room: 'Location:',
      classId: 'Class Level:',
      rollCallTitle: 'Roll-Call Attendance',
      studentsCount: 'students',
      oneClickToggles: 'With 1-click toggles',
      markAllPresent: 'Mark All Present',
      urgentTasks: 'Urgent Tasks',
      due: 'Due',
      overdue: 'Overdue',
      scheduleTimeline: "Today's Schedule",
      completed: 'COMPLETED',
      upcoming: 'UPCOMING',
      later: 'LATER',
      addTaskPlaceholder: 'Add a quick action item...',
      add: 'Add',
      priorityLabel: 'Priority',
      deadlineMethod: 'Deadline Method',
      calendarDate: 'Calendar Date',
      noDeadline: 'No Deadline',
      cohortLesson: 'Cohort Lesson',
      targetCohort: 'Target Cohort',
      lessonSlot: 'Lesson Slot',
      pickDate: 'Pick Date:',
    },
    attendance: {
      present: 'Present',
      absent: 'Absent',
      late: 'Late',
      excused: 'Excused',
    },
    liveModal: {
      title: 'Live Cockpit',
      stopwatch: 'SESSION STOPWATCH',
      pause: 'Pause',
      resume: 'Resume',
      finish: 'Finish & Log Claim',
      close: 'Exit Cockpit',
      activeStage: 'Active Lesson Stage',
      stageWarmUp: '1. Warm-up / Hook (5-10m)',
      stagePresentation: '2. Presentation (15-20m)',
      stagePractice: '3. Controlled Practice (15-20m)',
      stageProduction: '4. Free Production (20-25m)',
      stageWrapUp: '5. Review & Wrap-up (5-10m)',
      vocabBank: 'Target Vocabulary Bank',
      scratchpad: 'In-Class Student Notes & Scratchpad',
      scratchpadPlaceholder: 'Jot down quick behavioral notes or student achievements during class...',
      confirmFinish: 'Confirm Finish Class',
    },
    hubs: {
      classesTab: 'Cohorts',
      studentsTab: 'Student Directory',
      cefrTab: 'CEFR Milestone Gradebook',
      attendanceTab: 'Attendance History',
      claimsTab: 'Teaching Claims & Honorariums',
      parentReportsTab: 'Parent Progress Reports',
      createNew: '+ Create New',
      exportPdf: 'Print A4 Report Card',
      copyWhatsApp: 'Copy WhatsApp Message',
    },
  },
  id: {
    brandName: 'ClassQue',
    brandSubtitle: 'TeachAssist',
    nav: {
      cockpit: 'Dasbor Hari Ini',
      classesStudents: 'Kelas & Siswa',
      lessonPlanner: 'Rencana Mengajar',
      claimsReports: 'Klaim & Laporan',
      settings: 'Pengaturan',
    },
    kpi: {
      todayHours: 'Jam Mengajar Hari Ini',
      nextClassIn: 'Kelas Berikutnya',
      pendingTasks: 'Tugas Tertunda',
      monthlyClaim: 'Klaim Bulan Ini',
    },
    cockpit: {
      nextClass: 'KELAS BERIKUTNYA',
      launchLive: 'Mulai Kelas Langsung',
      liveRunning: 'Kelas Sedang Berlangsung',
      room: 'Ruang/Lokasi:',
      classId: 'Tingkat Kemahiran:',
      rollCallTitle: 'Presensi Siswa',
      studentsCount: 'siswa',
      oneClickToggles: 'Presensi kilat 1-klik',
      markAllPresent: 'Tandai Semua Hadir',
      urgentTasks: 'Tugas Mendesak',
      due: 'Batas',
      overdue: 'Terlambat',
      scheduleTimeline: 'Jadwal Hari Ini',
      completed: 'SELESAI',
      upcoming: 'BERIKUTNYA',
      later: 'NANTI',
      addTaskPlaceholder: 'Tambah tugas baru...',
      add: 'Tambah',
      priorityLabel: 'Prioritas',
      deadlineMethod: 'Metode Batas Waktu',
      calendarDate: 'Tanggal Kalender',
      noDeadline: 'Tanpa Batas',
      cohortLesson: 'Sesi Kelas',
      targetCohort: 'Target Kelas',
      lessonSlot: 'Pilih Jadwal',
      pickDate: 'Pilih Tanggal:',
    },
    attendance: {
      present: 'Hadir',
      absent: 'Alpa',
      late: 'Terlambat',
      excused: 'Izin',
    },
    liveModal: {
      title: 'Kokpit Kelas Langsung',
      stopwatch: 'STOPWATCH SESI MENGAJAR',
      pause: 'Jeda',
      resume: 'Lanjut',
      finish: 'Selesai & Catat Honor',
      close: 'Tutup Kokpit',
      activeStage: 'Tahap Pembelajaran Aktif',
      stageWarmUp: '1. Pemanasan / Apersepsi (5-10 mnt)',
      stagePresentation: '2. Penyampaian Materi (15-20 mnt)',
      stagePractice: '3. Latihan Terpandu (15-20 mnt)',
      stageProduction: '4. Aplikasi Mandiri (20-25 mnt)',
      stageWrapUp: '5. Refleksi & Penutup (5-10 mnt)',
      vocabBank: 'Bank Kosakata Target',
      scratchpad: 'Catatan Kilat Perkembangan Siswa',
      scratchpadPlaceholder: 'Tulis catatan cepat keaktifan/kesulitan siswa selama sesi berlangsung...',
      confirmFinish: 'Konfirmasi Selesai Mengajar',
    },
    hubs: {
      classesTab: 'Daftar Kelas (Rombel)',
      studentsTab: 'Direktori Siswa',
      cefrTab: 'Capaian CEFR / Indikator',
      attendanceTab: 'Riwayat Presensi',
      claimsTab: 'Klaim Honorarium Mengajar',
      parentReportsTab: 'Laporan Wali Murid',
      createNew: '+ Buat Baru',
      exportPdf: 'Cetak Lembar Rapor A4',
      copyWhatsApp: 'Salin Format WhatsApp',
    },
  },
};

/** Claim workflow status in the active language (Draft -> Submitted -> Approved -> Paid). */
export const claimStatusLabel = (status: string, lang: Language): string => {
  const map: Record<string, { id: string; en: string }> = {
    draft: { id: 'Draf', en: 'Draft' },
    submitted: { id: 'Diajukan', en: 'Submitted' },
    approved: { id: 'Disetujui', en: 'Approved' },
    paid: { id: 'Terbayar', en: 'Paid' },
  };
  const m = map[status];
  return m ? m[lang] : status;
};

/** Attendance status in the active language (spec: Hadir / Alpa / Terlambat / Izin). */
export const attendanceStatusLabel = (status: string, lang: Language): string => {
  const map: Record<string, { id: string; en: string }> = {
    present: { id: 'Hadir', en: 'Present' },
    absent: { id: 'Alpa', en: 'Absent' },
    late: { id: 'Terlambat', en: 'Late' },
    excused: { id: 'Izin', en: 'Excused' },
  };
  const m = map[status];
  return m ? m[lang] : status;
};

/** CEFR skill category names (spec: Mendengarkan / Membaca / Interaksi Lisan / Produksi Lisan / Menulis). */
export const skillLabel = (skill: string, lang: Language): string => {
  const map: Record<string, { id: string; en: string }> = {
    listening: { id: 'Mendengarkan', en: 'Listening' },
    reading: { id: 'Membaca', en: 'Reading' },
    spoken_interaction: { id: 'Interaksi Lisan', en: 'Spoken Interaction' },
    spoken_production: { id: 'Produksi Lisan', en: 'Spoken Production' },
    writing: { id: 'Menulis', en: 'Writing' },
  };
  const m = map[skill];
  return m ? m[lang] : skill.replace(/_/g, ' ');
};

/** The built-in placeholder teacher name ("Educator") is shown in the active language instead. */
export const displayTeacherName = (name: string, lang: Language): string =>
  !name || name === 'Educator' ? (lang === 'id' ? 'Guru' : 'Teacher') : name;

export const useTranslation = (lang: Language) => {
  return translations[lang] || translations.en;
};
