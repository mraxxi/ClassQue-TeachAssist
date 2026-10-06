// Stage 08 + W2/W3 — JSON backup/restore, malformed files, reload-from-D1, sync token UX.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { open, check, done, txt, store, goto, api, sleep } from '../lib.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'classque-e2e-'));
const file = (n, content) => { const f = path.join(tmp, n); fs.writeFileSync(f, typeof content === 'string' ? content : JSON.stringify(content)); return f; };

// Sat 5 Sep 2026 23:30 UTC = Sun 6 Sep 06:30 WIB -> the local date differs from the UTC date
let { browser, p } = await open({ time: '2026-09-05T23:30:00Z' });
await goto.settings(p); await p.waitForTimeout(400);

// ============================ export ============================
const [dl] = await Promise.all([p.waitForEvent('download'), p.click('main button:has-text("Ekspor Cadangan Lengkap")')]);
const name = dl.suggestedFilename(); const exported = path.join(tmp, 'export.json'); await dl.saveAs(exported);
const bk = JSON.parse(fs.readFileSync(exported, 'utf8'));
check('8.1 export file name is classque_backup_<LOCAL date>.json', name === 'classque_backup_2026-09-06.json', name);
check('8.1b backup contains every entity type', ['teacher', 'cohorts', 'students', 'attendanceRecords', 'lessonPlans', 'tasks', 'sessions', 'claims', 'studentEvaluations', 'parentReports', 'cefrMilestones'].every((k) => k in bk), Object.keys(bk).join());
check('8.1c the sync token is NEVER written to a backup', !fs.readFileSync(exported, 'utf8').includes('e2e-token'));
check('8.1d storage label is honest (localStorage, not IndexedDB)', /localStorage/.test(await txt(p, 'main')) && !/IndexedDB/.test(await txt(p, 'main')));

// ============================ restore round-trip ============================
let orig = await store(p);
// remove data locally, then restore
await goto.classes(p); await p.click('main button:has-text("Cambridge Starters A1")'); await p.click('button[title="Hapus kelas"]'); await p.click('button:has-text("Ya, Hapus Kelas")'); await p.waitForTimeout(400);
let s = await store(p);
check('8.2 data modified before restore', !s.cohorts.some((c) => c.name === 'Cambridge Starters A1'));
await goto.settings(p); await p.waitForTimeout(300);
await p.setInputFiles('input[type=file]', exported); await p.waitForTimeout(800);
s = await store(p);
const same = (k) => JSON.stringify(s[k].map((x) => ({ ...x, updatedAt: undefined }))) === JSON.stringify(orig[k].map((x) => ({ ...x, updatedAt: undefined })));
check('8.3 restore brings back every entity identically', ['cohorts', 'students', 'lessonPlans', 'sessions', 'claims', 'attendanceRecords', 'studentEvaluations', 'tasks', 'parentReports'].every(same), ['cohorts', 'students', 'lessonPlans', 'sessions', 'claims', 'attendanceRecords', 'studentEvaluations', 'tasks'].filter((k) => !same(k)).join());
check('8.3b restore is flagged for sync', s.hasUnsyncedChanges === true || s.lastSyncedAt !== orig.lastSyncedAt);

// ============================ restored-only data survives (F26) ============================
bk.cohorts.push({ ...bk.cohorts[0], id: 'cohort-restored-only', name: 'RESTORED_ONLY' });
await p.setInputFiles('input[type=file]', file('restored-only.json', bk)); await p.waitForTimeout(800);
s = await store(p);
check('8.4 restored-only cohort present locally and marked unsynced', s.cohorts.some((c) => c.id === 'cohort-restored-only') && s.hasUnsyncedChanges);
await sleep(3000);
check('8.4b restore auto-synced to D1', (await api()).json.data.cohorts.some((c) => c.id === 'cohort-restored-only'));
await p.reload(); await p.waitForTimeout(3000);
s = await store(p);
check('8.4c restored data is still there after reload (not overwritten by D1)', s.cohorts.some((c) => c.id === 'cohort-restored-only'), s.cohorts.map((c) => c.name).join('|'));

// replace semantics: restoring a file WITHOUT a cohort removes it from D1 as well
const lean = { ...bk, cohorts: bk.cohorts.filter((c) => c.id !== 'cohort-restored-only') };
await goto.settings(p); await p.setInputFiles('input[type=file]', file('lean.json', lean)); await p.waitForTimeout(800);
await sleep(3000);
check('8.5 restore REPLACES the dataset: cohort missing from the file is removed locally and in D1', !(await store(p)).cohorts.some((c) => c.id === 'cohort-restored-only') && !(await api()).json.data.cohorts.some((c) => c.id === 'cohort-restored-only'));

