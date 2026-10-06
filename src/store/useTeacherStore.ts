import { create } from 'zustand';
import { 
  Teacher, Cohort, Student, AttendanceRecord, AttendanceStatus, 
  LessonPlan, TaskItem, CefrMilestone, TeachingSession, TeachingClaim, 
  Language, ParentReport, StudentMilestoneEvaluation, CompetencyScore,
  NotificationItem
} from '../types';
import { 
  defaultTeacher, initialCohorts, initialStudents, 
  initialLessonPlans, initialTasks, initialCefrMilestones, 
  initialSessions, initialClaims 
} from './seedData';
import { getCookie, setCookie, COOKIE_KEYS } from '../utils/cookies';
import { newId } from '../utils/id';
import { getStorageKey, getIdentity, ensureVerified } from '../utils/identity';

interface TeacherState {
  // Navigation
  activeTab: 'cockpit' | 'classes-students' | 'lesson-planner' | 'claims-reports' | 'settings';
  setActiveTab: (tab: 'cockpit' | 'classes-students' | 'lesson-planner' | 'claims-reports' | 'settings') => void;

  // Language & Localization
  language: Language;
  setLanguage: (lang: Language) => void;

  // Teacher Profile
  teacher: Teacher;
  updateTeacher: (data: Partial<Teacher>) => void;

  // Cohorts & Students
  cohorts: Cohort[];
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

  // Live Stopwatch & Cockpit
  isLiveCockpitOpen: boolean;
  setLiveCockpitOpen: (open: boolean) => void;
  activeSessionCohortId: string | null;
  stopwatchSeconds: number;
  isStopwatchRunning: boolean;
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

  parentReports: ParentReport[];
  addParentReport: (report: ParentReport) => void;
  updateParentReport: (id: string, data: Partial<ParentReport>) => void;

  // Cloudflare D1 Edge Sync & Portability
  isSyncingWithEdge: boolean;
  isEdgeConnected: boolean;
  hasUnsyncedChanges: boolean;
  lastLocalMutationAt: string | null;
  lastSyncedAt: string | null;
  fetchDatabaseFromEdge: () => Promise<boolean>;
  syncDatabaseToEdge: () => Promise<boolean>;
  resetToDemoData: () => Promise<void>;
  importFullDatabase: (importedData: any) => boolean;

  // Notifications Center
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  addNotification: (notification: NotificationItem) => void;

  // UI State
  toasts: { id: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }[];
  addToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
}

// Per-teacher local-first buffer. initIdentity() must resolve before this module loads
// (see main.tsx), so the key already points at the signed-in teacher's own data.
const STORAGE_KEY = getStorageKey();

const getSavedState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse saved state', e);
  }
  return null;
};

const saved = getSavedState();

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
      hasUnsyncedChanges: state.hasUnsyncedChanges,
      lastLocalMutationAt: state.lastLocalMutationAt,
      lastSyncedAt: state.lastSyncedAt,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (e) {
    console.error('Failed to persist state to storage', e);
  }
};

let autoSyncTimer: ReturnType<typeof setTimeout> | null = null;

export const scheduleAutoSync = (delayMs = 1500) => {
  if (autoSyncTimer) clearTimeout(autoSyncTimer);
  autoSyncTimer = setTimeout(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }
    const store = useTeacherStore.getState();
    if (!store.hasUnsyncedChanges) return;
    await store.syncDatabaseToEdge();
  }, delayMs);
};

const commitMutation = (set: any, get: any) => {
  set({
    hasUnsyncedChanges: true,
    lastLocalMutationAt: new Date().toISOString(),
  });
  persistState(get());
  scheduleAutoSync(1500);
};

const defaultNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    category: 'schedule',
    title: 'Sesi Kelas Mendatang',
    message: 'Cambridge Flyers A2 dijadwalkan hari ini pukul 14:00.',
    timestamp: '15m lalu',
    isRead: false,
    actionTab: 'cockpit',
  },
  {
    id: 'notif-2',
    category: 'task',
    title: 'Batas Waktu Tugas Segera',
    message: 'Siapkan rubric speaking dan review evaluasi CEFR.',
    timestamp: '1 jam lalu',
    isRead: false,
    actionTab: 'cockpit',
  },
  {
    id: 'notif-3',
    category: 'claim',
    title: 'Klaim Honor Mengajar Siap',
    message: 'Klaim honorarium bulan ini siap ditinjau dan diekspor.',
    timestamp: 'Kemarin',
    isRead: false,
    actionTab: 'claims-reports',
  },
];

