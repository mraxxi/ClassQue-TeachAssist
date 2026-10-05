import { create } from 'zustand';
import {
  Teacher, Cohort, Student, AttendanceRecord, AttendanceStatus,
  LessonPlan, TaskItem, CefrMilestone, TeachingSession, TeachingClaim,
  Language, ParentReport, StudentMilestoneEvaluation, CompetencyScore,
  NotificationItem, ClaimStatus,
} from '../types';
import { defaultTeacher } from './seedData';
import { getCookie, setCookie, COOKIE_KEYS } from '../utils/cookies';
import { addMinutesToTime, localDateStr, localTimeStr } from '../utils/date';
import { generateDynamicNotifications, mergeNotifications } from '../utils/notifications';
import { getSyncToken, syncHeaders, type SyncAuthStatus } from '../utils/syncAuth';
import { validateBackup } from '../utils/backup';

export type TabId = 'cockpit' | 'classes-students' | 'lesson-planner' | 'claims-reports' | 'settings';

/** Entities that can be deleted; deletions are replayed to D1 as soft-delete tombstones. */
export type TombstoneKey =
  | 'cohorts' | 'students' | 'lessonPlans' | 'attendanceRecords' | 'sessions'
  | 'claims' | 'studentEvaluations' | 'parentReports' | 'tasks';
export type Tombstones = Partial<Record<TombstoneKey, string[]>>;

export interface TeacherState {
  // Navigation
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // Language & Localization
  language: Language;
  setLanguage: (lang: Language) => void;

  // Teacher Profile
  teacher: Teacher;
  updateTeacher: (data: Partial<Teacher>) => void;

  // Cohorts & Students
  cohorts: Cohort[];
  /** Cohort the Cockpit is focused on (manual override of "next class"); UI-only, not persisted. */
  cockpitCohortId: string;
  setCockpitCohortId: (id: string) => void;
  selectedCohortId: string;
  setSelectedCohortId: (id: string) => void;
  addCohort: (cohort: Cohort) => void;
  updateCohort: (id: string, data: Partial<Cohort>) => void;
  deleteCohort: (id: string) => void;

  students: Student[];
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;
  addStudent: (student: Student) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  transferStudent: (studentId: string, newCohortId: string) => void;

  // Attendance
  attendanceRecords: AttendanceRecord[];
  setAttendance: (studentId: string, cohortId: string, date: string, status: AttendanceStatus, note?: string) => void;
  batchMarkAllPresent: (cohortId: string, date: string) => void;

  // Live Stopwatch & Cockpit (persisted; elapsed time is derived from wall-clock timestamps)
  isLiveCockpitOpen: boolean;
  setLiveCockpitOpen: (open: boolean) => void;
  activeSessionCohortId: string | null;
  stopwatchSeconds: number;
  isStopwatchRunning: boolean;
  liveScratchpad: string;
  setLiveScratchpad: (text: string) => void;
  startLiveSession: (cohortId: string) => void;
  pauseLiveSession: () => void;
  resumeLiveSession: () => void;
  tickStopwatch: () => void;
  finishLiveSession: (notes?: string) => TeachingSession;

  // Lesson Plans
  lessonPlans: LessonPlan[];
  selectedLessonPlanId: string | null;
  setSelectedLessonPlanId: (id: string | null) => void;
  addLessonPlan: (plan: LessonPlan) => void;
  updateLessonPlan: (id: string, data: Partial<LessonPlan>) => void;
  deleteLessonPlan: (id: string) => void;
  duplicateLessonPlan: (id: string) => void;

  // Tasks
  tasks: TaskItem[];
  toggleTask: (id: string) => void;
  addTask: (task: TaskItem) => void;
  deleteTask: (id: string) => void;

  // CEFR Milestones & Evaluations
  cefrMilestones: CefrMilestone[];
  studentEvaluations: StudentMilestoneEvaluation[];
  setStudentMilestoneScore: (studentId: string, milestoneId: string, score: CompetencyScore, notes?: string) => void;

  // Claims & Reports
  sessions: TeachingSession[];
  addManualSession: (session: TeachingSession) => void;
  updateSession: (id: string, data: Partial<TeachingSession>) => void;
  deleteSession: (id: string) => void;

  claims: TeachingClaim[];
  updateClaim: (id: string, data: Partial<TeachingClaim>) => void;
  /** Creates the claim for `period` if needed, then merges `data` into it. */
  upsertClaim: (period: string, data: Partial<TeachingClaim>) => TeachingClaim;

  parentReports: ParentReport[];
  addParentReport: (report: ParentReport) => void;
  updateParentReport: (id: string, data: Partial<ParentReport>) => void;
  /** One report per student + period: updates the existing one instead of duplicating. */
  upsertParentReport: (report: ParentReport) => ParentReport;

