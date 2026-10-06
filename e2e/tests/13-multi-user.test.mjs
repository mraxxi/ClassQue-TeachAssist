// Multi-user: one D1 shared by several teachers, each login sees and changes only its own data.
// run.sh signs this file in as E2E_USER_EMAIL (demo data inherited via LEGACY_OWNER_EMAIL) and, from
// 13-multi-user.seed.sql, pre-loads a SECOND teacher ("teacher-b") with a row in every table.
import { execFileSync } from 'node:child_process';
import { api, check, done, open, store, goto, STORAGE_KEY } from '../lib.mjs';

const ME = process.env.E2E_USER_EMAIL || 'e2e.teacher@classque.test';
const FUTURE = '2099-01-01T00:00:00.000Z'; // newer than anything stored, so only ownership can stop a write

/**
 * Reads D1 directly (the same local database the server uses), one result list per query. Only done at the very
 * end: running the D1 CLI against the live local database drops the dev server's open connections.
 */
const sql = (...queries) => {
  const out = execFileSync('npx', ['wrangler', 'd1', 'execute', process.env.E2E_DB, '--local', '--persist-to', `${process.env.E2E_STATE}/d1`, '--json', '--command', queries.join('; ')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return JSON.parse(out.slice(out.indexOf('['))).map((r) => r.results);
};
const B_IDS = ['b-cohort', 'b-student', 'b-att', 'b-lesson', 'b-session', 'b-claim', 'b-eval', 'b-report', 'b-task'];

// ---- identity ------------------------------------------------------------------------------
let r = await api('/api/me');
check('M1 /api/me returns the signed-in login email', r.status === 200 && r.json?.email === ME, JSON.stringify(r.json));
check('M1b the legacy owner inherited the demo teacher row', r.json?.teacher?.id === 'teacher-1', r.json?.teacher?.id);

// ---- reads ---------------------------------------------------------------------------------
r = await api('/api/sync');
const mine = r.json?.data;
check('M2 GET returns my data and the demo cohorts', r.status === 200 && mine?.cohorts?.length > 0 && mine?.teacher?.email === ME);
const flat = JSON.stringify(mine);
check('M3 GET contains nothing of teacher B (every table)', !/b-cohort|b-student|b-att|b-lesson|b-session|b-claim|b-eval|b-report|b-task|Teacher B|b\.teacher@/.test(flat), B_IDS.filter((x) => flat.includes(x)).join(','));
r = await api('/api/sync?summary=1');
check('M4 summary counts only my rows', r.json?.counts?.cohorts === mine.cohorts.length && r.json?.counts?.tasks === mine.tasks.length, JSON.stringify(r.json?.counts));
r = await api('/api/sync?since=1970-01-01T00:00:00.000Z');
check('M5 a delta pull from the beginning of time still excludes B', !/b-cohort|b-student|b-task|Teacher B/.test(JSON.stringify(r.json)));

// ---- writes: every attempt to touch B's rows is refused ---------------------------------------
const base = { updatedAt: FUTURE };
r = await api('/api/sync', {
  method: 'POST',
  body: {
    teacher: { id: 'teacher-b', email: 'b.teacher@classque.test', name: 'Renamed By A' },
    cohorts: [{ ...base, id: 'b-cohort', teacherId: 'teacher-b', name: 'HACKED' }],
    students: [{ ...base, id: 'b-student', cohortId: 'b-cohort', fullName: 'HACKED' }],
    lessonPlans: [{ ...base, id: 'b-lesson', teacherId: 'teacher-b', title: 'HACKED' }],
    attendanceRecords: [{ ...base, id: 'b-att', cohortId: 'b-cohort', studentId: 'b-student', attendanceDate: '2026-10-01', status: 'absent' }],
    sessions: [{ ...base, id: 'b-session', teacherId: 'teacher-b', cohortId: 'b-cohort', sessionDate: '2026-10-01' }],
    claims: [{ ...base, id: 'b-claim', teacherId: 'teacher-b', claimPeriod: '2026-10', notes: 'HACKED' }],
    studentEvaluations: [{ ...base, id: 'b-eval', studentId: 'b-student', milestoneId: 'x', competencyScore: 1 }],
    parentReports: [{ ...base, id: 'b-report', studentId: 'b-student', cohortId: 'b-cohort', reportPeriod: '2026-10', teacherNarrativeFeedback: 'HACKED' }],
    tasks: [{ ...base, id: 'b-task', teacherId: 'teacher-b', title: 'HACKED' }],
  },
});
check('M6 the overwrite attempt is accepted as a request but every record is rejected', r.status === 200 && r.json?.rejected >= 9, JSON.stringify(r.json));
r = await api('/api/sync', {
  method: 'POST',
  body: {
    students: [{ ...base, id: 'a-intruder', cohortId: 'b-cohort', fullName: 'Intruder' }],
    attendanceRecords: [{ ...base, id: 'a-intruder-att', cohortId: 'b-cohort', studentId: 'b-student', attendanceDate: '2026-10-02', status: 'present' }],
    parentReports: [{ ...base, id: 'a-intruder-rep', studentId: 'b-student', cohortId: 'b-cohort', reportPeriod: '2026-11' }],
    deleted: { cohorts: [{ id: 'b-cohort', at: FUTURE }], students: [{ id: 'b-student', at: FUTURE }], tasks: [{ id: 'b-task', at: FUTURE }], lessonPlans: [{ id: 'b-lesson', at: FUTURE }] },
  },
});
check('M7 adding rows to B\'s cohort and deleting B\'s rows is refused', r.status === 200 && r.json?.rejected >= 7, JSON.stringify(r.json));

// ---- writes: my own data works, ownership is forced to me ---------------------------------------
r = await api('/api/sync', {
  method: 'POST',
  body: {
    cohorts: [{ updatedAt: '2026-10-06T01:00:00.000Z', id: 'mine-cohort', teacherId: 'teacher-b', name: 'Mine' }],
    students: [{ updatedAt: '2026-10-06T01:00:00.000Z', id: 'mine-student', cohortId: 'mine-cohort', fullName: 'Mine S' }],
    attendanceRecords: [{ updatedAt: '2026-10-06T01:00:00.000Z', id: 'mine-att', cohortId: 'mine-cohort', studentId: 'mine-student', attendanceDate: '2026-10-06', status: 'late' }],
    tasks: [{ updatedAt: '2026-10-06T01:00:00.000Z', id: 'mine-task', teacherId: 'teacher-b', title: 'Mine T' }],
  },
});
check('M12 my own new records are all accepted (child rows in the same push as their parent)', r.status === 200 && r.json?.rejected === 0, JSON.stringify(r.json));
r = await api('/api/sync');
check('M14 my new records come back to me', r.json.data.cohorts.some((c) => c.id === 'mine-cohort') && r.json.data.students.some((s) => s.id === 'mine-student') && r.json.data.attendanceRecords.some((a) => a.id === 'mine-att' && a.attendanceDate === '2026-10-06' && a.status === 'late') && r.json.data.tasks.some((t) => t.id === 'mine-task'));
r = await api('/api/sync', { method: 'POST', body: { deleted: { tasks: [{ id: 'mine-task', at: '2026-10-06T02:00:00.000Z' }] } } });
check('M15 I can still delete my own record', r.json?.rejected === 0 && !(await api('/api/sync')).json.data.tasks.some((t) => t.id === 'mine-task'));

// ---- browser: per-login buffer, random ids, account card ---------------------------------------------
const { browser, p } = await open({ lang: 'en' });
const keys = await p.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('classque_teacher_os_v1')));
check('M16 the local buffer is stored under this login\'s own key', keys.length === 1 && keys[0] === STORAGE_KEY, keys.join(','));
await p.fill('input[placeholder^="Add a quick"]', 'Task with a random id');
await p.click('main button[type=submit]:has-text("Add")');
await p.waitForTimeout(500);
const st = await store(p);
const created = st.tasks.find((t) => t.title === 'Task with a random id');
check('M17 new records get collision-proof ids (UUID), not timestamps', /^task-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(created?.id || ''), created?.id);
await goto.settings(p);
await p.waitForTimeout(300);
const body = await p.innerText('main');
check('M18 Settings shows who is signed in, with a sign-out link', /signed in as/i.test(body) && body.includes(ME) && (await p.locator('a[href="/cdn-cgi/access/logout"]').count()) === 1);
check('M19 the login email cannot be edited in the profile form', await p.locator('input[type=email]').first().evaluate((el) => el.readOnly));
await p.waitForTimeout(2500);
check('M20 the new task synced for this login', (await api('/api/sync')).json.data.tasks.some((t) => t.title === 'Task with a random id'));
check('M21 no page errors', p.errs.length === 0, p.errs.join(' | '));
await browser.close();

