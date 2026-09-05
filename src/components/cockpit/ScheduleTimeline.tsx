import { Clock, MapPin, Play } from 'lucide-react';
import { useTeacherStore } from '../../store/facade';
import { useTranslation } from '../../utils/i18n';

export const ScheduleTimeline: React.FC = () => {
  const { cohorts, sessions, startLiveSession, language } = useTeacherStore();
  const t = useTranslation(language);

  const todayDate = new Date().toISOString().split('T')[0];
  const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDayName = daysMap[new Date().getDay()];

  // Find cohorts scheduled for today (or all active cohorts as fallback)
  const todayCohorts = cohorts.filter((c) => c.scheduleDays?.includes(todayDayName));
  const displayCohorts = todayCohorts.length > 0 ? todayCohorts : cohorts;

  // Completed sessions for today
  const todaySessions = sessions.filter((s) => s.sessionDate === todayDate && s.status === 'completed');

  return (
    <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-700" />
          {t.cockpit.scheduleTimeline}
        </h3>
        <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-100 font-mono">
          {todayDayName}, {todayDate}
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
        {displayCohorts.map((cohort, idx) => {
          const isCompleted = todaySessions.some((s) => s.cohortId === cohort.id);
          const isFirstUpcoming = !isCompleted && idx === 0;

          return (
            <div key={cohort.id} className="relative group">
              {/* Dot indicator */}
              <div
                className={`absolute -left-6 top-2 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 transition-all ${
                  isCompleted
                    ? 'bg-emerald-500 ring-emerald-200'
                    : isFirstUpcoming
                    ? 'bg-teal-700 ring-teal-200 scale-110'
                    : 'bg-stone-300 ring-stone-100'
                }`}
              />

              {/* Card item */}
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  isFirstUpcoming
                    ? 'bg-teal-50/70 border-teal-200 shadow-2xs'
                    : isCompleted
                    ? 'bg-emerald-50/40 border-emerald-200/70'
                    : 'bg-stone-50/60 border-stone-200/70 hover:bg-stone-100/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-bold text-stone-900 truncate">{cohort.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-stone-200/80 text-stone-700 shrink-0">
                      {cohort.cefrLevel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : isFirstUpcoming
                          ? 'bg-teal-800 text-white shadow-2xs'
                          : 'bg-stone-200/80 text-stone-600'
                      }`}
                    >
                      {isCompleted
                        ? (language === 'id' ? 'SELESAI' : 'COMPLETED')
                        : isFirstUpcoming
                        ? (language === 'id' ? 'BERIKUTNYA' : 'UPCOMING')
                        : (language === 'id' ? 'NANTI' : 'LATER')}
                    </span>

                    {!isCompleted && (
                      <button
                        onClick={() => startLiveSession(cohort.id)}
                        className="p-1 rounded-lg bg-teal-800 hover:bg-teal-900 text-white transition-colors cursor-pointer"
                        title="Start this class"
                      >
                        <Play className="w-3 h-3 fill-white" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-1 font-medium">
                  <span className="font-mono text-stone-700">{cohort.startTime || '14:00'} ({cohort.durationMinutes || 60}m)</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                    <span className="truncate">{cohort.roomOrLink || 'Room 101'}</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
