import React, { useState } from 'react';
import { 
  Receipt, MessageSquare, Printer, 
  Copy, UserCheck
} from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useTranslation } from '../../utils/i18n';

export const ClaimsReportsHub: React.FC = () => {
  const { 
    claims, sessions, students, cohorts, teacher, language 
  } = useTeacherStore();
  const t = useTranslation(language);

  const [activeTab, setActiveTab] = useState<'claims' | 'parent-reports'>('claims');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const activeClaim = claims[0];
  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const studentCohort = cohorts.find((c) => c.id === selectedStudent?.cohortId);

  // Auto-generate WhatsApp message for selected student
  const whatsappDraft = `*LAPORAN PERKEMBANGAN BELAJAR SISWA* 📚
━━━━━━━━━━━━━━━━━━
Nama Siswa: *${selectedStudent?.fullName} (${selectedStudent?.nickname})*
Kelas: *${studentCohort?.name || 'Flyers A2'}*
Guru Pengampu: *${teacher.name}*
Kehadiran Bulan Ini: *100% (Hadir)*

🎯 *Capaian Pembelajaran (CEFR ${studentCohort?.cefrLevel || 'A2'}):*
• Spoken Production: *Tercapai Sesuai Harapan (TC)*
• Listening & Reading: *Sangat Berkembang (M)*

📝 *Catatan Guru:*
"${selectedStudent?.strengths || 'Sangat aktif dan percaya diri berbicara dalam bahasa Inggris.'}"

Terima kasih atas kerja sama Bapak/Ibu ${selectedStudent?.guardianName}. 🙏
_${teacher.schoolName}_`;

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsappDraft);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-700" />
            {t.nav.claimsReports}
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            {language === 'id' 
              ? 'Rekapitulasi honorarium mengajar dan generator laporan perkembangan siswa.' 
              : 'Automated teaching honorarium claims and parent progress reporting.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
          <button
            onClick={() => setActiveTab('claims')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'claims' ? 'bg-white text-teal-900 shadow-xs' : 'text-stone-600'
            }`}
          >
            {t.hubs.claimsTab}
          </button>
          <button
            onClick={() => setActiveTab('parent-reports')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'parent-reports' ? 'bg-white text-teal-900 shadow-xs' : 'text-stone-600'
            }`}
          >
            {t.hubs.parentReportsTab}
          </button>
        </div>
      </div>

      {/* Tab 1: Teaching Claims & Invoices */}
      {activeTab === 'claims' && (
        <div className="space-y-6">
          
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-teal-900 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-bold text-teal-200 uppercase tracking-wider block">
                  {language === 'id' ? 'Periode Klaim Berjalan' : 'Active Claim Period'}
                </span>
                <h3 className="text-2xl font-black mt-1">September 2026</h3>
                <p className="text-xs text-teal-100 mt-0.5">Invoice Ref: {activeClaim?.claimNumber}</p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-teal-200 uppercase tracking-wider block">
                  {language === 'id' ? 'Total Estimasi Honor' : 'Total Claim Amount'}
                </span>
                <span className="text-3xl sm:text-4xl font-black text-emerald-300 tracking-tight">
                  {formatIDR(activeClaim?.totalClaimAmount || 0)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-teal-950/40 p-4 rounded-2xl border border-teal-700/50 text-center">
              <div>
                <span className="text-[11px] text-teal-200 font-semibold block">Total Sesi</span>
                <span className="text-lg font-bold">{activeClaim?.totalSessions || 0} Pertemuan</span>
              </div>
              <div>
                <span className="text-[11px] text-teal-200 font-semibold block">Total Durasi</span>
                <span className="text-lg font-bold">{activeClaim?.totalHours || 0} Jam</span>
              </div>
              <div>
                <span className="text-[11px] text-teal-200 font-semibold block">Status</span>
                <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 mt-0.5 uppercase">
                  {activeClaim?.status || 'Draft'}
                </span>
              </div>
            </div>
          </div>

          {/* Session Breakdown List */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-stone-900">
                {language === 'id' ? 'Rincian Sesi Mengajar Terverifikasi' : 'Verified Teaching Sessions Log'}
              </h3>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 border border-stone-200 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-stone-600" />
                <span>Cetak Rekap Klaim</span>
              </button>
            </div>

            <div className="divide-y divide-stone-100">
              {sessions.map((sess) => (
                <div key={sess.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-800 font-bold text-xs flex items-center justify-center border border-teal-200">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900">
                        {cohorts.find(c => c.id === sess.cohortId)?.name || 'Class Session'}
                      </p>
                      <p className="text-[11px] text-stone-400">
                        {sess.sessionDate} • {sess.startTime} - {sess.endTime} ({sess.durationMinutes} min)
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-black text-stone-900">
                    {formatIDR(sess.totalClaimAmount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Parent Progress Reports */}
      {activeTab === 'parent-reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Student Selector (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-3">
            <span className="text-[11px] font-extrabold text-stone-400 uppercase tracking-wider block">
              {language === 'id' ? 'Pilih Siswa' : 'Select Student'}
            </span>

            <div className="space-y-1.5">
              {students.map((st) => {
                const isSelected = st.id === selectedStudent?.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStudentId(st.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                      isSelected ? 'bg-teal-50 border border-teal-300 shadow-xs' : 'hover:bg-stone-50 border border-stone-200'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-stone-900">{st.fullName}</p>
                      <p className="text-[11px] text-stone-400">Wali: {st.guardianName}</p>
                    </div>
                    <UserCheck className={`w-4 h-4 ${isSelected ? 'text-teal-700' : 'text-stone-300'}`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Dual Formats (WhatsApp Brief & Printable Card) (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Format 1: WhatsApp Message Copy Card */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-extrabold text-stone-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Format Pesan WhatsApp (1-Klik Salin)
                </h4>
                <button
                  onClick={handleCopyWhatsApp}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copyFeedback ? 'Tersalin! ✓' : 'Salin Teks WA'}</span>
                </button>
              </div>

              <pre className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-800 whitespace-pre-wrap leading-relaxed">
                {whatsappDraft}
              </pre>
            </div>

            {/* Format 2: Printable A4 Report Card */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs print:p-0 print:border-none">
              <div className="flex items-center justify-between mb-4 no-print">
                <h4 className="text-xs font-extrabold text-stone-900 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-teal-700" />
                  Pratinjau Lembar Rapor Cetak A4
                </h4>
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak A4 / PDF</span>
                </button>
              </div>

              {/* Printable Layout */}
              <div className="p-6 border-2 border-stone-200 rounded-2xl bg-[#FCFAF7] print:border-black print:bg-white text-stone-900">
                <div className="text-center border-b-2 border-stone-800 pb-4 mb-4">
                  <h2 className="text-base font-extrabold tracking-wide uppercase">{teacher.schoolName}</h2>
                  <p className="text-xs font-medium text-stone-500">LAPORAN CAPAIAN PERKEMBANGAN SISWA (CEFR)</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div><strong>Nama Siswa:</strong> {selectedStudent?.fullName}</div>
                  <div><strong>Kelas / Rombel:</strong> {studentCohort?.name}</div>
                  <div><strong>Wali Murid:</strong> {selectedStudent?.guardianName}</div>
                  <div><strong>Guru Pengampu:</strong> {teacher.name}</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-stone-200 text-xs mb-4">
                  <h5 className="font-bold text-stone-800 mb-1">Catatan Evaluasi Guru:</h5>
                  <p className="text-stone-600 leading-relaxed italic">
                    "{selectedStudent?.notes || 'Siswa menunjukkan antusiasme belajar yang sangat baik dan konsisten.'}"
                  </p>
                </div>

                <div className="text-right text-[11px] text-stone-400">
                  Dicetak pada: {new Date().toLocaleDateString('id-ID')}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
