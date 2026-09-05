import React, { useState, useEffect } from 'react';
import { Clock, Globe } from 'lucide-react';
import { useTeacherStore } from '../../store/facade';

interface ClassroomClockProps {
  compact?: boolean;
  className?: string;
}

export const ClassroomClock: React.FC<ClassroomClockProps> = ({ compact = false, className = '' }) => {
  const { language } = useTeacherStore();
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Time (HH:mm:ss)
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // Timezone resolution
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const offsetMinutes = -now.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const gmtString = `GMT${sign}${offsetHours}`;

  // Friendly regional label mapping (especially helpful for Indonesian and regional educators)
  let tzAbbr = gmtString;
  if (timeZone.includes('Jakarta') || timeZone.includes('Pontianak') || offsetMinutes === 420) {
    tzAbbr = 'WIB (GMT+7)';
  } else if (timeZone.includes('Makassar') || timeZone.includes('Bali') || offsetMinutes === 480) {
    tzAbbr = 'WITA (GMT+8)';
  } else if (timeZone.includes('Jayapura') || offsetMinutes === 540) {
    tzAbbr = 'WIT (GMT+9)';
  } else {
    const city = timeZone.split('/').pop()?.replace(/_/g, ' ') || timeZone;
    tzAbbr = `${city} (${gmtString})`;
  }

  // Localized date formatting
  const formattedDate = new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
    weekday: compact ? 'short' : 'long',
    day: 'numeric',
    month: compact ? 'short' : 'long',
    year: 'numeric',
  }).format(now);

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg bg-stone-100/90 border border-stone-200 text-stone-700 select-none ${className}`}>
        <Clock className="w-3.5 h-3.5 text-teal-700 animate-pulse" />
        <span className="font-mono font-bold text-xs tracking-tight text-stone-900">
          {hours}:{minutes}:{seconds}
        </span>
        <span className="text-[10px] font-medium text-stone-500 border-l border-stone-300 pl-1.5">
          {tzAbbr.split(' ')[0]}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-teal-900 via-stone-900 to-teal-950 text-white shadow-md border border-teal-800/40 select-none ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-800/80 border border-teal-700/50 flex items-center justify-center text-teal-200 shadow-inner">
          <Clock className="w-5 h-5 text-teal-300" />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-xs">
              {hours}:{minutes}
              <span className="text-teal-300/80 text-lg sm:text-xl font-medium">:{seconds}</span>
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-teal-950/80 border border-teal-700/40 text-[11px] text-teal-200 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>{tzAbbr}</span>
            </div>
          </div>
          <p className="text-xs text-stone-300 font-medium capitalize mt-0.5">
            {formattedDate}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto text-[11px] text-stone-300/80 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
        <Globe className="w-3.5 h-3.5 text-teal-300 shrink-0" />
        <span className="truncate max-w-[200px]" title={timeZone}>
          {timeZone}
        </span>
      </div>
    </div>
  );
};
