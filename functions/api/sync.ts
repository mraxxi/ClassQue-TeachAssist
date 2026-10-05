// Cloudflare Pages Function: /api/sync
// Bidirectional D1 sync endpoint with camelCase <-> snake_case translation.
// Authentication is enforced by ./_middleware.ts (Bearer SYNC_TOKEN).
//
//   GET  /api/sync              -> full dataset
//   GET  /api/sync?summary=1    -> record counts + last update (cheap, for diagnostics)
//   POST /api/sync              -> upsert records, soft-delete tombstones ({ deleted: { <entity>: [id] } })

interface Env {
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

// ---------------------------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------------------------

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) return unbound();

  try {
    if (new URL(request.url).searchParams.get('summary') === '1') {
      const results = await env.DB.batch(
        Object.values(COUNT_TABLES).map((table) =>
          env.DB.prepare(
            table === 'cefr_milestones'
              ? `SELECT COUNT(*) AS n, NULL AS last FROM ${table}`
              : `SELECT COUNT(*) AS n, MAX(updated_at) AS last FROM ${table} WHERE deleted_at IS NULL`
          )
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

    const q = (sql: string) => env.DB.prepare(sql).all();
    const [rawTeachers, rawCohorts, rawStudents, rawMilestones, rawLessons, rawAttendance, rawSessions, rawClaims, rawEvals, rawReports, rawTasks] =
      await Promise.all([
        q('SELECT * FROM teachers WHERE deleted_at IS NULL'),
        q('SELECT * FROM cohorts WHERE deleted_at IS NULL'),
        q('SELECT * FROM students WHERE deleted_at IS NULL'),
        q('SELECT * FROM cefr_milestones'),
        q('SELECT * FROM lesson_plans WHERE deleted_at IS NULL'),
        q('SELECT * FROM attendance_records WHERE deleted_at IS NULL'),
        q('SELECT * FROM teaching_sessions WHERE deleted_at IS NULL'),
        q('SELECT * FROM teaching_claims WHERE deleted_at IS NULL'),
        q('SELECT * FROM student_milestone_evaluations WHERE deleted_at IS NULL'),
        q('SELECT * FROM parent_reports WHERE deleted_at IS NULL'),
        q('SELECT * FROM tasks WHERE deleted_at IS NULL'),
      ]);
    const rows = (r: { results?: unknown[] }) => (r.results || []) as Row[];

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
      cohortId: a.cohort_id,
      studentId: a.student_id,
      attendanceDate: a.attendance_date || a.session_date || '',
      status: a.status || 'present',
      note: a.note || undefined,
    }));

    const sessions = rows(rawSessions).map((s) => ({
      id: s.id,
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
      studentId: ev.student_id,
      milestoneId: ev.milestone_id,
      competencyScore: Number(ev.competency_score) as 1 | 2 | 3 | 4,
      evaluatedAt: ev.evaluated_at,
      teacherNotes: ev.teacher_notes || undefined,
    }));

    const parentReports = rows(rawReports).map((rp) => ({
      id: rp.id,
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
      syncedAt: new Date().toISOString(),
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
        else if (!Array.isArray(ids) || ids.some((x) => typeof x !== 'string')) problems.push(`deleted.${key} must be an array of ids`);
      }
    }
  }
  return problems;
}

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
    const db = env.DB;
    const teacherId: string = payload.teacher?.id || 'teacher-1';
    const statements: D1PreparedStatement[] = [];
    let upserts = 0;
    const push = (sql: string, ...values: unknown[]) => statements.push(db.prepare(sql).bind(...values.map(nul)));
    const upsert = (sql: string, ...values: unknown[]) => {
      upserts++;
      push(sql, ...values);
    };

    // 0. Tombstones first (soft delete; GET filters deleted_at IS NULL)
    let deletedCount = 0;
    for (const [key, ids] of Object.entries((payload.deleted || {}) as Record<string, string[]>)) {
      const table = TOMBSTONE_TABLES[key];
      for (let i = 0; i < ids.length; i += 50) {
        const chunk = ids.slice(i, i + 50);
        push(
          `UPDATE ${table} SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id IN (${chunk.map(() => '?').join(',')})`,
          ...chunk
        );
      }
      deletedCount += ids.length;
    }

    // 1. Teacher profile
    if (payload.teacher) {
      const t = payload.teacher;
      upsert(
        `INSERT INTO teachers (id, email, name, school_name, default_hourly_rate, currency, language_preference, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           email = excluded.email, name = excluded.name, school_name = excluded.school_name,
           default_hourly_rate = excluded.default_hourly_rate, currency = excluded.currency,
           language_preference = excluded.language_preference, updated_at = datetime('now')`,
        teacherId, t.email ?? 'teacher@classque.edu', t.name ?? 'Educator', t.schoolName ?? null,
        num(t.defaultHourlyRate, 150000), t.currency ?? 'IDR', t.languagePreference ?? 'id'
      );
    }

    // 2. Cohorts
    for (const c of payload.cohorts || []) {
      upsert(
        `INSERT INTO cohorts (id, teacher_id, name, cefr_level, schedule_days, start_time, duration_minutes, room_or_link, hourly_rate_override, is_active, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name, cefr_level = excluded.cefr_level, schedule_days = excluded.schedule_days,
           start_time = excluded.start_time, duration_minutes = excluded.duration_minutes,
           room_or_link = excluded.room_or_link, hourly_rate_override = excluded.hourly_rate_override,
           is_active = excluded.is_active, updated_at = datetime('now')`,
        c.id, c.teacherId ?? teacherId, c.name, c.cefrLevel ?? 'A1', JSON.stringify(c.scheduleDays ?? []),
        c.startTime ?? '14:00', num(c.durationMinutes, 60), c.roomOrLink ?? null,
        c.hourlyRateOverride === undefined || c.hourlyRateOverride === null ? null : Number(c.hourlyRateOverride),
        c.isActive === false ? 0 : 1
      );
    }

    // 3. Students
    for (const s of payload.students || []) {
      upsert(
        `INSERT INTO students (id, cohort_id, full_name, nickname, gender, date_of_birth, guardian_name, guardian_phone, guardian_email, notes, strengths, growth_areas, is_active, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           cohort_id = excluded.cohort_id, full_name = excluded.full_name, nickname = excluded.nickname,
           gender = excluded.gender, date_of_birth = excluded.date_of_birth, guardian_name = excluded.guardian_name,
           guardian_phone = excluded.guardian_phone, guardian_email = excluded.guardian_email, notes = excluded.notes,
           strengths = excluded.strengths, growth_areas = excluded.growth_areas, is_active = excluded.is_active,
           updated_at = datetime('now')`,
        s.id, s.cohortId, s.fullName, s.nickname ?? null, s.gender ?? null, s.dateOfBirth ?? null,
        s.guardianName ?? null, s.guardianPhone ?? null, s.guardianEmail ?? null, s.notes ?? null,
        s.strengths ?? null, s.growthAreas ?? null, s.isActive === false ? 0 : 1
      );
    }

    // 4. Lesson plans
    for (const l of payload.lessonPlans || []) {
      upsert(
        `INSERT INTO lesson_plans (id, teacher_id, cohort_id, title, topic, cefr_level, duration_minutes, warm_up, presentation, practice, production, wrap_up, vocabulary_json, grammar_focus, materials_links, homework, is_template, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           cohort_id = excluded.cohort_id, title = excluded.title, topic = excluded.topic,
           cefr_level = excluded.cefr_level, duration_minutes = excluded.duration_minutes,
           warm_up = excluded.warm_up, presentation = excluded.presentation, practice = excluded.practice,
           production = excluded.production, wrap_up = excluded.wrap_up, vocabulary_json = excluded.vocabulary_json,
           grammar_focus = excluded.grammar_focus, materials_links = excluded.materials_links,
           homework = excluded.homework, is_template = excluded.is_template, updated_at = datetime('now')`,
        l.id, l.teacherId ?? teacherId, l.cohortId || null, l.title, l.topic ?? null, l.cefrLevel ?? 'A1',
        num(l.durationMinutes, 60), l.warmUp ?? null, l.presentation ?? null, l.practice ?? null,
        l.production ?? null, l.wrapUp ?? null, JSON.stringify(l.vocabulary ?? []), l.grammarFocus ?? null,
        JSON.stringify(l.materialsLinks ?? []), l.homework ?? null, l.isTemplate ? 1 : 0
      );
    }

    // 5. Attendance records
    for (const a of payload.attendanceRecords || []) {
      upsert(
        `INSERT INTO attendance_records (id, cohort_id, student_id, attendance_date, status, note, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           attendance_date = excluded.attendance_date, status = excluded.status, note = excluded.note,
           updated_at = datetime('now')`,
        a.id, a.cohortId, a.studentId, a.attendanceDate, a.status, a.note ?? null
      );
    }

    // 6. Teaching sessions
    for (const s of payload.sessions || []) {
      upsert(
        `INSERT INTO teaching_sessions (id, teacher_id, cohort_id, lesson_plan_id, session_date, start_time, duration_minutes, hourly_rate, total_claim_amount, status, scratchpad_notes, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           cohort_id = excluded.cohort_id, lesson_plan_id = excluded.lesson_plan_id,
           session_date = excluded.session_date, start_time = excluded.start_time,
           duration_minutes = excluded.duration_minutes, hourly_rate = excluded.hourly_rate,
           total_claim_amount = excluded.total_claim_amount, status = excluded.status,
           scratchpad_notes = excluded.scratchpad_notes, updated_at = datetime('now')`,
        s.id, s.teacherId ?? teacherId, s.cohortId, s.lessonPlanId ?? null, s.sessionDate, s.startTime ?? '00:00',
        num(s.durationMinutes, 60), num(s.hourlyRate, 0), num(s.totalClaimAmount, 0), s.status ?? 'completed',
        s.scratchpadNotes ?? null
      );
    }

    // 7. Teaching claims
    for (const cl of payload.claims || []) {
      upsert(
        `INSERT INTO teaching_claims (id, teacher_id, claim_period, claim_number, total_sessions, total_hours, base_amount, allowance_amount, total_claim_amount, currency, status, submitted_at, paid_at, notes, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           total_sessions = excluded.total_sessions, total_hours = excluded.total_hours,
           base_amount = excluded.base_amount, allowance_amount = excluded.allowance_amount,
           total_claim_amount = excluded.total_claim_amount, status = excluded.status,
           submitted_at = excluded.submitted_at, paid_at = excluded.paid_at,
           notes = excluded.notes, updated_at = datetime('now')`,
        cl.id, cl.teacherId ?? teacherId, cl.claimPeriod, cl.claimNumber ?? null, num(cl.totalSessions, 0),
        num(cl.totalHours, 0), num(cl.baseAmount, 0), num(cl.allowanceAmount, 0), num(cl.totalClaimAmount, 0),
        cl.currency ?? 'IDR', cl.status ?? 'draft', cl.submittedAt ?? null, cl.paidAt ?? null, cl.notes ?? null
      );
    }

    // 8. Student milestone evaluations
    for (const ev of payload.studentEvaluations || []) {
      upsert(
        `INSERT INTO student_milestone_evaluations (id, student_id, milestone_id, competency_score, evaluated_at, teacher_notes, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           competency_score = excluded.competency_score, teacher_notes = excluded.teacher_notes,
           evaluated_at = excluded.evaluated_at, updated_at = datetime('now')`,
        ev.id, ev.studentId, ev.milestoneId, ev.competencyScore, ev.evaluatedAt ?? new Date().toISOString(), ev.teacherNotes ?? null
      );
    }

    // 9. Parent reports (attendance_rate 0 is a real value)
    for (const rp of payload.parentReports || []) {
      upsert(
        `INSERT INTO parent_reports (id, student_id, cohort_id, report_period, attendance_rate, total_sessions_count, present_count, milestone_summary_json, teacher_narrative_feedback, whatsapp_brief_text, is_sent, sent_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           attendance_rate = excluded.attendance_rate, total_sessions_count = excluded.total_sessions_count,
           present_count = excluded.present_count, milestone_summary_json = excluded.milestone_summary_json,
           teacher_narrative_feedback = excluded.teacher_narrative_feedback,
           whatsapp_brief_text = excluded.whatsapp_brief_text, is_sent = excluded.is_sent,
           sent_at = excluded.sent_at, updated_at = datetime('now')`,
        rp.id, rp.studentId, rp.cohortId, rp.reportPeriod, num(rp.attendanceRate, 0), num(rp.totalSessionsCount, 0),
        num(rp.presentCount, 0), rp.milestoneSummaryJson ?? null, rp.teacherNarrativeFeedback ?? null,
        rp.whatsappBriefText ?? null, rp.isSent ? 1 : 0, rp.sentAt ?? null
      );
    }

    // 10. Tasks
    for (const tk of payload.tasks || []) {
      upsert(
        `INSERT INTO tasks (id, teacher_id, cohort_id, title, priority, due_date, deadline_type, due_lesson_label, is_completed, completed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           cohort_id = excluded.cohort_id, title = excluded.title, priority = excluded.priority,
           due_date = excluded.due_date, deadline_type = excluded.deadline_type,
           due_lesson_label = excluded.due_lesson_label, is_completed = excluded.is_completed,
           completed_at = excluded.completed_at, updated_at = datetime('now')`,
        tk.id, tk.teacherId ?? teacherId, tk.cohortId || null, tk.title, tk.priority ?? 'medium', tk.dueDate || null,
        tk.deadlineType ?? 'date', tk.dueLessonLabel ?? null, tk.isCompleted ? 1 : 0, tk.completedAt ?? null
      );
    }

    if (statements.length > 0) await db.batch(statements);

    return reply(200, {
      success: true,
      message: `Synchronized ${upserts} records and ${deletedCount} deletions to Cloudflare D1.`,
      syncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return reply(500, { error: error.message || 'D1 batch sync failed' });
  }
};
