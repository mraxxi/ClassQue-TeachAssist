import React from 'react';
import { Play, MapPin, Award, BookMarked, Sparkles } from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useTranslation } from '../../utils/i18n';

export const NextClassCard: React.FC = () => {
  const { cohorts, startLiveSession, language, lessonPlans, isLiveCockpitOpen } = useTeacherStore();
  const t = useTranslation(language);

  // Pick upcoming cohort
  const nextCohort = cohorts[0] || null;
  const linkedLesson = lessonPlans.find((lp) => lp.cohortId === nextCohort?.id) || lessonPlans[0];

  if (!nextCohort) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs text-center">
        <p className="text-sm text-stone-500">No scheduled cohorts found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-extrabold tracking-wider text-stone-500 uppercase flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping"></span>
          {t.cockpit.nextClass}
        </span>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
          <Award className="w-3.5 h-3.5 text-amber-600" />
          CEFR {nextCohort.cefrLevel}
        </span>
      </div>

      {/* Class Name & Time */}
      <div className="mb-4">
        <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
          {nextCohort.name}
        </h2>
        <div className="flex items-center gap-3 text-stone-600 text-sm mt-1 font-medium">
          <span className="text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
            {nextCohort.startTime} - 15:30
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-stone-400" />
            {nextCohort.roomOrLink}
          </span>
        </div>
      </div>

      {/* Linked Lesson Plan Preview */}
      {linkedLesson && (
        <div className="bg-stone-50/90 rounded-xl p-3 border border-stone-200/80 mb-5">
          <div className="flex items-center justify-between text-xs text-stone-500 font-semibold mb-1">
            <span className="flex items-center gap-1 text-teal-800">
              <BookMarked className="w-3.5 h-3.5" />
              {language === 'id' ? 'RPP Terhubung' : 'Linked Lesson Plan'}
            </span>
            <span>{linkedLesson.durationMinutes} min</span>
          </div>
          <p className="text-xs font-bold text-stone-800 truncate">{linkedLesson.title}</p>
          <p className="text-[11px] text-stone-500 truncate mt-0.5">{linkedLesson.topic}</p>
        </div>
      )}

      {/* Big 1-Click Launch Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => startLiveSession(nextCohort.id)}
          className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-teal-800 to-teal-700 hover:from-teal-900 hover:to-teal-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{isLiveCockpitOpen ? t.cockpit.liveRunning : t.cockpit.launchLive}</span>
          <span className="text-teal-200 text-xs font-normal">⏱️</span>
        </button>

        <button 
          onClick={() => useTeacherStore.getState().addToast('AI Assistant feature is coming in Phase 3!', 'info')}
          title="Classroom AI Assistant / Prompt"
          className="p-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-teal-700" />
        </button>
      </div>

    </div>
  );
};
