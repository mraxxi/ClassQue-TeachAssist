// Stage 01 + W3 + W9 — cohort/student CRUD, search, WhatsApp numbers, cascade deletes, delete propagation to D1.
import { open, check, done, txt, store, goto, api, sleep } from '../lib.mjs';

const { browser, p } = await open();
const sel = (n) => `main button:has-text("${n}")`;
await goto.classes(p); await p.waitForTimeout(400);

// ---- add cohort ----------------------------------------------------------------------------------
await p.click('text=Tambah Rombel'); await p.waitForTimeout(300);
await p.fill('input[placeholder^="e.g. Cambridge Flyers"]', 'IELTS Master B2');
await p.locator('div.fixed select').first().selectOption('B2');
await p.click('div.fixed button:has-text("Sel / Tue")'); // Mon+Wed are preselected
await p.fill('div.fixed input[type=time]', '16:00');
await p.fill('input[placeholder^="e.g. Room 204"]', 'Room 303');
await p.fill('div.fixed input[type=number]', '200000');
await p.click('div.fixed button:has-text("Buat Kelas")'); await p.waitForTimeout(500);
let s = await store(p);
const c = s.cohorts.find((x) => x.name === 'IELTS Master B2');
check('1.1 add cohort saved with all fields', c && c.cefrLevel === 'B2' && [...c.scheduleDays].sort().join() === 'Mon,Tue,Wed' && c.startTime === '16:00' && c.roomOrLink === 'Room 303' && c.hourlyRateOverride === 200000, JSON.stringify(c));
check('1.1b new cohort stamped with updatedAt', !!c?.updatedAt);
check('1.2 cohort chip visible', (await txt(p, 'main')).includes('IELTS Master B2'));
await p.click('main button:has-text("Riwayat Presensi")'); await p.waitForTimeout(300);
check('1.3a cohort chip in Attendance tab', (await txt(p, 'main')).includes('IELTS Master B2'));
await p.click('main button:has-text("Capaian CEFR")'); await p.waitForTimeout(300);
check('1.3b cohort chip in CEFR tab', (await txt(p, 'main')).includes('IELTS Master B2'));
await goto.lessons(p); await p.click('main button:has-text("Buat RPP Baru")'); await p.waitForTimeout(300);
check('1.3c cohort in Lesson Plan modal', (await p.$$eval('div.fixed select option', (o) => o.map((x) => x.textContent))).some((t) => t.includes('IELTS Master B2')));
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
check('1.3d Esc closes the lesson plan modal', !(await txt(p, 'body')).includes('Simpan RPP') && !(await txt(p, 'body')).includes('Buat RPP |'));
await goto.classes(p); await p.waitForTimeout(300);

// ---- edit cohort + persistence -------------------------------------------------------------------------
await p.click(sel('IELTS Master B2')); await p.click('button[title="Edit active cohort details"]'); await p.waitForTimeout(300);
await p.fill('div.fixed input[type=time]', '17:30'); await p.fill('input[placeholder^="e.g. Room 204"]', 'https://meet.google.com/abc');
await p.click('div.fixed button[type=submit]:visible'); await p.waitForTimeout(500);
s = await store(p);
check('2.1 edit cohort time + room', s.cohorts.find((x) => x.name === 'IELTS Master B2')?.startTime === '17:30');
await p.waitForTimeout(2500); await p.reload(); await p.waitForTimeout(2500);
s = await store(p);
check('2.2 edit persists across sync + reload', s.cohorts.find((x) => x.name === 'IELTS Master B2')?.roomOrLink === 'https://meet.google.com/abc');
await goto.classes(p); await p.waitForTimeout(300);

// ---- students + guardian phone -------------------------------------------------------------------------------
const addStudent = async (full, nick, guardian, phone) => {
  await p.click('text=Tambah Siswa'); await p.waitForTimeout(300);
  await p.fill('input[placeholder="e.g. Liam Michael Wong"]', full);
  await p.fill('input[placeholder="e.g. Liam"]', nick);
  await p.fill('input[placeholder^="e.g. Mrs. Linda"]', guardian);
  await p.fill('input[type=tel]', phone);
  await p.click('div.fixed button[type=submit]:has-text("Tambah Siswa")'); await p.waitForTimeout(500);
};
await p.click(sel('IELTS Master B2')); await p.waitForTimeout(300);
await addStudent('Rina Kartika', 'Rini', 'Ibu Sari', '+62 812-3456-7890');
await addStudent('Doni Pratama', 'Don', 'Bapak Eko', '081298765432');
s = await store(p);
const rina = s.students.find((x) => x.fullName === 'Rina Kartika'), doni = s.students.find((x) => x.fullName === 'Doni Pratama');
check('3.1 students added to the selected cohort', rina?.cohortId === c.id && doni?.cohortId === c.id);

await p.fill('input[placeholder^="Cari nama"]', 'rini'); await p.waitForTimeout(300);
let m = await txt(p, 'main'); check('4.1 search by nickname', m.includes('Rina Kartika') && !m.includes('Doni Pratama'));
await p.fill('input[placeholder^="Cari nama"]', 'pratama'); await p.waitForTimeout(300);
m = await txt(p, 'main'); check('4.2 search by full name', m.includes('Doni Pratama') && !m.includes('Rina Kartika'));
await p.fill('input[placeholder^="Cari nama"]', '');

