import { useEffect, useMemo, useState } from 'react';
import { useTeacherStore } from '../store/useTeacherStore';
import { getNextSlot, getTodaySlots } from '../utils/schedule';

/** Re-renders every `intervalMs` so time-based UI (countdowns, statuses) stays current. */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * The cohort the Cockpit is "about": the class that is live, else the next one today,
 * else the first cohort. The teacher can override it from the Next Class card.
 */
export function useCockpitCohort() {
  const { cohorts, sessions, cockpitCohortId } = useTeacherStore();
  const now = useNow();
  const slots = useMemo(() => getTodaySlots(cohorts, sessions, now), [cohorts, sessions, now]);
  const next = getNextSlot(slots);
  const fallback = next?.cohort || slots[0]?.cohort || cohorts[0];
  const active = cohorts.find((c) => c.id === cockpitCohortId) || fallback;
  const activeSlot = slots.find((s) => s.cohort.id === active?.id);
  return { now, slots, next, active, activeSlot };
}
