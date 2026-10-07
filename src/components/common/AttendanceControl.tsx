import React from 'react';
import { CheckCircle2, Clock, HelpCircle, XCircle } from 'lucide-react';
import type { AttendanceStatus, Language } from '../../types';

interface Option {
  key: AttendanceStatus;
  short: string;
  id: string;
  en: string;
  Icon: React.ComponentType<{ className?: string }>;
  on: string;
}

const OPTIONS: Option[] = [
  { key: 'present', short: 'H', id: 'Hadir (H)', en: 'Present (P)', Icon: CheckCircle2, on: 'bg-emerald-700 text-white border-emerald-700' },
  { key: 'absent', short: 'A', id: 'Alpa (A)', en: 'Absent (A)', Icon: XCircle, on: 'bg-rose-700 text-white border-rose-700' },
  { key: 'late', short: 'T', id: 'Terlambat (T)', en: 'Late (L)', Icon: Clock, on: 'bg-amber-700 text-white border-amber-700' },
  { key: 'excused', short: 'I', id: 'Izin (I)', en: 'Excused (E)', Icon: HelpCircle, on: 'bg-sky-700 text-white border-sky-700' },
];

interface AttendanceControlProps {
  /** `undefined` = not recorded yet (nothing is highlighted). */
  value?: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
  language: Language;
  /** Accessible name of the group, e.g. the student's name. */
  label: string;
  /** Tighter layout for dense lists / the live cockpit. */
  dense?: boolean;
  /** Letters + icons only (narrow columns); the full word stays in the accessible name. */
  compact?: boolean;
}

/**
 * Roll-Call status picker shared by the Attendance tab, the cockpit card and the Live Cockpit.
 * - >= 44 px touch targets (36 px when `dense` on pointer devices)
 * - state is conveyed by colour AND icon AND label (never colour alone)
 * - exposed as a radio group (`aria-pressed` buttons would not announce "1 of 4")
 * - narrow screens show the letter, wide screens the full word; both stay in the accessible name
 */
export const AttendanceControl: React.FC<AttendanceControlProps> = ({ value, onChange, language, label, dense = false, compact = false }) => (
  <div role="radiogroup" aria-label={label} className="grid grid-cols-4 gap-1 sm:inline-flex sm:gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200 w-full sm:w-auto">
    {OPTIONS.map(({ key, short, id, en, Icon, on }) => {
      const selected = value === key;
      const full = language === 'id' ? id : en;
      return (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={selected}
          aria-label={`${full} — ${label}`}
          onClick={() => onChange(key)}
          className={`inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
            dense ? 'min-h-11 sm:min-h-9 px-2.5' : 'min-h-11 px-3'
          } ${selected ? `${on} shadow-xs` : 'border-transparent text-stone-700 hover:bg-stone-200 active:bg-stone-300'}`}
        >
          <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className={compact ? 'hidden' : 'hidden sm:inline'}>{full}</span>
          <span className={compact ? 'text-[11px] leading-none sm:text-xs' : 'sm:hidden text-[11px] leading-none'}>{short}</span>
        </button>
      );
    })}
  </div>
);

/** "3 / 5 recorded" with a progress bar: tells the teacher at a glance whether roll-call is finished. */
export const RollCallProgress: React.FC<{ recorded: number; total: number; language: Language }> = ({ recorded, total, language }) => {
  const pct = total > 0 ? Math.round((recorded / total) * 100) : 0;
  const complete = total > 0 && recorded === total;
  return (
    <div className="flex items-center gap-2 min-w-0" data-testid="rollcall-progress">
      <div className="h-1.5 w-20 sm:w-28 rounded-full bg-stone-200 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={recorded} aria-label={language === 'id' ? 'Presensi tercatat' : 'Roll-call recorded'}>
        <div className={`h-full rounded-full transition-all ${complete ? 'bg-emerald-700' : 'bg-teal-600'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[11px] font-bold whitespace-nowrap ${complete ? 'text-emerald-700' : 'text-stone-600'}`}>
        {recorded}/{total} {language === 'id' ? 'tercatat' : 'recorded'}
      </span>
    </div>
  );
};
