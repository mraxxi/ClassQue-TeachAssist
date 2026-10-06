// Stage 15 / W2 / W3 — edge API: authentication, round-trip, validation, falsy values, tombstones, summary.
import { api, check, done, BASE } from '../lib.mjs';

// ---- authentication (no-login cases live in 13b-api-no-login) --------------------------------------------------------------------
let r;
r = await api('/api/sync');
check('A4 the signed-in teacher is accepted', r.status === 200 && r.json?.data?.cohorts?.length > 0, `status ${r.status}`);
check('A4b seeded demo data not changed by rejected writes', r.json?.data?.teacher?.name !== 'HACKED');

// ---- full round-trip -------------------------------------------------------------------------
const payload = {
  teacher: { id: 'teacher-9', email: 't9@x.id', name: 'T Nine', schoolName: 'S', defaultHourlyRate: 123000, currency: 'IDR', languagePreference: 'en' },
  cohorts: [{ id: 'c9', teacherId: 'teacher-9', name: 'Coh9', cefrLevel: 'B1', scheduleDays: ['Tue', 'Thu'], startTime: '09:00', durationMinutes: 90, roomOrLink: 'R9', hourlyRateOverride: 111000, isActive: true }],
  students: [
    { id: 's9', cohortId: 'c9', fullName: 'Stu Nine', nickname: 'Nine', gender: 'F', guardianName: 'G', guardianPhone: '+62811', guardianEmail: 'g@x.id', notes: 'n', strengths: 'st', growthAreas: 'ga', isActive: true },
    { id: 's9b', cohortId: 'c9', fullName: 'Inactive One', isActive: false },
  ],
  lessonPlans: [{ id: 'lp9', teacherId: 'teacher-9', cohortId: 'c9', title: 'LP9', topic: 'T', cefrLevel: 'B1', durationMinutes: 60, warmUp: 'w', presentation: 'p', practice: 'pr', production: 'pd', wrapUp: 'wr', vocabulary: [{ word: 'a', pos: 'noun', definitionEn: 'd', definitionId: 'dd', example: 'e' }], grammarFocus: 'g', materialsLinks: ['http://x'], homework: 'hw', isTemplate: false }],
  attendanceRecords: [{ id: 'a9', cohortId: 'c9', studentId: 's9', attendanceDate: '2026-10-01', status: 'late', note: 'bus' }],
  sessions: [{ id: 'ss9', teacherId: 'teacher-9', cohortId: 'c9', lessonPlanId: 'lp9', sessionDate: '2026-10-01', startTime: '09:00', durationMinutes: 90, hourlyRate: 111000, totalClaimAmount: 166500, status: 'completed', scratchpadNotes: 'sp' }],
  claims: [{ id: 'cl9', teacherId: 'teacher-9', claimPeriod: '2026-10', claimNumber: 'CLM-9', totalSessions: 1, totalHours: 1.5, baseAmount: 166500, allowanceAmount: 10000, totalClaimAmount: 176500, currency: 'IDR', status: 'submitted', submittedAt: '2026-10-02T00:00:00Z', notes: 'cn' }],
  studentEvaluations: [{ id: 'ev9', studentId: 's9', milestoneId: 'ms-a2-li-1', competencyScore: 3, evaluatedAt: '2026-10-01T00:00:00Z', teacherNotes: 'tn' }],
  parentReports: [{ id: 'pr9', studentId: 's9', cohortId: 'c9', reportPeriod: '2026-10', attendanceRate: 80, totalSessionsCount: 5, presentCount: 4, milestoneSummaryJson: '[{"code":"x"}]', teacherNarrativeFeedback: 'nf', whatsappBriefText: 'wa', isSent: true, sentAt: '2026-10-03T00:00:00Z' }],
  tasks: [{ id: 'tk9', teacherId: 'teacher-9', cohortId: 'c9', title: 'T9', priority: 'high', dueDate: '2026-10-09', deadlineType: 'lesson', dueLessonLabel: 'Coh9 • Thu (09:00)', isCompleted: true, completedAt: '2026-10-05T00:00:00Z' }],
};
r = await api('/api/sync', { method: 'POST', body: payload });
check('B1 POST full payload accepted', r.status === 200 && r.json?.success, `${r.status} ${JSON.stringify(r.json).slice(0, 120)}`);
const g = (await api('/api/sync')).json.data;
const find = (arr, id) => arr?.find((x) => x.id === id);
check('B2 cohort round-trip', find(g.cohorts, 'c9')?.name === 'Coh9' && find(g.cohorts, 'c9')?.hourlyRateOverride === 111000 && find(g.cohorts, 'c9')?.scheduleDays?.join() === 'Tue,Thu');
check('B3 student round-trip incl. isActive=false preserved', find(g.students, 's9')?.guardianPhone === '+62811' && find(g.students, 's9b')?.isActive === false, JSON.stringify(find(g.students, 's9b')));
check('B4 lesson plan vocab + links', find(g.lessonPlans, 'lp9')?.vocabulary?.[0]?.word === 'a' && find(g.lessonPlans, 'lp9')?.materialsLinks?.[0] === 'http://x');
const a = find(g.attendanceRecords, 'a9');
check('B5 attendance uses attendanceDate + note', a?.attendanceDate === '2026-10-01' && a?.note === 'bus' && a?.status === 'late', JSON.stringify(a));
check('B6 session round-trip', find(g.sessions, 'ss9')?.totalClaimAmount === 166500 && find(g.sessions, 'ss9')?.startTime === '09:00');
const c = find(g.claims, 'cl9');
check('B7 claim round-trip incl. submittedAt', c?.status === 'submitted' && !!c?.submittedAt && c?.allowanceAmount === 10000);
check('B8 evaluation round-trip', find(g.studentEvaluations, 'ev9')?.teacherNotes === 'tn');
const pr = find(g.parentReports, 'pr9');
check('B9 parent report round-trip', pr?.isSent === true && !!pr?.sentAt && pr?.milestoneSummaryJson?.includes('"x"'), JSON.stringify(pr));
const tk = find(g.tasks, 'tk9');
check('B10 task round-trip (deadline_type / label / completed)', tk?.deadlineType === 'lesson' && tk?.dueLessonLabel === 'Coh9 • Thu (09:00)' && tk?.isCompleted === true);

