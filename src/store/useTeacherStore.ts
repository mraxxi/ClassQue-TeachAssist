import { create } from 'zustand';
import { 
  Teacher, Cohort, Student, AttendanceRecord, AttendanceStatus, 
  LessonPlan, TaskItem, CefrMilestone, TeachingSession, TeachingClaim, 
  Language, ParentReport
} from '../types';
import { 
  initialTeacher, initialCohorts, initialStudents, 
  initialLessonPlans, initialTasks, initialCefrMilestones, 
  initialSessions, initialClaims 
} from './seedData';

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

  students: Student[];
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;
  addStudent: (student: Student) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;

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

  // Tasks
  tasks: TaskItem[];
  toggleTask: (id: string) => void;
  addTask: (task: TaskItem) => void;
  deleteTask: (id: string) => void;

  // CEFR Milestones & Evaluations
  cefrMilestones: CefrMilestone[];

  // Claims & Reports
  sessions: TeachingSession[];
  claims: TeachingClaim[];
  parentReports: ParentReport[];
  addParentReport: (report: ParentReport) => void;

  // UI State
  toasts: { id: string; message: string; type: 'info' | 'success' | 'warning' }[];
  addToast: (message: string, type?: 'info' | 'success' | 'warning') => void;
  removeToast: (id: string) => void;
}

const STORAGE_KEY = 'classque_teacher_os_v1';

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

const initialCohortList = (saved?.cohorts && Array.isArray(saved.cohorts) && saved.cohorts.length > 0)
  ? saved.cohorts
  : initialCohorts;

const initialStudentList = (saved?.students && Array.isArray(saved.students) && saved.students.length > 0)
  ? saved.students
  : initialStudents;

const initialTaskList = (saved?.tasks && Array.isArray(saved.tasks) && saved.tasks.length > 0)
  ? saved.tasks
  : initialTasks;