// ---- browser: work done before a login is confirmed is not lost --------------------------------------------
{
  const g = await open({ lang: 'en', token: null }); // new device, sync token not entered yet -> guest
  await g.p.fill('input[placeholder^="Add a quick"]', 'Written as a guest');
  await g.p.click('main button[type=submit]:has-text("Add")');
  await g.p.waitForTimeout(500);
  const guestKeys = await g.p.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('classque_teacher_os_v1')));
  check('M22 without a confirmed login the work is kept in a guest buffer', guestKeys.join(',') === 'classque_teacher_os_v1:guest', guestKeys.join(','));
  await g.p.evaluate((t) => localStorage.setItem('classque_sync_token', t), process.env.E2E_TOKEN || 'e2e-token');
  await g.p.reload();
  await g.p.waitForTimeout(3000);
  const after = await g.p.evaluate(() => ({ keys: Object.keys(localStorage).filter((k) => k.startsWith('classque_teacher_os_v1')), tasks: Object.values(localStorage).filter((v) => v.includes('Written as a guest')).length }));
  check('M23 once the login is confirmed the guest work moves into that teacher\'s own buffer', after.keys.join(',') === STORAGE_KEY && after.tasks === 1, JSON.stringify(after));
  await g.browser.close();
}

// ---- database state (read last, see `sql`) ---------------------------------------------------------
const TABLES = ['cohorts', 'students', 'lesson_plans', 'attendance_records', 'teaching_sessions', 'teaching_claims', 'parent_reports', 'tasks', 'teachers', 'student_milestone_evaluations'];
const [cohorts, students, lessons, atts, sessions, claims, reports, tasks, teachers, evals] = sql(...TABLES.map((t) => `SELECT * FROM ${t}`));
const byId = (list, id) => list.find((x) => x.id === id);
check('M8 B\'s cohort, student, lesson, session, claim, task are untouched',
  byId(cohorts, 'b-cohort')?.name === 'B Cohort' && !byId(cohorts, 'b-cohort')?.deleted_at && byId(students, 'b-student')?.full_name === 'B Student' && !byId(students, 'b-student')?.deleted_at &&
  byId(lessons, 'b-lesson')?.title === 'B Lesson' && !byId(lessons, 'b-lesson')?.deleted_at && byId(sessions, 'b-session')?.cohort_id === 'b-cohort' &&
  byId(claims, 'b-claim')?.notes == null && byId(tasks, 'b-task')?.title === 'B Task' && !byId(tasks, 'b-task')?.deleted_at);
check('M9 B\'s attendance, evaluation and report are untouched', byId(atts, 'b-att')?.status === 'present' && byId(evals, 'b-eval')?.competency_score === 3 && byId(reports, 'b-report')?.teacher_narrative_feedback == null);
check('M10 nothing was inserted into B\'s cohort or about B\'s student', !byId(students, 'a-intruder') && !byId(atts, 'a-intruder-att') && !byId(reports, 'a-intruder-rep'));
check('M11 a posted profile never changes another teacher or my login email', byId(teachers, 'teacher-b')?.name === 'Teacher B' && byId(teachers, 'teacher-1')?.email === ME, JSON.stringify(teachers.map((t) => [t.id, t.email, t.name])));
check('M13 a spoofed teacherId is replaced by my own id', byId(cohorts, 'mine-cohort')?.teacher_id === 'teacher-1' && byId(tasks, 'mine-task')?.teacher_id === 'teacher-1', `${byId(cohorts, 'mine-cohort')?.teacher_id} ${byId(tasks, 'mine-task')?.teacher_id}`);
done();
