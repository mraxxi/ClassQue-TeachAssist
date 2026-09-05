import React, { useState, useEffect } from 'react';
import { 
  Receipt, MessageSquare, Printer, 
  Copy, UserCheck, Plus, Trash2, Calendar,
  DollarSign, Award, BookOpen, Send, CheckCircle2, History
} from 'lucide-react';
import { useTeacherStore } from '../../store/facade';
import { useTranslation } from '../../utils/i18n';
import { TeachingSession, ClaimStatus, ParentReport, CompetencyScore } from '../../types';
import { ManualSessionModal } from './ManualSessionModal';
import { ClaimInvoiceModal } from './ClaimInvoiceModal';
import { PrintableReportCard } from './PrintableReportCard';
import { ConfirmModal } from '../common/ConfirmModal';

export const ClaimsReportsHub: React.FC = () => {
  const { 
    claims, updateClaim, sessions, deleteSession, 
    students, cohorts, teacher, language, addToast,
    studentEvaluations, cefrMilestones, attendanceRecords,
    parentReports, addParentReport, updateParentReport
  } = useTeacherStore();
  const t = useTranslation(language);

  const [activeTab, setActiveTab] = useState<'claims' | 'parent-reports'>('claims');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Modals
  const [isManualSessionModalOpen, setManualSessionModalOpen] = useState(false);
  const [isInvoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [isReportCardModalOpen, setReportCardModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<TeachingSession | null>(null);

  // Allowance edit state
  const [allowanceInput, setAllowanceInput] = useState<string>('200000');

  // Narrative feedback editor for selected student
  const [narrativeFeedback, setNarrativeFeedback] = useState<string>('');

  // Filter sessions for selected month
  const monthlySessions = sessions.filter((s) => s.sessionDate.startsWith(selectedMonth));
  const totalMinutes = monthlySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const baseAmount = monthlySessions.reduce((acc, s) => acc + s.totalClaimAmount, 0);
  const allowanceNum = parseFloat(allowanceInput) || 0;
  const grandTotal = baseAmount + allowanceNum;

  // Active claim record
  const activeClaim = claims.find((c) => c.claimPeriod === selectedMonth) || claims[0];
  const claimStatus: ClaimStatus = activeClaim?.status || 'draft';

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const studentCohort = cohorts.find((c) => c.id === selectedStudent?.cohortId);

  // Sync narrative feedback when student changes
  useEffect(() => {
    if (selectedStudent) {
      setNarrativeFeedback(
        selectedStudent.notes ||
        selectedStudent.strengths ||
        (language === 'id' 
          ? 'Siswa menunjukkan antusiasme belajar yang sangat baik, berpartisipasi aktif dalam interaksi kelas, dan konsisten menyelesaikan tugas.'
          : 'Student demonstrates exceptional enthusiasm, actively participates in classroom discussions, and consistently completes practice tasks.')
      );
    }
  }, [selectedStudentId, selectedStudent, language]);

  // Compute student attendance statistics
  const studentAttendanceList = attendanceRecords.filter((r) => r.studentId === selectedStudent?.id);
  const rawPresent = studentAttendanceList.filter((r) => r.status === 'present' || r.status === 'late').length;
  const totalSessionsCount = studentAttendanceList.length > 0 ? studentAttendanceList.length : 8;
  const presentCount = studentAttendanceList.length > 0 ? rawPresent : 8;
  const attendanceRate = Math.round((presentCount / totalSessionsCount) * 100);

  // Get CEFR evaluations for student
  const rawEvaluations = studentEvaluations.filter((ev) => ev.studentId === selectedStudent?.id);
  const evaluatedMilestones = rawEvaluations.length > 0
    ? rawEvaluations.map((ev) => ({
        milestone: cefrMilestones.find((m) => m.id === ev.milestoneId) || {
          id: ev.milestoneId,
          cefrLevel: studentCohort?.cefrLevel || 'A2',
          skillCategory: 'spoken_production' as const,
          code: 'A2.SP.1',
          descriptionEn: 'General speaking',
          descriptionId: 'Kemampuan bicara umum',
          canDoStatementEn: 'Can produce simple connected sentences.',
          canDoStatementId: 'Mampu menyusun kalimat sederhana yang saling terhubung.',
        },
        score: ev.competencyScore,
        notes: ev.teacherNotes,
      }))
    : cefrMilestones.slice(0, 3).map((m, idx) => ({
        milestone: m,
        score: (3 + (idx % 2 === 0 ? 1 : 0)) as CompetencyScore,
        notes: 'Sangat baik dan antusias dalam latihan.',
      }));

  // Auto-generate WhatsApp message for selected student
  const getScoreAbbr = (score: number) => {
    switch (score) {
      case 1: return 'MB (Mulai Berkembang)';
      case 2: return 'SB (Sedang Berkembang)';
      case 3: return 'TC (Tercapai Sesuai Harapan)';
      case 4: return 'M (Mahir / Melebihi)';
      default: return 'TC';
    }
  };

  const cefrPointsText = evaluatedMilestones
    .slice(0, 3)
    .map((ev) => `• ${ev.milestone.skillCategory.replace('-', ' ').toUpperCase()}: *${getScoreAbbr(ev.score)}*`)
    .join('\n');

  const whatsappDraft = `*LAPORAN PERKEMBANGAN BELAJAR SISWA* 📚
━━━━━━━━━━━━━━━━━━
Nama Siswa: *${selectedStudent?.fullName || 'Liam Wong'} (${selectedStudent?.nickname || 'Liam'})*
Kelas: *${studentCohort?.name || 'Primary English'}*
Guru Pengampu: *${teacher.name}*
Periode: *${selectedMonth}*
Kehadiran: *${attendanceRate}% (${presentCount}/${totalSessionsCount} Sesi Hadir)*

🎯 *Capaian Kompetensi (CEFR ${studentCohort?.cefrLevel || 'A2'}):*
${cefrPointsText}

📝 *Catatan & Rekomendasi Guru:*
"${narrativeFeedback}"

${selectedStudent?.growthAreas ? `🌱 *Area Fokus:* ${selectedStudent.growthAreas}\n` : ''}
Terima kasih atas bimbingan dan kerja sama Bapak/Ibu ${selectedStudent?.guardianName || 'Wali Murid'}. 🙏
_${teacher.schoolName || 'ClassQue Academy'}_`;

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsappDraft);
    setCopyFeedback(true);
    addToast(language === 'id' ? 'Format pesan WhatsApp tersalin!' : 'WhatsApp format copied to clipboard!', 'success');
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleSaveParentReport = () => {
    if (!selectedStudent) return;
    const newReport: ParentReport = {
      id: `rep_${Date.now()}`,
      studentId: selectedStudent.id,
      cohortId: selectedStudent.cohortId,
      reportPeriod: selectedMonth,
      attendanceRate,
      totalSessionsCount,
      presentCount,
      milestoneSummaryJson: JSON.stringify(evaluatedMilestones),
      teacherNarrativeFeedback: narrativeFeedback,
      whatsappBriefText: whatsappDraft,
      isSent: false,
    };
    addParentReport(newReport);
    addToast(
      language === 'id' 
        ? `Rapor ${selectedStudent.fullName} berhasil disimpan ke riwayat!` 
        : `Report for ${selectedStudent.fullName} saved to history!`,
      'success'
    );
  };

  const handleToggleReportSent = (reportId: string, currentSent: boolean) => {
    updateParentReport(reportId, {
      isSent: !currentSent,
      sentAt: !currentSent ? new Date().toISOString() : undefined,
    });
    addToast(
      language === 'id'
        ? (!currentSent ? 'Status laporan diubah: Terkirim ✓' : 'Status laporan: Belum dikirim')
        : (!currentSent ? 'Report marked as sent ✓' : 'Report marked as unsent'),
      'info'
    );
  };

  const handleStatusChange = (newStatus: ClaimStatus) => {
    if (activeClaim) {
      updateClaim(activeClaim.id, {
        status: newStatus,
        totalSessions: monthlySessions.length,
        totalHours: parseFloat(totalHours),
        baseAmount,
        allowanceAmount: allowanceNum,
        totalClaimAmount: grandTotal,
      });
      addToast(
        language === 'id' 
          ? `Status klaim diubah menjadi: ${newStatus.toUpperCase()}` 
          : `Claim status updated to: ${newStatus.toUpperCase()}`,
        'success'
      );
    }
  };

  const handleDeleteSessionConfirm = () => {
    if (!sessionToDelete) return;
    deleteSession(sessionToDelete.id);
    addToast(language === 'id' ? 'Sesi berhasil dihapus' : 'Session deleted', 'info');
    setSessionToDelete(null);
  };

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: teacher.currency || 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const studentReports = parentReports.filter((r) => r.studentId === selectedStudent?.id);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-700" />
            {t.nav.claimsReports}
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            {language === 'id' 
              ? 'Kalkulator honorarium mengajar otomatis dan generator laporan perkembangan siswa.' 
              : 'Automated teaching honorarium calculator and student parent progress report generator.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
          <button
            onClick={() => setActiveTab('claims')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'claims'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-teal-700" />
            <span>{t.hubs.claimsTab}</span>
          </button>
          <button
            onClick={() => setActiveTab('parent-reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'parent-reports'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>{t.hubs.parentReportsTab}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Claims & Honorarium Engine */}
      {activeTab === 'claims' && (
        <div className="space-y-6">
          
          {/* Top Period Selector & Action Bar */}
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-teal-700" />
              <label className="text-xs font-bold text-stone-700">
                {language === 'id' ? 'Pilih Periode Bulan:' : 'Select Claim Period:'}
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
              >
                <option value="2026-09">September 2026</option>
                <option value="2026-08">Agustus 2026</option>
                <option value="2026-07">Juli 2026</option>
                <option value="2026-06">Juni 2026</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setManualSessionModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'id' ? 'Catat Sesi Manual' : 'Log Manual Session'}</span>
              </button>

              <button
                onClick={() => setInvoiceModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{language === 'id' ? 'Cetak Faktur Klaim (A4)' : 'Print Invoice (A4)'}</span>
              </button>
            </div>
          </div>

          {/* Metric Cards Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs">
              <span className="text-[11px] font-extrabold text-stone-400 uppercase tracking-wider block">
                {language === 'id' ? 'Total Sesi Terverifikasi' : 'Verified Sessions'}
              </span>
              <p className="text-2xl font-black text-stone-900 mt-1 font-mono">
                {monthlySessions.length} <span className="text-xs font-medium text-stone-400 font-sans">sesi</span>
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {totalHours} {language === 'id' ? 'total jam mengajar' : 'total teaching hours'}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs">
              <span className="text-[11px] font-extrabold text-stone-400 uppercase tracking-wider block">
                {language === 'id' ? 'Honor Pokok Sesi' : 'Base Honorarium'}
              </span>
              <p className="text-2xl font-black text-stone-900 mt-1 font-mono">
                {formatIDR(baseAmount)}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Tarif default: {formatIDR(teacher.defaultHourlyRate)}/jam
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs">
              <span className="text-[11px] font-extrabold text-stone-400 uppercase tracking-wider block">
                {language === 'id' ? 'Tunjangan & Ekstra' : 'Allowances & Extras'}
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <input
                  type="number"
                  step="50000"
                  value={allowanceInput}
                  onChange={(e) => setAllowanceInput(e.target.value)}
                  className="w-full px-2.5 py-1 text-sm font-black font-mono text-stone-900 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">Transport & materi</p>
            </div>

            <div className="bg-gradient-to-br from-teal-800 to-teal-950 rounded-3xl p-5 text-white shadow-md">
              <span className="text-[11px] font-extrabold text-teal-300 uppercase tracking-wider block">
                {language === 'id' ? 'Grand Total Klaim' : 'Total Claim Amount'}
              </span>
              <p className="text-2xl font-black mt-1 font-mono">
                {formatIDR(grandTotal)}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  claimStatus === 'paid' 
                    ? 'bg-emerald-500 text-white' 
                    : claimStatus === 'approved' 
                    ? 'bg-blue-500 text-white' 
                    : claimStatus === 'submitted'
                    ? 'bg-amber-500 text-white'
                    : 'bg-stone-700 text-stone-200'
                }`}>
                  Status: {claimStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Claim Workflow Status Transition Box */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-teal-700" />
                {language === 'id' ? 'Alur Status Pengajuan Klaim' : 'Claim Workflow Status'}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {language === 'id' 
                  ? 'Perbarui tahapan status klaim dari Draf hingga Terbayar.' 
                  : 'Update the claim lifecycle from Draft through Paid.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStatusChange('draft')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  claimStatus === 'draft'
                    ? 'bg-stone-800 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                1. Draft
              </button>

              <button
                onClick={() => handleStatusChange('submitted')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  claimStatus === 'submitted'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                2. Submitted
              </button>

              <button
                onClick={() => handleStatusChange('approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  claimStatus === 'approved'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                3. Approved
              </button>

              <button
                onClick={() => handleStatusChange('paid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  claimStatus === 'paid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                4. Paid ✓
              </button>
            </div>
          </div>

          {/* Itemized Verified Sessions Log */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-extrabold text-stone-900">
                {language === 'id' ? 'Rincian Sesi Mengajar Terverifikasi' : 'Itemized Verified Teaching Sessions'} ({monthlySessions.length})
              </h3>
              <span className="text-xs text-stone-400 font-medium font-mono">
                {selectedMonth}
              </span>
            </div>

            {monthlySessions.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs">
                <p>{language === 'id' ? 'Belum ada sesi mengajar tercatat di bulan ini.' : 'No teaching sessions logged for this month.'}</p>
                <button
                  onClick={() => setManualSessionModalOpen(true)}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200 hover:bg-teal-100 transition-colors"
                >
                  + {language === 'id' ? 'Catat Sesi Pertama' : 'Log First Session'}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {monthlySessions.map((sess) => {
                  const cohort = cohorts.find((c) => c.id === sess.cohortId);
                  return (
                    <div key={sess.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-800 font-black text-xs flex items-center justify-center border border-emerald-200 shrink-0">
                          ✓
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-stone-900 truncate">
                            {cohort?.name || 'Class Session'}
                          </p>
                          <p className="text-[11px] text-stone-400 font-medium">
                            {sess.sessionDate} • {sess.startTime} - {sess.endTime || 'Done'} ({sess.durationMinutes}m)
                            {sess.scratchpadNotes ? ` • 📝 ${sess.scratchpadNotes}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-stone-900 font-mono">
                          {formatIDR(sess.totalClaimAmount)}
                        </span>

                        <button
                          onClick={() => setSessionToDelete(sess)}
                          className="p-1.5 text-stone-300 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 2: Parent Progress Reports */}
      {activeTab === 'parent-reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Student Selector & Reports History (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Student Selector Card */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-stone-400 uppercase tracking-wider block">
                  {language === 'id' ? 'Pilih Siswa' : 'Select Student'} ({students.length})
                </span>
                <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md font-bold">
                  {selectedMonth}
                </span>
              </div>

              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                {students.map((st) => {
                  const isSelected = st.id === selectedStudent?.id;
                  const cohort = cohorts.find((c) => c.id === st.cohortId);
                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStudentId(st.id)}
                      className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                        isSelected ? 'bg-teal-50 border border-teal-300 shadow-xs' : 'hover:bg-stone-50 border border-stone-200/80'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-stone-900">{st.fullName}</p>
                        <p className="text-[11px] text-stone-400">{cohort?.name || 'Class'} • Wali: {st.guardianName || '-'}</p>
                      </div>
                      <UserCheck className={`w-4 h-4 ${isSelected ? 'text-teal-700' : 'text-stone-300'}`} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Past Generated Reports History */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-stone-500" />
                  {language === 'id' ? 'Riwayat Rapor Siswa Ini' : 'Student Report History'}
                </h4>
                <span className="text-[10px] text-stone-400 font-mono">
                  {studentReports.length} {language === 'id' ? 'tersimpan' : 'saved'}
                </span>
              </div>

              {studentReports.length === 0 ? (
                <p className="text-[11px] text-stone-400 italic py-2 text-center">
                  {language === 'id' ? 'Belum ada riwayat rapor tersimpan.' : 'No saved report history for this student.'}
                </p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {studentReports.map((rep) => (
                    <div key={rep.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-stone-900 font-mono text-[11px]">{rep.reportPeriod}</p>
                        <p className="text-[10px] text-stone-500">Kehadiran: {rep.attendanceRate}%</p>
                      </div>
                      <button
                        onClick={() => handleToggleReportSent(rep.id, rep.isSent)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors ${
                          rep.isSent 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{rep.isSent ? 'Terkirim' : 'Belum Kirim'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right: Feedback Editor, WhatsApp Preview & A4 Card (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Student Stats Bar */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white font-black flex items-center justify-center text-sm shadow-xs">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900">{selectedStudent?.fullName}</h3>
                  <p className="text-xs text-stone-500">
                    {studentCohort?.name} • CEFR {studentCohort?.cefrLevel} • Wali: {selectedStudent?.guardianName} ({selectedStudent?.guardianPhone || 'No WA'})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-extrabold text-stone-400 block">Kehadiran</span>
                  <span className="text-sm font-black text-emerald-700 font-mono">{attendanceRate}% ({presentCount}/{totalSessionsCount} Sesi)</span>
                </div>
              </div>
            </div>

            {/* Editable Teacher Narrative Feedback */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-stone-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-700" />
                  {language === 'id' ? 'Catatan & Narasi Evaluasi Guru' : 'Teacher Narrative Feedback & Recommendations'}
                </h4>
                <button
                  onClick={handleSaveParentReport}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{language === 'id' ? 'Simpan ke Riwayat Rapor' : 'Save to History'}</span>
                </button>
              </div>

              <textarea
                value={narrativeFeedback}
                onChange={(e) => setNarrativeFeedback(e.target.value)}
                rows={3}
                placeholder={language === 'id' ? 'Tuliskan catatan perkembangan dan rekomendasi belajar siswa...' : 'Write student progress notes and learning suggestions...'}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
              />
            </div>

            {/* Format 1: WhatsApp Message Copy Card */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-stone-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  {language === 'id' ? 'Format Pesan WhatsApp (1-Klik Salin & Kirim)' : 'WhatsApp Brief Format (1-Click Copy & Send)'}
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyWhatsApp}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copyFeedback ? (language === 'id' ? 'Tersalin! ✓' : 'Copied! ✓') : (language === 'id' ? 'Salin Teks WA' : 'Copy WA Text')}</span>
                  </button>

                  {selectedStudent?.guardianPhone && (
                    <a
                      href={`https://wa.me/${selectedStudent.guardianPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappDraft)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1"
                    >
                      <span>Buka WA ↗</span>
                    </a>
                  )}
                </div>
              </div>

              <pre className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-mono text-stone-800 whitespace-pre-wrap leading-relaxed">
                {whatsappDraft}
              </pre>
            </div>

            {/* Format 2: Printable A4 Report Card Preview Trigger */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-stone-900 flex items-center gap-2">
                    <Printer className="w-4 h-4 text-teal-700" />
                    {language === 'id' ? 'Lembar Rapor Cetak A4 / PDF Resmi' : 'Formal Printable A4 / PDF Report Card'}
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {language === 'id' 
                      ? 'Format lengkap dengan matriks kompetensi CEFR, tingkat kehadiran, dan kolom tanda tangan wali.' 
                      : 'Full format with CEFR rubric matrix, attendance percentage, and signature blocks.'}
                  </p>
                </div>
                <button
                  onClick={() => setReportCardModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{language === 'id' ? 'Pratinjau & Cetak A4' : 'Preview & Print A4'}</span>
                </button>
              </div>

              {/* Compact Mini Preview */}
              <div className="p-4 border border-stone-200 rounded-2xl bg-[#FCFAF7] text-stone-900 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <span className="font-extrabold text-stone-700 uppercase">{teacher.schoolName || 'ClassQue Language Academy'}</span>
                  <span className="text-[10px] font-bold text-teal-800 font-mono">Period: {selectedMonth}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><strong>Siswa:</strong> {selectedStudent?.fullName}</div>
                  <div><strong>Kelas:</strong> {studentCohort?.name}</div>
                  <div><strong>Kehadiran:</strong> {attendanceRate}% ({presentCount}/{totalSessionsCount} Sesi)</div>
                  <div><strong>Guru:</strong> {teacher.name}</div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Manual Session Modal */}
      <ManualSessionModal
        isOpen={isManualSessionModalOpen}
        cohorts={cohorts}
        onClose={() => setManualSessionModalOpen(false)}
      />

      {/* Claim Invoice Modal */}
      <ClaimInvoiceModal
        isOpen={isInvoiceModalOpen}
        claim={activeClaim}
        sessions={monthlySessions}
        cohorts={cohorts}
        teacher={teacher}
        onClose={() => setInvoiceModalOpen(false)}
      />

      {/* Printable Report Card Modal */}
      <PrintableReportCard
        isOpen={isReportCardModalOpen}
        student={selectedStudent}
        cohort={studentCohort}
        teacher={teacher}
        reportPeriod={selectedMonth}
        attendanceRate={attendanceRate}
        presentCount={presentCount}
        totalSessionsCount={totalSessionsCount}
        evaluations={evaluatedMilestones}
        narrativeFeedback={narrativeFeedback}
        language={language}
        onClose={() => setReportCardModalOpen(false)}
      />

      {/* Delete Session Confirmation Modal */}
      <ConfirmModal
        isOpen={!!sessionToDelete}
        title={language === 'id' ? 'Hapus Sesi Mengajar?' : 'Delete Session?'}
        message={
          language === 'id'
            ? `Apakah Anda yakin ingin menghapus sesi tanggal ${sessionToDelete?.sessionDate}? Total klaim akan berkurang.`
            : `Are you sure you want to delete the session on ${sessionToDelete?.sessionDate}?`
        }
        confirmText={language === 'id' ? 'Ya, Hapus Sesi' : 'Yes, Delete'}
        cancelText={language === 'id' ? 'Batal' : 'Cancel'}
        isDangerous={true}
        onConfirm={handleDeleteSessionConfirm}
        onCancel={() => setSessionToDelete(null)}
      />

    </div>
  );
};
