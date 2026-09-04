import React from 'react';
import { Clock, Users, CheckSquare, Receipt } from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useTranslation } from '../../utils/i18n';
import { NextClassCard } from './NextClassCard';
import { RollCallQuickCard } from './RollCallQuickCard';
import { ScheduleTimeline } from './ScheduleTimeline';
import { UrgentTasksCard } from './UrgentTasksCard';
import { LiveCockpitModal } from './LiveCockpitModal';

export const DashboardCockpit: React.FC = () => {
  const { language, tasks, claims } = useTeacherStore();
  const t = useTranslation(language);

  const pendingTasksCount = tasks.filter((t) => !t.isCompleted).length;
  const currentClaim = claims[0];
  const claimFormatted = currentClaim
    ? new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
        style: 'currency',
        currency: currentClaim.currency || 'IDR',
        maximumFractionDigits: 0,
      }).format(currentClaim.totalClaimAmount)
    : 'Rp 0';

  const kpis = [
    {
      label: t.kpi.todayHours,
      value: '6.0 hrs',
      icon: Clock,
      color: 'text-teal-700 bg-teal-50 border-teal-200',
    },
    {
      label: t.kpi.nextClassIn,
      value: '1 hr 12 mins',
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
      
      {/* 4 Pulse KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs flex items-center justify-between transition-all hover:shadow-xs"
            >
              <div>
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                  {kpi.label}
                </span>
                <span className="text-xl sm:text-2xl font-black text-stone-900 mt-1 block">
                  {kpi.value}
                </span>
              </div>
              <div className={`p-2.5 rounded-xl border ${kpi.color}`}>
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