// ---- WhatsApp numbers (F7) -----------------------------------------------------------------------------------------
const wa = async (name) => { await p.click(`main :text("${name}") >> nth=0`); await p.waitForTimeout(300); return p.$eval('main a[href*="wa.me"]', (a) => a.href).catch(() => ''); };
check('5.1 local format 0812… -> wa.me/62812…', (await wa('Doni Pratama')).startsWith('https://wa.me/6281298765432?'));
check('5.2 +62 formatted number -> digits', (await wa('Rina Kartika')).startsWith('https://wa.me/6281234567890?'));

// ---- transfer --------------------------------------------------------------------------------------------------------------
await p.click('button[title="Transfer student to another cohort"]'); await p.waitForTimeout(300);
const opts = await p.$$eval('div.fixed select option', (o) => o.map((x) => ({ v: x.value, t: x.textContent })));
const starters = opts.find((o) => o.t.includes('Cambridge Starters'));
await p.selectOption('div.fixed select', starters.v); await p.click('div.fixed button[type=submit]'); await p.waitForTimeout(400);
s = await store(p);
check('6.1 transfer student', s.students.find((x) => x.fullName === 'Rina Kartika')?.cohortId === starters.v);

// ---- delete student cascades (F4) ------------------------------------------------------------------------------------------
await p.click(sel('Cambridge Flyers A2')); await p.waitForTimeout(300);
await p.click('main button:has-text("Riwayat Presensi")'); await p.click('button:has-text("Tandai Semua Hadir")'); await p.waitForTimeout(400);
await p.click('main button:has-text("Direktori Siswa (")'); await p.waitForTimeout(300);
s = await store(p);
const liam = s.students.find((x) => x.fullName === 'Liam Wong');
const before = { att: s.attendanceRecords.filter((r) => r.studentId === liam.id).length, ev: s.studentEvaluations.filter((e) => e.studentId === liam.id).length };
check('7.0 precondition: Liam has attendance + evaluations', before.att > 0 && before.ev > 0, JSON.stringify(before));
await p.click('main :text("Liam Wong") >> nth=0'); await p.click('button[title="Delete student"]'); await p.waitForTimeout(300);
const confirmText = await txt(p, 'body');
check('7.1 confirmation states exactly what is deleted', new RegExp(`${before.att} (catatan presensi|attendance)`).test(confirmText) && new RegExp(`${before.ev} evaluasi`).test(confirmText), confirmText.match(/Hapus siswa[^|]*/)?.[0]);
await p.click('button:has-text("Ya, Hapus Siswa")'); await p.waitForTimeout(500);
s = await store(p);
check('7.2 student removed', !s.students.some((x) => x.id === liam.id));
check('7.3 attendance cascade-deleted', !s.attendanceRecords.some((r) => r.studentId === liam.id));
check('7.4 evaluations cascade-deleted', !s.studentEvaluations.some((e) => e.studentId === liam.id));
check('7.5 tombstones queued for D1', (s.tombstones.students || []).includes(liam.id));

// ---- delete cohort cascades (F5) ----------------------------------------------------------------------------------------------
s = await store(p);
const flyers = s.cohorts.find((x) => x.name === 'Cambridge Flyers A2');
const flyersStudents = s.students.filter((x) => x.cohortId === flyers.id).map((x) => x.id);
const flyersPlan = s.lessonPlans.find((l) => l.cohortId === flyers.id);
const sessionsBefore = s.sessions.length;
await p.click(sel('Cambridge Flyers A2')); await p.click('button[title="Delete cohort"]'); await p.waitForTimeout(300);
check('8.1 cohort confirmation lists the cascade', new RegExp(`${flyersStudents.length} siswa`).test(await txt(p, 'body')), (await txt(p, 'body')).match(/Hapus rombel[^|]*/)?.[0]);
await p.click('button:has-text("Ya, Hapus Kelas")'); await p.waitForTimeout(500);
s = await store(p);
check('8.2 cohort removed', !s.cohorts.some((x) => x.id === flyers.id));
check('8.3 its students removed (no orphans)', !s.students.some((x) => x.cohortId === flyers.id));
check('8.4 no orphan attendance/evaluations/reports', !s.attendanceRecords.some((r) => r.cohortId === flyers.id) && !s.studentEvaluations.some((e) => flyersStudents.includes(e.studentId)) && !s.parentReports.some((r) => r.cohortId === flyers.id));
check('8.5 lesson plan kept but un-linked', !flyersPlan || (s.lessonPlans.find((l) => l.id === flyersPlan.id) && !s.lessonPlans.find((l) => l.id === flyersPlan.id).cohortId));
check('8.6 teaching sessions (billing history) are kept', s.sessions.length === sessionsBefore && sessionsBefore > 0, `${sessionsBefore} -> ${s.sessions.length}`);

// ---- deletes reach D1 and never resurrect (F6) -------------------------------------------------------------------------------------
await sleep(3000);
s = await store(p);
check('9.1 auto-sync completed (nothing pending)', s.hasUnsyncedChanges === false && Object.keys(s.tombstones).length === 0, JSON.stringify(s.tombstones));
const remote = (await api()).json.data;
check('9.2 D1 no longer has the deleted student / cohort', !remote.students.some((x) => x.id === liam.id) && !remote.cohorts.some((x) => x.id === flyers.id), `students:${remote.students.length}`);
await p.reload(); await p.waitForTimeout(3000);
s = await store(p);
check('9.3 deleted records do not come back after reload', !s.students.some((x) => x.id === liam.id) && !s.cohorts.some((x) => x.id === flyers.id));
check('9.4 no page errors', p.errs.length === 0, p.errs.join(' | '));
await browser.close();
done();
