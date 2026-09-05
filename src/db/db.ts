import Dexie, { type EntityTable } from 'dexie';
import type { 
  Teacher, Cohort, Student, AttendanceRecord, LessonPlan, 
  TeachingSession, CefrMilestone, StudentMilestoneEvaluation, 
  TeachingClaim, ParentReport, TaskItem, NotificationItem 
} from '../types';

export interface SyncMetadata {
  syncStatus: 'synced' | 'pending';
  updatedAt: string;
}

export type TeacherEntity = Teacher & SyncMetadata;
export type CohortEntity = Cohort & SyncMetadata;
export type StudentEntity = Student & SyncMetadata;
export type AttendanceRecordEntity = AttendanceRecord & SyncMetadata;
export type LessonPlanEntity = LessonPlan & SyncMetadata;
export type TeachingSessionEntity = TeachingSession & SyncMetadata;
export type CefrMilestoneEntity = CefrMilestone & SyncMetadata;
export type StudentEvaluationEntity = StudentMilestoneEvaluation & SyncMetadata;
export type TeachingClaimEntity = TeachingClaim & SyncMetadata;
export type ParentReportEntity = ParentReport & SyncMetadata;
export type TaskItemEntity = TaskItem & SyncMetadata;
export type NotificationEntity = NotificationItem & SyncMetadata;

class TeachAssistDB extends Dexie {
  teachers!: EntityTable<TeacherEntity, 'id'>;
  cohorts!: EntityTable<CohortEntity, 'id'>;
  students!: EntityTable<StudentEntity, 'id'>;
  attendanceRecords!: EntityTable<AttendanceRecordEntity, 'id'>;
  lessonPlans!: EntityTable<LessonPlanEntity, 'id'>;
  teachingSessions!: EntityTable<TeachingSessionEntity, 'id'>;
  cefrMilestones!: EntityTable<CefrMilestoneEntity, 'id'>;
  studentEvaluations!: EntityTable<StudentEvaluationEntity, 'id'>;
  teachingClaims!: EntityTable<TeachingClaimEntity, 'id'>;
  parentReports!: EntityTable<ParentReportEntity, 'id'>;
  tasks!: EntityTable<TaskItemEntity, 'id'>;
  notifications!: EntityTable<NotificationEntity, 'id'>;
  syncQueue!: EntityTable<{ id: string, entityType: string, action: 'insert' | 'update' | 'delete', data: any, timestamp: string }, 'id'>;

  constructor() {
    super('TeachAssistDB');
    this.version(1).stores({
      teachers: 'id, syncStatus',
      cohorts: 'id, teacherId, isActive, syncStatus',
      students: 'id, cohortId, isActive, syncStatus',
      attendanceRecords: 'id, sessionId, cohortId, studentId, attendanceDate, syncStatus',
      lessonPlans: 'id, teacherId, cohortId, cefrLevel, isTemplate, syncStatus',
      teachingSessions: 'id, teacherId, cohortId, sessionDate, status, syncStatus',
      cefrMilestones: 'id, cefrLevel, skillCategory, code, syncStatus',
      studentEvaluations: 'id, studentId, milestoneId, syncStatus',
      teachingClaims: 'id, teacherId, claimPeriod, status, syncStatus',
      parentReports: 'id, studentId, cohortId, reportPeriod, isSent, syncStatus',
      tasks: 'id, teacherId, cohortId, priority, dueDate, isCompleted, syncStatus',
      notifications: 'id, category, isRead, syncStatus',
      syncQueue: 'id, entityType, action, timestamp'
    });
  }
}

export const db = new TeachAssistDB();
