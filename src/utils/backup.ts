import type {
  AttendanceRecord, CefrMilestone, Cohort, LessonPlan, ParentReport, Student,
  StudentMilestoneEvaluation, Teacher, TaskItem, TeachingClaim, TeachingSession,
} from '../types';

export interface BackupData {
  teacher?: Teacher;
  cohorts: Cohort[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  lessonPlans: LessonPlan[];
  tasks: TaskItem[];
  sessions: TeachingSession[];
  claims: TeachingClaim[];
  studentEvaluations: StudentMilestoneEvaluation[];
  parentReports: ParentReport[];
  cefrMilestones?: CefrMilestone[];
}

export type BackupResult = { ok: true; data: BackupData } | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isStr = (v: unknown) => typeof v === 'string' && v.length > 0;

/** [key, required string fields]. Every list is optional but, when present, must be well-formed. */
const SHAPES: [keyof BackupData, string[]][] = [
  ['cohorts', ['id', 'name']],
  ['students', ['id', 'cohortId', 'fullName']],
  ['attendanceRecords', ['id', 'cohortId', 'studentId', 'attendanceDate', 'status']],
  ['lessonPlans', ['id', 'title']],
  ['tasks', ['id', 'title']],
  ['sessions', ['id', 'cohortId', 'sessionDate']],
  ['claims', ['id', 'claimPeriod']],
  ['studentEvaluations', ['id', 'studentId', 'milestoneId']],
  ['parentReports', ['id', 'studentId', 'cohortId', 'reportPeriod']],
  ['cefrMilestones', ['id', 'code']],
];

/**
 * Validates a parsed backup COMPLETELY before anything is applied, so a bad file can never
 * leave the app half-restored. Returns normalised data (missing lists become `[]`).
 */
export function validateBackup(raw: unknown): BackupResult {
  if (!isObj(raw)) return { ok: false, error: 'Backup must be a JSON object.' };
  if (!Array.isArray(raw.cohorts)) return { ok: false, error: 'Backup is missing the "cohorts" list.' };
  if (raw.teacher !== undefined && raw.teacher !== null && !isObj(raw.teacher)) {
    return { ok: false, error: '"teacher" must be an object.' };
  }

  const out: Record<string, unknown> = {};
  for (const [key, required] of SHAPES) {
    const list = raw[key];
    if (list === undefined || list === null) {
      out[key] = [];
      continue;
    }
    if (!Array.isArray(list)) return { ok: false, error: `"${key}" must be a list.` };
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (!isObj(item)) return { ok: false, error: `"${key}[${i}]" must be an object.` };
      const missing = required.find((f) => !isStr(item[f]));
      if (missing) return { ok: false, error: `"${key}[${i}]" is missing "${missing}".` };
    }
    out[key] = list;
  }
  // Referential sanity: students must point at a cohort in the file.
  const cohortIds = new Set((out.cohorts as Cohort[]).map((c) => c.id));
  const orphan = (out.students as Student[]).find((s) => !cohortIds.has(s.cohortId));
  if (orphan) return { ok: false, error: `Student "${orphan.fullName}" references an unknown cohort.` };

  if (raw.teacher) out.teacher = raw.teacher;
  if (!(raw.cefrMilestones as unknown[] | undefined)?.length) delete out.cefrMilestones;
  return { ok: true, data: out as unknown as BackupData };
}
