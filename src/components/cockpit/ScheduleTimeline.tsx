import React from 'react';
import { Clock, MapPin, Play } from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useTranslation } from '../../utils/i18n';
import { useCockpitCohort } from '../../hooks/useCockpitCohort';
import { dayKeyOf, localDateStr } from '../../utils/date';
import type { SlotStatus } from '../../utils/schedule';

const STATUS_LABEL: Record<SlotStatus, { id: string; en: string; chip: string; card: string; dot: string }> = {
  completed: { id: 'SELESAI', en: 'COMPLETED', chip: 'bg-emerald-100 text-emerald-800', card: 'bg-emerald-50/40 border-emerald-200/70', dot: 'bg-emerald-500 ring-emerald-200' },
  live: { id: 'BERLANGSUNG', en: 'LIVE NOW', chip: 'bg-rose-700 text-white shadow-2xs', card: 'bg-rose-50/60 border-rose-200', dot: 'bg-rose-500 ring-rose-200 scale-110' },
  upcoming: { id: 'BERIKUTNYA', en: 'UPCOMING', chip: 'bg-teal-800 text-white shadow-2xs', card: 'bg-teal-50/70 border-teal-200 shadow-2xs', dot: 'bg-teal-700 ring-teal-200 scale-110' },
  later: { id: 'NANTI', en: 'LATER', chip: 'bg-stone-200/80 text-stone-600', card: 'bg-stone-50/60 border-stone-200/70 hover:bg-stone-100/70', dot: 'bg-stone-300 ring-stone-100' },
  missed: { id: 'TERLEWAT', en: 'MISSED', chip: 'bg-amber-100 text-amber-800', card: 'bg-amber-50/50 border-amber-200/70', dot: 'bg-amber-400 ring-amber-100' },
};

export const ScheduleTimeline: React.FC = () => {
  const { startLiveSession, activeSessionCohortId, language } = useTeacherStore();

  const handleStart = (cohortId: string) => {
    if (activeSessionCohortId && activeSessionCohortId !== cohortId && !window.confirm(language === 'id'
      ? 'Kelas lain sedang berlangsung. Ganti dengan kelas ini? (Sesi yang berjalan akan dibuang.)'
      : 'Another class is in progress. Switch to this one? (The running session will be discarded.)')) return;
    startLiveSession(cohortId);
  };
  const t = useTranslation(language);
  const { slots, now } = useCockpitCohort();

  return (
    <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-700" />
          {t.cockpit.scheduleTimeline}
        </h3>
        <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-100 font-mono">
          {dayKeyOf(now)}, {localDateStr(now)}
        </span>
      </div>

      {slots.length === 0 ? (
        <p className="text-xs text-stone-500 py-4 text-center" data-testid="timeline-empty">
          {language === 'id' ? 'Tidak ada kelas terjadwal hari ini.' : 'No classes scheduled today.'}
        </p>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
          {slots.map((slot) => {
            const cfg = STATUS_LABEL[slot.status];
            return (
              <div key={slot.cohort.id} className="relative group" data-testid={`slot-${slot.status}`}>
                <div className={`absolute -left-6 top-2 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 transition-all ${cfg.dot}`} />
                <div className={`p-3.5 rounded-2xl border transition-all ${cfg.card}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-stone-900 truncate">{slot.cohort.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-stone-200/80 text-stone-700 shrink-0">
                        {slot.cohort.cefrLevel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${cfg.chip}`}>
                        {language === 'id' ? cfg.id : cfg.en}
                      </span>
                      {slot.status !== 'completed' && (
                        <button
                          onClick={() => handleStart(slot.cohort.id)}
                          className="p-1 rounded-lg bg-teal-800 hover:bg-teal-900 text-white transition-colors cursor-pointer"
                          title={language === 'id' ? 'Mulai kelas ini' : 'Start this class'}
                        >
                          <Play className="w-3 h-3 fill-white" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-1 font-medium">
                    <span className="font-mono text-stone-700">
                      {slot.startTime} – {slot.endTime} ({slot.cohort.durationMinutes || 60}m)
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="truncate">{slot.cohort.roomOrLink || '—'}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