  // Cloudflare D1 Edge Sync & Portability
  isSyncingWithEdge: boolean;
  isEdgeConnected: boolean;
  syncAuthStatus: SyncAuthStatus;
  hasUnsyncedChanges: boolean;
  lastLocalMutationAt: string | null;
  lastSyncedAt: string | null;
  tombstones: Tombstones;
  fetchDatabaseFromEdge: () => Promise<boolean>;
  syncDatabaseToEdge: () => Promise<boolean>;
  /** Discards local state (including unsynced edits) and re-downloads everything from D1. */
  reloadFromEdge: () => Promise<boolean>;
  importFullDatabase: (importedData: unknown) => { ok: boolean; error?: string };

  // Notifications Center (derived from real state; see utils/notifications.ts)
  notifications: NotificationItem[];
  dismissedNotifications: Record<string, string>;
  refreshNotifications: () => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  addNotification: (notification: NotificationItem) => void;

  // UI State
  toasts: { id: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }[];
  addToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
}

const STORAGE_KEY = 'classque_teacher_os_v1';
const nowIso = () => new Date().toISOString();

const getSavedState = (): any => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse saved state', e);
  }
  return null;
};

const saved = getSavedState();
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

const persistState = (state: Partial<TeacherState>) => {
  try {
    const dataToSave = {
      language: state.language,
      teacher: state.teacher,
      cohorts: state.cohorts,
      students: state.students,
      attendanceRecords: state.attendanceRecords,
      lessonPlans: state.lessonPlans,
      tasks: state.tasks,
      sessions: state.sessions,
      claims: state.claims,
      studentEvaluations: state.studentEvaluations,
      parentReports: state.parentReports,
      cefrMilestones: state.cefrMilestones,
      notifications: state.notifications,
      dismissedNotifications: state.dismissedNotifications,
      tombstones: state.tombstones,
      hasUnsyncedChanges: state.hasUnsyncedChanges,
      lastLocalMutationAt: state.lastLocalMutationAt,
      lastSyncedAt: state.lastSyncedAt,
      // live class session (survives reload / tab crash)
      live: (state as any).__live,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (e) {
    console.error('Failed to persist state to storage', e);
  }
};

// ---- live-session bookkeeping (kept outside React state; mirrored into storage) ---------------

interface LiveSession {
  cohortId: string;
  startedAt: number | null; // ms timestamp of the last resume; null while paused
  accumulatedMs: number; // running time before the last resume
  startDate: string; // YYYY-MM-DD (local) the class started
  startTime: string; // HH:mm (local) the class started
  scratchpad: string;
  open: boolean;
}

let live: LiveSession | null = saved?.live?.cohortId ? (saved.live as LiveSession) : null;
const liveElapsedMs = () => (live ? live.accumulatedMs + (live.startedAt ? Date.now() - live.startedAt : 0) : 0);

// ---- auto sync -----------------------------------------------------------------------------------

let autoSyncTimer: ReturnType<typeof setTimeout> | null = null;
let retryDelayMs = 30_000;

export const scheduleAutoSync = (delayMs = 1500) => {
  if (autoSyncTimer) clearTimeout(autoSyncTimer);
  autoSyncTimer = setTimeout(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    const store = useTeacherStore.getState();
    if (!store.hasUnsyncedChanges) return;
    const ok = await store.syncDatabaseToEdge();
    const after = useTeacherStore.getState();
    if (!ok && after.syncAuthStatus !== 'missing' && after.syncAuthStatus !== 'rejected' && after.syncAuthStatus !== 'unconfigured') {
      // transient failure: retry with capped backoff
      scheduleAutoSync(retryDelayMs);
      retryDelayMs = Math.min(retryDelayMs * 2, 10 * 60_000);
    } else if (ok) {
      retryDelayMs = 30_000;
    }
  }, delayMs);
};

const addTombstones = (current: Tombstones, key: TombstoneKey, ids: string[]): Tombstones =>
  ids.length === 0 ? current : { ...current, [key]: Array.from(new Set([...(current[key] || []), ...ids])) };

const initialCohortList = arr<Cohort>(saved?.cohorts);
const initialStudentList = arr<Student>(saved?.students);

const initialLiveCohort = live?.cohortId || null;

let syncInFlight: Promise<boolean> | null = null;

export const useTeacherStore = create<TeacherState>((set, get) => {
  /** Marks local data as changed: persists immediately, refreshes alerts, schedules a debounced D1 push. */
  const commitMutation = () => {
    set({ hasUnsyncedChanges: true, lastLocalMutationAt: nowIso() });
    get().refreshNotifications();
    persistWithLive();
    scheduleAutoSync(1500);
  };
  const persistWithLive = () => persistState({ ...get(), __live: live } as any);

  const applyRemote = (d: any) => {
    set((state) => {
      const pick = <T extends { id: string }>(remote: unknown, current: T[]): T[] =>
        Array.isArray(remote) ? (remote as T[]) : current;
      const cohorts = pick<Cohort>(d.cohorts, state.cohorts);
      const students = pick<Student>(d.students, state.students);
      const lessonPlans = pick<LessonPlan>(d.lessonPlans, state.lessonPlans);
      return {
        teacher: d.teacher ? { ...state.teacher, ...d.teacher } : state.teacher,
        cohorts,
        students,
        lessonPlans,
        attendanceRecords: pick<AttendanceRecord>(d.attendanceRecords, state.attendanceRecords),
        sessions: pick<TeachingSession>(d.sessions, state.sessions),
        claims: pick<TeachingClaim>(d.claims, state.claims),
        studentEvaluations: pick<StudentMilestoneEvaluation>(d.studentEvaluations, state.studentEvaluations),
        parentReports: pick<ParentReport>(d.parentReports, state.parentReports),
        tasks: pick<TaskItem>(d.tasks, state.tasks),
        cefrMilestones: Array.isArray(d.cefrMilestones) && d.cefrMilestones.length > 0 ? d.cefrMilestones : state.cefrMilestones,
        selectedCohortId: cohorts.some((c) => c.id === state.selectedCohortId) ? state.selectedCohortId : cohorts[0]?.id || '',
        selectedStudentId: students.some((s) => s.id === state.selectedStudentId) ? state.selectedStudentId : students[0]?.id || null,
        selectedLessonPlanId: lessonPlans.some((p) => p.id === state.selectedLessonPlanId) ? state.selectedLessonPlanId : lessonPlans[0]?.id || null,
        hasUnsyncedChanges: false,
        tombstones: {},
        isSyncingWithEdge: false,
        isEdgeConnected: true,
        syncAuthStatus: 'ok' as SyncAuthStatus,
        lastSyncedAt: nowIso(),
      };
    });
    get().refreshNotifications();
    persistWithLive();
  };

  const classifyFailure = (status: number) => {
    if (status === 401) set({ syncAuthStatus: 'rejected', isSyncingWithEdge: false, isEdgeConnected: false });
    else if (status === 503) set({ syncAuthStatus: 'unconfigured', isSyncingWithEdge: false, isEdgeConnected: false });
    else set({ isSyncingWithEdge: false, isEdgeConnected: false });
  };

  /** Shared body for stamping + persisting a collection mutation. */
  const stamp = <T extends object>(item: T): T => ({ ...item, updatedAt: nowIso() });

  return {
    activeTab: 'cockpit',
    setActiveTab: (tab) => {
      set({ activeTab: tab });
      if (tab === 'cockpit') get().refreshNotifications();
    },

    language: (() => {
      const cookieLang = getCookie(COOKIE_KEYS.LANG);
      if (cookieLang === 'en' || cookieLang === 'id') return cookieLang;
      return saved?.language === 'en' ? 'en' : 'id';
    })(),
    setLanguage: (lang) => {
      set({ language: lang });
      setCookie(COOKIE_KEYS.LANG, lang);
      get().refreshNotifications();
      persistWithLive();
    },

    teacher: saved?.teacher ? { ...defaultTeacher, ...saved.teacher } : defaultTeacher,
    updateTeacher: (data) => {
      set((state) => ({ teacher: { ...state.teacher, ...data } }));
      commitMutation();
    },

    // ---- Cohorts ---------------------------------------------------------------------------
    cohorts: initialCohortList,
    cockpitCohortId: '',
    setCockpitCohortId: (id) => set({ cockpitCohortId: id }),
    selectedCohortId: initialCohortList[0]?.id || '',
    setSelectedCohortId: (id) => set({ selectedCohortId: id }),
    addCohort: (cohort) => {
      set((state) => ({ cohorts: [...state.cohorts, stamp(cohort)], selectedCohortId: cohort.id }));
      commitMutation();
    },
    updateCohort: (id, data) => {
      set((state) => ({ cohorts: state.cohorts.map((c) => (c.id === id ? stamp({ ...c, ...data }) : c)) }));
      commitMutation();
    },
    /**
     * Deletes a cohort together with everything that only makes sense inside it: its students and
     * their attendance, evaluations and reports. Lesson plans / tasks are un-linked (kept), and
     * Teaching Sessions are KEPT so already-earned honorarium history stays intact.
     */
    deleteCohort: (id) => {
      set((state) => {
        const studentIds = state.students.filter((s) => s.cohortId === id).map((s) => s.id);
        const gone = new Set(studentIds);
        const attendance = state.attendanceRecords.filter((r) => r.cohortId === id || gone.has(r.studentId));
        const evals = state.studentEvaluations.filter((e) => gone.has(e.studentId));
        const reports = state.parentReports.filter((r) => r.cohortId === id || gone.has(r.studentId));
        let tombstones = state.tombstones;
        tombstones = addTombstones(tombstones, 'cohorts', [id]);
        tombstones = addTombstones(tombstones, 'students', studentIds);
        tombstones = addTombstones(tombstones, 'attendanceRecords', attendance.map((r) => r.id));
        tombstones = addTombstones(tombstones, 'studentEvaluations', evals.map((e) => e.id));
        tombstones = addTombstones(tombstones, 'parentReports', reports.map((r) => r.id));
        const cohorts = state.cohorts.filter((c) => c.id !== id);
        const students = state.students.filter((s) => !gone.has(s.id));
        return {
          cohorts,
          students,
          attendanceRecords: state.attendanceRecords.filter((r) => !attendance.includes(r)),
          studentEvaluations: state.studentEvaluations.filter((e) => !evals.includes(e)),
          parentReports: state.parentReports.filter((r) => !reports.includes(r)),
          lessonPlans: state.lessonPlans.map((p) => (p.cohortId === id ? stamp({ ...p, cohortId: undefined }) : p)),
          tasks: state.tasks.map((t) => (t.cohortId === id ? stamp({ ...t, cohortId: undefined }) : t)),
          tombstones,
          selectedCohortId: state.selectedCohortId === id ? cohorts[0]?.id || '' : state.selectedCohortId,
          selectedStudentId: state.selectedStudentId && gone.has(state.selectedStudentId) ? students[0]?.id || null : state.selectedStudentId,
        };
      });
      commitMutation();
    },

    // ---- Students --------------------------------------------------------------------------
    students: initialStudentList,
    selectedStudentId: initialStudentList[0]?.id || null,
    setSelectedStudentId: (id) => set({ selectedStudentId: id }),
    addStudent: (student) => {
      set((state) => ({ students: [...state.students, stamp(student)], selectedStudentId: student.id }));
      commitMutation();
    },
    updateStudent: (id, data) => {
      set((state) => ({ students: state.students.map((s) => (s.id === id ? stamp({ ...s, ...data }) : s)) }));
      commitMutation();
    },
    /** Deletes a student and their attendance, evaluations and parent reports. */
    deleteStudent: (id) => {
      set((state) => {
        const attendance = state.attendanceRecords.filter((r) => r.studentId === id);
        const evals = state.studentEvaluations.filter((e) => e.studentId === id);
        const reports = state.parentReports.filter((r) => r.studentId === id);
        let tombstones = addTombstones(state.tombstones, 'students', [id]);
        tombstones = addTombstones(tombstones, 'attendanceRecords', attendance.map((r) => r.id));
        tombstones = addTombstones(tombstones, 'studentEvaluations', evals.map((e) => e.id));
        tombstones = addTombstones(tombstones, 'parentReports', reports.map((r) => r.id));
        const remaining = state.students.filter((s) => s.id !== id);
        return {
          students: remaining,
          attendanceRecords: state.attendanceRecords.filter((r) => r.studentId !== id),
          studentEvaluations: state.studentEvaluations.filter((e) => e.studentId !== id),
          parentReports: state.parentReports.filter((r) => r.studentId !== id),
          tombstones,
          selectedStudentId: state.selectedStudentId === id ? remaining[0]?.id || null : state.selectedStudentId,
        };
      });
      commitMutation();
    },
    transferStudent: (studentId, newCohortId) => {
      set((state) => ({
        students: state.students.map((s) => (s.id === studentId ? stamp({ ...s, cohortId: newCohortId }) : s)),
      }));
      commitMutation();
    },

    // ---- Attendance ------------------------------------------------------------------------
    attendanceRecords: arr<AttendanceRecord>(saved?.attendanceRecords),
    setAttendance: (studentId, cohortId, date, status, note) => {
      set((state) => {
        const idx = state.attendanceRecords.findIndex((r) => r.studentId === studentId && r.attendanceDate === date);
        if (idx >= 0) {
          const updated = [...state.attendanceRecords];
          updated[idx] = stamp({ ...updated[idx], status, note: note !== undefined ? note : updated[idx].note });
          return { attendanceRecords: updated };
        }
        const record: AttendanceRecord = stamp({
          id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          cohortId,
          studentId,
          attendanceDate: date,
          status,
          note,
        });
        return { attendanceRecords: [...state.attendanceRecords, record] };
      });
      commitMutation();
    },
    batchMarkAllPresent: (cohortId, date) => {
      const cohortStudents = get().students.filter((s) => s.cohortId === cohortId);
      set((state) => {
        const records = [...state.attendanceRecords];
        cohortStudents.forEach((student) => {
          const idx = records.findIndex((r) => r.studentId === student.id && r.attendanceDate === date);
          if (idx >= 0) records[idx] = stamp({ ...records[idx], status: 'present' as AttendanceStatus });
          else
            records.push(
              stamp({
                id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${student.id}`,
                cohortId,
                studentId: student.id,
                attendanceDate: date,
                status: 'present' as AttendanceStatus,
              })
            );
        });
        return { attendanceRecords: records };
      });
      commitMutation();
    },

    // ---- Live class ------------------------------------------------------------------------
    isLiveCockpitOpen: Boolean(live?.open),
    setLiveCockpitOpen: (open) => {
      if (live) live = { ...live, open };
      set({ isLiveCockpitOpen: open });
      persistWithLive();
    },
    activeSessionCohortId: initialLiveCohort,
    stopwatchSeconds: Math.floor(liveElapsedMs() / 1000),
    isStopwatchRunning: Boolean(live?.startedAt),
    liveScratchpad: live?.scratchpad || '',
    setLiveScratchpad: (text) => {
      if (live) live = { ...live, scratchpad: text };
      set({ liveScratchpad: text });
      persistWithLive();
    },
    startLiveSession: (cohortId) => {
      if (live && live.cohortId === cohortId) {
        // Re-opening the class that is already running: keep its time and notes.
        live = { ...live, open: true };
        set({ isLiveCockpitOpen: true });
      } else {
        const now = new Date();
        live = {
          cohortId,
          startedAt: now.getTime(),
          accumulatedMs: 0,
          startDate: localDateStr(now),
          startTime: localTimeStr(now),
          scratchpad: '',
          open: true,
        };
        set({
          activeSessionCohortId: cohortId,
          isLiveCockpitOpen: true,
          isStopwatchRunning: true,
          stopwatchSeconds: 0,
          liveScratchpad: '',
        });
      }
      persistWithLive();
    },
    pauseLiveSession: () => {
      if (!live) return;
      live = { ...live, accumulatedMs: liveElapsedMs(), startedAt: null };
      set({ isStopwatchRunning: false, stopwatchSeconds: Math.floor(liveElapsedMs() / 1000) });
      persistWithLive();
    },
    resumeLiveSession: () => {
      if (!live || live.startedAt) return;
      live = { ...live, startedAt: Date.now() };
      set({ isStopwatchRunning: true });
      persistWithLive();
    },
    tickStopwatch: () => set({ stopwatchSeconds: Math.floor(liveElapsedMs() / 1000) }),
    finishLiveSession: (notes) => {
      const { cohorts, teacher, sessions } = get();
      const session = live;
      const cohort = cohorts.find((c) => c.id === session?.cohortId);
      const durationMins = Math.max(1, Math.round(liveElapsedMs() / 60000));
      const rate = cohort?.hourlyRateOverride ?? teacher.defaultHourlyRate;
      const startTime = session?.startTime || localTimeStr();

      const newSession: TeachingSession = stamp({
        id: `session_${Date.now()}`,
        teacherId: teacher.id,
        cohortId: session?.cohortId || cohorts[0]?.id || '',
        sessionDate: session?.startDate || localDateStr(),
        startTime,
        endTime: addMinutesToTime(startTime, durationMins),
        durationMinutes: durationMins,
        hourlyRate: rate,
        totalClaimAmount: Math.round((durationMins / 60) * rate),
        status: 'completed' as const,
        scratchpadNotes: notes ?? session?.scratchpad ?? '',
      });

      live = null;
      set({
        isStopwatchRunning: false,
        isLiveCockpitOpen: false,
        stopwatchSeconds: 0,
        activeSessionCohortId: null,
        liveScratchpad: '',
        sessions: [newSession, ...sessions],
      });
      commitMutation();
      return newSession;
    },

    // ---- Lesson plans ----------------------------------------------------------------------
    lessonPlans: arr<LessonPlan>(saved?.lessonPlans),
    selectedLessonPlanId: saved?.selectedLessonPlanId || null,
    setSelectedLessonPlanId: (id) => set({ selectedLessonPlanId: id }),
    addLessonPlan: (plan) => {
      set((state) => ({ lessonPlans: [stamp(plan), ...state.lessonPlans], selectedLessonPlanId: plan.id }));
      commitMutation();
    },
    updateLessonPlan: (id, data) => {
      set((state) => ({ lessonPlans: state.lessonPlans.map((p) => (p.id === id ? stamp({ ...p, ...data }) : p)) }));
      commitMutation();
    },
    deleteLessonPlan: (id) => {
      set((state) => {
        const remaining = state.lessonPlans.filter((p) => p.id !== id);
        return {
          lessonPlans: remaining,
          sessions: state.sessions.map((s) => (s.lessonPlanId === id ? stamp({ ...s, lessonPlanId: undefined }) : s)),
          tombstones: addTombstones(state.tombstones, 'lessonPlans', [id]),
          selectedLessonPlanId: state.selectedLessonPlanId === id ? remaining[0]?.id || null : state.selectedLessonPlanId,
        };
      });
      commitMutation();
    },
    duplicateLessonPlan: (id) => {
      const target = get().lessonPlans.find((p) => p.id === id);
      if (!target) return;
      const copy: LessonPlan = stamp({ ...target, id: `lp_${Date.now()}`, title: `${target.title} (Copy)` });
      set((state) => ({ lessonPlans: [copy, ...state.lessonPlans], selectedLessonPlanId: copy.id }));
      commitMutation();
    },

    // ---- Tasks -----------------------------------------------------------------------------
    tasks: arr<TaskItem>(saved?.tasks),
    toggleTask: (id) => {
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? stamp({ ...t, isCompleted: !t.isCompleted, completedAt: !t.isCompleted ? nowIso() : undefined }) : t
        ),
      }));
      commitMutation();
    },
    addTask: (task) => {
      set((state) => ({ tasks: [stamp(task), ...state.tasks] }));
      commitMutation();
    },
    deleteTask: (id) => {
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        tombstones: addTombstones(state.tombstones, 'tasks', [id]),
      }));
      commitMutation();
    },

    // ---- CEFR ------------------------------------------------------------------------------
    cefrMilestones: arr<CefrMilestone>(saved?.cefrMilestones),
    studentEvaluations: arr<StudentMilestoneEvaluation>(saved?.studentEvaluations),
    setStudentMilestoneScore: (studentId, milestoneId, score, notes) => {
      set((state) => {
        const idx = state.studentEvaluations.findIndex((e) => e.studentId === studentId && e.milestoneId === milestoneId);
        if (idx >= 0) {
          const updated = [...state.studentEvaluations];
          updated[idx] = stamp({
            ...updated[idx],
            competencyScore: score,
            evaluatedAt: nowIso(),
            teacherNotes: notes !== undefined ? notes : updated[idx].teacherNotes,
          });
          return { studentEvaluations: updated };
        }
        const evaluation: StudentMilestoneEvaluation = stamp({
          id: `eval_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          studentId,
          milestoneId,
          competencyScore: score,
          evaluatedAt: nowIso(),
          teacherNotes: notes,
        });
        return { studentEvaluations: [...state.studentEvaluations, evaluation] };
      });
      commitMutation();
    },

    // ---- Sessions & claims -----------------------------------------------------------------
    sessions: arr<TeachingSession>(saved?.sessions),
    addManualSession: (session) => {
      set((state) => ({ sessions: [stamp(session), ...state.sessions] }));
      commitMutation();
    },
    updateSession: (id, data) => {
      set((state) => ({ sessions: state.sessions.map((s) => (s.id === id ? stamp({ ...s, ...data }) : s)) }));
      commitMutation();
    },
    deleteSession: (id) => {
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
        tombstones: addTombstones(state.tombstones, 'sessions', [id]),
      }));
      commitMutation();
    },

    claims: arr<TeachingClaim>(saved?.claims),
    updateClaim: (id, data) => {
      set((state) => ({
        claims: state.claims.map((c) => {
          if (c.id !== id) return c;
          const next: TeachingClaim = { ...c, ...data };
          if (data.status && data.status !== c.status) next.paidAt = statusTimestamp(data.status, 'paid', c.paidAt);
          if (data.status && data.status !== c.status) next.submittedAt = statusTimestamp(data.status, ['submitted', 'approved', 'paid'], c.submittedAt);
          return stamp(next);
        }),
      }));
      commitMutation();
    },
    upsertClaim: (period, data) => {
      let existing = get().claims.find((c) => c.claimPeriod === period);
      if (!existing) {
        const { teacher } = get();
        existing = stamp({
          id: `claim_${period}`,
          teacherId: teacher.id,
          claimPeriod: period,
          claimNumber: `CLM-${period.replace('-', '')}-001`,
          totalSessions: 0,
          totalHours: 0,
          baseAmount: 0,
          allowanceAmount: 0,
          totalClaimAmount: 0,
          currency: teacher.currency || 'IDR',
          status: 'draft' as ClaimStatus,
        });
        set((state) => ({ claims: [...state.claims, existing!] }));
      }
      get().updateClaim(existing.id, data);
      return get().claims.find((c) => c.id === existing!.id)!;
    },

    parentReports: arr<ParentReport>(saved?.parentReports),
    addParentReport: (report) => {
      set((state) => ({ parentReports: [stamp(report), ...state.parentReports] }));
      commitMutation();
    },
    updateParentReport: (id, data) => {
      set((state) => ({ parentReports: state.parentReports.map((r) => (r.id === id ? stamp({ ...r, ...data }) : r)) }));
      commitMutation();
    },
    upsertParentReport: (report) => {
      const existing = get().parentReports.find((r) => r.studentId === report.studentId && r.reportPeriod === report.reportPeriod);
      if (existing) {
        const { id: _ignored, isSent: _s, sentAt: _t, ...rest } = report;
        get().updateParentReport(existing.id, rest);
        return get().parentReports.find((r) => r.id === existing.id)!;
      }
      get().addParentReport(report);
      return report;
    },

    // ---- Sync ------------------------------------------------------------------------------
    isSyncingWithEdge: false,
    isEdgeConnected: false,
    syncAuthStatus: (getSyncToken() ? 'unknown' : 'missing') as SyncAuthStatus,
    hasUnsyncedChanges: Boolean(saved?.hasUnsyncedChanges),
    lastLocalMutationAt: saved?.lastLocalMutationAt || null,
    lastSyncedAt: saved?.lastSyncedAt || null,
    tombstones: (saved?.tombstones && typeof saved.tombstones === 'object' ? saved.tombstones : {}) as Tombstones,

    syncDatabaseToEdge: () => {
      if (syncInFlight) return syncInFlight;
      syncInFlight = (async () => {
        if (!getSyncToken()) {
          set({ syncAuthStatus: 'missing', isEdgeConnected: false });
          return false;
        }
        try {
          set({ isSyncingWithEdge: true });
          const state = get();
          const mutationMarker = state.lastLocalMutationAt;
          const sentTombstones = state.tombstones;
          const res = await fetch('/api/sync', {
            method: 'POST',
            headers: syncHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
              teacher: state.teacher,
              cohorts: state.cohorts,
              students: state.students,
              lessonPlans: state.lessonPlans,
              attendanceRecords: state.attendanceRecords,
              sessions: state.sessions,
              claims: state.claims,
              studentEvaluations: state.studentEvaluations,
              parentReports: state.parentReports,
              tasks: state.tasks,
              deleted: sentTombstones,
            }),
          });
          if (!res.ok) {
            classifyFailure(res.status);
            return false;
          }
          // Edits made while the request was in flight stay "unsynced" and are pushed again.
          set((s) => {
            const remaining: Tombstones = {};
            (Object.keys(s.tombstones) as TombstoneKey[]).forEach((k) => {
              const left = (s.tombstones[k] || []).filter((id) => !(sentTombstones[k] || []).includes(id));
              if (left.length) remaining[k] = left;
            });
            return {
              isSyncingWithEdge: false,
              isEdgeConnected: true,
              syncAuthStatus: 'ok' as SyncAuthStatus,
              hasUnsyncedChanges: s.lastLocalMutationAt !== mutationMarker,
              tombstones: remaining,
              lastSyncedAt: nowIso(),
            };
          });
          persistWithLive();
          if (get().hasUnsyncedChanges) scheduleAutoSync(1500);
          return true;
        } catch {
          set({ isSyncingWithEdge: false, isEdgeConnected: false });
          return false;
        }
      })().finally(() => {
        syncInFlight = null;
      });
      return syncInFlight;
    },

    fetchDatabaseFromEdge: async () => {
      if (!getSyncToken()) {
        set({ syncAuthStatus: 'missing', isEdgeConnected: false });
        return false;
      }
      try {
        // Unsynced local edits always win: push them first, never pull over them.
        if (get().hasUnsyncedChanges) {
          const pushed = await get().syncDatabaseToEdge();
          if (!pushed) return false;
        }
        set({ isSyncingWithEdge: true });
        const marker = get().lastLocalMutationAt;
        const res = await fetch('/api/sync', { headers: syncHeaders() });
        if (!res.ok) {
          classifyFailure(res.status);
          return false;
        }
        const json = (await res.json()) as any;
        const d = json?.data;
        if (!d) {
          set({ isSyncingWithEdge: false });
          return false;
        }
        // Edited while we were downloading: keep local edits, push them instead.
        if (get().lastLocalMutationAt !== marker) {
          set({ isSyncingWithEdge: false, hasUnsyncedChanges: true });
          scheduleAutoSync(500);
          return false;
        }
        // Brand-new, empty D1 + existing local data: seed D1 from this device instead of wiping it.
        const remoteEmpty = !d.teacher && ['cohorts', 'students', 'lessonPlans', 'tasks', 'sessions', 'claims'].every((k) => !d[k]?.length);
        const local = get();
        const localHasData = local.cohorts.length + local.students.length + local.lessonPlans.length + local.tasks.length + local.sessions.length > 0;
        if (remoteEmpty && localHasData) {
          set({ isSyncingWithEdge: false, hasUnsyncedChanges: true });
          return get().syncDatabaseToEdge();
        }
        applyRemote(d);
        return true;
      } catch {
        set({ isSyncingWithEdge: false, isEdgeConnected: false });
        return false;
      }
    },

    reloadFromEdge: async () => {
      if (!getSyncToken()) {
        set({ syncAuthStatus: 'missing', isEdgeConnected: false });
        return false;
      }
      try {
        set({ isSyncingWithEdge: true });
        const res = await fetch('/api/sync', { headers: syncHeaders() });
        if (!res.ok) {
          classifyFailure(res.status);
          return false;
        }
        const d = ((await res.json()) as any)?.data;
        if (!d) {
          set({ isSyncingWithEdge: false });
          return false;
        }
        applyRemote(d); // replaces local data and clears unsynced edits + tombstones
        return true;
      } catch {
        set({ isSyncingWithEdge: false, isEdgeConnected: false });
        return false;
      }
    },

    importFullDatabase: (imported) => {
      const result = validateBackup(imported);
      if (!result.ok) return { ok: false, error: result.error };
      const data = result.data;
      set((state) => {
        // A restore REPLACES the dataset: anything not in the file must also disappear from D1.
        let tombstones = state.tombstones;
        const dropMissing = (key: TombstoneKey, current: { id: string }[], next: { id: string }[]) => {
          const keep = new Set(next.map((x) => x.id));
          tombstones = addTombstones(tombstones, key, current.filter((x) => !keep.has(x.id)).map((x) => x.id));
        };
        dropMissing('cohorts', state.cohorts, data.cohorts);
        dropMissing('students', state.students, data.students);
        dropMissing('lessonPlans', state.lessonPlans, data.lessonPlans);
        dropMissing('attendanceRecords', state.attendanceRecords, data.attendanceRecords);
        dropMissing('sessions', state.sessions, data.sessions);
        dropMissing('claims', state.claims, data.claims);
        dropMissing('studentEvaluations', state.studentEvaluations, data.studentEvaluations);
        dropMissing('parentReports', state.parentReports, data.parentReports);
        dropMissing('tasks', state.tasks, data.tasks);
        return {
          teacher: data.teacher ? { ...state.teacher, ...data.teacher } : state.teacher,
          cohorts: data.cohorts.map(stamp),
          selectedCohortId: data.cohorts[0]?.id || '',
          students: data.students.map(stamp),
          selectedStudentId: data.students[0]?.id || null,
          attendanceRecords: data.attendanceRecords.map(stamp),
          lessonPlans: data.lessonPlans.map(stamp),
          selectedLessonPlanId: data.lessonPlans[0]?.id || null,
          tasks: data.tasks.map(stamp),
          sessions: data.sessions.map(stamp),
          claims: data.claims.map(stamp),
          studentEvaluations: data.studentEvaluations.map(stamp),
          parentReports: data.parentReports.map(stamp),
          cefrMilestones: data.cefrMilestones?.length ? data.cefrMilestones : state.cefrMilestones,
          tombstones,
        };
      });
      commitMutation(); // flags the restore as unsynced so it is pushed to D1 (and not overwritten by the next pull)
      return { ok: true };
    },

    // ---- Notifications ---------------------------------------------------------------------
    notifications: [],
    dismissedNotifications: (saved?.dismissedNotifications && typeof saved.dismissedNotifications === 'object' ? saved.dismissedNotifications : {}) as Record<string, string>,
    refreshNotifications: () => {
      const s = get();
      const generated = generateDynamicNotifications({
        cohorts: s.cohorts, tasks: s.tasks, sessions: s.sessions, claims: s.claims, language: s.language,
      });
      // forget dismissals older than 30 days so the map cannot grow forever
      const cutoff = Date.now() - 30 * 86_400_000;
      const dismissed = Object.fromEntries(Object.entries(s.dismissedNotifications).filter(([, at]) => new Date(at).getTime() > cutoff));
      const merged = mergeNotifications(generated, s.notifications, dismissed);
      const same = merged.length === s.notifications.length && merged.every((n, i) => JSON.stringify(n) === JSON.stringify(s.notifications[i]));
      if (!same) set({ notifications: merged, dismissedNotifications: dismissed });
    },
    markNotificationAsRead: (id) => {
      set((state) => ({ notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)) }));
      persistWithLive();
    },
    markAllNotificationsAsRead: () => {
      set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, isRead: true })) }));
      persistWithLive();
    },
    clearNotifications: () => {
      set((state) => ({
        notifications: [],
        dismissedNotifications: {
          ...state.dismissedNotifications,
          ...Object.fromEntries(state.notifications.map((n) => [n.id, nowIso()])),
        },
      }));
      persistWithLive();
    },
    addNotification: (notification) => {
      set((state) => ({ notifications: [notification, ...state.notifications] }));
      persistWithLive();
    },

    // ---- Toasts ----------------------------------------------------------------------------
    toasts: [],
    addToast: (message, type = 'info') => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, 3000);
    },
    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  };
});

/**
 * Claim timestamp rules: `submittedAt` is set once a claim is submitted (or beyond) and cleared when it
 * returns to draft; `paidAt` is set only while the claim is paid.
 */
function statusTimestamp(status: ClaimStatus, active: ClaimStatus | ClaimStatus[], previous?: string): string | undefined {
  const on = Array.isArray(active) ? active.includes(status) : status === active;
  if (!on) return undefined;
  return previous || new Date().toISOString();
}

// Initial alert computation (needs the store to exist).
useTeacherStore.getState().refreshNotifications();