export const useTeacherStore = create<TeacherState>((set, get) => ({
  activeTab: 'cockpit',
  setActiveTab: (tab) => set({ activeTab: tab }),

  language: saved?.language === 'en' ? 'en' : 'id',
  setLanguage: (lang) => {
    set({ language: lang });
    try {
      const current = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        language: lang,
        cohorts: current.cohorts,
        students: current.students,
        tasks: current.tasks,
        attendanceRecords: current.attendanceRecords,
      }));
    } catch (e) {
      console.error(e);
    }
  },

  teacher: saved?.teacher ? { ...initialTeacher, ...saved.teacher } : initialTeacher,
  updateTeacher: (data) => set((state) => ({ teacher: { ...state.teacher, ...data } })),

  cohorts: initialCohortList,
  selectedCohortId: initialCohortList[0]?.id || 'cohort-1',
  setSelectedCohortId: (id) => set({ selectedCohortId: id }),
  addCohort: (cohort) => set((state) => ({ cohorts: [...state.cohorts, cohort] })),
  updateCohort: (id, data) => set((state) => ({
    cohorts: state.cohorts.map((c) => (c.id === id ? { ...c, ...data } : c))
  })),

  students: initialStudentList,
  selectedStudentId: initialStudentList[0]?.id || 'student-1',
  setSelectedStudentId: (id) => set({ selectedStudentId: id }),
  addStudent: (student) => set((state) => ({ students: [...state.students, student] })),
  updateStudent: (id, data) => set((state) => ({
    students: state.students.map((s) => (s.id === id ? { ...s, ...data } : s))
  })),

  attendanceRecords: (saved?.attendanceRecords && Array.isArray(saved.attendanceRecords))
    ? saved.attendanceRecords
    : [
        { id: 'att-1', cohortId: 'cohort-1', studentId: 'student-1', attendanceDate: '2026-09-05', status: 'present' },
        { id: 'att-2', cohortId: 'cohort-1', studentId: 'student-2', attendanceDate: '2026-09-05', status: 'present' },
        { id: 'att-3', cohortId: 'cohort-1', studentId: 'student-3', attendanceDate: '2026-09-05', status: 'present' },
        { id: 'att-4', cohortId: 'cohort-1', studentId: 'student-4', attendanceDate: '2026-09-05', status: 'present' },
        { id: 'att-5', cohortId: 'cohort-1', studentId: 'student-5', attendanceDate: '2026-09-05', status: 'late', note: 'Traffic' },
      ],
  setAttendance: (studentId, cohortId, date, status, note) => {
    set((state) => {
      const existing = state.attendanceRecords.findIndex(
        (r) => r.studentId === studentId && r.attendanceDate === date
      );
      if (existing >= 0) {
        const updated = [...state.attendanceRecords];
        updated[existing] = { ...updated[existing], status, note };
        return { attendanceRecords: updated };
      } else {
        const newRecord: AttendanceRecord = {
          id: `att-${Date.now()}-${studentId}`,
          cohortId,
          studentId,
          attendanceDate: date,
          status,
          note
        };
        return { attendanceRecords: [...state.attendanceRecords, newRecord] };
      }
    });
  },
  batchMarkAllPresent: (cohortId, date) => {
    const { students } = get();
    const cohortStudents = students.filter((s) => s.cohortId === cohortId);
    cohortStudents.forEach((st) => {
      get().setAttendance(st.id, cohortId, date, 'present');
    });
  },

  // Live Stopwatch
  isLiveCockpitOpen: false,
  setLiveCockpitOpen: (open) => set({ isLiveCockpitOpen: open }),
  activeSessionCohortId: 'cohort-1',
  stopwatchSeconds: 195, // 03:15 for instant demo feel
  isStopwatchRunning: false,
  startLiveSession: (cohortId) => {
    set({
      isLiveCockpitOpen: true,
      activeSessionCohortId: cohortId,
      isStopwatchRunning: true,
    });
  },
  pauseLiveSession: () => set({ isStopwatchRunning: false }),
  resumeLiveSession: () => set({ isStopwatchRunning: true }),
  tickStopwatch: () => set((state) => ({ stopwatchSeconds: state.stopwatchSeconds + 1 })),
  finishLiveSession: (notes) => {
    const { activeSessionCohortId, stopwatchSeconds, cohorts, teacher, sessions } = get();
    const cohort = cohorts.find((c) => c.id === activeSessionCohortId);
    const durationMinutes = Math.round(stopwatchSeconds / 60);
    const hourlyRate = cohort?.hourlyRateOverride || teacher.defaultHourlyRate;
    const totalClaim = Math.round((durationMinutes / 60) * hourlyRate);

    const newSession: TeachingSession = {
      id: `sess-${Date.now()}`,
      teacherId: teacher.id,
      cohortId: activeSessionCohortId || 'cohort-1',
      sessionDate: new Date().toISOString().split('T')[0],
      startTime: new Date(Date.now() - stopwatchSeconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: durationMinutes || 1,
      hourlyRate,
      totalClaimAmount: totalClaim,
      status: 'completed',
      scratchpadNotes: notes,
    };

    set({
      isLiveCockpitOpen: false,
      isStopwatchRunning: false,
      stopwatchSeconds: 0,
      sessions: [newSession, ...sessions],
    });

    return newSession;
  },

  lessonPlans: saved?.lessonPlans || initialLessonPlans,
  selectedLessonPlanId: initialLessonPlans[0].id,
  setSelectedLessonPlanId: (id) => set({ selectedLessonPlanId: id }),
  addLessonPlan: (plan) => set((state) => ({ lessonPlans: [plan, ...state.lessonPlans] })),

  tasks: initialTaskList,
  toggleTask: (id) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
  })),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  deleteTask: (id) => set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

  cefrMilestones: initialCefrMilestones,

  sessions: saved?.sessions || initialSessions,
  claims: saved?.claims || initialClaims,
  parentReports: saved?.parentReports || [],
  addParentReport: (report) => set((state) => ({ parentReports: [report, ...state.parentReports] })),

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
