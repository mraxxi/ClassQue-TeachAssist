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
import { applyTheme, persistTheme, readThemePreference, type ThemePreference } from '../utils/theme';

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  /** Optional button, e.g. "Undo". */
  action?: { label: string; onClick: () => void };
}

/** Everything a delete can remove or un-link; kept in memory only so the last delete can be undone. */
export interface UndoSnapshot {
  cohorts: Cohort[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  studentEvaluations: StudentMilestoneEvaluation[];
  parentReports: ParentReport[];
  lessonPlans: LessonPlan[];
  tasks: TaskItem[];
  sessions: TeachingSession[];
}

export type TabId = 'cockpit' | 'classes-students' | 'lesson-planner' | 'claims-reports' | 'settings';

/** Entities that can be deleted; deletions are replayed to D1 as soft-delete tombstones. */
export type TombstoneKey =
  | 'cohorts' | 'students' | 'lessonPlans' | 'attendanceRecords' | 'sessions'
  | 'claims' | 'studentEvaluations' | 'parentReports' | 'tasks';
/** A recorded deletion: `at` is the client time of the delete (used for per-record last-write-wins). */
export interface TombstoneEntry { id: string; at: string }
export type Tombstones = Partial<Record<TombstoneKey, TombstoneEntry[]>>;

export interface TeacherState {
  // Navigation
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // Language & Localization
  language: Language;
  setLanguage: (lang: Language) => void;

  // Appearance (cq_theme cookie)
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;

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
  /** Server cursor of the last pull (delta sync). null = next pull is a full download. */
  syncCursor: string | null;
  /** True when the next push must send EVERY record (first sync, upgrade, seeding an empty D1). */
  fullPushPending: boolean;
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

  // Undo for destructive actions (cohort / student / session / task / lesson plan deletes)
  lastDelete: { label: string; snapshot: UndoSnapshot } | null;
  undoLastDelete: () => void;

  // UI State
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastItem['type'], options?: { action?: ToastItem['action']; duration?: number }) => void;
  removeToast: (id: string) => void;
}

const STORAGE_KEY = 'classque_teacher_os_v1';
const nowIso = () => new Date().toISOString();
const takeSnapshot = (s: TeacherState): UndoSnapshot => ({
  cohorts: s.cohorts, students: s.students, attendanceRecords: s.attendanceRecords, studentEvaluations: s.studentEvaluations,
  parentReports: s.parentReports, lessonPlans: s.lessonPlans, tasks: s.tasks, sessions: s.sessions,
});

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
      syncCursor: state.syncCursor,
      fullPushPending: state.fullPushPending,
      dirty: (state as any).__dirty,
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

/**
 * Ids edited locally since they were last pushed (id -> the updatedAt stamp at that moment).
 * Only these are sent on the next push: delta sync. Records that arrived from the server are never dirty.
 */
let dirtyMap: Record<string, string> =
  saved?.dirty && typeof saved.dirty === 'object' ? { ...(saved.dirty as Record<string, string>) } : {};
const markDirty = (id: string | undefined, at: string) => {
  if (id) dirtyMap[id] = at;
};

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
    if (!ok && after.syncAuthStatus !== 'missing' && after.syncAuthStatus !== 'rejected' && after.syncAuthStatus !== 'unconfigured' && after.syncAuthStatus !== 'unbound') {
      // transient failure: retry with capped backoff
      scheduleAutoSync(retryDelayMs);
      retryDelayMs = Math.min(retryDelayMs * 2, 10 * 60_000);
    } else if (ok) {
      retryDelayMs = 30_000;
    }
  }, delayMs);
};

const addTombstones = (current: Tombstones, key: TombstoneKey, ids: string[]): Tombstones => {
  if (ids.length === 0) return current;
  const at = nowIso();
  const existing = current[key] || [];
  const known = new Set(existing.map((t) => t.id));
  return { ...current, [key]: [...existing, ...ids.filter((id) => !known.has(id)).map((id) => ({ id, at }))] };
};

/** Saved state written before delta sync stored tombstones as plain id strings. */
const normaliseTombstones = (raw: unknown): Tombstones => {
  if (!raw || typeof raw !== 'object') return {};
  const out: Tombstones = {};
  for (const [key, list] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(list)) continue;
    out[key as TombstoneKey] = list.map((x) => (typeof x === 'string' ? { id: x, at: nowIso() } : (x as TombstoneEntry)));
  }
  return out;
};