// session edits (date/time/cohort) must be persisted too, not just amounts
payload.sessions[0].sessionDate = '2026-10-02'; payload.sessions[0].startTime = '10:15';
await api('/api/sync', { method: 'POST', body: { sessions: payload.sessions } });
const s2 = find((await api('/api/sync')).json.data.sessions, 'ss9');
check('B11 session date/time edits persist', s2?.sessionDate === '2026-10-02' && s2?.startTime === '10:15', JSON.stringify(s2));

// ---- falsy values are real values (F37) --------------------------------------------------------
await api('/api/sync', { method: 'POST', body: { parentReports: [{ id: 'pz', studentId: 's9', cohortId: 'c9', reportPeriod: '2026-11', attendanceRate: 0, totalSessionsCount: 4, presentCount: 0, isSent: false }], sessions: [{ id: 'sz', cohortId: 'c9', sessionDate: '2026-11-02', startTime: '08:00', durationMinutes: 30, hourlyRate: 0, totalClaimAmount: 0 }] } });
const g2 = (await api('/api/sync')).json.data;
check('C1 attendanceRate 0 stays 0 (not 100)', find(g2.parentReports, 'pz')?.attendanceRate === 0, String(find(g2.parentReports, 'pz')?.attendanceRate));
check('C2 session with 0 rate/amount stays 0', find(g2.sessions, 'sz')?.hourlyRate === 0 && find(g2.sessions, 'sz')?.totalClaimAmount === 0, JSON.stringify(find(g2.sessions, 'sz')));

// ---- validation (F38) --------------------------------------------------------------------------
r = await api('/api/sync', { method: 'POST', body: '{bad' });
check('D1 malformed JSON -> 400', r.status === 400, `status ${r.status}`);
r = await api('/api/sync', { method: 'POST', body: JSON.stringify([1, 2]) });
check('D2 non-object payload -> 400', r.status === 400);
r = await api('/api/sync', { method: 'POST', body: { cohorts: 'nope' } });
check('D3 wrong shape -> 400 with problems', r.status === 400 && r.json?.problems?.length > 0, JSON.stringify(r.json));
r = await api('/api/sync', { method: 'POST', body: { students: [{ id: 'x1' }] } });
check('D4 record missing required fields -> 400 (not 500)', r.status === 400 && /cohortId|fullName/.test(JSON.stringify(r.json)), JSON.stringify(r.json));
r = await api('/api/sync', { method: 'POST', body: { tasks: [{ id: 'tk-min', title: 'minimal task' }] } });
check('D5 minimal record with optional fields omitted is accepted', r.status === 200, `${r.status} ${JSON.stringify(r.json)}`);
r = await api('/api/sync', { method: 'POST', body: { students: [{ id: "s'--", cohortId: 'c9', fullName: "'); DROP TABLE students;--" }] } });
check('D6 SQL metacharacters are data (parameterised)', r.status === 200 && (await api('/api/sync')).json.data.students.length > 3);

// ---- tombstones / soft delete (F6) ---------------------------------------------------------------
r = await api('/api/sync', { method: 'POST', body: { deleted: { students: ['s9b'], tasks: ['tk9'] } } });
const g3 = (await api('/api/sync')).json.data;
check('E1 tombstoned records disappear from GET', r.status === 200 && !find(g3.students, 's9b') && !find(g3.tasks, 'tk9'));
check('E1b other records untouched', !!find(g3.students, 's9') && !!find(g3.cohorts, 'c9'));
r = await api('/api/sync', { method: 'POST', body: { deleted: { bogus: ['x'] } } });
check('E2 unknown tombstone entity -> 400', r.status === 400);