// ============================ malformed backups (F27) ============================
const snapshot = async () => JSON.stringify((({ cohorts, students, tasks, sessions }) => ({ cohorts, students, tasks, sessions }))(await store(p)));
const before = await snapshot();
const bad = {
  'not-json': '{not json',
  'wrong-object': { foo: 1 },
  'cohort-without-name': { cohorts: [{ id: 'c1' }] },
  'students-not-list': { cohorts: [{ id: 1 }], students: 'x' },
  'student-unknown-cohort': { cohorts: [{ id: 'c1', name: 'A' }], students: [{ id: 's1', cohortId: 'nope', fullName: 'X' }] },
  'array-root': [1, 2, 3],
};
for (const [label, content] of Object.entries(bad)) {
  await p.setInputFiles('input[type=file]', file(`${label}.json`, content)); await p.waitForTimeout(500);
  check(`8.6 malformed backup "${label}" leaves data untouched and the app alive`, (await snapshot()) === before && !/Something went wrong/.test(await txt(p, 'body')), (await txt(p, 'body')).match(/Invalid[^|]*|tidak valid[^|]*/)?.[0]);
}
check('8.6b an error toast explains the rejection', /tidak valid|Invalid/.test(await txt(p, 'body')));

// ============================ reload from D1 (F28) ============================
// local-only unsynced edit that must be DISCARDED, plus a change that exists only in D1
await api('/api/sync', { method: 'POST', body: { tasks: [{ id: 'd1-only-task', title: 'Created on another device', priority: 'low', dueDate: '2026-09-20', deadlineType: 'date', isCompleted: false }] } });
await p.route('**/api/sync', (r) => (r.request().method() === 'POST' ? r.abort() : r.continue()));
await goto.cockpit(p); await p.fill('input[placeholder^="Tambah tugas"]', 'LOCAL ONLY unsynced'); await p.click('main button[type=submit]:has-text("Tambah")'); await p.waitForTimeout(400);
await sleep(2200); // let the (blocked) auto-sync attempt fail so the edit stays local-only
await goto.settings(p); await p.waitForTimeout(300);
await p.click('main button:has-text("Muat Ulang dari D1")'); await p.waitForTimeout(400);
check('8.7 reload-from-D1 asks TWICE (double confirmation)', /Ganti data lokal dengan data D1/.test(await txt(p, 'body')));
await p.click('button:has-text("Lanjutkan")'); await p.waitForTimeout(300);
check('8.7b second, final confirmation', /Konfirmasi terakhir/.test(await txt(p, 'body')));
await p.click('button:has-text("Ya, Ganti Data Lokal")'); await p.waitForTimeout(1500);
await p.unroute('**/api/sync');
s = await store(p);
check('8.7c local unsynced edit is discarded and the D1-only record appears', !s.tasks.some((t) => t.title === 'LOCAL ONLY unsynced') && s.tasks.some((t) => t.id === 'd1-only-task') && s.hasUnsyncedChanges === false, s.tasks.map((t) => t.title).join('|'));
check('8.7d honest success message (no fake "reset to demo")', !/data percontohan|demo/i.test(await txt(p, 'body')));

// ============================ sync token UX (F36) ============================
await browser.close();
({ browser, p } = await open({ token: null }));
check('A5 without a token the badge says a token is needed', /Perlu Token/.test(await txt(p, 'header')), await txt(p, 'header'));
await p.click('header button:has-text("Perlu Token")'); await p.waitForTimeout(500);
check('A5b diagnostics explains how to fix it', /Token sinkronisasi belum diisi/.test(await txt(p, 'body')));
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
await p.fill('input[placeholder^="Tambah tugas"]', 'works offline without token'); await p.click('main button[type=submit]:has-text("Tambah")'); await p.waitForTimeout(2200);
s = await store(p);
check('A6 the app still works locally without a token (local-first)', s.tasks.some((t) => t.title === 'works offline without token') && s.hasUnsyncedChanges === true);
await goto.settings(p); await p.waitForTimeout(300);
check('A7 settings shows "Token belum diisi"', /Token belum diisi/.test(await txt(p, 'main')));
await p.fill('input[type=password]', 'definitely-wrong'); await p.click('main button:has-text("Simpan Token")'); await p.waitForTimeout(1500);
check('A8 a wrong token is reported as rejected', /Token ditolak/.test(await txt(p, 'main')), (await txt(p, 'main')).match(/Cloudflare D1 Edge \| [^|]*/)?.[0]);
check('A8b badge reflects the rejected token', /Token Ditolak/.test(await txt(p, 'header')));
await p.fill('input[type=password]', 'e2e-token'); await p.click('main button:has-text("Simpan Token")'); await p.waitForTimeout(3500);
s = await store(p);
check('A9 correct token -> connected and the pending local edit is pushed to D1', /Terhubung/.test(await txt(p, 'main')) && (await api()).json.data.tasks.some((t) => t.title === 'works offline without token') && s.hasUnsyncedChanges === false);
check('A10 no page errors', p.errs.length === 0, p.errs.join(' | '));
await browser.close();
done();
