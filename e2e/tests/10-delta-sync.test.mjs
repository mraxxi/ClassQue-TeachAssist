// FR-020 — delta sync + per-record merge across TWO devices sharing one D1.
import { open, check, done, txt, store, goto, api, sleep, modalText } from '../lib.mjs';

// Device A's clock is an hour behind device B's, so "who edited last" is unambiguous.
const A = await open({ time: '2026-10-05T08:00:00Z' });
const B = await open({ time: '2026-10-05T09:00:00Z' });
const posts = [], gets = [];
A.p.on('request', (r) => { if (r.url().includes('/api/sync')) (r.method() === 'POST' ? posts : gets).push(r.method() === 'POST' ? JSON.parse(r.postData() || '{}') : r.url()); });
B.p.on('request', (r) => { if (r.url().includes('/api/sync') && r.method() === 'GET') gets.push('B:' + r.url()); });

const pull = async (d) => { await d.p.click('header button').catch(() => {}); await d.p.waitForTimeout(500); await d.p.click('div.fixed button:has-text("Tarik Data dari D1")'); await d.p.waitForTimeout(1500); await d.p.keyboard.press('Escape'); await d.p.waitForTimeout(300); };
const online = async (d) => { await d.ctx.setOffline(false); await d.p.evaluate(() => window.dispatchEvent(new Event('online'))); await sleep(3500); };
const addTask = async (d, title) => { await goto.cockpit(d.p); await d.p.fill('input[placeholder^="Tambah tugas"]', title); await d.p.click('main button[type=submit]:has-text("Tambah")'); await d.p.waitForTimeout(300); };
const editCohortRoom = async (d, room) => { await goto.classes(d.p); await d.p.click('button[title="Edit active cohort details"]'); await d.p.waitForTimeout(300); await d.p.fill('input[placeholder^="e.g. Room 204"]', room); await d.p.click('div.fixed button[type=submit]:visible'); await d.p.waitForTimeout(300); };
const room = async (d) => (await store(d.p)).cohorts.find((c) => c.id === 'cohort-1').roomOrLink;

// ============================ delta payload ============================
await sleep(2000);
let s = await store(A.p);
check('S0 both devices start fully synced', s.hasUnsyncedChanges === false && !!s.syncCursor && Object.keys(s.dirty || {}).length === 0, `cursor=${s.syncCursor} dirty=${Object.keys(s.dirty || {}).length}`);
posts.length = 0;
await addTask(A, 'only-this-task');
await sleep(3000);
check('S1 pushing one edit sends ONLY that record (not the whole dataset)', posts.length === 1 && posts[0].tasks?.length === 1 && posts[0].tasks[0].title === 'only-this-task' && posts[0].cohorts.length === 0 && posts[0].students.length === 0 && posts[0].attendanceRecords.length === 0, JSON.stringify(Object.fromEntries(Object.entries(posts[0] || {}).map(([k, v]) => [k, Array.isArray(v) ? v.length : typeof v]))));
check('S1b the pushed record is no longer dirty', Object.keys((await store(A.p)).dirty || {}).length === 0);

// ============================ incremental pull ============================
gets.length = 0;
await pull(B);
const bTasks = (await store(B.p)).tasks.map((t) => t.title);
check('S2 device B receives the task through a delta pull', bTasks.includes('only-this-task'));
check('S2b that pull was incremental (?since=)', gets.some((u) => /B:.*since=/.test(u)), gets.join(' | '));

// ============================ offline edits on both devices ============================
await A.ctx.setOffline(true); await B.ctx.setOffline(true);
await goto.cockpit(A.p);
await A.p.locator('xpath=//*[normalize-space(text())="Grade Assignment \'Flyers Unit 4\'"]/ancestor::div[@data-testid="task-row"][1]').first().locator('button').first().click(); // A: complete a seeded task
await addTask(B, 'task-created-on-B');                                   // B: create a task
await editCohortRoom(B, 'B-ROOM');                                       // B: edit the Flyers cohort
await sleep(1200);
await online(A); await online(B); await pull(A); await pull(B);
const finalA = await store(A.p), finalB = await store(B.p);
const done_ = (st) => st.tasks.find((t) => /Grade Assignment/.test(t.title))?.isCompleted;
check('S3 edits to DIFFERENT records on two offline devices both survive on both devices',
  done_(finalA) === true && done_(finalB) === true && finalA.tasks.some((t) => t.title === 'task-created-on-B') && finalB.tasks.some((t) => t.title === 'task-created-on-B') && (await room(A)) === 'B-ROOM' && (await room(B)) === 'B-ROOM',
  `A:${done_(finalA)} ${finalA.tasks.length} tasks room=${await room(A)} | B:${done_(finalB)} ${finalB.tasks.length} tasks room=${await room(B)}`);
