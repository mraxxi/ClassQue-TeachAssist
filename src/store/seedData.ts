import { Teacher, Cohort, Student, LessonPlan, TaskItem, CefrMilestone, TeachingSession, TeachingClaim } from '../types';

export const defaultTeacher: Teacher = {
  id: 'teacher-1',
  email: 'teacher@classque.edu',
  name: 'Educator',
  schoolName: 'ClassQue Language Academy',
  schoolLogoUrl: '',
  defaultHourlyRate: 150000,
  currency: 'IDR',
  languagePreference: 'id',
  themePreference: 'light',
};

export const initialCohorts: Cohort[] = [];
export const initialStudents: Student[] = [];
export const initialLessonPlans: LessonPlan[] = [];
export const initialTasks: TaskItem[] = [];
export const initialCefrMilestones: CefrMilestone[] = [];
export const initialSessions: TeachingSession[] = [];
export const initialClaims: TeachingClaim[] = [];
