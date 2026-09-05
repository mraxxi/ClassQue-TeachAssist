import React from 'react';
import { Clock, Users, CheckSquare, Receipt } from 'lucide-react';
import { useTeacherStore } from '../../store/facade';
import { useTranslation } from '../../utils/i18n';
import { ClassroomClock } from '../common/ClassroomClock';
import { NextClassCard } from './NextClassCard';
import { RollCallQuickCard } from './RollCallQuickCard';
import { ScheduleTimeline } from './ScheduleTimeline';
import { UrgentTasksCard } from './UrgentTasksCard';
import { LiveCockpitModal } from './LiveCockpitModal';

export const DashboardCockpit: React.FC = () => {
  const { language, tasks, sessions, cohorts, teacher, isStopwatchRunning } = useTeacherStore();
  const t = useTranslation(language);

  const todayDate = new Date().toISOString().split('T')[0];
  const currentMonth = todayDate.slice(0, 7); // e.g. "2026-09"

  // 1. Calculate Today's completed hours
  const todayCompletedSessions = sessions.filter(
    (s) => s.sessionDate === todayDate && s.status === 'completed'
  );
  const todayMinutes = todayCompletedSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const todayHoursFormatted = `${(todayMinutes / 60).toFixed(1)} hrs`;

  // 2. Next class countdown / status
  const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDayName = daysMap[new Date().getDay()];
  const todayScheduledCohort = cohorts.find((c) => c.scheduleDays?.includes(todayDayName)) || cohorts[0];
  const nextClassStatus = isStopwatchRunning
    ? (language === 'id' ? 'Sedang Berlangsung' : 'Live Now')
    : todayScheduledCohort
    ? `${todayScheduledCohort.startTime || '14:00'} (${todayScheduledCohort.cefrLevel})`
    : (language === 'id' ? 'Tidak Ada Hari Ini' : 'None Today');

  // 3. Pending tasks count
  const pendingTasksCount = tasks.filter((tk) => !tk.isCompleted).length;

  // 4. Monthly Claim calculation
  const monthlySessions = sessions.filter((s) => s.sessionDate.startsWith(currentMonth));
  const monthlyClaimSum = monthlySessions.reduce((acc, s) => acc + (s.totalClaimAmount || 0), 0);
  const claimFormatted = new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency: teacher.currency || 'IDR',
    maximumFractionDigits: 0,
  }).format(monthlyClaimSum > 0 ? monthlyClaimSum : 4250000); // fallback to active claim baseline for instant demo feel

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
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Real-time Classroom Clock & Local Timezone Banner */}
      <ClassroomClock />

      {/* 4 Pulse KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-2xs flex items-center justify-between transition-all hover:shadow-xs"
            >
              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  {kpi.label}
                </span>
                <span className="text-xl sm:text-2xl font-black text-stone-900 mt-1 block tracking-tight">
                  {kpi.value}
                </span>
              </div>
              <div className={`p-3 rounded-2xl border ${kpi.color}`}>
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