check('S3b the server has the merged state', (await api()).json.data.tasks.some((t) => t.title === 'task-created-on-B' ) && (await api()).json.data.tasks.find((t) => /Grade Assignment/.test(t.title)).isCompleted === true);

// ============================ same record, conflicting edits ============================
await A.ctx.setOffline(true); await B.ctx.setOffline(true);
await editCohortRoom(B, 'ROOM-NEWER-B'); await sleep(300);          // B edits at 09:xx (later clock)
await editCohortRoom(A, 'ROOM-OLDER-A'); await sleep(300);          // A edits at 08:xx (earlier clock)
await online(B); await online(A);                                      // B pushes first, then A tries to push an OLDER edit
await sleep(2500); await pull(A); await pull(B);
check('S4 conflicting edits of one record: the LATER edit wins on both devices (regardless of who syncs first)', (await room(A)) === 'ROOM-NEWER-B' && (await room(B)) === 'ROOM-NEWER-B', `A=${await room(A)} B=${await room(B)}`);
check('S4b the server agrees', (await api()).json.data.cohorts.find((c) => c.id === 'cohort-1').roomOrLink === 'ROOM-NEWER-B');

// ============================ deletes propagate (with cascade) ============================
await goto.classes(A.p); await A.p.click('main button:has-text("Cambridge Starters A1")'); await A.p.click('button[title="Delete cohort"]'); await A.p.click('button:has-text("Ya, Hapus Kelas")'); await A.p.waitForTimeout(500);
await sleep(3000);
gets.length = 0;
await pull(B);
const bs = await store(B.p);
check('S5 a cohort deleted on A disappears from B, with its students (cascade)', !bs.cohorts.some((c) => c.id === 'cohort-2') && !bs.students.some((x) => x.cohortId === 'cohort-2'), bs.cohorts.map((c) => c.name).join('|'));

// ============================ edit beats delete ============================
// A deletes a student (older clock), B edits that same student (newer clock) while both are offline
await goto.classes(B.p); await B.p.click('main button:has-text("Cambridge Flyers A2")'); await B.p.waitForTimeout(300);
await goto.classes(A.p); await A.p.click('main button:has-text("Cambridge Flyers A2")'); await A.p.waitForTimeout(300);
await A.ctx.setOffline(true); await B.ctx.setOffline(true);
await A.p.click('main :text("Aisha Khan") >> nth=0'); await A.p.click('button[title="Delete student"]'); await A.p.click('button:has-text("Ya, Hapus Siswa")'); await A.p.waitForTimeout(400);
await B.p.click('main :text("Aisha Khan") >> nth=0'); await B.p.click('button[title="Edit student profile"]'); await B.p.waitForTimeout(300);
await B.p.locator('div.fixed textarea').last().fill('EDITED ON B AFTER A DELETED'); await B.p.click('div.fixed button[type=submit]:visible'); await B.p.waitForTimeout(400);
await online(A); await online(B); await sleep(1500); await pull(A); await pull(B);
const aisha = (st) => st.students.find((x) => x.fullName === 'Aisha Khan');
const fa = await store(A.p), fb = await store(B.p);
check('S6 a newer edit beats an older delete: the student survives on both devices with the edit', aisha(fa)?.notes?.includes('EDITED ON B') && aisha(fb)?.notes?.includes('EDITED ON B'), `A=${aisha(fa)?.notes?.slice(0, 20)} B=${aisha(fb)?.notes?.slice(0, 20)}`);

// ============================ steady state ============================
check('S7 both devices end in sync with no pending work', !(await store(A.p)).hasUnsyncedChanges && !(await store(B.p)).hasUnsyncedChanges);
check('S8 no page errors on either device', A.p.errs.length === 0 && B.p.errs.length === 0, [...A.p.errs, ...B.p.errs].join(' | '));
await A.browser.close(); await B.browser.close();
done();
