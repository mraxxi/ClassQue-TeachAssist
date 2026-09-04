import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useTranslation } from '../../utils/i18n';

export const ScheduleTimeline: React.FC = () => {
  const { language } = useTeacherStore();
  const t = useTranslation(language);

  const scheduleItems = [
    {
      time: '13:15 - 14:15',
      title: 'Cambridge Starters A1',
      room: 'Room 102',
      status: 'completed',
      statusLabel: t.cockpit.completed,
    },
    {
      time: '14:30 - 15:30',
      title: 'Cambridge Flyers A2',
      room: 'Room 204',
      status: 'upcoming',
      statusLabel: t.cockpit.upcoming,
    },
    {
      time: '15:45 - 16:45',
      title: 'Teacher Planning & Prep',
      room: 'Staff Room',
      status: 'later',
      statusLabel: t.cockpit.later,
    },
    {
      time: '17:00 - 18:30',
      title: 'IELTS Intensive Prep',
      room: 'Virtual Lab (Meet)',
      status: 'later',
      statusLabel: t.cockpit.later,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-700" />
          {t.cockpit.scheduleTimeline}
        </h3>
        <span className="text-xs font-semibold text-stone-500">13:15 – 18:30</span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
        {scheduleItems.map((item, idx) => {
          const isCompleted = item.status === 'completed';
          const isUpcoming = item.status === 'upcoming';

          return (
            <div key={idx} className="relative group">
              {/* Dot indicator */}
              <div
                className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
                  isCompleted
                    ? 'bg-emerald-500 ring-emerald-200'
                    : isUpcoming
                    ? 'bg-teal-700 ring-teal-200 scale-110'
                    : 'bg-stone-300 ring-stone-100'
                }`}
              />

              {/* Card item */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  isUpcoming
                    ? 'bg-teal-50/60 border-teal-200 shadow-xs'
                    : 'bg-stone-50/60 border-stone-200/70 hover:bg-stone-100/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-stone-900 truncate">{item.title}</span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : isUpcoming
                        ? 'bg-teal-100 text-teal-900 border border-teal-300'
                        : 'bg-stone-200/80 text-stone-600'
                    }`}
                  >
                    {item.statusLabel}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-1">
                  <span>{item.time}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    {item.room}
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
