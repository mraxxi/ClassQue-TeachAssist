// Cloudflare Pages Function: /api/sync
// Bidirectional D1 sync endpoint with camelCase <-> snake_case translation.
// Authentication: the Cloudflare Access login (see ../_lib/auth.ts); no login -> 401.
//
//   GET  /api/sync                  -> full dataset (+ `cursor`)
//   GET  /api/sync?since=<cursor>   -> DELTA: only records changed after the cursor (+ `deleted` ids)
//   GET  /api/sync?summary=1        -> record counts + last update (cheap, for diagnostics)
//   POST /api/sync                  -> upsert records + soft-delete tombstones
//        { cohorts: [...], ..., deleted: { <entity>: [id | { id, at }] } }
//
// Who is calling: every request must carry a verified login (Cloudflare Access, or DEV_USER_EMAIL locally).
// The server maps that email to a teacher row and acts as that teacher: reads return only that teacher's rows
// and writes can only create or change rows that teacher owns (see `Ownership` below). The browser never
// decides `teacher_id`.
//
// Conflict rule (per record, last-write-wins): every record carries the client's `updatedAt`, stored as
// `client_updated_at`. An upsert or delete only applies when it is NEWER than what is stored; a newer upsert
// also revives a soft-deleted row (this is what makes "Undo delete" work across devices). Rejected writes are
// counted in the response (`rejected`) and the winning version arrives with the next pull.

import { getAuthenticatedEmail, unauthorizedResponse, type AuthEnv } from '../_lib/auth';
import { getOrCreateTeacher, type TeacherRow } from '../_lib/teacher';

interface Env extends AuthEnv {
  DB: D1Database;
}

type Row = Record<string, any>;

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

const unbound = () =>
  reply(503, {
    error: 'Cloudflare D1 binding (DB) is not configured in wrangler.toml or Cloudflare dashboard.',
    status: 'unbound',
  });

