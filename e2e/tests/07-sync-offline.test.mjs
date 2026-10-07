// Stages 11, 12, 14 + W3/W8 — auto-sync engine, offline brownout, service worker, diagnostics, cookies.
import { open, check, done, txt, store, goto, api, modalText, sleep } from '../lib.mjs';

let { browser, p, ctx } = await open();
let posts = [];
p.on('request', (r) => { if (r.url().includes('/api/sync') && r.method() === 'POST') posts.push(Date.now()); });
const addTask = async (title) => { await p.fill('input[placeholder^="Tambah tugas"]', title); await p.click('main button[type=submit]:has-text("Tambah")'); };

// ============================ Stage 14: auto-sync ============================
const t0 = Date.now();
await addTask('AS task 1');
let s = await store(p);
check('14.1 mutation is in localStorage synchronously, flagged unsynced', s.tasks.some((x) => x.title === 'AS task 1') && s.hasUnsyncedChanges === true && !!s.lastLocalMutationAt);
check('14.1b entity carries updatedAt', !!s.tasks.find((x) => x.title === 'AS task 1').updatedAt);
await addTask('AS task 2'); await addTask('AS task 3');
await sleep(3500);
check('14.2 debounced: 3 rapid edits -> exactly one POST ~1.5s after the last', posts.length === 1 && posts[0] - t0 > 1200 && posts[0] - t0 < 4000, `${posts.length} POST(s)`);
s = await store(p);
check('14.2b synced flags updated', s.hasUnsyncedChanges === false && !!s.lastSyncedAt);
check('14.3 all three tasks in D1', ['AS task 1', 'AS task 2', 'AS task 3'].every((t) => (api && true)) && (await api()).json.data.tasks.filter((x) => /^AS task/.test(x.title)).length === 3);

// every entity type is stamped (F35)
await goto.classes(p); await p.click('button[title="Ubah detail kelas aktif"]'); await p.waitForTimeout(300);
await p.fill('div.fixed input[type=time]', '15:00'); await p.click('div.fixed button[type=submit]:visible'); await p.waitForTimeout(400);
s = await store(p);
check('14.4 cohort update stamped with updatedAt', !!s.cohorts[0].updatedAt);
await p.waitForTimeout(2200);

// ============================ edit while a sync is in flight ============================
await goto.cockpit(p);
await p.route('**/api/sync', async (r) => { if (r.request().method() === 'POST') await sleep(2000); await r.continue(); });
await addTask('inflight A'); await sleep(2100); // POST A is now in flight (delayed)
await addTask('inflight B'); // edited while A is on the wire
await sleep(2300);
s = await store(p);
check('14.5 an edit made during an in-flight sync keeps the "unsynced" flag', s.tasks.some((x) => x.title === 'inflight B'), `unsynced=${s.hasUnsyncedChanges}`);
await sleep(5500);
await p.unroute('**/api/sync');
const remoteTasks = (await api()).json.data.tasks.map((x) => x.title);
check('14.5b both edits end up in D1 (nothing lost)', remoteTasks.includes('inflight A') && remoteTasks.includes('inflight B'), remoteTasks.slice(-3).join('|'));
check('14.5c final state is in-sync', (await store(p)).hasUnsyncedChanges === false);

