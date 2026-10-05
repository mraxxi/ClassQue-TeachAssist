import type { Cohort, Language, NotificationItem, TaskItem, TeachingClaim, TeachingSession } from '../types';
import { localDateStr, localMonthStr, parseLocal } from './date';
import { getTodaySlots } from './schedule';

export interface NotificationInput {
  cohorts: Cohort[];
  tasks: TaskItem[];
  sessions: TeachingSession[];
  claims: TeachingClaim[];
  language: Language;
  now?: Date;
}

/**
 * Derives the teacher's alerts from real state (no stored fakes).
 * IDs are deterministic so read/dismissed state survives regeneration.
 *   - schedule: today's classes that are live or still upcoming
 *   - task:     open tasks that are overdue or due today
 *   - claim:    a draft Teaching Claim for the current month that has sessions
 */
export function generateDynamicNotifications(input: NotificationInput): NotificationItem[] {
  const { cohorts, tasks, sessions, claims, language } = input;
  const now = input.now ?? new Date();
  const today = localDateStr(now);
  const month = localMonthStr(now);
  const id = language === 'id';
  const items: NotificationItem[] = [];

  for (const slot of getTodaySlots(cohorts, sessions, now)) {
    if (slot.status !== 'live' && slot.status !== 'upcoming' && slot.status !== 'later') continue;
    const where = slot.cohort.roomOrLink ? ` • ${slot.cohort.roomOrLink}` : '';
    items.push({
      id: `sched:${slot.cohort.id}:${today}`,
      category: 'schedule',
      title: slot.status === 'live' ? (id ? 'Kelas Sedang Berlangsung' : 'Class In Progress') : (id ? 'Sesi Kelas Mendatang' : 'Upcoming Class'),
      message: id
        ? `${slot.cohort.name} dijadwalkan hari ini pukul ${slot.startTime}${where}.`
        : `${slot.cohort.name} is scheduled today at ${slot.startTime}${where}.`,
      timestamp: slot.start.toISOString(),
      isRead: false,
      actionTab: 'cockpit',
    });
  }

  for (const task of tasks) {
    if (task.isCompleted || !task.dueDate || task.dueDate > today) continue;
    const overdue = task.dueDate < today;
    items.push({
      id: `task:${task.id}:${overdue ? 'overdue' : 'today'}`,
      category: 'task',
      title: overdue ? (id ? 'Tugas Terlambat' : 'Overdue Task') : (id ? 'Batas Waktu Tugas Hari Ini' : 'Task Due Today'),
      message: `${task.title}${task.dueLessonLabel ? ` — ${task.dueLessonLabel}` : ''}`,
      timestamp: parseLocal(task.dueDate).toISOString(),
      isRead: false,
      actionTab: 'cockpit',
    });
  }

  const monthHasSessions = sessions.some((s) => s.sessionDate.startsWith(month) && s.status === 'completed');
  for (const claim of claims) {
    if (claim.claimPeriod !== month || claim.status !== 'draft' || !monthHasSessions) continue;
    items.push({
      id: `claim:${claim.id}`,
      category: 'claim',
      title: id ? 'Klaim Honor Siap Ditinjau' : 'Teaching Claim Ready',
      message: id
        ? `Klaim honorarium ${claim.claimPeriod} masih berstatus draf. Tinjau dan ajukan.`
        : `The ${claim.claimPeriod} Teaching Claim is still a draft. Review and submit it.`,
      timestamp: now.toISOString(),
      isRead: false,
      actionTab: 'claims-reports',
    });
  }

  return items;
}

/** Merge freshly generated alerts with stored read-state and drop dismissed ones. */
export function mergeNotifications(
  generated: NotificationItem[],
  existing: NotificationItem[],
  dismissed: Record<string, string>
): NotificationItem[] {
  const readIds = new Set(existing.filter((n) => n.isRead).map((n) => n.id));
  return generated
    .filter((n) => !dismissed[n.id])
    .map((n) => ({ ...n, isRead: readIds.has(n.id) }));
}
