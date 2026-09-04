export type Language = 'id' | 'en';
export type Theme = 'light' | 'dark' | 'system';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type CEFRLevel = 'Pre-A1' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type SkillCategory = 'listening' | 'reading' | 'spoken_interaction' | 'spoken_production' | 'writing';

export type CompetencyScore = 1 | 2 | 3 | 4;
// 1: Emerging / Mulai Berkembang (MB)
// 2: Developing / Sedang Berkembang (SB)
// 3: Achieved / Tercapai Sesuai Harapan (TC)
// 4: Mastered / Mahir (M)

export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type ClaimStatus = 'draft' | 'submitted' | 'approved' | 'paid';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface Teacher {
  id: string;
  email: string;
  name: string;
  schoolName: string;
  schoolLogoUrl?: string;
  defaultHourlyRate: number;
  currency: string;
  languagePreference: Language;
  themePreference: Theme;
}

export interface Cohort {
  id: string;
  teacherId: string;
  name: string;
  cefrLevel: CEFRLevel;
  scheduleDays: string[]; // ["Mon", "Wed"]
  startTime: string; // "14:00"
  durationMinutes: number; // 90
  roomOrLink: string;
  hourlyRateOverride?: number;
  isActive: boolean;
}

export interface Student {
  id: string;
  cohortId: string;
  fullName: string;
  nickname: string;
  gender: 'M' | 'F' | 'other';
  dateOfBirth?: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  notes?: string;
  strengths?: string;
  growthAreas?: string;
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  sessionId?: string;
  cohortId: string;
  studentId: string;
  attendanceDate: string; // "YYYY-MM-DD"
  status: AttendanceStatus;
  note?: string;
}

export interface VocabularyItem {
  word: string;
  pos: string; // part of speech
  definitionEn: string;
  definitionId: string;
  example: string;
}

export interface LessonPlan {
  id: string;
  teacherId: string;
  cohortId?: string;
  title: string;
  topic: string;
  cefrLevel: CEFRLevel;
  durationMinutes: number;
  warmUp: string; // Stage 1
  presentation: string; // Stage 2
  practice: string; // Stage 3
  production: string; // Stage 4
  wrapUp: string; // Stage 5
  vocabulary: VocabularyItem[];
  grammarFocus: string;
  materialsLinks: string[];
  homework: string;
  isTemplate: boolean;
}

export interface TeachingSession {
  id: string;
  teacherId: string;
  cohortId: string;
  lessonPlanId?: string;
  sessionDate: string; // "YYYY-MM-DD"
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  hourlyRate: number;
  totalClaimAmount: number;
  status: SessionStatus;
  scratchpadNotes?: string;
}

export interface CefrMilestone {
  id: string;
  cefrLevel: CEFRLevel;
  skillCategory: SkillCategory;
  code: string;
  descriptionEn: string;
  descriptionId: string;
  canDoStatementEn: string;
  canDoStatementId: string;
}

export interface StudentMilestoneEvaluation {
  id: string;
  studentId: string;
  milestoneId: string;
  competencyScore: CompetencyScore;
  evaluatedAt: string;
  teacherNotes?: string;
}

export interface TeachingClaim {
  id: string;
  teacherId: string;
  claimPeriod: string; // "YYYY-MM"
  claimNumber: string;
  totalSessions: number;
  totalHours: number;
  baseAmount: number;
  allowanceAmount: number;
  totalClaimAmount: number;
  currency: string;
  status: ClaimStatus;
  submittedAt?: string;
  paidAt?: string;
  notes?: string;
}

export interface ParentReport {
  id: string;
  studentId: string;
  cohortId: string;
  reportPeriod: string;
  attendanceRate: number;
  totalSessionsCount: number;
  presentCount: number;
  milestoneSummaryJson?: string;
  teacherNarrativeFeedback: string;
  whatsappBriefText: string;
  isSent: boolean;
  sentAt?: string;
}

export interface TaskItem {
  id: string;
  teacherId: string;
  cohortId?: string;
  title: string;
  priority: TaskPriority;
  dueDate: string;
  isCompleted: boolean;
  completedAt?: string;
}