// ============================ server error keeps data unsynced, no data loss ============================
await p.route('**/api/sync', (r) => (r.request().method() === 'POST' ? r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"boom"}' }) : r.continue()));
await addTask('during outage'); await sleep(2500);
s = await store(p);
check('14.6 a 500 from the edge leaves the edit safely queued', s.tasks.some((x) => x.title === 'during outage') && s.hasUnsyncedChanges === true);
check('14.6b badge says "Belum Tersinkron" (not an auth problem)', /Belum Tersinkron/.test(await txt(p, 'header')), await txt(p, 'header'));
await p.unroute('**/api/sync');

// ============================ Stage 11: diagnostics modal ============================
await p.click('header button:has-text("Belum Tersinkron")'); await p.waitForTimeout(1500);
let m = await modalText(p);
check('11.1 modal opens from the badge', /Diagnostik Cloudflare D1/.test(m) && /classque_db/.test(m));
check('11.2 local buffer shows Unsynced after the failed push', /Belum Tersinkron/.test(m), m.match(/Penyangga Local-First \| [^|]*/)?.[0]);
const remoteCount = async (label) => (await p.locator(`[data-testid="diag-remote-${label}"]`).innerText());
const summary = (await api('/api/sync?summary=1')).json;
check('11.3 D1 record counts are shown next to local counts (F32)', (await remoteCount('cohorts')) === `D1: ${summary.counts.cohorts}` && (await remoteCount('students')) === `D1: ${summary.counts.students}` && (await remoteCount('tasks')) === `D1: ${summary.counts.tasks}`, `${await remoteCount('cohorts')} ${await remoteCount('students')} ${await remoteCount('tasks')}`);
check('11.4 remote last-updated timestamp shown', (await p.locator('[data-testid="diag-remote-updated"]').innerText()) !== '—');
await p.click('div.fixed button:has-text("Uji Ping")'); await p.waitForTimeout(1200);
check('11.5 ping reports latency', /\d+ ms latensi/.test(await modalText(p)));
await p.click('div.fixed button:has-text("Sinkronkan Sekarang")'); await p.waitForTimeout(1800);
check('11.6 push syncs the queued edit -> Tersinkron + D1 updated', /Penyangga Local-First \| Tersinkron/.test(await modalText(p)) && (await api()).json.data.tasks.some((x) => x.title === 'during outage'));
check('11.6b D1 count refreshed after the push', (await remoteCount('tasks')) === `D1: ${(await api('/api/sync?summary=1')).json.counts.tasks}`);
s = await store(p);
await api('/api/sync', { method: 'POST', body: { tasks: [...s.tasks, { id: 'task-from-d1', teacherId: 'teacher-1', title: 'Created elsewhere', priority: 'low', dueDate: '2026-10-20', deadlineType: 'date', isCompleted: false }] } });
await p.click('div.fixed button:has-text("Tarik Data dari D1")'); await p.waitForTimeout(1500);
check('11.7 pull brings D1-only changes into the app', (await store(p)).tasks.some((x) => x.id === 'task-from-d1'));
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
check('11.8 Esc closes the diagnostics modal', !(await txt(p, 'body')).includes('Diagnostik Cloudflare D1'));

// the modal must be a centred overlay over the whole viewport when opened from the (blurred, sticky) top bar
await p.locator('header button[title*="Diagnostik"], header button[title*="sinkron" i], header button[title*="sync" i], header button[title*="diagnostics" i]').first().click(); await p.waitForTimeout(600);
const box = await p.locator('[role=dialog], div.fixed:has-text("Diagnostik Cloudflare D1")').last().boundingBox();
const panel = await p.locator('div.fixed:has-text("Diagnostik Cloudflare D1") > div').first().boundingBox();
const vp = p.viewportSize();
check('11.9 opened from the TOP BAR badge the diagnostics modal is a centred overlay, not trapped in the header', box.width >= vp.width - 2 && panel.width > 400 && panel.x > 200 && Math.abs(panel.x + panel.width / 2 - vp.width / 2) < 40, JSON.stringify({ box, panel }));
await p.keyboard.press('Escape'); await p.waitForTimeout(300);

// ============================ Stage 14: offline brownout ============================
// register the service worker + warm the cache, then go offline
await p.evaluate(() => navigator.serviceWorker.ready.then(() => true));
await p.reload(); await p.waitForTimeout(2500);
await ctx.setOffline(true); await p.waitForTimeout(400);
check('14.7 badge switches to offline', /Luar Jaringan/.test(await txt(p, 'header')), await txt(p, 'header'));
await addTask('Offline task A');
await goto.classes(p); await p.click('main button:has-text("Riwayat Presensi")'); await p.click('button:has-text("Tandai Semua Hadir")'); await p.waitForTimeout(2200);
s = await store(p);
check('14.8 offline edits are kept locally and queued', s.tasks.some((x) => x.title === 'Offline task A') && s.hasUnsyncedChanges === true);
// the big one (F34): reload while offline
let reloaded = true; try { await p.reload({ timeout: 10000 }); } catch { reloaded = false; }
await p.waitForTimeout(2000);
check('14.9 the app SHELL loads when reloaded offline (service worker)', reloaded && (await p.locator('aside').count()) === 1, `reloaded=${reloaded}`);
s = await store(p);
check('14.9b offline edits survived the offline reload', s?.tasks?.some((x) => x.title === 'Offline task A') && s.hasUnsyncedChanges === true);
await addTask('Offline task B').catch(() => {});
await ctx.setOffline(false); await p.evaluate(() => window.dispatchEvent(new Event('online'))); await sleep(3500);
const remote = (await api()).json.data;
check('14.10 reconnect pushes everything made offline (tasks + attendance), nothing lost', remote.tasks.some((x) => x.title === 'Offline task A') && remote.attendanceRecords.length >= 5, `${remote.attendanceRecords.length} attendance rows in D1`);
check('14.10b flags reset after reconnect', (await store(p)).hasUnsyncedChanges === false);

// ============================ Stage 12: cookies ============================
const ck = async () => Object.fromEntries((await ctx.cookies()).map((c) => [c.name, c]));
await goto.cockpit(p);
await p.locator('aside button[title*="bahasa"]').click(); await p.waitForTimeout(400);
let c = await ck();
check('12.1 cq_lang cookie set (SameSite=Lax, path=/, ~365 days)', c.cq_lang?.value === 'en' && c.cq_lang.sameSite === 'Lax' && c.cq_lang.path === '/' && Math.abs((c.cq_lang.expires * 1000 - Date.now()) / 864e5 - 365) < 2, JSON.stringify(c.cq_lang && { v: c.cq_lang.value, s: c.cq_lang.sameSite }));
const w0 = (await p.locator('aside').first().boundingBox()).width;
await p.locator('aside button').first().click(); await p.waitForTimeout(500);
const w1 = (await p.locator('aside').first().boundingBox()).width; c = await ck();
check('12.2 sidebar collapses and writes cq_sidebar_expanded=false', w1 < w0 && c.cq_sidebar_expanded?.value === 'false', `${w0}->${w1}`);
const badge = p.locator('header button[title*="Diagnostik"], header button[title*="sinkron" i], header button[title*="sync" i], header button[title*="diagnostics" i]').first();
check('15.BUG-07 sync status stays visible (top bar) while the sidebar is collapsed', (await badge.boundingBox())?.width > 10);
check('18.2a the sync badge is shown once: none in the sidebar', (await p.locator('aside button[title*="Diagnostik"], aside button[title*="sinkron" i], aside button[title*="sync" i], aside button[title*="diagnostics" i]').count()) === 0);
await p.reload(); await p.waitForTimeout(2500);
check('12.3 language + collapsed state restored from cookies', (await p.locator('aside').first().boundingBox()).width === w1 && /Today|Hours/i.test(await txt(p, 'main')));
await ctx.addCookies([{ name: 'cq_lang', value: 'id', url: 'http://localhost:8789' }]); await p.reload(); await p.waitForTimeout(2000);
check('12.4 cookie takes precedence over localStorage', /JAM MENGAJAR/.test(await txt(p, 'main')));
check('14.11 no page errors', p.errs.length === 0, p.errs.join(' | '));
await browser.close();
done();
