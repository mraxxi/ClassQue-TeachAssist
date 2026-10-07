import React, { useState } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, CheckCheck, 
  FileEdit
} from 'lucide-react';
import { Cohort, Student, AttendanceStatus } from '../../types';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useTranslation, attendanceStatusLabel } from '../../utils/i18n';
import { AttendanceControl, RollCallProgress } from '../common/AttendanceControl';
import { addDaysStr, localDateStr } from '../../utils/date';

interface AttendanceHistoryTabProps {
  activeCohort: Cohort;
  cohortStudents: Student[];
}

export const AttendanceHistoryTab: React.FC<AttendanceHistoryTabProps> = ({
  activeCohort,
  cohortStudents,
}) => {
  const { attendanceRecords, setAttendance, batchMarkAllPresent, language, addToast } = useTeacherStore();
  const t = useTranslation(language);

  const [selectedDate, setSelectedDate] = useState<string>(localDateStr());
  const [viewMode, setViewMode] = useState<'daily' | 'matrix'>('daily');
  const [editingNoteStudentId, setEditingNoteStudentId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');

  // Date navigation helpers (local calendar dates, never UTC)
  const handlePrevDay = () => setSelectedDate(addDaysStr(selectedDate, -1));
  const handleNextDay = () => setSelectedDate(addDaysStr(selectedDate, 1));
  const handleToday = () => setSelectedDate(localDateStr());

  const getStudentStatusRecord = (studentId: string, date: string) => {
    return attendanceRecords.find(
      (r) => r.studentId === studentId && r.attendanceDate === date
    );
  };

  /** `undefined` = not recorded yet. Unrecorded never counts as present. */
  const getStudentStatus = (studentId: string, date: string): AttendanceStatus | undefined =>
    getStudentStatusRecord(studentId, date)?.status;

  // Selected date statistics
  const presentCount = cohortStudents.filter((s) => getStudentStatus(s.id, selectedDate) === 'present').length;
  const absentCount = cohortStudents.filter((s) => getStudentStatus(s.id, selectedDate) === 'absent').length;
  const lateCount = cohortStudents.filter((s) => getStudentStatus(s.id, selectedDate) === 'late').length;
  const excusedCount = cohortStudents.filter((s) => getStudentStatus(s.id, selectedDate) === 'excused').length;
  const unmarkedCount = cohortStudents.filter((s) => getStudentStatus(s.id, selectedDate) === undefined).length;
  const recordedCount = cohortStudents.length - unmarkedCount;
  // Rate is computed from recorded students only; "—" while nothing is recorded.
  const attendanceRate: number | null = recordedCount > 0 ? Math.round(((presentCount + lateCount) / recordedCount) * 100) : null;

  // Recent 7 dates for matrix view (oldest -> today)
  const today = localDateStr();
  const recentDates: string[] = [];
  for (let i = 6; i >= 0; i--) recentDates.push(addDaysStr(today, -i));

  const handleSaveNote = (studentId: string) => {
    const currentStatus = getStudentStatus(studentId, selectedDate);
    if (!currentStatus) {
      addToast(language === 'id' ? 'Tandai status presensi terlebih dahulu.' : 'Mark an attendance status first.', 'warning');
      return;
    }
    setAttendance(studentId, activeCohort.id, selectedDate, currentStatus, noteText.trim());
    setEditingNoteStudentId(null);
    setNoteText('');
    addToast(language === 'id' ? 'Catatan presensi disimpan' : 'Attendance note saved', 'success');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      
      {/* Top Controls Bar */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        
        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
            title={language === 'id' ? 'Hari sebelumnya' : 'Previous day'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 bg-stone-50 px-3.5 py-1.5 rounded-xl border border-stone-200 font-bold text-xs text-stone-800">
            <Calendar className="w-3.5 h-3.5 text-teal-700" />
            <input
              type="date"
                aria-label={language === 'id' ? 'Tanggal presensi' : 'Attendance date'}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer font-mono"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
            title={language === 'id' ? 'Hari berikutnya' : 'Next day'}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
          >
            {language === 'id' ? 'Hari Ini' : 'Today'}
          </button>
        </div>

        {/* View Mode & Quick Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'daily' ? 'bg-white text-teal-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              {language === 'id' ? 'Harian' : 'Daily Roll-Call'}
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'matrix' ? 'bg-white text-teal-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              {language === 'id' ? 'Matriks 7 Hari' : '7-Day Matrix'}
            </button>
          </div>

          {viewMode === 'daily' && (
            <button
              onClick={() => {
                batchMarkAllPresent(activeCohort.id, selectedDate);
                addToast(language === 'id' ? 'Semua siswa ditandai Hadir' : 'All students marked Present', 'success');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>{t.cockpit.markAllPresent}</span>
            </button>
          )}
        </div>

      </div>

      {/* Date KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            {language === 'id' ? 'Tingkat Kehadiran' : 'Attendance Rate'}
          </span>
          <span className="text-xl font-black text-teal-900 mt-0.5 block">{attendanceRate === null ? '—' : `${attendanceRate}%`}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            {language === 'id' ? 'Hadir' : 'Present'}
          </span>
          <span className="text-xl font-black text-stone-900 mt-0.5 block">{presentCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
            {language === 'id' ? 'Alpa' : 'Absent'}
          </span>
          <span className="text-xl font-black text-stone-900 mt-0.5 block">{absentCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
            {language === 'id' ? 'Terlambat' : 'Late'}
          </span>
          <span className="text-xl font-black text-stone-900 mt-0.5 block">{lateCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
            {language === 'id' ? 'Izin' : 'Excused'}
          </span>
          <span className="text-xl font-black text-stone-900 mt-0.5 block">{excusedCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs text-center col-span-2 sm:col-span-1" data-testid="unmarked-kpi">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            {language === 'id' ? 'Belum Dicatat' : 'Not Recorded'}
          </span>
          <span className="text-xl font-black text-stone-900 mt-0.5 block">{unmarkedCount}</span>
        </div>
      </div>

      {/* View 1: Daily Roll-Call List */}
      {viewMode === 'daily' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-sm font-extrabold text-stone-900">
              {language === 'id' ? 'Daftar Presensi Sesi:' : 'Session Roster:'} <span className="font-mono text-teal-800">{selectedDate}</span>
            </h3>
            <RollCallProgress recorded={recordedCount} total={cohortStudents.length} language={language} />
          </div>

          <div className="divide-y divide-stone-100">
            {cohortStudents.map((st) => {
              const currentStatus = getStudentStatus(st.id, selectedDate);
              const rec = getStudentStatusRecord(st.id, selectedDate);
              const isEditingNote = editingNoteStudentId === st.id;

              return (
                <div key={st.id} className="py-3.5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    
                    {/* Student Identity */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-stone-100 text-stone-800 font-bold text-xs flex items-center justify-center border border-stone-200">
                        {st.nickname?.[0] || st.fullName?.[0] || 'S'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-900">{st.fullName}</p>
                        <p className="text-[11px] text-stone-400">
                          "{st.nickname}" • {language === 'id' ? 'Wali' : 'Guardian'}: {st.guardianName}
                        </p>
                      </div>
                    </div>

                    {/* 1-Click Status Selector & Note Trigger */}
                    <div className="flex items-center gap-2">
                      <AttendanceControl
                        value={currentStatus}
                        language={language}
                        label={st.fullName}
                        onChange={(status) => setAttendance(st.id, activeCohort.id, selectedDate, status, rec?.note)}
                      />

                      <button
                        onClick={() => {
                          if (isEditingNote) {
                            setEditingNoteStudentId(null);
                          } else {
                            setEditingNoteStudentId(st.id);
                            setNoteText(rec?.note || '');
                          }
                        }}
                        className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                          rec?.note
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-500 border-stone-200'
                        }`}
                        title={rec?.note ? `${language === 'id' ? 'Catatan' : 'Note'}: ${rec.note}` : (language === 'id' ? 'Tambah catatan presensi' : 'Add attendance note')}
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                  {/* Existing Note or Inline Note Editor */}
                  {rec?.note && !isEditingNote && (
                    <div className="pl-12">
                      <span className="text-[11px] font-medium bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200/80 inline-block">
                        📝 {rec.note}
                      </span>
                    </div>
                  )}

                  {isEditingNote && (
                    <div className="pl-12 flex items-center gap-2 pt-1 animate-in fade-in duration-100">
                      <input
                        type="text"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder={language === 'id' ? 'mis. Izin sakit flu / Datang terlambat 15 menit...' : 'e.g. Excused: flu / Arrived 15 minutes late...'}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveNote(st.id);
                          if (e.key === 'Escape') setEditingNoteStudentId(null);
                        }}
                        className="flex-1 px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 text-stone-800"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveNote(st.id)}
                        className="px-3 py-1.5 rounded-xl bg-teal-800 text-white text-xs font-bold hover:bg-teal-900 cursor-pointer"
                      >
                        {language === 'id' ? 'Simpan' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingNoteStudentId(null)}
                        className="px-2.5 py-1.5 rounded-xl bg-stone-100 text-stone-600 text-xs font-bold hover:bg-stone-200 cursor-pointer"
                      >
                        {language === 'id' ? 'Batal' : 'Cancel'}
                      </button>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: 7-Day Cohort Matrix View */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4 overflow-x-auto">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-sm font-extrabold text-stone-900">
              {language === 'id' ? 'Matriks Riwayat Presensi 7 Hari Terakhir' : '7-Day Attendance Matrix'}
            </h3>
            <span className="text-xs text-stone-500 font-medium">
              {language === 'id' ? 'Klik chip status untuk mengubah' : 'Click a status chip to change it'}
            </span>
          </div>

          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-[11px] text-stone-400 uppercase font-bold">
                <th className="py-2.5 px-3">{language === 'id' ? 'Siswa' : 'Student'}</th>
                {recentDates.map((dt) => (
                  <th key={dt} className="py-2.5 px-2 text-center font-mono">
                    {dt.slice(5)}
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right">{language === 'id' ? 'Kehadiran' : 'Attendance'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {cohortStudents.map((st) => {
                let stPresent = 0;
                let stRecorded = 0;
                return (
                  <tr key={st.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-stone-900">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {st.nickname?.[0] || 'S'}
                        </div>
                        <span className="truncate max-w-[140px]">{st.fullName}</span>
                      </div>
                    </td>

                    {recentDates.map((dt) => {
                      const status = getStudentStatus(st.id, dt);
                      if (status) stRecorded++;
                      if (status === 'present' || status === 'late') stPresent++;

                      const letter = !status ? '·' : status === 'present' ? 'H' : status === 'absent' ? 'A' : status === 'late' ? 'T' : 'I';
                      const color = !status
                        ? 'bg-stone-50 text-stone-300 border-stone-200'
                        : status === 'present' 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : status === 'absent' 
                        ? 'bg-rose-100 text-rose-800 border-rose-300' 
                        : status === 'late' 
                        ? 'bg-amber-100 text-amber-800 border-amber-300' 
                        : 'bg-sky-100 text-sky-800 border-sky-300';

                      const cycleNext = () => {
                        const order: AttendanceStatus[] = ['present', 'late', 'excused', 'absent'];
                        const nextIdx = status ? (order.indexOf(status) + 1) % order.length : 0;
                        setAttendance(st.id, activeCohort.id, dt, order[nextIdx]);
                      };

                      return (
                        <td key={dt} className="py-3 px-2 text-center">
                          <button
                            onClick={cycleNext}
                            className={`w-7 h-7 rounded-lg text-xs font-black border transition-all cursor-pointer ${color}`}
                            title={`${dt}: ${status ? attendanceStatusLabel(status, language).toUpperCase() : (language === 'id' ? 'BELUM DICATAT' : 'NOT RECORDED')} (${language === 'id' ? 'Klik untuk mengubah' : 'Click to toggle'})`}
                          >
                            {letter}
                          </button>
                        </td>
                      );
                    })}

                    <td className="py-3 px-3 text-right font-mono font-bold text-teal-900">
                      {stRecorded > 0 ? `${Math.round((stPresent / stRecorded) * 100)}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
