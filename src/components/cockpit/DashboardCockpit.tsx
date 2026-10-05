import React from 'react';
import { Clock, Users, CheckSquare, Receipt } from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useTranslation } from '../../utils/i18n';
import { CockpitGreeting } from './CockpitGreeting';
import { OnboardingChecklist } from './OnboardingChecklist';
import { NextClassCard } from './NextClassCard';
import { RollCallQuickCard } from './RollCallQuickCard';
import { ScheduleTimeline } from './ScheduleTimeline';
import { UrgentTasksCard } from './UrgentTasksCard';
import { LiveCockpitModal } from './LiveCockpitModal';
import { useCockpitCohort } from '../../hooks/useCockpitCohort';
import { formatRelative, localDateStr, localMonthStr } from '../../utils/date';

export const DashboardCockpit: React.FC = () => {
  const { language, tasks, sessions, teacher, isStopwatchRunning } = useTeacherStore();
  const t = useTranslation(language);

  const { slots, next, now } = useCockpitCohort();
  const todayDate = localDateStr(now);
  const currentMonth = localMonthStr(now); // e.g. "2026-09"

  // 1. Today's completed teaching time
  const todayMinutes = sessions
    .filter((s) => s.sessionDate === todayDate && s.status === 'completed')
    .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const todayHoursFormatted = todayMinutes < 60 ? `${todayMinutes} min` : `${(todayMinutes / 60).toFixed(1)} hrs`;

  // 2. Next class: live now, else the next one today (with countdown), else none
  const nextClassStatus = isStopwatchRunning || next?.status === 'live'
    ? (language === 'id' ? 'Sedang Berlangsung' : 'Live Now')
    : next
    ? `${next.startTime} (${next.cohort.cefrLevel}) • ${formatRelative(next.start.toISOString(), language, now)}`
    : slots.length > 0
    ? (language === 'id' ? 'Selesai Hari Ini' : 'Done for Today')
    : (language === 'id' ? 'Tidak Ada Hari Ini' : 'None Today');

  // 3. Pending tasks count
  const pendingTasksCount = tasks.filter((tk) => !tk.isCompleted).length;

  // 4. Monthly claim: sum of this month's completed Teaching Sessions (no placeholder amounts)
  const monthlyClaimSum = sessions
    .filter((s) => s.sessionDate.startsWith(currentMonth) && s.status === 'completed')
    .reduce((acc, s) => acc + (s.totalClaimAmount || 0), 0);
  const claimFormatted = new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency: teacher.currency || 'IDR',
    maximumFractionDigits: 0,
  }).format(monthlyClaimSum);

  const kpis = [
    {
      label: t.kpi.todayHours,
      value: todayHoursFormatted,
      icon: Clock,
      color: 'text-teal-700 bg-teal-50 border-teal-200',
    },
    {
      label: t.kpi.nextClassIn,
      value: nextClassStatus,
      icon: Users,
      color: 'text-sky-700 bg-sky-50 border-sky-200',
    },
    {
      label: t.kpi.pendingTasks,
      value: `${pendingTasksCount}`,
      icon: CheckSquare,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      label: t.kpi.monthlyClaim,
      value: claimFormatted,
      icon: Receipt,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Greeting + what happens next (the live clock is in the header; phones get a compact one here) */}
      <CockpitGreeting />

      {/* First-run guide (hidden once a cohort and a student exist) */}
      <OnboardingChecklist />

      {/* 4 Pulse KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-3xl p-3.5 sm:p-5 border border-stone-200/90 shadow-2xs flex items-center justify-between gap-2 transition-all hover:shadow-xs min-w-0"
            >
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                  {kpi.label}
                </span>
                <span className="text-base sm:text-2xl font-black text-stone-900 mt-0.5 sm:mt-1 block tracking-tight break-words">
                  {kpi.value}
                </span>
              </div>
              <div className={`hidden sm:block p-3 rounded-2xl border shrink-0 ${kpi.color}`} aria-hidden="true">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3-Zone Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 Cols): Next Class + Quick Roll-Call */}
        <div className="lg:col-span-7 space-y-6">
          <NextClassCard />
          <RollCallQuickCard />
        </div>

        {/* Right Column (5 Cols): Timeline + Urgent Tasks */}
        <div className="lg:col-span-5 space-y-6">
          <ScheduleTimeline />
          <UrgentTasksCard />
        </div>

      </div>

      {/* Live In-Class Full-Screen Modal */}
      <LiveCockpitModal />
    </div>
  );
};