/** Per-record last-write-wins merge of a delta pull into a local collection. */
function mergeCollection<T extends { id: string; updatedAt?: string }>(
  current: T[],
  remote: T[] | undefined,
  gone: { id: string; at: string }[] | undefined,
  pendingDeletes: Set<string>
): T[] {
  let next = current;
  if (remote?.length) {
    const byId = new Map(next.map((x) => [x.id, x]));
    for (const r of remote) {
      if (pendingDeletes.has(r.id)) continue; // we deleted it locally and have not pushed that yet
      const l = byId.get(r.id);
      // Keep the local copy only when it is strictly newer (an edit the server has not seen / lost the race).
      if (l?.updatedAt && (!r.updatedAt || l.updatedAt > r.updatedAt)) continue;
      byId.set(r.id, r);
    }
    next = Array.from(byId.values());
  }
  if (gone?.length) {
    const goneAt = new Map(gone.map((g) => [g.id, g.at]));
    // A local edit made after the remote delete wins ("edit beats delete") and will be pushed again.
    next = next.filter((x) => {
      const at = goneAt.get(x.id);
      return !(at && !(x.updatedAt && x.updatedAt > at));
    });
  }
  return next;
}

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
  const persistWithLive = () => persistState({ ...get(), __live: live, __dirty: dirtyMap } as any);

  const applyRemote = (d: any, cursor?: string) => {
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
        syncCursor: cursor ?? null,
        fullPushPending: false,
        isSyncingWithEdge: false,
        isEdgeConnected: true,
        syncAuthStatus: 'ok' as SyncAuthStatus,
        lastSyncedAt: nowIso(),
      };
    });
    get().refreshNotifications();
    dirtyMap = {}; // everything now mirrors the server
    persistWithLive();
  };

  /** Incremental pull: per-record merge; local newer edits and pending local deletes are preserved. */
  const mergeRemote = (d: any, gone: Record<string, { id: string; at: string }[]> | undefined, cursor: string | undefined) => {
    set((state) => {
      const pend = (k: TombstoneKey) => new Set((state.tombstones[k] || []).map((t) => t.id));
      const cohorts = mergeCollection(state.cohorts, d.cohorts, gone?.cohorts, pend('cohorts'));
      const students = mergeCollection(state.students, d.students, gone?.students, pend('students'));
      const lessonPlans = mergeCollection(state.lessonPlans, d.lessonPlans, gone?.lessonPlans, pend('lessonPlans'));
      return {
        teacher: d.teacher ? { ...state.teacher, ...d.teacher } : state.teacher,
        cohorts,
        students,
        lessonPlans,
        attendanceRecords: mergeCollection(state.attendanceRecords, d.attendanceRecords, gone?.attendanceRecords, pend('attendanceRecords')),
        sessions: mergeCollection(state.sessions, d.sessions, gone?.sessions, pend('sessions')),
        claims: mergeCollection(state.claims, d.claims, gone?.claims, pend('claims')),
        studentEvaluations: mergeCollection(state.studentEvaluations, d.studentEvaluations, gone?.studentEvaluations, pend('studentEvaluations')),
        parentReports: mergeCollection(state.parentReports, d.parentReports, gone?.parentReports, pend('parentReports')),
        tasks: mergeCollection(state.tasks, d.tasks, gone?.tasks, pend('tasks')),
        selectedCohortId: cohorts.some((c) => c.id === state.selectedCohortId) ? state.selectedCohortId : cohorts[0]?.id || '',
        selectedStudentId: students.some((s) => s.id === state.selectedStudentId) ? state.selectedStudentId : students[0]?.id || null,
        selectedLessonPlanId: lessonPlans.some((p) => p.id === state.selectedLessonPlanId) ? state.selectedLessonPlanId : lessonPlans[0]?.id || null,
        syncCursor: cursor ?? state.syncCursor,
        isSyncingWithEdge: false,
        isEdgeConnected: true,
        syncAuthStatus: 'ok' as SyncAuthStatus,
        lastSyncedAt: nowIso(),
      };
    });
    // A dirty record that lost to a newer remote version no longer needs pushing.
    const s = get();
    const present = new Set<string>();
    [s.cohorts, s.students, s.lessonPlans, s.attendanceRecords, s.sessions, s.claims, s.studentEvaluations, s.parentReports, s.tasks].forEach((list) =>
      (list as { id: string; updatedAt?: string }[]).forEach((x) => present.add(`${x.id}|${x.updatedAt ?? ''}`))
    );
    for (const id of Object.keys(dirtyMap)) if (!present.has(`${id}|${dirtyMap[id]}`)) delete dirtyMap[id];
    get().refreshNotifications();
    persistWithLive();
  };

  /** Maps a failed sync response to a status. A 503 is either a missing SYNC_TOKEN ('unconfigured') or a missing D1 binding ('unbound'); the body says which. */
  const classifyFailure = async (res: Response) => {
    const off = { isSyncingWithEdge: false, isEdgeConnected: false };
    if (res.status === 401) set({ syncAuthStatus: 'rejected', ...off });
    else if (res.status === 503) {
      const body = (await res.json().catch(() => null)) as { status?: string } | null;
      set({ syncAuthStatus: body?.status === 'unbound' ? 'unbound' : 'unconfigured', ...off });
    } else set(off);
  };

  /** Shared body for stamping + persisting a collection mutation. */
  /** Remember the pre-delete state and show an "Undo" toast. */
  const announceDelete = (snapshot: UndoSnapshot, label: string) => {
    set({ lastDelete: { label, snapshot } });
    const id = get().language === 'id';
    get().addToast(label, 'info', {
      duration: 8000,
      action: { label: id ? 'Urungkan' : 'Undo', onClick: () => get().undoLastDelete() },
    });
  };

  const stamp = <T extends object>(item: T): T => {
    const at = nowIso();
    markDirty((item as { id?: string }).id, at);
    return { ...item, updatedAt: at };
  };

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

    theme: readThemePreference(),
    setTheme: (theme) => {
      persistTheme(theme);
      applyTheme(theme);
      set({ theme });
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
      const snap = takeSnapshot(get());
      const name = get().cohorts.find((c) => c.id === id)?.name ?? '';
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
      announceDelete(snap, get().language === 'id' ? `Kelas "${name}" dihapus` : `Cohort "${name}" deleted`);
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
      const snap = takeSnapshot(get());
      const name = get().students.find((x) => x.id === id)?.fullName ?? '';
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
      announceDelete(snap, get().language === 'id' ? `Siswa "${name}" dihapus` : `Student "${name}" removed`);
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
      const snap = takeSnapshot(get());
      const title = get().lessonPlans.find((x) => x.id === id)?.title ?? '';
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
      announceDelete(snap, get().language === 'id' ? `RPP "${title}" dihapus` : `Lesson plan "${title}" deleted`);
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
      const snap = takeSnapshot(get());
      const title = get().tasks.find((x) => x.id === id)?.title ?? '';
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        tombstones: addTombstones(state.tombstones, 'tasks', [id]),
      }));
      commitMutation();
      announceDelete(snap, get().language === 'id' ? `Tugas "${title}" dihapus` : `Task "${title}" deleted`);
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
      const snap = takeSnapshot(get());
      const date = get().sessions.find((x) => x.id === id)?.sessionDate ?? '';
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
        tombstones: addTombstones(state.tombstones, 'sessions', [id]),
      }));
      commitMutation();
      announceDelete(snap, get().language === 'id' ? `Sesi ${date} dihapus` : `Session ${date} deleted`);
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
    tombstones: normaliseTombstones(saved?.tombstones),
    syncCursor: (saved?.syncCursor as string) || null,
    // Upgrade path: state saved before delta sync has no dirty map, so push everything once.
    fullPushPending: saved ? saved.dirty === undefined : false,

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
          const sentDirty = { ...dirtyMap };
          const full = state.fullPushPending;
          /** Delta: only ids edited locally since the last successful push (everything when `full`). */
          const changed = <T extends { id: string }>(list: T[]): T[] => (full ? list : list.filter((x) => sentDirty[x.id] !== undefined));
          const res = await fetch('/api/sync', {
            method: 'POST',
            headers: syncHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
              teacher: state.teacher,
              cohorts: changed(state.cohorts),
              students: changed(state.students),
              lessonPlans: changed(state.lessonPlans),
              attendanceRecords: changed(state.attendanceRecords),
              sessions: changed(state.sessions),
              claims: changed(state.claims),
              studentEvaluations: changed(state.studentEvaluations),
              parentReports: changed(state.parentReports),
              tasks: changed(state.tasks),
              deleted: sentTombstones,
            }),
          });
          if (!res.ok) {
            await classifyFailure(res);
            return false;
          }
          const pushResult = (await res.json().catch(() => ({}))) as { rejected?: number };
          // Edits made while the request was in flight stay "unsynced" and are pushed again.
          set((s) => {
            const remaining: Tombstones = {};
            (Object.keys(s.tombstones) as TombstoneKey[]).forEach((k) => {
              const sentIds = new Set((sentTombstones[k] || []).map((t) => t.id));
              const left = (s.tombstones[k] || []).filter((t) => !sentIds.has(t.id));
              if (left.length) remaining[k] = left;
            });
            return {
              isSyncingWithEdge: false,
              isEdgeConnected: true,
              syncAuthStatus: 'ok' as SyncAuthStatus,
              hasUnsyncedChanges: s.lastLocalMutationAt !== mutationMarker,
              tombstones: remaining,
              fullPushPending: full ? false : s.fullPushPending,
              lastSyncedAt: nowIso(),
            };
          });
          // Clear only what was sent AND not edited again while the request was in flight.
          for (const id of Object.keys(sentDirty)) if (dirtyMap[id] === sentDirty[id]) delete dirtyMap[id];
          persistWithLive();
          if (get().hasUnsyncedChanges) scheduleAutoSync(1500);
          // Some of our writes lost the last-write-wins comparison: fetch the winning versions right away.
          if ((pushResult.rejected ?? 0) > 0) setTimeout(() => void get().fetchDatabaseFromEdge(), 200);
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
        const cursor = get().syncCursor;
        // 2 s of overlap absorbs clock differences between Worker instances; re-delivered rows merge idempotently.
        const since = cursor ? new Date(Date.parse(cursor) - 2000).toISOString() : null;
        const res = await fetch(since ? `/api/sync?since=${encodeURIComponent(since)}` : '/api/sync', { headers: syncHeaders() });
        if (!res.ok) {
          await classifyFailure(res);
          return false;
        }
        const json = (await res.json()) as any;
        const d = json?.data;
        if (!d) {
          set({ isSyncingWithEdge: false });
          return false;
        }
        if (json.delta) {
          // Per-record merge: edits made while downloading are safe because newer local records always win.
          mergeRemote(d, json.deleted, json.cursor);
          return true;
        }
        // Full download. Brand-new, empty D1 + existing local data: seed D1 from this device instead of wiping it.
        const remoteEmpty = !d.teacher && ['cohorts', 'students', 'lessonPlans', 'tasks', 'sessions', 'claims'].every((k) => !d[k]?.length);
        const local = get();
        const localHasData = local.cohorts.length + local.students.length + local.lessonPlans.length + local.tasks.length + local.sessions.length > 0;
        if (remoteEmpty && localHasData) {
          set({ isSyncingWithEdge: false, hasUnsyncedChanges: true, fullPushPending: true });
          return get().syncDatabaseToEdge();
        }
        if (get().hasUnsyncedChanges || get().tombstones && Object.keys(get().tombstones).length > 0) {
          // Edited while the full download was in flight: merge instead of replacing.
          mergeRemote(d, undefined, json.cursor);
          return true;
        }
        applyRemote(d, json.cursor);
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
          await classifyFailure(res);
          return false;
        }
        const json = (await res.json()) as any;
        const d = json?.data;
        const cursor = json?.cursor as string | undefined;
        if (!d) {
          set({ isSyncingWithEdge: false });
          return false;
        }
        applyRemote(d, cursor); // replaces local data and clears unsynced edits + tombstones
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
    // Restored so read-state survives the first regeneration after a reload.
    notifications: arr<NotificationItem>(saved?.notifications),
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

    // ---- Undo ------------------------------------------------------------------------------
    lastDelete: null,
    undoLastDelete: () => {
      const ld = get().lastDelete;
      if (!ld) return;
      const sn = ld.snapshot;
      const restored = new Set<string>();
      /** Snapshot order is kept; removed records come back (re-stamped so the server revives them); un-links are reverted. */
      const restore = <T extends { id: string; updatedAt?: string; cohortId?: string; lessonPlanId?: string }>(snapList: T[], cur: T[]): T[] => {
        const curById = new Map(cur.map((x) => [x.id, x]));
        const snapIds = new Set(snapList.map((x) => x.id));
        const merged = snapList.map((o) => {
          const c = curById.get(o.id);
          if (!c) {
            restored.add(o.id);
            return stamp(o);
          }
          let fixed = c;
          if (o.cohortId && c.cohortId === undefined) fixed = stamp({ ...fixed, cohortId: o.cohortId });
          if (o.lessonPlanId && c.lessonPlanId === undefined) fixed = stamp({ ...fixed, lessonPlanId: o.lessonPlanId });
          return fixed;
        });
        return [...merged, ...cur.filter((x) => !snapIds.has(x.id))];
      };
      set((state) => {
        const next = {
          cohorts: restore(sn.cohorts, state.cohorts),
          students: restore(sn.students, state.students),
          attendanceRecords: restore(sn.attendanceRecords, state.attendanceRecords),
          studentEvaluations: restore(sn.studentEvaluations, state.studentEvaluations),
          parentReports: restore(sn.parentReports, state.parentReports),
          lessonPlans: restore(sn.lessonPlans, state.lessonPlans),
          tasks: restore(sn.tasks, state.tasks),
          sessions: restore(sn.sessions, state.sessions),
        };
        const tombstones: Tombstones = {};
        (Object.keys(state.tombstones) as TombstoneKey[]).forEach((k) => {
          const left = (state.tombstones[k] || []).filter((t) => !restored.has(t.id));
          if (left.length) tombstones[k] = left;
        });
        return { ...next, tombstones, lastDelete: null };
      });
      commitMutation();
      const id = get().language === 'id';
      get().addToast(id ? 'Dikembalikan' : 'Restored', 'success');
    },

    // ---- Toasts ----------------------------------------------------------------------------
    toasts: [],
    addToast: (message, type = 'info', options) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      set((state) => ({ toasts: [...state.toasts, { id, message, type, action: options?.action }] }));
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, options?.duration ?? 3000);
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
