import React, { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, MessageSquare, Printer, 
  Copy, UserCheck, Plus, Trash2, Calendar,
  DollarSign, Award, BookOpen, Send, CheckCircle2, History, Pencil
} from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useTranslation, claimStatusLabel, skillLabel } from '../../utils/i18n';
import { toWhatsAppNumber } from '../../utils/phone';
import { TeachingSession, TeachingClaim, ClaimStatus, ParentReport } from '../../types';
import { localMonthStr } from '../../utils/date';
import { ManualSessionModal } from './ManualSessionModal';
import { ClaimInvoiceModal } from './ClaimInvoiceModal';
import { PrintableReportCard } from './PrintableReportCard';
import { ConfirmModal } from '../common/ConfirmModal';

export const ClaimsReportsHub: React.FC = () => {
  const { 
    claims, updateClaim, upsertClaim, sessions, deleteSession, 
    students, cohorts, teacher, language, addToast,
    studentEvaluations, cefrMilestones, attendanceRecords,
    parentReports, upsertParentReport, updateParentReport
  } = useTeacherStore();
  const t = useTranslation(language);

  const [activeTab, setActiveTab] = useState<'claims' | 'parent-reports'>('claims');
  const [selectedMonth, setSelectedMonth] = useState<string>(localMonthStr());
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Modals
  const [isManualSessionModalOpen, setManualSessionModalOpen] = useState(false);
  const [isInvoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [isReportCardModalOpen, setReportCardModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<TeachingSession | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<TeachingSession | null>(null);

  // Allowance edit state
  const [allowanceInput, setAllowanceInput] = useState<string>('0');

  // Narrative feedback editor for selected student
  const [narrativeFeedback, setNarrativeFeedback] = useState<string>('');

  // Months offered: the current month plus every month that has sessions, a claim or attendance (newest first)
  const monthOptions = useMemo(() => {
    const set = new Set<string>([localMonthStr(), selectedMonth]);
    sessions.forEach((x) => x.sessionDate && set.add(x.sessionDate.slice(0, 7)));
    claims.forEach((c) => c.claimPeriod && set.add(c.claimPeriod));
    attendanceRecords.forEach((r) => r.attendanceDate && set.add(r.attendanceDate.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [sessions, claims, attendanceRecords, selectedMonth]);

  const monthLabel = (m: string) => {
    const [y, mo] = m.split('-').map(Number);
    return new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' }).format(new Date(y, (mo || 1) - 1, 1));
  };

  // Totals are always derived from the month's Teaching Sessions
  const monthlySessions = sessions.filter((s) => s.sessionDate.startsWith(selectedMonth));
  const totalMinutes = monthlySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const baseAmount = monthlySessions.reduce((acc, s) => acc + s.totalClaimAmount, 0);

  // Active claim record for the month (if one exists yet)
  const activeClaim = claims.find((c) => c.claimPeriod === selectedMonth);
  const claimStatus: ClaimStatus = activeClaim?.status || 'draft';
  const isClaimLocked = claimStatus !== 'draft';

  // The allowance input mirrors the claim record; changing month or claim reloads it.
  useEffect(() => {
    setAllowanceInput(String(activeClaim?.allowanceAmount ?? 0));
  }, [selectedMonth, activeClaim?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const allowanceNum = Math.max(0, parseFloat(allowanceInput) || 0);
  const grandTotal = baseAmount + (isClaimLocked ? activeClaim?.allowanceAmount ?? 0 : allowanceNum);

  const claimTotals = (allowance: number): Partial<TeachingClaim> => ({
    totalSessions: monthlySessions.length,
    totalHours: parseFloat(totalHours),
    baseAmount,
    allowanceAmount: allowance,
    totalClaimAmount: baseAmount + allowance,
  });

  // Keep a DRAFT claim's stored totals in step with its sessions (submitted/approved/paid claims stay frozen).
  useEffect(() => {
    if (!activeClaim || activeClaim.status !== 'draft') return;
    const t = claimTotals(activeClaim.allowanceAmount);
    if (
      activeClaim.totalSessions !== t.totalSessions || activeClaim.totalHours !== t.totalHours ||
      activeClaim.baseAmount !== t.baseAmount || activeClaim.totalClaimAmount !== t.totalClaimAmount
    ) {
      updateClaim(activeClaim.id, t);
    }
  }, [monthlySessions.length, totalHours, baseAmount, activeClaim?.id, activeClaim?.status, activeClaim?.allowanceAmount]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitAllowance = () => {
    if (isClaimLocked) return;
    if (allowanceNum === (activeClaim?.allowanceAmount ?? 0) && activeClaim) return;
    upsertClaim(selectedMonth, claimTotals(allowanceNum));
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const studentCohort = cohorts.find((c) => c.id === selectedStudent?.cohortId);

  // Pre-fill the narrative only from what the teacher actually wrote about the student
  useEffect(() => {
    if (selectedStudent) {
      setNarrativeFeedback(selectedStudent.notes || selectedStudent.strengths || '');
    }
  }, [selectedStudentId, selectedStudent?.notes, selectedStudent?.strengths]); // eslint-disable-line react-hooks/exhaustive-deps

  // Attendance for the selected month, from RECORDED rows only (no placeholder numbers)
  const studentAttendanceList = attendanceRecords.filter(
    (r) => r.studentId === selectedStudent?.id && r.attendanceDate.startsWith(selectedMonth)
  );
  const presentCount = studentAttendanceList.filter((r) => r.status === 'present' || r.status === 'late').length;
  const totalSessionsCount = studentAttendanceList.length;
  const attendanceRate: number | null = totalSessionsCount > 0 ? Math.round((presentCount / totalSessionsCount) * 100) : null;

  // CEFR: only real evaluations the teacher has entered
  const evaluatedMilestones = studentEvaluations
    .filter((ev) => ev.studentId === selectedStudent?.id)
    .flatMap((ev) => {
      const milestone = cefrMilestones.find((m) => m.id === ev.milestoneId);
      return milestone ? [{ milestone, score: ev.competencyScore, notes: ev.teacherNotes }] : [];
    });
  const hasReportData = totalSessionsCount > 0 || evaluatedMilestones.length > 0;

  // Auto-generate WhatsApp message for selected student
  const getScoreAbbr = (score: number) => {
    const id = language === 'id';
    switch (score) {
      case 1: return id ? 'MB (Mulai Berkembang)' : 'Emerging';
      case 2: return id ? 'SB (Sedang Berkembang)' : 'Developing';
      case 3: return id ? 'TC (Tercapai Sesuai Harapan)' : 'Achieved';
      case 4: return id ? 'M (Mahir / Melebihi)' : 'Mastered';
      default: return id ? 'TC' : 'Achieved';
    }
  };

  const cefrPointsText = evaluatedMilestones
    .slice(0, 3)
    .map((ev) => `• ${skillLabel(ev.milestone.skillCategory, language).toUpperCase()}: *${getScoreAbbr(ev.score)}*`)
    .join('\n');

  const whatsappDraft = language === 'id'
    ? `*LAPORAN PERKEMBANGAN BELAJAR SISWA* 📚
━━━━━━━━━━━━━━━━━━
Nama Siswa: *${selectedStudent?.fullName || '-'}${selectedStudent?.nickname ? ` (${selectedStudent.nickname})` : ''}*
Kelas: *${studentCohort?.name || '-'}*
Guru Pengampu: *${teacher.name}*
Periode: *${selectedMonth}*
Kehadiran: *${attendanceRate === null ? 'belum ada data presensi bulan ini' : `${attendanceRate}% (${presentCount}/${totalSessionsCount} Sesi Hadir)`}*

${evaluatedMilestones.length > 0 ? `🎯 *Capaian Kompetensi (CEFR ${studentCohort?.cefrLevel || ''}):*\n${cefrPointsText}\n\n` : ''}${narrativeFeedback.trim() ? `📝 *Catatan & Rekomendasi Guru:*\n"${narrativeFeedback.trim()}"\n` : ''}
${selectedStudent?.growthAreas ? `🌱 *Area Fokus:* ${selectedStudent.growthAreas}\n` : ''}
Terima kasih atas bimbingan dan kerja sama Bapak/Ibu ${selectedStudent?.guardianName || 'Wali Murid'}. 🙏
_${teacher.schoolName || ''}_`
    : `*STUDENT LEARNING PROGRESS REPORT* 📚
━━━━━━━━━━━━━━━━━━
Student: *${selectedStudent?.fullName || '-'}${selectedStudent?.nickname ? ` (${selectedStudent.nickname})` : ''}*
Cohort: *${studentCohort?.name || '-'}*
Teacher: *${teacher.name}*
Period: *${selectedMonth}*
Attendance: *${attendanceRate === null ? 'no attendance recorded this month' : `${attendanceRate}% (${presentCount}/${totalSessionsCount} sessions attended)`}*

${evaluatedMilestones.length > 0 ? `🎯 *Competency Progress (CEFR ${studentCohort?.cefrLevel || ''}):*\n${cefrPointsText}\n\n` : ''}${narrativeFeedback.trim() ? `📝 *Teacher Notes & Recommendations:*\n"${narrativeFeedback.trim()}"\n` : ''}
${selectedStudent?.growthAreas ? `🌱 *Focus Areas:* ${selectedStudent.growthAreas}\n` : ''}
Thank you for your guidance and support, ${selectedStudent?.guardianName || 'Guardian'}. 🙏
_${teacher.schoolName || ''}_`;

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsappDraft);
    setCopyFeedback(true);
    addToast(language === 'id' ? 'Format pesan WhatsApp tersalin!' : 'WhatsApp format copied to clipboard!', 'success');
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleSaveParentReport = () => {
    if (!selectedStudent) return;
    if (!hasReportData && !narrativeFeedback.trim()) {
      addToast(
        language === 'id' ? 'Belum ada data presensi, capaian CEFR, atau catatan untuk dilaporkan.' : 'There is no attendance, CEFR or narrative data to report yet.',
        'warning'
      );
      return;
    }
    const existed = parentReports.some((r) => r.studentId === selectedStudent.id && r.reportPeriod === selectedMonth);
    const newReport: ParentReport = {
      id: `rep_${Date.now()}`,
      studentId: selectedStudent.id,
      cohortId: selectedStudent.cohortId,
      reportPeriod: selectedMonth,
      attendanceRate: attendanceRate ?? 0,
      totalSessionsCount,
      presentCount,
      milestoneSummaryJson: JSON.stringify(evaluatedMilestones),
      teacherNarrativeFeedback: narrativeFeedback,
      whatsappBriefText: whatsappDraft,
      isSent: false,
    };
    upsertParentReport(newReport);
    addToast(
      language === 'id' 
        ? `Rapor ${selectedStudent.fullName} ${existed ? 'diperbarui' : 'disimpan'} di riwayat!` 
        : `Report for ${selectedStudent.fullName} ${existed ? 'updated' : 'saved'} in history!`,
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
    // Creates the month's claim on first use; totals refreshed while it is still a draft.
    const allowance = isClaimLocked ? activeClaim?.allowanceAmount ?? 0 : allowanceNum;
    upsertClaim(selectedMonth, { ...(newStatus === 'draft' || !isClaimLocked ? claimTotals(allowance) : {}), status: newStatus });
    addToast(
      language === 'id' 
        ? `Status klaim diubah menjadi: ${newStatus.toUpperCase()}` 
        : `Claim status updated to: ${newStatus.toUpperCase()}`,
      'success'
    );
  };

  const handleDeleteSessionConfirm = () => {
    if (!sessionToDelete) return;
    deleteSession(sessionToDelete.id);
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

  // What the invoice shows: the stored claim, or a draft built from the month's current numbers
  const invoiceClaim: TeachingClaim = {
    ...(activeClaim ?? {
      id: '',
      teacherId: teacher.id,
      claimPeriod: selectedMonth,
      claimNumber: `CLM-${selectedMonth.replace('-', '')}-001`,
      currency: teacher.currency || 'IDR',
      status: 'draft' as ClaimStatus,
    }),
    ...claimTotals(isClaimLocked ? activeClaim?.allowanceAmount ?? 0 : allowanceNum),
  } as TeachingClaim;

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
            <MessageSquare className="w-4 h-4 text-emerald-700" />
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
                aria-label={language === 'id' ? 'Periode klaim' : 'Claim period'}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>{monthLabel(m)}</option>
                ))}
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
                <span>{language === 'id' ? 'Cetak Lembar Klaim (A4)' : 'Print Claim Sheet (A4)'}</span>
              </button>
            </div>
          </div>

          {/* Metric Cards Banner */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-3xl p-3.5 sm:p-5 border border-stone-200 shadow-xs">
              <span className="text-[11px] font-extrabold text-stone-400 uppercase tracking-wider block">
                {language === 'id' ? 'Total Sesi Terverifikasi' : 'Verified Sessions'}
              </span>
              <p className="text-lg sm:text-2xl font-black text-stone-900 mt-1 font-mono break-words">
                {monthlySessions.length} <span className="text-xs font-medium text-stone-400 font-sans">{language === 'id' ? 'sesi' : 'sessions'}</span>
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {totalHours} {language === 'id' ? 'total jam mengajar' : 'total teaching hours'}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-3.5 sm:p-5 border border-stone-200 shadow-xs">
              <span className="text-[11px] font-extrabold text-stone-400 uppercase tracking-wider block">
                {language === 'id' ? 'Honor Pokok Sesi' : 'Base Honorarium'}
              </span>
              <p className="text-lg sm:text-2xl font-black text-stone-900 mt-1 font-mono break-words">
                {formatIDR(baseAmount)}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {language === 'id' ? 'Tarif Honor default' : 'Default hourly rate'}: {formatIDR(teacher.defaultHourlyRate)}/{language === 'id' ? 'jam' : 'hr'}
              </p>
            </div>

            <div className="col-span-2 lg:col-span-1 bg-white rounded-3xl p-3.5 sm:p-5 border border-stone-200 shadow-xs">
              <span className="text-[11px] font-extrabold text-stone-400 uppercase tracking-wider block">
                {language === 'id' ? 'Tunjangan & Ekstra' : 'Allowances & Extras'}
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <input
                  type="number"
                  aria-label={language === 'id' ? 'Tunjangan & ekstra (Rp)' : 'Allowances & extras'}
                  step="50000"
                  min={0}
                  value={allowanceInput}
                  disabled={isClaimLocked}
                  onChange={(e) => setAllowanceInput(e.target.value)}
                  onBlur={commitAllowance}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  title={isClaimLocked ? (language === 'id' ? 'Klaim sudah diajukan; kembalikan ke Draft untuk mengubah.' : 'Claim already submitted; set it back to Draft to edit.') : undefined}
                  className="w-full px-2.5 py-1 text-sm font-black font-mono text-stone-900 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">{language === 'id' ? 'Transport & materi' : 'Transport & materials'}</p>
            </div>

            <div className="theme-original col-span-2 lg:col-span-1 bg-gradient-to-br from-teal-800 to-teal-950 rounded-3xl p-4 sm:p-5 text-white shadow-md">
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
                  Status: {claimStatusLabel(claimStatus, language)}
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
                1. {claimStatusLabel('draft', language)}
              </button>

              <button
                onClick={() => handleStatusChange('submitted')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  claimStatus === 'submitted'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                2. {claimStatusLabel('submitted', language)}
              </button>

              <button
                onClick={() => handleStatusChange('approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  claimStatus === 'approved'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                3. {claimStatusLabel('approved', language)}
              </button>

              <button
                onClick={() => handleStatusChange('paid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  claimStatus === 'paid'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                4. {claimStatusLabel('paid', language)} ✓
              </button>
            </div>
          </div>

          {/* Itemized Verified Sessions Log */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-extrabold text-stone-900">
                {language === 'id' ? 'Rincian Sesi Pembelajaran Terverifikasi' : 'Itemized Verified Teaching Sessions'} ({monthlySessions.length})
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
                            {cohort?.name || (language === 'id' ? 'Rombel dihapus' : 'Deleted cohort')}
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
                          onClick={() => setSessionToEdit(sess)}
                          className="p-1.5 text-stone-300 hover:text-teal-700 rounded-lg transition-colors cursor-pointer"
                          title={language === 'id' ? 'Ubah sesi' : 'Edit session'}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSessionToDelete(sess)}
                          className="p-1.5 text-stone-300 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                          title={language === 'id' ? 'Hapus sesi' : 'Delete session'}
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
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  aria-label={language === 'id' ? 'Periode laporan' : 'Report period'}
                  className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md font-bold border border-teal-100 focus:outline-none cursor-pointer"
                >
                  {monthOptions.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
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
                        <p className="text-[11px] text-stone-400">{cohort?.name || (language === 'id' ? 'Kelas' : 'Cohort')} • {language === 'id' ? 'Wali' : 'Guardian'}: {st.guardianName || '-'}</p>
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
                <h3 className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-stone-500" />
                  {language === 'id' ? 'Riwayat Rapor Siswa Ini' : 'Student Report History'}
                </h3>
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
                        <p className="text-[10px] text-stone-500">{language === 'id' ? 'Kehadiran' : 'Attendance'}: {rep.totalSessionsCount > 0 ? `${rep.attendanceRate}%` : '—'}</p>
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
                    {studentCohort?.name} • CEFR {studentCohort?.cefrLevel} • {language === 'id' ? 'Wali' : 'Guardian'}: {selectedStudent?.guardianName} ({selectedStudent?.guardianPhone || (language === 'id' ? 'Tanpa WA' : 'No WA')})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-extrabold text-stone-400 block">{language === 'id' ? 'Kehadiran' : 'Attendance'}</span>
                  <span className="text-sm font-black text-emerald-700 font-mono" data-testid="report-attendance">
                    {attendanceRate === null ? (language === 'id' ? 'Belum ada data presensi' : 'No attendance data') : `${attendanceRate}% (${presentCount}/${totalSessionsCount} ${language === 'id' ? 'Sesi' : 'Sessions'})`}
                  </span>
                </div>
              </div>
            </div>

            {/* Editable Teacher Narrative Feedback */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-stone-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-700" />
                  {language === 'id' ? 'Catatan & Narasi Evaluasi Guru' : 'Teacher Narrative Feedback & Recommendations'}
                </h3>
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
                <h3 className="text-xs font-extrabold text-stone-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                  {language === 'id' ? 'Format Pesan WhatsApp (1-Klik Salin & Kirim)' : 'WhatsApp Brief Format (1-Click Copy & Send)'}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyWhatsApp}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copyFeedback ? (language === 'id' ? 'Tersalin! ✓' : 'Copied! ✓') : (language === 'id' ? 'Salin Teks WA' : 'Copy WA Text')}</span>
                  </button>

                  {selectedStudent?.guardianPhone && (
                    <a
                      href={`https://wa.me/${toWhatsAppNumber(selectedStudent.guardianPhone)}?text=${encodeURIComponent(whatsappDraft)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1"
                    >
                      <span>{language === 'id' ? 'Buka WA' : 'Open WA'} ↗</span>
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
                  <h3 className="text-xs font-extrabold text-stone-900 flex items-center gap-2">
                    <Printer className="w-4 h-4 text-teal-700" />
                    {language === 'id' ? 'Lembar Rapor Cetak A4 / PDF Resmi' : 'Formal Printable A4 / PDF Report Card'}
                  </h3>
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
              <div className="p-4 border border-stone-200 rounded-2xl bg-(--app-paper) text-stone-900 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <span className="font-extrabold text-stone-700 uppercase">{teacher.schoolName}</span>
                  <span className="text-[10px] font-bold text-teal-800 font-mono">{language === 'id' ? 'Periode' : 'Period'}: {selectedMonth}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><strong>{language === 'id' ? 'Siswa' : 'Student'}:</strong> {selectedStudent?.fullName}</div>
                  <div><strong>{language === 'id' ? 'Kelas' : 'Cohort'}:</strong> {studentCohort?.name}</div>
                  <div><strong>{language === 'id' ? 'Kehadiran' : 'Attendance'}:</strong> {attendanceRate === null ? '—' : `${attendanceRate}% (${presentCount}/${totalSessionsCount} ${language === 'id' ? 'Sesi' : 'Sessions'})`}</div>
                  <div><strong>{language === 'id' ? 'Guru' : 'Teacher'}:</strong> {teacher.name}</div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Manual Session Modal */}
      <ManualSessionModal
        isOpen={isManualSessionModalOpen || !!sessionToEdit}
        cohorts={cohorts}
        sessionToEdit={sessionToEdit}
        onClose={() => { setManualSessionModalOpen(false); setSessionToEdit(null); }}
      />

      {/* Claim Invoice Modal */}
      <ClaimInvoiceModal
        isOpen={isInvoiceModalOpen}
        claim={invoiceClaim}
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
        title={language === 'id' ? 'Hapus Sesi Pembelajaran?' : 'Delete Session?'}
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
