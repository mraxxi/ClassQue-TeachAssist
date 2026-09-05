import React, { useState, useEffect } from 'react';
import { X, Users, Clock, MapPin, Award, DollarSign } from 'lucide-react';
import { Cohort, CEFRLevel } from '../../types';
import { useTeacherStore } from '../../store/facade';

interface CohortModalProps {
  isOpen: boolean;
  cohortToEdit?: Cohort | null;
  onClose: () => void;
}

const CEFR_LEVELS: CEFRLevel[] = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const DAYS_OF_WEEK = [
  { key: 'Mon', label: 'Sen / Mon' },
  { key: 'Tue', label: 'Sel / Tue' },
  { key: 'Wed', label: 'Rab / Wed' },
  { key: 'Thu', label: 'Kam / Thu' },
  { key: 'Fri', label: 'Jum / Fri' },
  { key: 'Sat', label: 'Sab / Sat' },
  { key: 'Sun', label: 'Min / Sun' },
];

export const CohortModal: React.FC<CohortModalProps> = ({
  isOpen,
  cohortToEdit,
  onClose,
}) => {
  const { teacher, addCohort, updateCohort, addToast, language } = useTeacherStore();

  const [name, setName] = useState('');
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('A1');
  const [scheduleDays, setScheduleDays] = useState<string[]>(['Mon', 'Wed']);
  const [startTime, setStartTime] = useState('14:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [roomOrLink, setRoomOrLink] = useState('Room 101');
  const [hourlyRateOverride, setHourlyRateOverride] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (cohortToEdit) {
      setName(cohortToEdit.name);
      setCefrLevel(cohortToEdit.cefrLevel);
      setScheduleDays(cohortToEdit.scheduleDays || []);
      setStartTime(cohortToEdit.startTime || '14:00');
      setDurationMinutes(cohortToEdit.durationMinutes || 60);
      setRoomOrLink(cohortToEdit.roomOrLink || '');
      setHourlyRateOverride(
        cohortToEdit.hourlyRateOverride ? cohortToEdit.hourlyRateOverride.toString() : ''
      );
      setIsActive(cohortToEdit.isActive ?? true);
    } else {
      setName('');
      setCefrLevel('A1');
      setScheduleDays(['Mon', 'Wed']);
      setStartTime('14:00');
      setDurationMinutes(60);
      setRoomOrLink('Room 101');
      setHourlyRateOverride('');
      setIsActive(true);
    }
  }, [cohortToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (day: string) => {
    if (scheduleDays.includes(day)) {
      setScheduleDays(scheduleDays.filter((d) => d !== day));
    } else {
      setScheduleDays([...scheduleDays, day]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast(language === 'id' ? 'Nama kelas wajib diisi!' : 'Cohort name is required!', 'warning');
      return;
    }

    const rateOverrideNum = hourlyRateOverride.trim() ? parseFloat(hourlyRateOverride) : undefined;

    if (cohortToEdit) {
      updateCohort(cohortToEdit.id, {
        name: name.trim(),
        cefrLevel,
        scheduleDays,
        startTime,
        durationMinutes,
        roomOrLink: roomOrLink.trim(),
        hourlyRateOverride: rateOverrideNum,
        isActive,
      });
      addToast(language === 'id' ? 'Kelas berhasil diperbarui!' : 'Cohort updated successfully!', 'success');
    } else {
      const newCohort: Cohort = {
        id: `cohort-${Date.now()}`,
        teacherId: teacher.id,
        name: name.trim(),
        cefrLevel,
        scheduleDays,
        startTime,
        durationMinutes,
        roomOrLink: roomOrLink.trim() || 'Room 101',
        hourlyRateOverride: rateOverrideNum,
        isActive: true,
      };
      addCohort(newCohort);
      addToast(language === 'id' ? 'Kelas baru berhasil dibuat!' : 'New cohort created successfully!', 'success');
    }

    onClose();
  };

  const isEditing = !!cohortToEdit;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200 p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-stone-900 tracking-tight">
                {isEditing
                  ? (language === 'id' ? 'Edit Kelas / Rombel' : 'Edit Cohort')
                  : (language === 'id' ? 'Buat Kelas / Rombel Baru' : 'Create New Cohort')}
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                {language === 'id'
                  ? 'Atur nama kelas, tingkat CEFR, jadwal rutin, dan lokasi pembelajaran.'
                  : 'Set class name, CEFR level, recurring schedule, and location.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-2 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Cohort Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'id' ? 'Nama Kelas / Rombel' : 'Cohort Name'} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cambridge Flyers A2 - Saturday"
              className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800 font-medium"
            />
          </div>

          {/* CEFR Level & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-teal-700" />
                {language === 'id' ? 'Target Tingkat CEFR' : 'Target CEFR Level'}
              </label>
              <select
                value={cefrLevel}
                onChange={(e) => setCefrLevel(e.target.value as CEFRLevel)}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800 font-bold"
              >
                {CEFR_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    CEFR {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-700" />
                {language === 'id' ? 'Durasi Sesi (Menit)' : 'Duration (Minutes)'}
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800 font-medium"
              >
                <option value={45}>45 Menit / Mins</option>
                <option value={60}>60 Menit / Mins (1 Jam)</option>
                <option value={90}>90 Menit / Mins (1.5 Jam)</option>
                <option value={120}>120 Menit / Mins (2 Jam)</option>
              </select>
            </div>
          </div>

          {/* Schedule Days Multi-Select */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              {language === 'id' ? 'Hari Pembelajaran Rutin' : 'Recurring Schedule Days'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = scheduleDays.includes(d.key);
                return (
                  <button
                    type="button"
                    key={d.key}
                    onClick={() => toggleDay(d.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-800 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Time & Location/Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'id' ? 'Jam Mulai' : 'Start Time'}
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-700" />
                {language === 'id' ? 'Ruang / Tautan Online' : 'Room / Virtual Link'}
              </label>
              <input
                type="text"
                value={roomOrLink}
                onChange={(e) => setRoomOrLink(e.target.value)}
                placeholder="e.g. Room 204 or https://meet.google.com/..."
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800"
              />
            </div>
          </div>

          {/* Hourly Rate Override */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-teal-700" />
              {language === 'id'
                ? 'Tarif Honor Khusus Kelas Ini (Opsional)'
                : 'Custom Hourly Rate for this Cohort (Optional)'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={hourlyRateOverride}
                onChange={(e) => setHourlyRateOverride(e.target.value)}
                placeholder={`Default: ${new Intl.NumberFormat('id-ID').format(teacher.defaultHourlyRate)} ${teacher.currency}`}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800 font-mono"
              />
              <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-2 rounded-xl border border-stone-200">
                {teacher.currency}
              </span>
            </div>
            <p className="text-[10px] text-stone-400 mt-1">
              {language === 'id'
                ? 'Kosongkan jika menggunakan tarif standar profil guru.'
                : 'Leave blank to use default teacher hourly rate.'}
            </p>
          </div>

          {/* Active Status Toggle (Edit mode only) */}
          {isEditing && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="cohortActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-teal-700 focus:ring-teal-700"
              />
              <label htmlFor="cohortActive" className="text-xs font-bold text-stone-700 cursor-pointer">
                {language === 'id' ? 'Status Kelas Aktif' : 'Cohort is Active'}
              </label>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
            >
              {language === 'id' ? 'Batal' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              {isEditing
                ? (language === 'id' ? 'Simpan Perubahan' : 'Save Changes')
                : (language === 'id' ? 'Buat Kelas' : 'Create Cohort')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