// ---- summary (F32) --------------------------------------------------------------------------------
r = await api('/api/sync?summary=1');
check('F1 summary returns counts + lastUpdatedAt, no records', r.status === 200 && r.json?.counts?.cohorts >= 1 && !r.json?.data && r.json?.lastUpdatedAt, JSON.stringify(r.json));
check('F1b summary count matches data', r.json?.counts?.students === (await api('/api/sync')).json.data.students.length);
check('G1 responses are not cacheable', r.headers.get('cache-control') === 'no-store');

// ---- delta sync + per-record last-write-wins (FR-020) -----------------------------------------------------
const base = { cohortId: 'c9', fullName: 'Delta Student', nickname: 'D' };
const T1 = '2026-10-06T01:00:00.000Z', T2 = '2026-10-06T02:00:00.000Z', T3 = '2026-10-06T03:00:00.000Z';
r = await api('/api/sync', { method: 'POST', body: { students: [{ id: 'sd', ...base, notes: 'v2', updatedAt: T2 }] } });
check('L1 first write accepted', r.status === 200 && r.json.rejected === 0 && !!r.json.cursor, JSON.stringify(r.json));
r = await api('/api/sync', { method: 'POST', body: { students: [{ id: 'sd', ...base, notes: 'v1-OLD', updatedAt: T1 }] } });
check('L2 an OLDER edit is rejected (last-write-wins) and reported', r.json.rejected === 1, JSON.stringify(r.json));
check('L2b the newer value is kept', (await api()).json.data.students.find((x) => x.id === 'sd')?.notes === 'v2');
r = await api('/api/sync', { method: 'POST', body: { students: [{ id: 'sd', ...base, notes: 'v3', updatedAt: T3 }] } });
check('L3 a NEWER edit wins', r.json.rejected === 0 && (await api()).json.data.students.find((x) => x.id === 'sd')?.notes === 'v3');
check('L3b records carry the client edit timestamp back', (await api()).json.data.students.find((x) => x.id === 'sd')?.updatedAt === T3);

const full = (await api()).json;
check('D1 full response includes a cursor and is not a delta', !!full.cursor && full.delta === false);
const cur = full.cursor;
await new Promise((res) => setTimeout(res, 30));
await api('/api/sync', { method: 'POST', body: { students: [{ id: 'sd', ...base, notes: 'v4', updatedAt: '2026-10-06T04:00:00.000Z' }], tasks: [{ id: 'td', title: 'delta task', updatedAt: T3 }] } });
const delta = (await api('/api/sync?since=' + encodeURIComponent(cur))).json;
check('D2 delta returns ONLY what changed after the cursor', delta.delta === true && delta.data.students.length === 1 && delta.data.students[0].id === 'sd' && delta.data.tasks.length === 1 && delta.data.cohorts.length === 0, `students:${delta.data.students.length} tasks:${delta.data.tasks.length} cohorts:${delta.data.cohorts.length}`);
check('D3 delta skips the static CEFR framework and is far smaller than a full pull', delta.data.cefrMilestones.length === 0 && JSON.stringify(delta).length < JSON.stringify(full).length / 5, `${JSON.stringify(delta).length} vs ${JSON.stringify(full).length} bytes`);
const d2 = (await api('/api/sync?since=' + encodeURIComponent(delta.cursor))).json;
check('D4 nothing changed since the new cursor -> empty delta', d2.data.students.length + d2.data.tasks.length + d2.data.cohorts.length === 0);

await api('/api/sync', { method: 'POST', body: { deleted: { students: [{ id: 'sd', at: '2026-10-06T05:00:00.000Z' }] } } });
const d3 = (await api('/api/sync?since=' + encodeURIComponent(delta.cursor))).json;
check('D5 deletions arrive as { id, at } in the delta', d3.deleted?.students?.[0]?.id === 'sd' && !d3.data.students.some((x) => x.id === 'sd'), JSON.stringify(d3.deleted));
r = await api('/api/sync', { method: 'POST', body: { students: [{ id: 'sd', ...base, notes: 'revived', updatedAt: '2026-10-06T06:00:00.000Z' }] } });
check('R1 a NEWER edit revives a soft-deleted record (undo across devices)', r.json.rejected === 0 && (await api()).json.data.students.find((x) => x.id === 'sd')?.notes === 'revived');
await api('/api/sync', { method: 'POST', body: { deleted: { students: [{ id: 'sd', at: '2026-10-06T05:45:00.000Z' }] } } });
check('R2 a delete OLDER than the latest edit is rejected (edit wins)', (await api()).json.data.students.some((x) => x.id === 'sd' && x.notes === 'revived'));
await api('/api/sync', { method: 'POST', body: { tasks: [{ id: 'tleg', title: 'legacy', updatedAt: '2020-01-01T00:00:00.000Z' }] } });
r = await api('/api/sync', { method: 'POST', body: { deleted: { tasks: ['tleg'] } } });
check('R3 legacy string tombstones are still accepted (stamped with server time)', r.status === 200 && !(await api()).json.data.tasks.some((x) => x.id === 'tleg'));
done();
