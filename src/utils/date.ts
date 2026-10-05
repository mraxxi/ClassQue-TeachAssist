/**
 * Local-time date helpers.
 *
 * Never use `toISOString().split('T')[0]` for "today": it returns the UTC date, which is
 * yesterday for a teacher in WIB (UTC+7) before 07:00.
 */
import type { Language } from '../types';

export const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const pad = (n: number) => String(n).padStart(2, '0');

/** `YYYY-MM-DD` in the user's local timezone. */
export const localDateStr = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** `YYYY-MM` in the user's local timezone. */
export const localMonthStr = (d: Date = new Date()): string => localDateStr(d).slice(0, 7);

/** `HH:mm` in the user's local timezone. */
export const localTimeStr = (d: Date = new Date()): string => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Day key (`Mon`…`Sun`) matching `Cohort.scheduleDays`. */
export const dayKeyOf = (d: Date = new Date()): string => DAY_KEYS[d.getDay()];

/** Parse `YYYY-MM-DD` (+ optional `HH:mm`) as a LOCAL date. */
export const parseLocal = (dateStr: string, time = '00:00'): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
};

/** `dateStr` shifted by `days` (local calendar arithmetic). */
export const addDaysStr = (dateStr: string, days: number): string => {
  const d = parseLocal(dateStr);
  d.setDate(d.getDate() + days);
  return localDateStr(d);
};

export const timeToMinutes = (time: string): number => {
  const [h, m] = (time || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const addMinutesToTime = (time: string, minutes: number): string => {
  const total = (timeToMinutes(time) + minutes) % (24 * 60);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

/** Short relative time, e.g. `15m ago` / `in 2h` / `15m lalu` / `dalam 2 jam`. */
export const formatRelative = (iso: string, language: Language, now: Date = new Date()): string => {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const diffMin = Math.round((t - now.getTime()) / 60000);
  const abs = Math.abs(diffMin);
  const unit =
    abs < 1 ? null
    : abs < 60 ? { v: abs, id: 'mnt', en: 'm' }
    : abs < 60 * 24 ? { v: Math.round(abs / 60), id: 'jam', en: 'h' }
    : { v: Math.round(abs / (60 * 24)), id: 'hari', en: 'd' };
  if (!unit) return language === 'id' ? 'sekarang' : 'now';
  if (language === 'id') return diffMin < 0 ? `${unit.v} ${unit.id} lalu` : `dalam ${unit.v} ${unit.id}`;
  return diffMin < 0 ? `${unit.v}${unit.en} ago` : `in ${unit.v}${unit.en}`;
};