const initialNotifications: NotificationItem[] = (saved?.notifications && Array.isArray(saved.notifications))
  ? saved.notifications
  : defaultNotifications;

const initialCohortList = (saved?.cohorts && Array.isArray(saved.cohorts))
  ? saved.cohorts
  : initialCohorts;

const initialStudentList = (saved?.students && Array.isArray(saved.students))
  ? saved.students
  : initialStudents;

const initialTaskList = (saved?.tasks && Array.isArray(saved.tasks))
  ? saved.tasks
  : initialTasks;

const initialAttendance = (saved?.attendanceRecords && Array.isArray(saved.attendanceRecords))
  ? saved.attendanceRecords
  : [];

const initialEvaluations: StudentMilestoneEvaluation[] = (saved?.studentEvaluations && Array.isArray(saved.studentEvaluations))
  ? saved.studentEvaluations
  : [];

export const useTeacherStore = create<TeacherState>((set, get) => ({
  activeTab: 'cockpit',
  setActiveTab: (tab) => set({ activeTab: tab }),

  language: (() => {
    const cookieLang = getCookie(COOKIE_KEYS.LANG);
    if (cookieLang === 'en' || cookieLang === 'id') return cookieLang;
    return saved?.language === 'en' ? 'en' : 'id';
  })(),
  setLanguage: (lang) => {
    set({ language: lang });
    setCookie(COOKIE_KEYS.LANG, lang);
    persistState(get());
  },

  teacher: {
    ...defaultTeacher,
    email: getIdentity().email ?? defaultTeacher.email,
    ...(saved?.teacher || {}),
  },
  updateTeacher: (data) => {
    set((state) => ({ teacher: { ...state.teacher, ...data } }));
    commitMutation(set, get);
  },

  cohorts: initialCohortList,
  selectedCohortId: initialCohortList[0]?.id || '',
  setSelectedCohortId: (id) => set({ selectedCohortId: id }),
  addCohort: (cohort) => {
    set((state) => ({
      cohorts: [...state.cohorts, cohort],
      selectedCohortId: cohort.id,
    }));
    commitMutation(set, get);
  },
  updateCohort: (id, data) => {
    set((state) => ({
      cohorts: state.cohorts.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
    commitMutation(set, get);
  },
  deleteCohort: (id) => {
    set((state) => {
      const remainingCohorts = state.cohorts.filter((c) => c.id !== id);
      const nextSelected = remainingCohorts[0]?.id || '';
      return {
        cohorts: remainingCohorts,
        selectedCohortId: state.selectedCohortId === id ? nextSelected : state.selectedCohortId,
      };
    });
    commitMutation(set, get);
  },

  students: initialStudentList,
  selectedStudentId: initialStudentList[0]?.id || null,
  setSelectedStudentId: (id) => set({ selectedStudentId: id }),
  addStudent: (student) => {
    set((state) => ({
      students: [...state.students, student],
      selectedStudentId: student.id,
    }));
    commitMutation(set, get);
  },
  updateStudent: (id, data) => {
    set((state) => ({
      students: state.students.map((s) => (s.id === id ? { ...s, ...data } : s)),
    }));
    commitMutation(set, get);
  },
  deleteStudent: (id) => {
    set((state) => {
      const remaining = state.students.filter((s) => s.id !== id);
      const nextSelected = remaining[0]?.id || null;
      return {
        students: remaining,
        selectedStudentId: state.selectedStudentId === id ? nextSelected : state.selectedStudentId,
      };
    });
    commitMutation(set, get);
  },
  transferStudent: (studentId, newCohortId) => {
    set((state) => ({
      students: state.students.map((s) => (s.id === studentId ? { ...s, cohortId: newCohortId } : s)),
    }));
    commitMutation(set, get);
  },

  attendanceRecords: initialAttendance,
  setAttendance: (studentId, cohortId, date, status, note) => {
    set((state) => {
      const existingIdx = state.attendanceRecords.findIndex(
        (r) => r.studentId === studentId && r.attendanceDate === date
      );
      if (existingIdx >= 0) {
        const updated = [...state.attendanceRecords];
        updated[existingIdx] = {
          ...updated[existingIdx],
          status,
          note: note !== undefined ? note : updated[existingIdx].note,
        };
        return { attendanceRecords: updated };
      }
      const newRecord: AttendanceRecord = {
        id: newId('att'),
        cohortId,
        studentId,
        attendanceDate: date,
        status,
        note,
      };
      return { attendanceRecords: [...state.attendanceRecords, newRecord] };
    });
    commitMutation(set, get);
  },
  batchMarkAllPresent: (cohortId, date) => {
    const cohortStudents = get().students.filter((s) => s.cohortId === cohortId);
    set((state) => {
      const currentRecords = [...state.attendanceRecords];
      cohortStudents.forEach((student) => {
        const existingIdx = currentRecords.findIndex(
          (r) => r.studentId === student.id && r.attendanceDate === date
        );
        if (existingIdx >= 0) {
          currentRecords[existingIdx] = { ...currentRecords[existingIdx], status: 'present' };
        } else {
          currentRecords.push({
            id: newId('att'),
            cohortId,
            studentId: student.id,
            attendanceDate: date,
            status: 'present',
          });
        }
      });
      return { attendanceRecords: currentRecords };
    });
    commitMutation(set, get);
  },

  isLiveCockpitOpen: false,
  setLiveCockpitOpen: (open) => set({ isLiveCockpitOpen: open }),
  activeSessionCohortId: null,
  stopwatchSeconds: 0,
  isStopwatchRunning: false,
  startLiveSession: (cohortId) => {
    set({
      activeSessionCohortId: cohortId,
      isLiveCockpitOpen: true,
      isStopwatchRunning: true,
      stopwatchSeconds: 0,
    });
  },
  pauseLiveSession: () => set({ isStopwatchRunning: false }),
  resumeLiveSession: () => set({ isStopwatchRunning: true }),
  tickStopwatch: () => set((state) => ({ stopwatchSeconds: state.stopwatchSeconds + 1 })),
  finishLiveSession: (notes) => {
    const { activeSessionCohortId, stopwatchSeconds, cohorts, teacher, sessions } = get();
    const cohort = cohorts.find((c) => c.id === activeSessionCohortId);
    const durationMins = Math.max(1, Math.round(stopwatchSeconds / 60));
    const rate = cohort?.hourlyRateOverride || teacher.defaultHourlyRate;
    const claimAmount = Math.round((durationMins / 60) * rate);

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const newSession: TeachingSession = {
      id: newId('session'),
      teacherId: teacher.id,
      cohortId: activeSessionCohortId || cohorts[0]?.id || 'cohort-1',
      sessionDate: todayStr,
      startTime: `${hours}:${minutes}`,
      durationMinutes: durationMins,
      hourlyRate: rate,
      totalClaimAmount: claimAmount,
      status: 'completed',
      scratchpadNotes: notes,
    };

    set({
      isStopwatchRunning: false,
      isLiveCockpitOpen: false,
      stopwatchSeconds: 0,
      activeSessionCohortId: null,
      sessions: [newSession, ...sessions],
    });
    commitMutation(set, get);
    return newSession;
  },

  lessonPlans: saved?.lessonPlans || initialLessonPlans,
  selectedLessonPlanId: saved?.selectedLessonPlanId || null,
  setSelectedLessonPlanId: (id) => set({ selectedLessonPlanId: id }),
  addLessonPlan: (plan) => {
    set((state) => ({
      lessonPlans: [plan, ...state.lessonPlans],
      selectedLessonPlanId: plan.id,
    }));
    commitMutation(set, get);
  },
  updateLessonPlan: (id, data) => {
    set((state) => ({
      lessonPlans: state.lessonPlans.map((p) => (p.id === id ? { ...p, ...data } : p)),
    }));
    commitMutation(set, get);
  },
  deleteLessonPlan: (id) => {
    set((state) => {
      const remaining = state.lessonPlans.filter((p) => p.id !== id);
      const nextSelected = remaining[0]?.id || null;
      return {
        lessonPlans: remaining,
        selectedLessonPlanId: state.selectedLessonPlanId === id ? nextSelected : state.selectedLessonPlanId,
      };
    });
    commitMutation(set, get);
  },
  duplicateLessonPlan: (id) => {
    const target = get().lessonPlans.find((p) => p.id === id);
    if (!target) return;
    const copy: LessonPlan = {
      ...target,
      id: newId('lp'),
      title: `${target.title} (Copy)`,
    };
    set((state) => ({
      lessonPlans: [copy, ...state.lessonPlans],
      selectedLessonPlanId: copy.id,
    }));
    commitMutation(set, get);
  },

  tasks: initialTaskList,
  toggleTask: (id) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)),
    }));
    commitMutation(set, get);
  },
  addTask: (task) => {
    set((state) => ({ tasks: [task, ...state.tasks] }));
    commitMutation(set, get);
  },
  deleteTask: (id) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
    commitMutation(set, get);
  },

  cefrMilestones: saved?.cefrMilestones || initialCefrMilestones,
  studentEvaluations: initialEvaluations,
  setStudentMilestoneScore: (studentId, milestoneId, score, notes) => {
    set((state) => {
      const existingIdx = state.studentEvaluations.findIndex(
        (e) => e.studentId === studentId && e.milestoneId === milestoneId
      );
      if (existingIdx >= 0) {
        const updated = [...state.studentEvaluations];
        updated[existingIdx] = {
          ...updated[existingIdx],
          competencyScore: score,
          evaluatedAt: new Date().toISOString(),
          teacherNotes: notes !== undefined ? notes : updated[existingIdx].teacherNotes,
        };
        return { studentEvaluations: updated };
      }
      const newEval: StudentMilestoneEvaluation = {
        id: newId('eval'),
        studentId,
        milestoneId,
        competencyScore: score,
        evaluatedAt: new Date().toISOString(),
        teacherNotes: notes,
      };
      return { studentEvaluations: [...state.studentEvaluations, newEval] };
    });
    commitMutation(set, get);
  },

  sessions: saved?.sessions || initialSessions,
  addManualSession: (session) => {
    set((state) => ({ sessions: [session, ...state.sessions] }));
    commitMutation(set, get);
  },
  updateSession: (id, data) => {
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...data } : s)),
    }));
    commitMutation(set, get);
  },
  deleteSession: (id) => {
    set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) }));
    commitMutation(set, get);
  },

  claims: saved?.claims || initialClaims,
  updateClaim: (id, data) => {
    set((state) => ({
      claims: state.claims.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
    commitMutation(set, get);
  },

  parentReports: saved?.parentReports || [],
  addParentReport: (report) => {
    set((state) => ({ parentReports: [report, ...state.parentReports] }));
    commitMutation(set, get);
  },
  updateParentReport: (id, data) => {
    set((state) => ({
      parentReports: state.parentReports.map((r) => (r.id === id ? { ...r, ...data } : r)),
    }));
    commitMutation(set, get);
  },

  isSyncingWithEdge: false,
  isEdgeConnected: false,
  hasUnsyncedChanges: Boolean(saved?.hasUnsyncedChanges),
  lastLocalMutationAt: saved?.lastLocalMutationAt || null,
  lastSyncedAt: saved?.lastSyncedAt || null,

  fetchDatabaseFromEdge: async () => {
    try {
      // Never talk to the edge unless the server confirms this buffer's owner is signed in.
      if (!(await ensureVerified())) {
        set({ isSyncingWithEdge: false, isEdgeConnected: false });
        return false;
      }
      set({ isSyncingWithEdge: true });
      const current = get();
      // If we have unsynced changes from an offline session, push them to D1 first!
      if (current.hasUnsyncedChanges) {
        await current.syncDatabaseToEdge();
      }

      const res = await fetch('/api/sync');
      if (!res.ok) {
        set({ isSyncingWithEdge: false, isEdgeConnected: false });
        return false;
      }
      const json = await res.json() as any;
      if (json?.data) {
        const d = json.data;
        const now = new Date().toISOString();
        set((state) => ({
          teacher: d.teacher ? { ...state.teacher, ...d.teacher } : state.teacher,
          cohorts: (d.cohorts && d.cohorts.length > 0) ? d.cohorts : state.cohorts,
          selectedCohortId: d.cohorts?.[0]?.id || state.selectedCohortId,
          students: (d.students && d.students.length > 0) ? d.students : state.students,
          selectedStudentId: d.students?.[0]?.id || state.selectedStudentId,
          cefrMilestones: (d.cefrMilestones && d.cefrMilestones.length > 0) ? d.cefrMilestones : state.cefrMilestones,
          lessonPlans: (d.lessonPlans && d.lessonPlans.length > 0) ? d.lessonPlans : state.lessonPlans,
          selectedLessonPlanId: d.lessonPlans?.[0]?.id || state.selectedLessonPlanId,
          attendanceRecords: d.attendanceRecords || state.attendanceRecords,
          sessions: (d.sessions && d.sessions.length > 0) ? d.sessions : state.sessions,
          claims: (d.claims && d.claims.length > 0) ? d.claims : state.claims,
          studentEvaluations: d.studentEvaluations || state.studentEvaluations,
          parentReports: d.parentReports || state.parentReports,
          tasks: (d.tasks && d.tasks.length > 0) ? d.tasks : state.tasks,
          isSyncingWithEdge: false,
          isEdgeConnected: true,
          hasUnsyncedChanges: false,
          lastSyncedAt: now,
        }));
        persistState(get());
        return true;
      }
      set({ isSyncingWithEdge: false });
      return false;
    } catch {
      set({ isSyncingWithEdge: false, isEdgeConnected: false });
      return false;
    }
  },

  syncDatabaseToEdge: async () => {
    try {
      // Never push this buffer unless the server confirms its owner is signed in.
      if (!(await ensureVerified())) {
        set({ isSyncingWithEdge: false, isEdgeConnected: false });
        return false;
      }
      set({ isSyncingWithEdge: true });
      const state = get();
      const payload = {
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
      };
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const now = new Date().toISOString();
        set({ 
          isSyncingWithEdge: false, 
          isEdgeConnected: true,
          hasUnsyncedChanges: false, 
          lastSyncedAt: now 
        });
        persistState(get());
        return true;
      }
      set({ isSyncingWithEdge: false });
      return false;
    } catch {
      set({ isSyncingWithEdge: false, isEdgeConnected: false });
      return false;
    }
  },

  resetToDemoData: async () => {
    localStorage.removeItem(STORAGE_KEY);
    const success = await get().fetchDatabaseFromEdge();
    if (!success) {
      set({
        teacher: defaultTeacher,
        cohorts: initialCohorts,
        selectedCohortId: '',
        students: initialStudents,
        selectedStudentId: null,
        attendanceRecords: [],
        lessonPlans: initialLessonPlans,
        selectedLessonPlanId: null,
        tasks: initialTasks,
        sessions: initialSessions,
        claims: initialClaims,
        studentEvaluations: [],
        parentReports: [],
      });
      persistState(get());
    }
  },

  importFullDatabase: (imported) => {
    try {
      if (!imported || typeof imported !== 'object') return false;
      if (imported.cohorts && Array.isArray(imported.cohorts)) {
        set({
          teacher: imported.teacher || get().teacher,
          cohorts: imported.cohorts,
          selectedCohortId: imported.cohorts[0]?.id || '',
          students: imported.students || [],
          selectedStudentId: imported.students?.[0]?.id || null,
          attendanceRecords: imported.attendanceRecords || [],
          lessonPlans: imported.lessonPlans || [],
          selectedLessonPlanId: imported.lessonPlans?.[0]?.id || null,
          tasks: imported.tasks || [],
          sessions: imported.sessions || [],
          claims: imported.claims || [],
          studentEvaluations: imported.studentEvaluations || [],
          parentReports: imported.parentReports || [],
          cefrMilestones: imported.cefrMilestones || get().cefrMilestones,
        });
        persistState(get());
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  // Notifications Center
  notifications: initialNotifications,
  markNotificationAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    }));
    persistState(get());
  },
  markAllNotificationsAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    }));
    persistState(get());
  },
  clearNotifications: () => {
    set({ notifications: [] });
    persistState(get());
  },
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
    }));
    persistState(get());
  },

  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Date.now().toString();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
