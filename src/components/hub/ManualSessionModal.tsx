import React, { useEffect, useState } from 'react';
import { X, Clock, Calendar, DollarSign, Plus } from 'lucide-react';
import { TeachingSession, Cohort } from '../../types';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { addMinutesToTime, localDateStr } from '../../utils/date';

interface ManualSessionModalProps {
  isOpen: boolean;
  cohorts: Cohort[];
  /** When set, the modal edits this session instead of creating a new one. */
  sessionToEdit?: TeachingSession | null;
  onClose: () => void;
}

export const ManualSessionModal: React.FC<ManualSessionModalProps> = ({
  isOpen,
  cohorts,
  sessionToEdit = null,
  onClose,
}) => {
  const { teacher, addManualSession, updateSession, addToast, language } = useTeacherStore();

  const [cohortId, setCohortId] = useState<string>(cohorts[0]?.id || '');
  const [sessionDate, setSessionDate] = useState<string>(localDateStr());
  const [startTime, setStartTime] = useState<string>('14:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [customRate, setCustomRate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEscapeKey(onClose, isOpen);

  // (Re)initialise the form every time the modal opens: blank for a new session, prefilled for an edit.
  useEffect(() => {
    if (!isOpen) return;
    if (sessionToEdit) {
      setCohortId(sessionToEdit.cohortId);
      setSessionDate(sessionToEdit.sessionDate);
      setStartTime(sessionToEdit.startTime || '14:00');
      setDurationMinutes(sessionToEdit.durationMinutes);
      setCustomRate(String(sessionToEdit.hourlyRate));
      setNotes(sessionToEdit.scratchpadNotes || '');
    } else {
      setCohortId(cohorts[0]?.id || '');
      setSessionDate(localDateStr());
      setStartTime('14:00');
      setDurationMinutes(60);
      setCustomRate('');
      setNotes('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sessionToEdit]);

  if (!isOpen) return null;

  const selectedCohort = cohorts.find((c) => c.id === cohortId) || cohorts[0];
  const effectiveHourlyRate = customRate.trim() 
    ? parseFloat(customRate) 
    : (selectedCohort?.hourlyRateOverride ?? teacher.defaultHourlyRate);

  const calculatedTotal = Math.round((durationMinutes / 60) * effectiveHourlyRate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cohortId) {
      addToast(language === 'id' ? 'Pilih kelas terlebih dahulu!' : 'Please select a cohort!', 'warning');
      return;
    }

    const endTimeStr = addMinutesToTime(startTime, durationMinutes);

    if (sessionToEdit) {
      updateSession(sessionToEdit.id, {
        cohortId,
        sessionDate,
        startTime,
        endTime: endTimeStr,
        durationMinutes,
        hourlyRate: effectiveHourlyRate,
        totalClaimAmount: calculatedTotal,
        scratchpadNotes: notes.trim() || undefined,
      });
      addToast(language === 'id' ? 'Sesi berhasil diperbarui!' : 'Teaching session updated!', 'success');
      onClose();
      return;
    }

    const newSession: TeachingSession = {
      id: `sess-${Date.now()}`,
      teacherId: teacher.id,
      cohortId,
      sessionDate,
      startTime,
      endTime: endTimeStr,
      durationMinutes,
      hourlyRate: effectiveHourlyRate,
      totalClaimAmount: calculatedTotal,
      status: 'completed',
      scratchpadNotes: notes.trim() || undefined,
    };

    addManualSession(newSession);
    addToast(
      language === 'id' 
        ? `Sesi ${selectedCohort?.name} (${durationMinutes}m) berhasil dicatat!` 
        : `Teaching session logged (${durationMinutes}m)!`,
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 scrim backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-stone-200 p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-stone-900 tracking-tight">
                {sessionToEdit
                  ? (language === 'id' ? 'Ubah Sesi Pembelajaran' : 'Edit Teaching Session')
                  : (language === 'id' ? 'Catat Sesi Pembelajaran Manual' : 'Log Teaching Session')}
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                {language === 'id'
                  ? 'Catat sesi tatap muka tambahan untuk rekapitulasi honorarium.'
                  : 'Manually record completed teaching sessions for claims.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={language === 'id' ? 'Tutup' : 'Close'}
            className="text-stone-400 hover:text-stone-600 p-2 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Cohort selection */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'id' ? 'Kelas / Rombel' : 'Cohort / Class'} *
            </label>
            <select
              value={cohortId}
              onChange={(e) => setCohortId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800 font-bold"
            >
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.cefrLevel})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Start Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-700" />
                {language === 'id' ? 'Tanggal Sesi' : 'Session Date'}
              </label>
              <input
                type="date"
                aria-label={language === 'id' ? 'Tanggal sesi' : 'Session date'}
                required
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 text-stone-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-700" />
                {language === 'id' ? 'Jam Mulai' : 'Start Time'}
              </label>
              <input
                type="time"
                aria-label={language === 'id' ? 'Jam mulai' : 'Start time'}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 text-stone-800 font-mono"
              />
            </div>
          </div>

          {/* Duration & Custom Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'id' ? 'Durasi Mengajar' : 'Duration'}
              </label>
              <input
                type="number"
                min={1}
                max={720}
                step={1}
                list="session-duration-presets"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 text-stone-800 font-bold"
                aria-label={language === 'id' ? 'Durasi (menit)' : 'Duration (minutes)'}
              />
              <datalist id="session-duration-presets">
                <option value="45" />
                <option value="60" />
                <option value="90" />
                <option value="120" />
                <option value="180" />
              </datalist>
              <p className="text-[10px] text-stone-400 mt-1">{language === 'id' ? 'menit' : 'minutes'}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-teal-700" />
                {language === 'id' ? 'Tarif per Jam' : 'Hourly Rate'}
              </label>
              <input
                type="number"
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                placeholder={`Default: ${effectiveHourlyRate}`}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 text-stone-800 font-mono"
              />
            </div>
          </div>

          {/* Calculated Earnings Preview */}
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-900">
              {language === 'id' ? 'Estimasi Honor Sesi:' : 'Calculated Session Honorarium:'}
            </span>
            <span className="font-black text-sm text-emerald-900 font-mono">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: teacher.currency, maximumFractionDigits: 0 }).format(calculatedTotal)}
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'id' ? 'Catatan / Materi yang Disampaikan' : 'Session Notes'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === 'id' ? 'mis. Review Unit 4, Persiapan Ujian Tengah Semester...' : 'e.g. Unit 4 Review, Midterm Preparation...'}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 text-stone-800"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
            >
              {language === 'id' ? 'Batal' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'id' ? 'Simpan Sesi' : 'Save Session'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
