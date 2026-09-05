// Cloudflare Pages Function: /api/sync
// Bidirectional D1 Sync Endpoint with camelCase <-> snake_case translation

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  if (!env.DB) {
    return new Response(
      JSON.stringify({ 
        error: 'Cloudflare D1 binding (DB) is not configured in wrangler.toml or Cloudflare dashboard.',
        status: 'unbound'
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const rawTeachers = await env.DB.prepare('SELECT * FROM teachers WHERE deleted_at IS NULL').all();
    const rawCohorts = await env.DB.prepare('SELECT * FROM cohorts WHERE deleted_at IS NULL').all();
    const rawStudents = await env.DB.prepare('SELECT * FROM students WHERE deleted_at IS NULL').all();
    const rawMilestones = await env.DB.prepare('SELECT * FROM cefr_milestones').all();
    const rawLessons = await env.DB.prepare('SELECT * FROM lesson_plans WHERE deleted_at IS NULL').all();
    const rawAttendance = await env.DB.prepare('SELECT * FROM attendance_records WHERE deleted_at IS NULL').all();
    const rawSessions = await env.DB.prepare('SELECT * FROM teaching_sessions WHERE deleted_at IS NULL').all();
    const rawClaims = await env.DB.prepare('SELECT * FROM teaching_claims WHERE deleted_at IS NULL').all();
    const rawEvals = await env.DB.prepare('SELECT * FROM student_milestone_evaluations WHERE deleted_at IS NULL').all();
    const rawReports = await env.DB.prepare('SELECT * FROM parent_reports WHERE deleted_at IS NULL').all();
    const rawTasks = await env.DB.prepare('SELECT * FROM tasks WHERE deleted_at IS NULL').all();

    // Map Teachers
    const teachers = (rawTeachers.results || []).map((t: any) => ({
      id: t.id,
      email: t.email,
      name: t.name,
      schoolName: t.school_name || '',
      schoolLogoUrl: t.school_logo_url || '',
      defaultHourlyRate: Number(t.default_hourly_rate) || 150000,
      currency: t.currency || 'IDR',
      languagePreference: t.language_preference || 'id',
      themePreference: t.theme_preference || 'light',
    }));

    // Map Cohorts
    const cohorts = (rawCohorts.results || []).map((c: any) => ({
      id: c.id,
      teacherId: c.teacher_id,
      name: c.name,
      cefrLevel: c.cefr_level || 'A1',
      scheduleDays: typeof c.schedule_days === 'string' ? JSON.parse(c.schedule_days || '[]') : (c.schedule_days || []),
      startTime: c.start_time || '14:00',
      durationMinutes: Number(c.duration_minutes) || 60,
      roomOrLink: c.room_or_link || '',
      hourlyRateOverride: c.hourly_rate_override ? Number(c.hourly_rate_override) : undefined,
      isActive: Boolean(c.is_active),
    }));

    // Map Students
    const students = (rawStudents.results || []).map((s: any) => ({
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

    // Map CEFR Milestones
    const cefrMilestones = (rawMilestones.results || []).map((m: any) => ({
      id: m.id,
      cefrLevel: m.cefr_level,
      skillCategory: m.skill_category,
      code: m.code,
      descriptionEn: m.description_en,
      descriptionId: m.description_id,
      canDoStatementEn: m.can_do_statement_en,
      canDoStatementId: m.can_do_statement_id,
    }));

    // Map Lesson Plans
    const lessonPlans = (rawLessons.results || []).map((l: any) => ({
      id: l.id,
      teacherId: l.teacher_id,
      cohortId: l.cohort_id || undefined,
      title: l.title,
      topic: l.topic || '',
      cefrLevel: l.cefr_level || 'A1',
      durationMinutes: Number(l.duration_minutes) || 60,
      warmUp: l.warm_up || '',
      presentation: l.presentation || '',
      practice: l.practice || '',
      production: l.production || '',
      wrapUp: l.wrap_up || '',
      vocabulary: typeof l.vocabulary_json === 'string' ? JSON.parse(l.vocabulary_json || '[]') : (l.vocabulary_json || []),
      grammarFocus: l.grammar_focus || '',
      materialsLinks: typeof l.materials_links === 'string' ? JSON.parse(l.materials_links || '[]') : (l.materials_links || []),
      homework: l.homework || '',
      isTemplate: Boolean(l.is_template),
    }));

    // Map Attendance Records
    const attendanceRecords = (rawAttendance.results || []).map((a: any) => ({
      id: a.id,
      cohortId: a.cohort_id,
      studentId: a.student_id,
      attendanceDate: a.attendance_date || a.session_date || '2026-09-05',
      status: a.status || 'present',
      note: a.note || undefined,
    }));

    // Map Teaching Sessions
    const teachingSessions = (rawSessions.results || []).map((sess: any) => ({
      id: sess.id,
      teacherId: sess.teacher_id,
      cohortId: sess.cohort_id,
      lessonPlanId: sess.lesson_plan_id || undefined,
      sessionDate: sess.session_date,
      startTime: sess.start_time,
      endTime: sess.end_time || undefined,
      durationMinutes: Number(sess.duration_minutes) || 60,
      hourlyRate: Number(sess.hourly_rate) || 150000,
      totalClaimAmount: Number(sess.total_claim_amount) || 150000,
      status: sess.status || 'completed',
      scratchpadNotes: sess.scratchpad_notes || '',
    }));

    // Map Teaching Claims
    const teachingClaims = (rawClaims.results || []).map((cl: any) => ({
      id: cl.id,
      teacherId: cl.teacher_id,
      claimPeriod: cl.claim_period,
      claimNumber: cl.claim_number,
      totalSessions: Number(cl.total_sessions) || 0,
      totalHours: Number(cl.total_hours) || 0,
      baseAmount: Number(cl.base_amount) || 0,
      allowanceAmount: Number(cl.allowance_amount) || 0,
      totalClaimAmount: Number(cl.total_claim_amount) || 0,
      currency: cl.currency || 'IDR',
      status: cl.status || 'draft',
      submittedAt: cl.submitted_at || undefined,
      paidAt: cl.paid_at || undefined,
      notes: cl.notes || undefined,
    }));

    // Map Student Milestone Evaluations
    const studentEvaluations = (rawEvals.results || []).map((ev: any) => ({
      id: ev.id,
      studentId: ev.student_id,
      milestoneId: ev.milestone_id,
      competencyScore: Number(ev.competency_score) as 1 | 2 | 3 | 4,
      evaluatedAt: ev.evaluated_at,
      teacherNotes: ev.teacher_notes || undefined,
    }));

    // Map Parent Reports
    const parentReports = (rawReports.results || []).map((rp: any) => ({
      id: rp.id,
      studentId: rp.student_id,
      cohortId: rp.cohort_id,
      reportPeriod: rp.report_period,
      attendanceRate: Number(rp.attendance_rate) || 100,
      totalSessionsCount: Number(rp.total_sessions_count) || 0,
      presentCount: Number(rp.present_count) || 0,
      milestoneSummaryJson: rp.milestone_summary_json || '',
      teacherNarrativeFeedback: rp.teacher_narrative_feedback || '',
      whatsappBriefText: rp.whatsapp_brief_text || '',
      isSent: Boolean(rp.is_sent),
      sentAt: rp.sent_at || undefined,
    }));

    // Map Tasks
    const tasks = (rawTasks.results || []).map((tk: any) => ({
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

    return new Response(
      JSON.stringify({
        success: true,
        syncedAt: new Date().toISOString(),
        data: {
          teacher: teachers[0] || null,
          cohorts,
          students,
          cefrMilestones,
          lessonPlans,
          attendanceRecords,
          sessions: teachingSessions,
          claims: teachingClaims,
          studentEvaluations,
          parentReports,
          tasks,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'D1 query failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  if (!env.DB) {
    return new Response(
      JSON.stringify({ 
        error: 'Cloudflare D1 binding (DB) is not configured in wrangler.toml or Cloudflare dashboard.',
        status: 'unbound'
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const payload = await request.json() as any;
    if (!payload || typeof payload !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }

    const statements: D1PreparedStatement[] = [];

    // 1. Sync Teacher Profile
    if (payload.teacher) {
      const t = payload.teacher;
      statements.push(
        env.DB.prepare(`
          INSERT INTO teachers (id, email, name, school_name, default_hourly_rate, currency, language_preference, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            email = excluded.email,
            name = excluded.name,
            school_name = excluded.school_name,
            default_hourly_rate = excluded.default_hourly_rate,
            currency = excluded.currency,
            language_preference = excluded.language_preference,
            updated_at = datetime('now')
        `).bind(
          t.id || 'teacher-1',
          t.email || 'teacher@classque.edu',
          t.name || 'Educator',
          t.schoolName || null,
          t.defaultHourlyRate || 150000,
          t.currency || 'IDR',
          t.languagePreference || 'id'
        )
      );
    }

    // 2. Sync Cohorts
    if (Array.isArray(payload.cohorts)) {
      for (const c of payload.cohorts) {
        statements.push(
          env.DB.prepare(`
            INSERT INTO cohorts (id, teacher_id, name, cefr_level, schedule_days, start_time, duration_minutes, room_or_link, hourly_rate_override, is_active, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              cefr_level = excluded.cefr_level,
              schedule_days = excluded.schedule_days,
              start_time = excluded.start_time,
              duration_minutes = excluded.duration_minutes,
              room_or_link = excluded.room_or_link,
              hourly_rate_override = excluded.hourly_rate_override,
              updated_at = datetime('now')
          `).bind(
            c.id, 
            c.teacherId || payload.teacher?.id || 'teacher-1',
            c.name,
            c.cefrLevel || 'A1',
            JSON.stringify(c.scheduleDays || []),
            c.startTime || '14:00',
            c.durationMinutes || 60,
            c.roomOrLink || null,
            c.hourlyRateOverride || null
          )
        );
      }
    }

    // 3. Sync Students
    if (Array.isArray(payload.students)) {
      for (const s of payload.students) {
        statements.push(
          env.DB.prepare(`
            INSERT INTO students (id, cohort_id, full_name, nickname, gender, date_of_birth, guardian_name, guardian_phone, guardian_email, notes, strengths, growth_areas, is_active, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
              cohort_id = excluded.cohort_id,
              full_name = excluded.full_name,
              nickname = excluded.nickname,
              gender = excluded.gender,
              date_of_birth = excluded.date_of_birth,
              guardian_name = excluded.guardian_name,
              guardian_phone = excluded.guardian_phone,
              guardian_email = excluded.guardian_email,
              notes = excluded.notes,
              strengths = excluded.strengths,
              growth_areas = excluded.growth_areas,
              updated_at = datetime('now')
          `).bind(
            s.id,
            s.cohortId,
            s.fullName,
            s.nickname || null,
            s.gender || null,
            s.dateOfBirth || null,
            s.guardianName || null,
            s.guardianPhone || null,
            s.guardianEmail || null,
            s.notes || null,
            s.strengths || null,
            s.growthAreas || null
          )
        );
      }
    }

    // 4. Sync Lesson Plans
    if (Array.isArray(payload.lessonPlans)) {
      for (const l of payload.lessonPlans) {
        statements.push(
          env.DB.prepare(`
            INSERT INTO lesson_plans (id, teacher_id, cohort_id, title, topic, cefr_level, duration_minutes, warm_up, presentation, practice, production, wrap_up, vocabulary_json, grammar_focus, materials_links, homework, is_template, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
              cohort_id = excluded.cohort_id, title = excluded.title, topic = excluded.topic,
              cefr_level = excluded.cefr_level, duration_minutes = excluded.duration_minutes,
              warm_up = excluded.warm_up, presentation = excluded.presentation,
              practice = excluded.practice, production = excluded.production,
              wrap_up = excluded.wrap_up, vocabulary_json = excluded.vocabulary_json,
              grammar_focus = excluded.grammar_focus, materials_links = excluded.materials_links,
              homework = excluded.homework, is_template = excluded.is_template,
              updated_at = datetime('now')
          `).bind(
            l.id, l.teacherId || payload.teacher?.id || 'teacher-1', l.cohortId || null, l.title, l.topic || null, l.cefrLevel || 'A1', l.durationMinutes || 60, l.warmUp || null, l.presentation || null, l.practice || null, l.production || null, l.wrapUp || null, JSON.stringify(l.vocabulary || []), l.grammarFocus || null, JSON.stringify(l.materialsLinks || []), l.homework || null, l.isTemplate ? 1 : 0
          )
        );
      }
    }

    // 5. Sync Attendance Records
    if (Array.isArray(payload.attendanceRecords)) {
      for (const a of payload.attendanceRecords) {
        statements.push(
          env.DB.prepare(`
            INSERT INTO attendance_records (id, cohort_id, student_id, attendance_date, status, note, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
              status = excluded.status, note = excluded.note, updated_at = datetime('now')
          `).bind(
            a.id, a.cohortId, a.studentId, a.attendanceDate, a.status, a.note || null
          )
        );
      }
    }

    // 6. Sync Teaching Sessions
    if (Array.isArray(payload.sessions)) {
      for (const s of payload.sessions) {
        statements.push(
          env.DB.prepare(`
            INSERT INTO teaching_sessions (id, teacher_id, cohort_id, lesson_plan_id, session_date, start_time, duration_minutes, hourly_rate, total_claim_amount, status, scratchpad_notes, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
              duration_minutes = excluded.duration_minutes, hourly_rate = excluded.hourly_rate,
              total_claim_amount = excluded.total_claim_amount, status = excluded.status,
              scratchpad_notes = excluded.scratchpad_notes, updated_at = datetime('now')
          `).bind(
            s.id, s.teacherId || payload.teacher?.id || 'teacher-1', s.cohortId, s.lessonPlanId || null, s.sessionDate, s.startTime, s.durationMinutes, s.hourlyRate, s.totalClaimAmount, s.status || 'completed', s.scratchpadNotes || null
          )
        );
      }
    }

    // 7. Sync Teaching Claims
    if (Array.isArray(payload.claims)) {
      for (const cl of payload.claims) {
        statements.push(
          env.DB.prepare(`
            INSERT INTO teaching_claims (id, teacher_id, claim_period, claim_number, total_sessions, total_hours, base_amount, allowance_amount, total_claim_amount, currency, status, submitted_at, paid_at, notes, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
              total_sessions = excluded.total_sessions, total_hours = excluded.total_hours,
              base_amount = excluded.base_amount, allowance_amount = excluded.allowance_amount,
              total_claim_amount = excluded.total_claim_amount, status = excluded.status,
              submitted_at = excluded.submitted_at, paid_at = excluded.paid_at,
              notes = excluded.notes, updated_at = datetime('now')
          `).bind(
            cl.id, cl.teacherId || payload.teacher?.id || 'teacher-1', cl.claimPeriod, cl.claimNumber || null, cl.totalSessions || 0, cl.totalHours || 0, cl.baseAmount || 0, cl.allowanceAmount || 0, cl.totalClaimAmount || 0, cl.currency || 'IDR', cl.status || 'draft', cl.submittedAt || null, cl.paidAt || null, cl.notes || null
          )
        );
      }
    }

    // 8. Sync Student Milestone Evaluations
    if (Array.isArray(payload.studentEvaluations)) {
      for (const ev of payload.studentEvaluations) {
        statements.push(
          env.DB.prepare(`
            INSERT INTO student_milestone_evaluations (id, student_id, milestone_id, competency_score, evaluated_at, teacher_notes, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
              competency_score = excluded.competency_score, teacher_notes = excluded.teacher_notes,
              evaluated_at = excluded.evaluated_at, updated_at = datetime('now')
          `).bind(
            ev.id, ev.studentId, ev.milestoneId, ev.competencyScore, ev.evaluatedAt || new Date().toISOString(), ev.teacherNotes || null
          )
        );
      }
    }

    // 9. Sync Parent Reports
    if (Array.isArray(payload.parentReports)) {
      for (const rp of payload.parentReports) {
        statements.push(
          env.DB.prepare(`
            INSERT INTO parent_reports (id, student_id, cohort_id, report_period, attendance_rate, total_sessions_count, present_count, milestone_summary_json, teacher_narrative_feedback, whatsapp_brief_text, is_sent, sent_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
              attendance_rate = excluded.attendance_rate, total_sessions_count = excluded.total_sessions_count,
              present_count = excluded.present_count, milestone_summary_json = excluded.milestone_summary_json,
              teacher_narrative_feedback = excluded.teacher_narrative_feedback,
              whatsapp_brief_text = excluded.whatsapp_brief_text, is_sent = excluded.is_sent,
              sent_at = excluded.sent_at, updated_at = datetime('now')
          `).bind(
            rp.id, rp.studentId, rp.cohortId, rp.reportPeriod, rp.attendanceRate || 100, rp.totalSessionsCount || 0, rp.presentCount || 0, rp.milestoneSummaryJson || null, rp.teacherNarrativeFeedback || null, rp.whatsappBriefText || null, rp.isSent ? 1 : 0, rp.sentAt || null
          )
        );
      }
    }

    // 10. Sync Tasks
    if (Array.isArray(payload.tasks)) {
      for (const tk of payload.tasks) {
        statements.push(
          env.DB.prepare(`
            INSERT INTO tasks (id, teacher_id, cohort_id, title, priority, due_date, deadline_type, due_lesson_label, is_completed, completed_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
              title = excluded.title, priority = excluded.priority, due_date = excluded.due_date,
              deadline_type = excluded.deadline_type, due_lesson_label = excluded.due_lesson_label,
              is_completed = excluded.is_completed, completed_at = excluded.completed_at,
              updated_at = datetime('now')
          `).bind(
            tk.id, tk.teacherId || payload.teacher?.id || 'teacher-1', tk.cohortId || null, tk.title, tk.priority || 'medium', tk.dueDate || null, tk.deadlineType || 'date', tk.dueLessonLabel || null, tk.isCompleted ? 1 : 0, tk.completedAt || null
          )
        );
      }
    }

    // Execute in batch
    if (statements.length > 0) {
      await env.DB.batch(statements);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully synchronized ${statements.length} records to Cloudflare D1.`,
        syncedAt: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'D1 batch sync failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