/** D1 rejects `undefined`; JSON.stringify drops undefined keys, so optional fields arrive as undefined. */
const nul = (v: unknown) => (v === undefined ? null : v);
/** Number with a default that only applies to null/undefined/NaN — 0 is a legitimate value. */
const num = (v: unknown, fallback: number) => {
  const n = v === null || v === undefined || v === '' ? NaN : Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const parseJson = (v: unknown, fallback: unknown) => {
  if (typeof v !== 'string') return v ?? fallback;
  try {
    return JSON.parse(v || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

// camelCase payload key -> D1 table. Order matters for deletes only in that children are listed with parents.
const TOMBSTONE_TABLES: Record<string, string> = {
  cohorts: 'cohorts',
  students: 'students',
  lessonPlans: 'lesson_plans',
  attendanceRecords: 'attendance_records',
  sessions: 'teaching_sessions',
  claims: 'teaching_claims',
  studentEvaluations: 'student_milestone_evaluations',
  parentReports: 'parent_reports',
  tasks: 'tasks',
};

const COUNT_TABLES: Record<string, string> = {
  cohorts: 'cohorts',
  students: 'students',
  milestones: 'cefr_milestones',
  attendance: 'attendance_records',
  lessonPlans: 'lesson_plans',
  tasks: 'tasks',
  claims: 'teaching_claims',
  sessions: 'teaching_sessions',
  evaluations: 'student_milestone_evaluations',
  reports: 'parent_reports',
};

/** The signed-in teacher, or the Response to send back (401 not signed in, 403 disabled). */
async function resolveTeacher(env: Env, request: Request): Promise<{ me: TeacherRow } | { response: Response }> {
  const email = await getAuthenticatedEmail(request, env);
  if (!email) return { response: unauthorizedResponse() };
  const me = await getOrCreateTeacher(env.DB, email, env.LEGACY_OWNER_EMAIL);
  if (!me) return { response: reply(403, { error: 'This account has been disabled.', status: 'disabled' }) };
  return { me };
}

// SQL fragments that say "belongs to the signed-in teacher" (each takes the teacher id as its one `?`).
// Soft-deleted parents still count, so a delta pull keeps delivering a child's tombstone.
const MY_COHORTS = 'SELECT id FROM cohorts WHERE teacher_id = ?';
const MY_STUDENTS = `SELECT id FROM students WHERE cohort_id IN (${MY_COHORTS})`;
/** Table -> WHERE condition selecting only that teacher's rows. `cefr_milestones` is shared reference data. */
const SCOPE: Record<string, string> = {
  cohorts: 'teacher_id = ?',
  students: `cohort_id IN (${MY_COHORTS})`,
  lesson_plans: 'teacher_id = ?',
  attendance_records: `cohort_id IN (${MY_COHORTS})`,
  teaching_sessions: 'teacher_id = ?',
  teaching_claims: 'teacher_id = ?',
  student_milestone_evaluations: `student_id IN (${MY_STUDENTS})`,
  parent_reports: `cohort_id IN (${MY_COHORTS})`,
  tasks: 'teacher_id = ?',
};

// ---------------------------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------------------------

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) return unbound();

  try {
    const who = await resolveTeacher(env, request);
    if ('response' in who) return who.response;
    const tid = who.me.id;

    if (new URL(request.url).searchParams.get('summary') === '1') {
      const results = await env.DB.batch(
        Object.values(COUNT_TABLES).map((table) =>
          table === 'cefr_milestones'
            ? env.DB.prepare(`SELECT COUNT(*) AS n, NULL AS last FROM ${table}`)
            : env.DB.prepare(`SELECT COUNT(*) AS n, MAX(updated_at) AS last FROM ${table} WHERE deleted_at IS NULL AND ${SCOPE[table]}`).bind(tid)
        )
      );
      const counts: Record<string, number> = {};
      let lastUpdatedAt: string | null = null;
      Object.keys(COUNT_TABLES).forEach((key, i) => {
        const row = (results[i].results?.[0] || {}) as Row;
        counts[key] = Number(row.n) || 0;
        if (row.last && (!lastUpdatedAt || row.last > lastUpdatedAt)) lastUpdatedAt = row.last;
      });
      return reply(200, {
        success: true,
        database: { name: 'classque_db' },
        counts,
        lastUpdatedAt,
        syncedAt: new Date().toISOString(),
      });
    }

    const url = new URL(request.url);
    const since = url.searchParams.get('since');
    // Taken BEFORE the queries so a write landing mid-request is re-delivered next time (idempotent).
    const cursor = new Date().toISOString();
    const isDelta = !!since;

    const all = (table: string) =>
      isDelta
        ? env.DB.prepare(`SELECT * FROM ${table} WHERE updated_at > ? AND ${SCOPE[table]}`).bind(since, tid).all()
        : env.DB.prepare(`SELECT * FROM ${table} WHERE deleted_at IS NULL AND ${SCOPE[table]}`).bind(tid).all();
    const [rawTeachers, rawCohortsAll, rawStudentsAll, rawMilestones, rawLessonsAll, rawAttendanceAll, rawSessionsAll, rawClaimsAll, rawEvalsAll, rawReportsAll, rawTasksAll] =
      await Promise.all([
        env.DB.prepare('SELECT * FROM teachers WHERE id = ? AND deleted_at IS NULL').bind(tid).all(),
        all('cohorts'),
        all('students'),
        isDelta ? Promise.resolve({ results: [] }) : env.DB.prepare('SELECT * FROM cefr_milestones').all(), // static framework
        all('lesson_plans'),
        all('attendance_records'),
        all('teaching_sessions'),
        all('teaching_claims'),
        all('student_milestone_evaluations'),
        all('parent_reports'),
        all('tasks'),
      ]);
    const rows = (r: { results?: unknown[] }) => (r.results || []) as Row[];
    // Delta responses include soft-deleted rows; split them into live records and a `deleted` id list.
    const deleted: Record<string, { id: string; at: string }[]> = {};
    const live = (key: string, raw: { results?: unknown[] }) => {
      const list = rows(raw);
      if (isDelta) {
        const gone = list.filter((r) => r.deleted_at).map((r) => ({ id: r.id as string, at: (r.client_updated_at || r.deleted_at) as string }));
        if (gone.length) deleted[key] = gone;
      }
      return list.filter((r) => !r.deleted_at);
    };
    const rawCohorts = { results: live('cohorts', rawCohortsAll) };
    const rawStudents = { results: live('students', rawStudentsAll) };
    const rawLessons = { results: live('lessonPlans', rawLessonsAll) };
    const rawAttendance = { results: live('attendanceRecords', rawAttendanceAll) };
    const rawSessions = { results: live('sessions', rawSessionsAll) };
    const rawClaims = { results: live('claims', rawClaimsAll) };
    const rawEvals = { results: live('studentEvaluations', rawEvalsAll) };
    const rawReports = { results: live('parentReports', rawReportsAll) };
    const rawTasks = { results: live('tasks', rawTasksAll) };
    /** The client's own edit timestamp travels with every record. */
    const ts = (r: Row) => (r.client_updated_at ? { updatedAt: r.client_updated_at as string } : {});

    const teachers = rows(rawTeachers).map((t) => ({
      id: t.id,
      email: t.email,
      name: t.name,
      schoolName: t.school_name || '',
      schoolLogoUrl: t.school_logo_url || '',
      defaultHourlyRate: num(t.default_hourly_rate, 150000),
      currency: t.currency || 'IDR',
      languagePreference: t.language_preference || 'id',
      themePreference: t.theme_preference || 'light',
    }));

    const cohorts = rows(rawCohorts).map((c) => ({
      id: c.id,
      ...ts(c),
      teacherId: c.teacher_id,
      name: c.name,
      cefrLevel: c.cefr_level || 'A1',
      scheduleDays: parseJson(c.schedule_days, []),
      startTime: c.start_time || '14:00',
      durationMinutes: num(c.duration_minutes, 60),
      roomOrLink: c.room_or_link || '',
      hourlyRateOverride: c.hourly_rate_override === null || c.hourly_rate_override === undefined ? undefined : Number(c.hourly_rate_override),
      isActive: Boolean(c.is_active),
    }));

    const students = rows(rawStudents).map((s) => ({
      id: s.id,
      ...ts(s),
      cohortId: s.cohort_id,
      fullName: s.full_name,
      nickname: s.nickname || '',
      gender: s.gender || 'other',
      dateOfBirth: s.date_of_birth || undefined,
      guardianName: s.guardian_name || '',
      guardianPhone: s.guardian_phone || '',
      guardianEmail: s.guardian_email || '',
      notes: s.notes || '',
      strengths: s.strengths || '',
      growthAreas: s.growth_areas || '',
      isActive: Boolean(s.is_active),
    }));

    const cefrMilestones = rows(rawMilestones).map((m) => ({
      id: m.id,
      cefrLevel: m.cefr_level,
      skillCategory: m.skill_category,
      code: m.code,
      descriptionEn: m.description_en,
      descriptionId: m.description_id,
      canDoStatementEn: m.can_do_statement_en,
      canDoStatementId: m.can_do_statement_id,
    }));

    const lessonPlans = rows(rawLessons).map((l) => ({
      id: l.id,
      ...ts(l),
      teacherId: l.teacher_id,
      cohortId: l.cohort_id || undefined,
      title: l.title,
      topic: l.topic || '',
      cefrLevel: l.cefr_level || 'A1',
      durationMinutes: num(l.duration_minutes, 60),
      warmUp: l.warm_up || '',
      presentation: l.presentation || '',
      practice: l.practice || '',
      production: l.production || '',
      wrapUp: l.wrap_up || '',
      vocabulary: parseJson(l.vocabulary_json, []),
      grammarFocus: l.grammar_focus || '',
      materialsLinks: parseJson(l.materials_links, []),
      homework: l.homework || '',
      isTemplate: Boolean(l.is_template),
    }));

    const attendanceRecords = rows(rawAttendance).map((a) => ({
      id: a.id,
      ...ts(a),
      cohortId: a.cohort_id,
      studentId: a.student_id,
      attendanceDate: a.attendance_date || a.session_date || '',
      status: a.status || 'present',
      note: a.note || undefined,
    }));

    const sessions = rows(rawSessions).map((s) => ({
      id: s.id,
      ...ts(s),
      teacherId: s.teacher_id,
      cohortId: s.cohort_id,
      lessonPlanId: s.lesson_plan_id || undefined,
      sessionDate: s.session_date,
      startTime: s.start_time,
      endTime: s.end_time || undefined,
      durationMinutes: num(s.duration_minutes, 60),
      hourlyRate: num(s.hourly_rate, 0),
      totalClaimAmount: num(s.total_claim_amount, 0),
      status: s.status || 'completed',
      scratchpadNotes: s.scratchpad_notes || '',
    }));

    const claims = rows(rawClaims).map((cl) => ({
      id: cl.id,
      ...ts(cl),
      teacherId: cl.teacher_id,
      claimPeriod: cl.claim_period,
      claimNumber: cl.claim_number,
      totalSessions: num(cl.total_sessions, 0),
      totalHours: num(cl.total_hours, 0),
      baseAmount: num(cl.base_amount, 0),
      allowanceAmount: num(cl.allowance_amount, 0),
      totalClaimAmount: num(cl.total_claim_amount, 0),
      currency: cl.currency || 'IDR',
      status: cl.status || 'draft',
      submittedAt: cl.submitted_at || undefined,
      paidAt: cl.paid_at || undefined,
      notes: cl.notes || undefined,
    }));

    const studentEvaluations = rows(rawEvals).map((ev) => ({
      id: ev.id,
      ...ts(ev),
      studentId: ev.student_id,
      milestoneId: ev.milestone_id,
      competencyScore: Number(ev.competency_score) as 1 | 2 | 3 | 4,
      evaluatedAt: ev.evaluated_at,
      teacherNotes: ev.teacher_notes || undefined,
    }));

    const parentReports = rows(rawReports).map((rp) => ({
      id: rp.id,
      ...ts(rp),
      studentId: rp.student_id,
      cohortId: rp.cohort_id,
      reportPeriod: rp.report_period,
      attendanceRate: num(rp.attendance_rate, 0),
      totalSessionsCount: num(rp.total_sessions_count, 0),
      presentCount: num(rp.present_count, 0),
      milestoneSummaryJson: rp.milestone_summary_json || '',
      teacherNarrativeFeedback: rp.teacher_narrative_feedback || '',
      whatsappBriefText: rp.whatsapp_brief_text || '',
      isSent: Boolean(rp.is_sent),
      sentAt: rp.sent_at || undefined,
    }));

    const tasks = rows(rawTasks).map((tk) => ({
      id: tk.id,
      ...ts(tk),
      teacherId: tk.teacher_id,
      cohortId: tk.cohort_id || undefined,
      title: tk.title,
      priority: tk.priority || 'medium',
      dueDate: tk.due_date || '',
      deadlineType: tk.deadline_type || 'date',
      dueLessonLabel: tk.due_lesson_label || undefined,
      isCompleted: Boolean(tk.is_completed),
      completedAt: tk.completed_at || undefined,
    }));

    return reply(200, {
      success: true,
      syncedAt: cursor,
      cursor,
      delta: isDelta,
      deleted: isDelta ? deleted : undefined,
      data: {
        teacher: teachers[0] || null,
        cohorts,
        students,
        cefrMilestones,
        lessonPlans,
        attendanceRecords,
        sessions,
        claims,
        studentEvaluations,
        parentReports,
        tasks,
      },
    });
  } catch (error: any) {
    return reply(500, { error: error.message || 'D1 query failed' });
  }
};

// ---------------------------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------------------------

const ENTITY_KEYS = [
  'cohorts', 'students', 'lessonPlans', 'attendanceRecords', 'sessions',
  'claims', 'studentEvaluations', 'parentReports', 'tasks',
] as const;

/** Per-entity required fields (everything else has a safe default). Returns a list of problems. */
const REQUIRED: Record<(typeof ENTITY_KEYS)[number], string[]> = {
  cohorts: ['id', 'name'],
  students: ['id', 'cohortId', 'fullName'],
  lessonPlans: ['id', 'title'],
  attendanceRecords: ['id', 'cohortId', 'studentId', 'attendanceDate', 'status'],
  sessions: ['id', 'cohortId', 'sessionDate'],
  claims: ['id', 'claimPeriod'],
  studentEvaluations: ['id', 'studentId', 'milestoneId', 'competencyScore'],
  parentReports: ['id', 'studentId', 'cohortId', 'reportPeriod'],
  tasks: ['id', 'title'],
};

function validate(payload: any): string[] {
  const problems: string[] = [];
  if (payload.teacher !== undefined && (payload.teacher === null || typeof payload.teacher !== 'object')) {
    problems.push('teacher must be an object');
  }
  for (const key of ENTITY_KEYS) {
    const list = payload[key];
    if (list === undefined) continue;
    if (!Array.isArray(list)) {
      problems.push(`${key} must be an array`);
      continue;
    }
    list.forEach((item: any, i: number) => {
      if (!item || typeof item !== 'object') {
        problems.push(`${key}[${i}] must be an object`);
        return;
      }
      for (const field of REQUIRED[key]) {
        if (item[field] === undefined || item[field] === null || item[field] === '') {
          problems.push(`${key}[${i}].${field} is required`);
        }
      }
    });
  }
  if (payload.deleted !== undefined) {
    if (payload.deleted === null || typeof payload.deleted !== 'object') problems.push('deleted must be an object');
    else {
      for (const [key, ids] of Object.entries(payload.deleted)) {
        if (!(key in TOMBSTONE_TABLES)) problems.push(`deleted.${key} is not a known entity`);
        else if (!Array.isArray(ids) || ids.some((x) => !(typeof x === 'string' || (x && typeof (x as any).id === 'string')))) problems.push(`deleted.${key} must be an array of ids or { id, at }`);
      }
    }
  }
  return problems;
}

/** Normalises `deleted` entries: legacy `id` strings or `{ id, at }` (at = the client's delete time). */
function tombstoneEntries(list: unknown[], fallbackAt: string): { id: string; at: string }[] {
  return list.map((x) => (typeof x === 'string' ? { id: x, at: fallbackAt } : { id: (x as any).id as string, at: ((x as any).at as string) || fallbackAt }));
}

type ColSpec = [column: string, value: (r: any, ctx: { teacherId: string }) => unknown];

/**
 * How a table's rows are tied to the signed-in teacher. Every `?` below is bound to the teacher id
 * (parent ids from the record are bound by `parents`).
 *  - `teacher`: the table has `teacher_id`; it is forced to the login's teacher, and an existing row that
 *    belongs to someone else is left untouched.
 *  - `child`: the row belongs through its cohort/student. A NEW row is only inserted when every parent it
 *    names is the teacher's (`parents`), and an EXISTING row is only updated when it already sits under
 *    one of the teacher's cohorts/students (`rowCondition`).
 */
type Ownership =
  | { kind: 'teacher' }
  | { kind: 'child'; parents: (r: any) => { sql: string; ids: string[] }; rowCondition: string };

const cohortIsMine = 'EXISTS (SELECT 1 FROM cohorts WHERE id = ? AND teacher_id = ?)';
const studentIsMine = `EXISTS (SELECT 1 FROM students WHERE id = ? AND cohort_id IN (${MY_COHORTS}))`;

/** camelCase payload key -> table + column mapping used by the generic last-write-wins upsert. */
const UPSERTS: Record<string, { table: string; cols: ColSpec[]; owner: Ownership }> = {
  cohorts: {
    table: 'cohorts',
    owner: { kind: 'teacher' },
    cols: [
      ['id', (c) => c.id], ['teacher_id', (_r, x) => x.teacherId], ['name', (c) => c.name],
      ['cefr_level', (c) => c.cefrLevel ?? 'A1'], ['schedule_days', (c) => JSON.stringify(c.scheduleDays ?? [])],
      ['start_time', (c) => c.startTime ?? '14:00'], ['duration_minutes', (c) => num(c.durationMinutes, 60)],
      ['room_or_link', (c) => c.roomOrLink ?? null],
      ['hourly_rate_override', (c) => (c.hourlyRateOverride === undefined || c.hourlyRateOverride === null ? null : Number(c.hourlyRateOverride))],
      ['is_active', (c) => (c.isActive === false ? 0 : 1)],
    ],
  },
  students: {
    table: 'students',
    owner: { kind: 'child', parents: (r) => ({ sql: cohortIsMine, ids: [r.cohortId] }), rowCondition: `students.cohort_id IN (${MY_COHORTS})` },
    cols: [
      ['id', (s) => s.id], ['cohort_id', (s) => s.cohortId], ['full_name', (s) => s.fullName], ['nickname', (s) => s.nickname ?? null],
      ['gender', (s) => s.gender ?? null], ['date_of_birth', (s) => s.dateOfBirth ?? null], ['guardian_name', (s) => s.guardianName ?? null],
      ['guardian_phone', (s) => s.guardianPhone ?? null], ['guardian_email', (s) => s.guardianEmail ?? null], ['notes', (s) => s.notes ?? null],
      ['strengths', (s) => s.strengths ?? null], ['growth_areas', (s) => s.growthAreas ?? null], ['is_active', (s) => (s.isActive === false ? 0 : 1)],
    ],
  },
  lessonPlans: {
    table: 'lesson_plans',
    owner: { kind: 'teacher' },
    cols: [
      ['id', (l) => l.id], ['teacher_id', (_r, x) => x.teacherId], ['cohort_id', (l) => l.cohortId || null], ['title', (l) => l.title],
      ['topic', (l) => l.topic ?? null], ['cefr_level', (l) => l.cefrLevel ?? 'A1'], ['duration_minutes', (l) => num(l.durationMinutes, 60)],
      ['warm_up', (l) => l.warmUp ?? null], ['presentation', (l) => l.presentation ?? null], ['practice', (l) => l.practice ?? null],
      ['production', (l) => l.production ?? null], ['wrap_up', (l) => l.wrapUp ?? null], ['vocabulary_json', (l) => JSON.stringify(l.vocabulary ?? [])],
      ['grammar_focus', (l) => l.grammarFocus ?? null], ['materials_links', (l) => JSON.stringify(l.materialsLinks ?? [])],
      ['homework', (l) => l.homework ?? null], ['is_template', (l) => (l.isTemplate ? 1 : 0)],
    ],
  },
  attendanceRecords: {
    table: 'attendance_records',
    owner: { kind: 'child', parents: (r) => ({ sql: `${cohortIsMine} AND ${studentIsMine}`, ids: [r.cohortId, r.studentId] }), rowCondition: `attendance_records.cohort_id IN (${MY_COHORTS})` },
    cols: [
      ['id', (a) => a.id], ['cohort_id', (a) => a.cohortId], ['student_id', (a) => a.studentId], ['attendance_date', (a) => a.attendanceDate],
      ['status', (a) => a.status], ['note', (a) => a.note ?? null],
    ],
  },
  sessions: {
    table: 'teaching_sessions',
    owner: { kind: 'teacher' },
    cols: [
      ['id', (s) => s.id], ['teacher_id', (_r, x) => x.teacherId], ['cohort_id', (s) => s.cohortId], ['lesson_plan_id', (s) => s.lessonPlanId ?? null],
      ['session_date', (s) => s.sessionDate], ['start_time', (s) => s.startTime ?? '00:00'], ['duration_minutes', (s) => num(s.durationMinutes, 60)],
      ['hourly_rate', (s) => num(s.hourlyRate, 0)], ['total_claim_amount', (s) => num(s.totalClaimAmount, 0)], ['status', (s) => s.status ?? 'completed'],
      ['scratchpad_notes', (s) => s.scratchpadNotes ?? null],
    ],
  },
  claims: {
    table: 'teaching_claims',
    owner: { kind: 'teacher' },
    cols: [
      ['id', (c) => c.id], ['teacher_id', (_r, x) => x.teacherId], ['claim_period', (c) => c.claimPeriod], ['claim_number', (c) => c.claimNumber ?? null],
      ['total_sessions', (c) => num(c.totalSessions, 0)], ['total_hours', (c) => num(c.totalHours, 0)], ['base_amount', (c) => num(c.baseAmount, 0)],
      ['allowance_amount', (c) => num(c.allowanceAmount, 0)], ['total_claim_amount', (c) => num(c.totalClaimAmount, 0)], ['currency', (c) => c.currency ?? 'IDR'],
      ['status', (c) => c.status ?? 'draft'], ['submitted_at', (c) => c.submittedAt ?? null], ['paid_at', (c) => c.paidAt ?? null], ['notes', (c) => c.notes ?? null],
    ],
  },
  studentEvaluations: {
    table: 'student_milestone_evaluations',
    owner: { kind: 'child', parents: (r) => ({ sql: studentIsMine, ids: [r.studentId] }), rowCondition: `student_milestone_evaluations.student_id IN (${MY_STUDENTS})` },
    cols: [
      ['id', (e) => e.id], ['student_id', (e) => e.studentId], ['milestone_id', (e) => e.milestoneId], ['competency_score', (e) => e.competencyScore],
      ['evaluated_at', (e) => e.evaluatedAt ?? new Date().toISOString()], ['teacher_notes', (e) => e.teacherNotes ?? null],
    ],
  },
  parentReports: {
    table: 'parent_reports',
    owner: { kind: 'child', parents: (r) => ({ sql: `${cohortIsMine} AND ${studentIsMine}`, ids: [r.cohortId, r.studentId] }), rowCondition: `parent_reports.cohort_id IN (${MY_COHORTS})` },
    cols: [
      ['id', (r) => r.id], ['student_id', (r) => r.studentId], ['cohort_id', (r) => r.cohortId], ['report_period', (r) => r.reportPeriod],
      ['attendance_rate', (r) => num(r.attendanceRate, 0)], ['total_sessions_count', (r) => num(r.totalSessionsCount, 0)], ['present_count', (r) => num(r.presentCount, 0)],
      ['milestone_summary_json', (r) => r.milestoneSummaryJson ?? null], ['teacher_narrative_feedback', (r) => r.teacherNarrativeFeedback ?? null],
      ['whatsapp_brief_text', (r) => r.whatsappBriefText ?? null], ['is_sent', (r) => (r.isSent ? 1 : 0)], ['sent_at', (r) => r.sentAt ?? null],
    ],
  },
  tasks: {
    table: 'tasks',
    owner: { kind: 'teacher' },
    cols: [
      ['id', (t) => t.id], ['teacher_id', (_r, x) => x.teacherId], ['cohort_id', (t) => t.cohortId || null], ['title', (t) => t.title],
      ['priority', (t) => t.priority ?? 'medium'], ['due_date', (t) => t.dueDate || null], ['deadline_type', (t) => t.deadlineType ?? 'date'],
      ['due_lesson_label', (t) => t.dueLessonLabel ?? null], ['is_completed', (t) => (t.isCompleted ? 1 : 0)], ['completed_at', (t) => t.completedAt ?? null],
    ],
  },
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) return unbound();

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return reply(400, { error: 'Request body must be valid JSON.' });
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return reply(400, { error: 'Payload must be a JSON object.' });
  }
  const problems = validate(payload);
  if (problems.length > 0) {
    return reply(400, { error: 'Invalid payload.', problems: problems.slice(0, 20) });
  }

  try {
    const who = await resolveTeacher(env, request);
    if ('response' in who) return who.response;
    const db = env.DB;
    const now = new Date().toISOString(); // one clock for the whole request
    // The browser never decides who owns a row: this is always the signed-in teacher.
    const ctx = { teacherId: who.me.id };
    const statements: D1PreparedStatement[] = [];
    const kinds: ('upsert' | 'delete' | 'other')[] = [];
    const add = (kind: 'upsert' | 'delete' | 'other', sql: string, ...values: unknown[]) => {
      statements.push(db.prepare(sql).bind(...values.map(nul)));
      kinds.push(kind);
    };

    // 0. Tombstones (soft delete). Only applies if newer than the row's last edit.
    let deletedCount = 0;
    for (const [key, list] of Object.entries((payload.deleted || {}) as Record<string, unknown[]>)) {
      const table = TOMBSTONE_TABLES[key];
      const entries = tombstoneEntries(list, now);
      deletedCount += entries.length;
      for (let i = 0; i < entries.length; i += 50) {
        const chunk = entries.slice(i, i + 50);
        const at = chunk.map((e) => e.at).sort().pop() as string;
        add(
          'delete',
          `UPDATE ${table} SET deleted_at = ?, updated_at = ?, client_updated_at = ?
             WHERE id IN (${chunk.map(() => '?').join(',')}) AND COALESCE(client_updated_at, '') <= ?
               AND ${SCOPE[table]}`,
          now, now, at, ...chunk.map((e) => e.id), at, ctx.teacherId
        );
      }
    }

    // 1. Teacher profile: only the signed-in teacher's own row. The login decides id and email; the
    //    browser may change the display name, school, rate, currency and language.
    if (payload.teacher) {
      const t = payload.teacher;
      add(
        'other',
        `UPDATE teachers SET name = ?, school_name = ?, default_hourly_rate = ?, currency = ?,
           language_preference = ?, updated_at = ?
         WHERE id = ?`,
        t.name || who.me.name, t.schoolName ?? null, num(t.defaultHourlyRate, 150000), t.currency ?? 'IDR',
        t.languagePreference === 'en' ? 'en' : 'id', now, ctx.teacherId
      );
    }

    // 2. Entities: generic per-record last-write-wins upsert (also revives a soft-deleted row when newer),
    //    guarded so it can only create or change rows the signed-in teacher owns (see `Ownership`).
    for (const [key, spec] of Object.entries(UPSERTS)) {
      for (const rec of payload[key] || []) {
        const cols = spec.cols.map(([c]) => c);
        // Records without a client stamp (legacy) get the OLDEST timestamp so they can never override a real edit.
        const clientTs = (rec.updatedAt as string) || '1970-01-01T00:00:00.000Z';
        const all = [...cols, 'client_updated_at', 'updated_at'];
        const setCols = cols.filter((c) => c !== 'id');
        const values = [...spec.cols.map(([, get]) => get(rec, ctx)), clientTs, now];
        const lww = `COALESCE(${spec.table}.client_updated_at, '') <= excluded.client_updated_at`;
        const update = `DO UPDATE SET
             ${setCols.map((c) => `${c} = excluded.${c}`).join(', ')},
             client_updated_at = excluded.client_updated_at, updated_at = excluded.updated_at, deleted_at = NULL`;
        if (spec.owner.kind === 'teacher') {
          add(
            'upsert',
            `INSERT INTO ${spec.table} (${all.join(', ')}) VALUES (${all.map(() => '?').join(', ')})
             ON CONFLICT(id) ${update}
             WHERE ${lww} AND ${spec.table}.teacher_id = excluded.teacher_id`,
            ...values
          );
        } else {
          const parents = spec.owner.parents(rec);
          // SQLite needs a WHERE on an INSERT ... SELECT that has an upsert clause; the parent check is it.
          add(
            'upsert',
            `INSERT INTO ${spec.table} (${all.join(', ')}) SELECT ${all.map(() => '?').join(', ')}
             WHERE ${parents.sql}
             ON CONFLICT(id) ${update}
             WHERE ${lww} AND ${spec.owner.rowCondition}`,
            ...values, ...parents.ids.flatMap((id) => [id, ctx.teacherId]), ctx.teacherId
          );
        }
      }
    }

    let rejected = 0;
    if (statements.length > 0) {
      const results = await db.batch(statements);
      results.forEach((r, i) => {
        // An upsert/delete that matched no row lost the last-write-wins comparison.
        if ((kinds[i] === 'upsert' || kinds[i] === 'delete') && (r.meta?.changes ?? 0) === 0) rejected++;
      });
    }

    const upserts = kinds.filter((k) => k === 'upsert').length;
    return reply(200, {
      success: true,
      message: `Synchronized ${upserts} records and ${deletedCount} deletions to Cloudflare D1.`,
      rejected,
      cursor: now,
      syncedAt: now,
    });
  } catch (error: any) {
    return reply(500, { error: error.message || 'D1 batch sync failed' });
  }
};
