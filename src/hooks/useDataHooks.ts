import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, CohortEntity, StudentEntity } from '../db/db';
import { queueSyncAction } from '../db/sync';
import type { Cohort, Student } from '../types';

// -- COHORTS --

export function useCohorts(teacherId: string) {
  return useQuery({
    queryKey: ['cohorts', teacherId],
    queryFn: () => db.cohorts.where('teacherId').equals(teacherId).toArray(),
    // We rely on Dexie as the single source of truth locally, so we only refetch if invalidated
    staleTime: Infinity, 
  });
}

export function useAddCohort() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (cohort: Cohort) => {
      const newCohort: CohortEntity = {
        ...cohort,
        syncStatus: 'pending',
        updatedAt: new Date().toISOString()
      };
      await db.cohorts.add(newCohort);
      await queueSyncAction('cohorts', 'insert', newCohort);
      return newCohort;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cohorts', data.teacherId] });
    }
  });
}

export function useUpdateCohort() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Cohort> }) => {
      const updateData = { ...data, syncStatus: 'pending', updatedAt: new Date().toISOString() };
      await db.cohorts.update(id, updateData as any);
      const updated = await db.cohorts.get(id);
      await queueSyncAction('cohorts', 'update', updated);
      return updated;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['cohorts', data.teacherId] });
      }
    }
  });
}

export function useDeleteCohort() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, teacherId }: { id: string, teacherId: string }) => {
      await db.cohorts.delete(id);
      await queueSyncAction('cohorts', 'delete', { id });
      return { id, teacherId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cohorts', data.teacherId] });
    }
  });
}


// -- STUDENTS --

export function useStudents(cohortId?: string) {
  return useQuery({
    queryKey: ['students', cohortId],
    queryFn: async () => {
      if (cohortId) {
        return db.students.where('cohortId').equals(cohortId).toArray();
      }
      return db.students.toArray();
    },
    staleTime: Infinity,
    enabled: true, // always enabled, will fetch all if no cohortId
  });
}

export function useAddStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (student: Student) => {
      const newStudent: StudentEntity = {
        ...student,
        syncStatus: 'pending',
        updatedAt: new Date().toISOString()
      };
      await db.students.add(newStudent);
      await queueSyncAction('students', 'insert', newStudent);
      return newStudent;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students', data.cohortId] });
      queryClient.invalidateQueries({ queryKey: ['students', undefined] });
    }
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Student> }) => {
      const updateData = { ...data, syncStatus: 'pending', updatedAt: new Date().toISOString() };
      await db.students.update(id, updateData as any);
      const updated = await db.students.get(id);
      await queueSyncAction('students', 'update', updated);
      return updated;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['students', data.cohortId] });
        queryClient.invalidateQueries({ queryKey: ['students', undefined] });
      }
    }
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, cohortId }: { id: string, cohortId: string }) => {
      await db.students.delete(id);
      await queueSyncAction('students', 'delete', { id });
      return { id, cohortId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students', data.cohortId] });
      queryClient.invalidateQueries({ queryKey: ['students', undefined] });
    }
  });
}

// -- GENERIC HOOKS FOR OTHER DOMAINS --

export function useGenericQuery(key: string, queryFn: () => Promise<any[]>) {
  return useQuery({
    queryKey: [key],
    queryFn,
    staleTime: Infinity,
  });
}

export function useTasks(teacherId: string) {
  return useQuery({
    queryKey: ['tasks', teacherId],
    queryFn: () => db.tasks.where('teacherId').equals(teacherId).toArray(),
    staleTime: Infinity,
  });
}

export function useLessonPlans(teacherId: string) {
  return useQuery({
    queryKey: ['lessonPlans', teacherId],
    queryFn: () => db.lessonPlans.where('teacherId').equals(teacherId).toArray(),
    staleTime: Infinity,
  });
}

export function useSessions(teacherId: string) {
  return useQuery({
    queryKey: ['sessions', teacherId],
    queryFn: () => db.teachingSessions.where('teacherId').equals(teacherId).toArray(),
    staleTime: Infinity,
  });
}

export function useClaims(teacherId: string) {
  return useQuery({
    queryKey: ['claims', teacherId],
    queryFn: () => db.teachingClaims.where('teacherId').equals(teacherId).toArray(),
    staleTime: Infinity,
  });
}

export function useAttendanceRecords() {
  return useQuery({
    queryKey: ['attendanceRecords'],
    queryFn: () => db.attendanceRecords.toArray(),
    staleTime: Infinity,
  });
}

export function useStudentEvaluations() {
  return useQuery({
    queryKey: ['studentEvaluations'],
    queryFn: () => db.studentEvaluations.toArray(),
    staleTime: Infinity,
  });
}

export function useParentReports() {
  return useQuery({
    queryKey: ['parentReports'],
    queryFn: () => db.parentReports.toArray(),
    staleTime: Infinity,
  });
}

export function useCefrMilestones() {
  return useQuery({
    queryKey: ['cefrMilestones'],
    queryFn: () => db.cefrMilestones.toArray(),
    staleTime: Infinity,
  });
}

// NOTE: Mutation hooks for everything else can be added here as needed,
// but for the facade we'll just use queryClient directly or add them later.
