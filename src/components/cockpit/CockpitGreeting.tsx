import React from 'react';
import { CalendarClock, CheckCircle2, Coffee, Radio } from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useCockpitCohort } from '../../hooks/useCockpitCohort';
import { ClassroomClock } from '../common/ClassroomClock';
import { formatRelative } from '../../utils/date';

/** "Ms. Sarah Jenkins" -> "Ms. Sarah"; "Pak Budi Santoso" -> "Pak Budi". */
export const firstName = (full: string): string => {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '';
  return /^(ms|mr|mrs|dr|bu|pak|ibu|bapak)\.?$/i.test(parts[0]) && parts[1] ? `${parts[0]} ${parts[1]}` : parts[0];
};

/**
 * Top of the Cockpit: a greeting plus ONE sentence about what happens next, instead of a second big clock
 * (the live clock lives in the header; phones get a compact one here). Keeps the primary action in the first
 * screen on small devices.
 */
export const CockpitGreeting: React.FC = () => {
  const { language, teacher } = useTeacherStore();
  const { slots, next, now } = useCockpitCohort();
  const id = language === 'id';
  const h = now.getHours();
  const hello = id
    ? h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'
    : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const date = new Intl.DateTimeFormat(id ? 'id-ID' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(now);

  let Icon = Coffee;
  let tone = 'bg-stone-100 text-stone-700';
  let sentence: string;
  if (next?.status === 'live') {
    Icon = Radio; tone = 'bg-rose-100 text-rose-800';
    sentence = id ? `${next.cohort.name} sedang berlangsung sampai ${next.endTime}.` : `${next.cohort.name} is in progress until ${next.endTime}.`;
  } else if (next) {
    Icon = CalendarClock; tone = 'bg-teal-100 text-teal-900';
    const when = formatRelative(next.start.toISOString(), language, now);
    sentence = id ? `Kelas berikutnya: ${next.cohort.name} pukul ${next.startTime} (${when}).` : `Next class: ${next.cohort.name} at ${next.startTime} (${when}).`;
  } else if (slots.length > 0) {
    Icon = CheckCircle2; tone = 'bg-emerald-100 text-emerald-800';
    sentence = id ? 'Semua kelas hari ini sudah selesai. Kerja bagus!' : 'All of today’s classes are done. Nice work!';
  } else {
    sentence = id ? 'Tidak ada kelas hari ini — waktu yang baik untuk menyiapkan materi.' : 'No classes today — a good time to prepare lessons.';
  }

  return (
    <section aria-label={id ? 'Ringkasan hari ini' : 'Today at a glance'} className="flex items-start justify-between gap-3" data-testid="cockpit-greeting">
      <div className="min-w-0">
        <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
          {hello}, {firstName(teacher.name)}
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 font-medium mt-0.5">{date}</p>
        <p className={`mt-2 inline-flex items-start gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold ${tone}`} data-testid="cockpit-sentence">
          <Icon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{sentence}</span>
        </p>
      </div>
      <div className="md:hidden shrink-0">
        <ClassroomClock compact />
      </div>
    </section>
  );
};
