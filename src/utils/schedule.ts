/**
 * Schedule helpers shared by the cockpit, task deadlines and notifications.
 * All maths is local-time based (see utils/date.ts).
 */
import type { Cohort, TeachingSession } from '../types';
import { addDaysStr, addMinutesToTime, dayKeyOf, localDateStr, parseLocal, timeToMinutes } from './date';

export type SlotStatus = 'completed' | 'live' | 'upcoming' | 'later' | 'missed';

export interface TodaySlot {
  cohort: Cohort;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  start: Date;
  end: Date;
  status: SlotStatus;
}

/**
 * Today's scheduled classes, sorted by start time.
 *  - completed: a completed Teaching Session exists for the cohort today
 *  - live:      now is within [start, end)
 *  - upcoming:  the next class that has not started yet
 *  - later:     further upcoming classes
 *  - missed:    ended without a completed Teaching Session
 */
export function getTodaySlots(cohorts: Cohort[], sessions: TeachingSession[], now: Date = new Date()): TodaySlot[] {
  const today = localDateStr(now);
  const dayKey = dayKeyOf(now);
  const slots: TodaySlot[] = cohorts
    .filter((c) => c.isActive !== false && c.scheduleDays?.includes(dayKey))
    .map((cohort) => {
      const startTime = cohort.startTime || '00:00';
      const endTime = addMinutesToTime(startTime, cohort.durationMinutes || 60);
      const start = parseLocal(today, startTime);
      const end = new Date(start.getTime() + (cohort.durationMinutes || 60) * 60000);
      return { cohort, startTime, endTime, start, end, status: 'later' as SlotStatus };
    })
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  let upcomingAssigned = false;
  for (const slot of slots) {
    const done = sessions.some((s) => s.sessionDate === today && s.cohortId === slot.cohort.id && s.status === 'completed');
    if (done) slot.status = 'completed';
    else if (now >= slot.start && now < slot.end) slot.status = 'live';
    else if (now >= slot.end) slot.status = 'missed';
    else if (!upcomingAssigned) { slot.status = 'upcoming'; upcomingAssigned = true; }
    else slot.status = 'later';
  }
  return slots;
}

/** The class to show as "next": the live one, else the first upcoming one. */
export function getNextSlot(slots: TodaySlot[]): TodaySlot | undefined {
  return slots.find((s) => s.status === 'live') || slots.find((s) => s.status === 'upcoming');
}

export interface LessonSlot {
  dateStr: string; // YYYY-MM-DD
  startTime: string;
  start: Date;
}

/** Upcoming lesson slots for a cohort. A class that has already ended today is skipped. */
export function getUpcomingLessonSlots(cohort: Cohort | undefined, count = 5, now: Date = new Date()): LessonSlot[] {
  if (!cohort || !cohort.scheduleDays?.length) return [];
  const result: LessonSlot[] = [];
  const startTime = cohort.startTime || '00:00';
  const today = localDateStr(now);
  for (let i = 0; i < 60 && result.length < count; i++) {
    const dateStr = addDaysStr(today, i);
    const start = parseLocal(dateStr, startTime);
    if (!cohort.scheduleDays.includes(dayKeyOf(start))) continue;
    const end = new Date(start.getTime() + (cohort.durationMinutes || 60) * 60000);
    if (end <= now) continue;
    result.push({ dateStr, startTime, start });
  }
  return result;
}
