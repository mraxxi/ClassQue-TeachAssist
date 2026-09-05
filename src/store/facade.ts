import { useTeacherStore as useZustandStore } from './useTeacherStore';
import { 
  useCohorts, useStudents, useTasks, useLessonPlans, 
  useSessions, useClaims, useAttendanceRecords, 
  useStudentEvaluations, useParentReports, useCefrMilestones 
} from '../hooks/useDataHooks';
import type { TeacherState } from './useTeacherStore';

export function useTeacherStore(): TeacherState {
  const store = useZustandStore();
  
  // Connect React Query domain data to the store facade
  const { data: cohorts = store.cohorts } = useCohorts(store.teacher.id);
  const { data: students = store.students } = useStudents();
  const { data: tasks = store.tasks } = useTasks(store.teacher.id);
  const { data: lessonPlans = store.lessonPlans } = useLessonPlans(store.teacher.id);
  const { data: sessions = store.sessions } = useSessions(store.teacher.id);
  const { data: claims = store.claims } = useClaims(store.teacher.id);
  const { data: attendanceRecords = store.attendanceRecords } = useAttendanceRecords();
  const { data: studentEvaluations = store.studentEvaluations } = useStudentEvaluations();
  const { data: parentReports = store.parentReports } = useParentReports();
  const { data: cefrMilestones = store.cefrMilestones } = useCefrMilestones();

  // We return a proxy-like object that merges the React Query data with the Zustand methods
  // For methods that modify data, they currently still modify Zustand.
  // In a complete refactor, those methods in `useTeacherStore.ts` would be replaced with
  // calls to the React Query mutations (like `useAddCohort`).
  // For this V2 pivot, we ensure the UI reads from Dexie/React Query automatically.
  
  return {
    ...store,
    cohorts,
    students,
    tasks,
    lessonPlans,
    sessions,
    claims,
    attendanceRecords,
    studentEvaluations,
    parentReports,
    cefrMilestones,
  } as TeacherState;
}

// Export the underlying store for non-component usages if needed (like the auto-sync timer)
export { useZustandStore };
