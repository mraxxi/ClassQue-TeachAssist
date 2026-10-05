import React from 'react';
import { Play, MapPin, Award, BookMarked, Sparkles, ChevronDown } from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useTranslation } from '../../utils/i18n';
import { useCockpitCohort } from '../../hooks/useCockpitCohort';
import { formatRelative } from '../../utils/date';

export const NextClassCard: React.FC = () => {
  const { cohorts, startLiveSession, language, lessonPlans, activeSessionCohortId, addToast } = useTeacherStore();
  const t = useTranslation(language);

  const { setCockpitCohortId } = useTeacherStore();
  const { active: activeCohort, activeSlot, now } = useCockpitCohort();

  const sessionRunning = !!activeSessionCohortId;
  const runningElsewhere = sessionRunning && activeSessionCohortId !== activeCohort?.id;

  /** Starting a different class would discard the running one, so ask first. */
  const handleLaunch = () => {
    if (!activeCohort) return;
    if (runningElsewhere && !window.confirm(language === 'id'
      ? 'Kelas lain sedang berlangsung. Ganti dengan kelas ini? (Sesi yang berjalan akan dibuang.)'
      : 'Another class is in progress. Switch to this one? (The running session will be discarded.)')) return;
    startLiveSession(activeCohort.id);
  };

  const linkedLesson =
    lessonPlans.find((lp) => lp.cohortId === activeCohort?.id) || lessonPlans.find((lp) => !lp.cohortId);

  if (!activeCohort) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs text-center">
        <p className="text-sm text-stone-500">
          {language === 'id' ? 'Belum ada rombel. Buat rombel di Kelas & Siswa.' : 'No cohorts found. Create a cohort in Classes & Students.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs relative overflow-hidden transition-all hover:shadow-md space-y-4">
      
      {/* Top Banner Tag & Cohort Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black tracking-wider text-teal-800 uppercase flex items-center gap-1.5 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping"></span>
            {t.cockpit.nextClass}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            CEFR {activeCohort.cefrLevel}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200" data-testid="next-class-status">
            {!activeSlot
              ? (language === 'id' ? 'Tidak dijadwalkan hari ini' : 'Not scheduled today')
              : activeSlot.status === 'live'
              ? (language === 'id' ? 'Sedang berlangsung' : 'In progress')
              : activeSlot.status === 'completed'
              ? (language === 'id' ? 'Selesai hari ini' : 'Done today')
              : activeSlot.status === 'missed'
              ? (language === 'id' ? 'Terlewat hari ini' : 'Missed today')
              : (language === 'id' ? 'Mulai ' : 'Starts ') + formatRelative(activeSlot.start.toISOString(), language, now)}
          </span>
        </div>

        {/* Cohort Quick Switcher */}
        {cohorts.length > 1 && (
          <div className="relative">
            <select
              value={activeCohort.id}
              onChange={(e) => setCockpitCohortId(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-700 cursor-pointer"
            >
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.startTime || '—'})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-2 top-2 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Class Name & Time */}
      <div>
        <h2 className="text-2xl font-black text-stone-900 tracking-tight">
          {activeCohort.name}
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-stone-600 text-xs mt-1.5 font-medium">
          <span className="text-teal-900 font-bold bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100 font-mono">
            {activeCohort.startTime || '—'} - {activeCohort.durationMinutes || 60}m
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-stone-400" />
            {activeCohort.roomOrLink || '—'}
          </span>
          <span>•</span>
          <span className="text-stone-400">
            {activeCohort.scheduleDays?.join(', ') || '—'}
          </span>
        </div>
      </div>

      {/* Linked Lesson Plan Preview */}
      {linkedLesson && (
        <div className="bg-stone-50/90 rounded-2xl p-3.5 border border-stone-200/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
            <span className="flex items-center gap-1.5 text-teal-800 font-bold">
              <BookMarked className="w-3.5 h-3.5" />
              {language === 'id' ? 'RPP Terhubung' : 'Linked Lesson Plan'}
            </span>
            <span className="font-mono text-[11px]">{linkedLesson.durationMinutes} min</span>
          </div>
          <p className="text-xs font-extrabold text-stone-800 truncate">{linkedLesson.title}</p>
          <p className="text-[11px] text-stone-500 truncate">{linkedLesson.topic || 'General Lesson'}</p>
        </div>
      )}

      {/* Big 1-Click Launch Button */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleLaunch}
          className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-teal-800 to-teal-700 hover:from-teal-900 hover:to-teal-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{sessionRunning && !runningElsewhere ? t.cockpit.liveRunning : t.cockpit.launchLive}</span>
          <span className="text-teal-200 text-xs font-normal">⏱️</span>
        </button>

        <button 
          onClick={() => addToast(
            language === 'id' 
              ? '💡 Tips Pedagogi: Awali kelas dengan apersepsi 5 menit untuk membangkitkan fokus siswa!' 
              : '💡 Pedagogical Prompt: Start with a 5-min warm-up flashcard drill to activate student schema!',
            'info'
          )}
          title="Classroom Pedagogical Prompt / Tip"
          className="p-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-teal-700" />
        </button>
      </div>

    </div>
  );
};
