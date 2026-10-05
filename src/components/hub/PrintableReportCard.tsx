import React from 'react';
import { X, Printer, Award, UserCheck, BookOpen } from 'lucide-react';
import { Student, Cohort, Teacher, CefrMilestone, CompetencyScore, Language } from '../../types';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface PrintableReportCardProps {
  isOpen: boolean;
  student: Student | null;
  cohort: Cohort | null | undefined;
  teacher: Teacher;
  reportPeriod: string;
  attendanceRate: number | null;
  presentCount: number;
  totalSessionsCount: number;
  evaluations: Array<{ milestone: CefrMilestone; score: CompetencyScore; notes?: string }>;
  narrativeFeedback: string;
  language: Language;
  onClose: () => void;
}

export const PrintableReportCard: React.FC<PrintableReportCardProps> = ({
  isOpen,
  student,
  cohort,
  teacher,
  reportPeriod,
  attendanceRate,
  presentCount,
  totalSessionsCount,
  evaluations,
  narrativeFeedback,
  language,
  onClose,
}) => {
  useEscapeKey(onClose, isOpen);

  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  const getScoreLabel = (score: CompetencyScore) => {
    switch (score) {
      case 1:
        return {
          code: 'MB',
          name: language === 'id' ? 'Mulai Berkembang' : 'Emerging',
          color: 'bg-amber-100 text-amber-900 border-amber-300',
        };
      case 2:
        return {
          code: 'SB',
          name: language === 'id' ? 'Sedang Berkembang' : 'Developing',
          color: 'bg-blue-100 text-blue-900 border-blue-300',
        };
      case 3:
        return {
          code: 'TC',
          name: language === 'id' ? 'Tercapai Sesuai Harapan' : 'Proficient',
          color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        };
      case 4:
        return {
          code: 'M',
          name: language === 'id' ? 'Mahir / Melebihi' : 'Mastered',
          color: 'bg-purple-100 text-purple-900 border-purple-300',
        };
      default:
        return {
          code: '-',
          name: '-',
          color: 'bg-stone-100 text-stone-700 border-stone-300',
        };
    }
  };

  const todayFormatted = new Date().toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-200 p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto print:max-w-none print:shadow-none print:border-none print:p-0 print:m-0">
        
        {/* Action Header (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-teal-700" />
            <span className="text-sm font-extrabold text-stone-900">
              {language === 'id' ? 'Lembar Rapor Siswa CEFR (Cetak A4 / PDF)' : 'CEFR Student Progress Report (A4 Print / PDF)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'id' ? 'Cetak Lembar A4 / PDF' : 'Print A4 / PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Body */}
        <div className="print-sheet space-y-6 text-stone-900 print:text-black">
          
          {/* Institution & Report Header */}
          <div className="border-b-2 border-stone-900 pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-wide uppercase text-stone-900">
                {teacher.schoolName}
              </h1>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-0.5">
                {language === 'id' 
                  ? 'Laporan Capaian Perkembangan Belajar Siswa (CEFR Standard)' 
                  : 'Student Learning & CEFR Progress Evaluation Report'}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-lg bg-stone-900 text-white font-mono font-bold text-xs">
                {reportPeriod}
              </span>
              <p className="text-[11px] text-stone-400 mt-1">
                Ref: {reportPeriod}-{student.id.slice(-6).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Student Identity Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#FCFAF7] border border-stone-200 text-xs">
            <div>
              <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block">
                {language === 'id' ? 'Nama Siswa' : 'Student Name'}
              </span>
              <p className="font-bold text-stone-900 mt-0.5">{student.fullName}</p>
              {student.nickname && <p className="text-[11px] text-stone-500">({student.nickname})</p>}
            </div>

            <div>
              <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block">
                {language === 'id' ? 'Kelas / Rombel' : 'Class / Cohort'}
              </span>
              <p className="font-bold text-stone-900 mt-0.5">{cohort?.name || 'General Class'}</p>
              <p className="text-[11px] text-teal-800 font-semibold font-mono">CEFR: {cohort?.cefrLevel || 'A2'}</p>
            </div>

            <div>
              <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block">
                {language === 'id' ? 'Wali Murid' : 'Guardian / Parent'}
              </span>
              <p className="font-bold text-stone-900 mt-0.5">{student.guardianName || '-'}</p>
              <p className="text-[11px] text-stone-500">{student.guardianPhone || '-'}</p>
            </div>

            <div>
              <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block">
                {language === 'id' ? 'Guru Pengampu' : 'Educator / Teacher'}
              </span>
              <p className="font-bold text-stone-900 mt-0.5">{teacher.name}</p>
              <p className="text-[11px] text-stone-500">{teacher.email}</p>
            </div>
          </div>

          {/* Attendance Metric Strip */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white font-black flex items-center justify-center text-sm shadow-xs">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-950">
                  {language === 'id' ? 'Tingkat Kehadiran & Partisipasi Sesi' : 'Attendance & Participation Rate'}
                </h4>
                <p className="text-[11px] text-emerald-700 font-medium">
                  {attendanceRate === null
                    ? (language === 'id' ? 'Belum ada data presensi pada periode ini.' : 'No attendance has been recorded for this period.')
                    : language === 'id'
                    ? `Hadir dalam ${presentCount} dari total ${totalSessionsCount} sesi pembelajaran yang dicatat.`
                    : `Attended ${presentCount} out of ${totalSessionsCount} recorded sessions.`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-900 font-mono">{attendanceRate === null ? '—' : `${attendanceRate}%`}</span>
              </div>
              {attendanceRate !== null && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-200/80 text-emerald-900 font-extrabold text-[11px]">
                  {attendanceRate >= 80 ? (language === 'id' ? 'Sangat Baik' : 'Excellent') : (language === 'id' ? 'Perlu Ditingkatkan' : 'Needs Improvement')}
                </span>
              )}
            </div>
          </div>

          {/* CEFR Competency Breakdown Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-700" />
                {language === 'id' ? 'Capaian Kompetensi Berbahasa (CEFR Rubrics)' : 'Language Competency Rubrics (CEFR)'}
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-bold text-stone-500">
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">MB = 1</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900">SB = 2</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900">TC = 3</span>
                <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900">M = 4</span>
              </div>
            </div>

            {evaluations.length === 0 ? (
              <div className="p-4 rounded-xl border border-stone-200 text-center text-xs text-stone-400">
                {language === 'id' ? 'Belum ada evaluasi CEFR yang dicatat.' : 'No CEFR evaluations recorded yet.'}
              </div>
            ) : (
              <table className="w-full border-collapse border border-stone-200 text-xs">
                <thead>
                  <tr className="bg-stone-100 text-stone-700 text-left">
                    <th className="p-2.5 border border-stone-200 font-extrabold w-16">Kode</th>
                    <th className="p-2.5 border border-stone-200 font-extrabold w-36">{language === 'id' ? 'Kategori Keterampilan' : 'Skill Category'}</th>
                    <th className="p-2.5 border border-stone-200 font-extrabold">{language === 'id' ? 'Deskriptor Capaian (Can-Do)' : 'Can-Do Descriptor'}</th>
                    <th className="p-2.5 border border-stone-200 font-extrabold w-32 text-center">{language === 'id' ? 'Tingkat Capaian' : 'Competency'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {evaluations.map((ev, idx) => {
                    const scoreObj = getScoreLabel(ev.score);
                    return (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FCFAF7]'}>
                        <td className="p-2.5 border border-stone-200 font-mono font-bold text-stone-700">
                          {ev.milestone.code}
                        </td>
                        <td className="p-2.5 border border-stone-200 font-bold text-stone-800 capitalize">
                          {ev.milestone.skillCategory.replace('-', ' ')}
                        </td>
                        <td className="p-2.5 border border-stone-200 text-stone-700">
                          <p className="font-medium">
                            {language === 'id' ? ev.milestone.canDoStatementId : ev.milestone.canDoStatementEn}
                          </p>
                          {ev.notes && (
                            <p className="text-[11px] text-teal-800 font-medium italic mt-0.5">
                              💬 {ev.notes}
                            </p>
                          )}
                        </td>
                        <td className="p-2.5 border border-stone-200 text-center">
                          <span className={`inline-block px-2 py-1 rounded-lg border font-extrabold text-[11px] ${scoreObj.color}`}>
                            {scoreObj.code} • {scoreObj.name}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Teacher Narrative Feedback & Observations */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2 text-xs">
            <h4 className="font-extrabold text-stone-900 uppercase tracking-wider text-[11px]">
              {language === 'id' ? 'Catatan Observasi & Rekomendasi Guru' : 'Educator Narrative & Growth Recommendations'}
            </h4>
            {(narrativeFeedback || student.strengths || student.notes) ? (
              <p className="text-stone-700 leading-relaxed italic bg-stone-50 p-3 rounded-xl border border-stone-200/70 whitespace-pre-wrap">
                "{narrativeFeedback || student.strengths || student.notes}"
              </p>
            ) : (
              <p className="text-stone-400 text-[11px] italic p-3 rounded-xl border border-dashed border-stone-200">
                {language === 'id' ? 'Belum ada catatan guru.' : 'No teacher narrative has been written yet.'}
              </p>
            )}
            {student.growthAreas && (
              <p className="text-[11px] text-stone-500 font-medium">
                🎯 <strong>{language === 'id' ? 'Area Pengembangan' : 'Focus for Growth'}:</strong> {student.growthAreas}
              </p>
            )}
          </div>

          {/* Signatures & Formal Stamp Block */}
          <div className="pt-6 border-t border-stone-200 grid grid-cols-2 gap-8 text-xs text-center">
            <div className="space-y-14">
              <p className="font-bold text-stone-700">
                {language === 'id' ? 'Orang Tua / Wali Murid,' : 'Parent / Guardian,'}
              </p>
              <div>
                <p className="border-b border-stone-400 w-44 mx-auto pb-1 font-bold text-stone-900">
                  ( {student.guardianName || '...........................................'} )
                </p>
                <p className="text-[10px] text-stone-400 mt-1">{language === 'id' ? 'Tanda Tangan & Nama Terang' : 'Signature & Full Name'}</p>
              </div>
            </div>

            <div className="space-y-14">
              <p className="font-bold text-stone-700">
                {todayFormatted},<br />
                {language === 'id' ? 'Guru Pengampu / Fasilitator,' : 'Educator / Facilitator,'}
              </p>
              <div>
                <p className="border-b border-stone-400 w-44 mx-auto pb-1 font-bold text-stone-900">
                  ( {teacher.name} )
                </p>
                <p className="text-[10px] text-stone-400 mt-1">{teacher.schoolName}</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
