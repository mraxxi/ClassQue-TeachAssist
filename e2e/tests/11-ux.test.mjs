// Stage 17 UX — roll-call control, phone layouts, undo, onboarding, dark mode, fonts, shortcuts, offline chunks, axe.
import fs from 'fs';
import { createRequire } from 'module';
import { open, check, done, txt, store, goto, api, sleep, BASE } from '../lib.mjs';

const require = createRequire(import.meta.url);
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const MON = '2026-10-05T06:50:00Z'; // Mon 13:50 WIB (Starters live, Flyers 14:30)
const sel = (n) => `main button:has-text("${n}")`;

// ============================ roll-call control ============================
let { browser, p, ctx } = await open({ time: MON, width: 390, height: 844 });
check('U1 cockpit greeting names the teacher and what happens next', /Selamat siang, Ms\. Sarah/.test(await txt(p, '[data-testid="cockpit-greeting"]')) && /Cambridge Starters A1 sedang berlangsung sampai 14:15/.test(await txt(p, '[data-testid="cockpit-sentence"]')), await txt(p, '[data-testid="cockpit-greeting"]'));
const launch = await p.locator('main button:has-text("Mulai Kelas Langsung")').boundingBox();
check('U2 phone: the primary action ("start class") is inside the first screen (no scrolling)', launch && launch.y + launch.height < 844, JSON.stringify(launch));
check('U2b no second big clock banner (one compact clock on phones)', (await p.locator('text=Asia/Jakarta').count()) === 0);
const radios = p.locator('[role=radiogroup] [role=radio]');
check('U3 roll-call is a real radio group (4 radios per student)', (await p.locator('[role=radiogroup]').count()) >= 1 && (await radios.count()) % 4 === 0);
const size = await radios.first().boundingBox();
check('U3b touch targets are at least 44 px tall', size.height >= 44, `${size.width}x${size.height}`);
check('U3c nothing is selected until the teacher records it (no silent "present")', (await p.locator('[role=radio][aria-checked=true]').count()) === 0);
await radios.first().focus(); await p.keyboard.press('Space'); await p.waitForTimeout(250);
let s = await store(p);
check('U3d operable by keyboard (Space selects Present)', s.attendanceRecords.some((r) => r.status === 'present' && r.attendanceDate === '2026-10-05'));
check('U3e state is exposed to assistive tech (aria-checked) and the progress bar updates', (await p.locator('[role=radio][aria-checked=true]').count()) === 1 && /1\/1 tercatat/.test(await txt(p, 'main')), await txt(p, '[data-testid="rollcall-progress"]'));
const nav = await p.locator('div.md\\:hidden button').first().boundingBox();
check('U3f bottom navigation targets are touch-sized', nav.height >= 44, `${nav.height}px`);

// ============================ phone live cockpit ============================
await p.click('main button:has-text("Mulai Kelas Langsung")'); await p.waitForTimeout(500);
const modal = p.locator('div.fixed').filter({ hasText: 'STOPWATCH SESI MENGAJAR' }).first();
const mb = await modal.locator('div.bg-white, div.bg-\\(--app-paper\\)').first().boundingBox().catch(() => null);
const tabs = p.locator('[role=tab]');
check('U4 phone live cockpit shows 4 tabs (Presensi · Nilai · Pelajaran · Catatan)', (await tabs.count()) === 4 && /Presensi/.test(await tabs.first().innerText()));
const visibleSections = async () => p.evaluate(() => [...document.querySelectorAll('div.fixed [class*="rounded-3xl"]')].filter((e) => e.offsetParent !== null && e.getBoundingClientRect().height > 0 && !e.innerText.includes('STOPWATCH') && !e.querySelector('[class*="rounded-3xl"]')).map((e) => e.innerText.slice(0, 18).replace(/\n/g, ' ')));
const first = await visibleSections();
await p.click('[role=tab]:has-text("Catatan")'); await p.waitForTimeout(250);
const notes = await visibleSections();
check('U4b only the selected tab\'s section is shown on a phone', first.length === 1 && notes.length === 1 && /CATATAN/i.test(notes[0]) && !/PRESENSI/i.test(notes[0]), `${first} -> ${notes}`);
const h2 = await p.locator('div.fixed h2').first().boundingBox(), fin = await p.locator('div.fixed button:has-text("Selesai")').boundingBox();
check('U4c header: cohort name is not covered by the Finish button', !(h2.x < fin.x + fin.width && h2.x + h2.width > fin.x && h2.y < fin.y + fin.height && h2.y + h2.height > fin.y), `${JSON.stringify(h2)} vs ${JSON.stringify(fin)}`);
const sheet = await p.locator('div.fixed').filter({ hasText: 'STOPWATCH SESI MENGAJAR' }).first().boundingBox();
check('U4d on phones the live cockpit is a full-height sheet (no floating card)', sheet.height >= 840 && sheet.y <= 1, JSON.stringify(sheet));
await browser.close();

// ============================ Undo ============================
({ browser, p } = await open({ time: MON }));
const B = await open({ time: '2026-10-05T07:00:00Z' });
await goto.classes(p); await p.click(sel('Cambridge Flyers A2')); await p.click('main button:has-text("Riwayat Presensi")'); await p.click('button:has-text("Tandai Semua Hadir")'); await p.waitForTimeout(500);
await p.click('main button:has-text("Direktori Siswa (")'); await p.waitForTimeout(300);
s = await store(p); const liam = s.students.find((x) => x.fullName === 'Liam Wong');
const had = { att: s.attendanceRecords.filter((r) => r.studentId === liam.id).length, ev: s.studentEvaluations.filter((e) => e.studentId === liam.id).length };
await p.click('main :text("Liam Wong") >> nth=0'); await p.click('button[title="Hapus siswa"]'); await p.click('button:has-text("Ya, Hapus Siswa")'); await p.waitForTimeout(500);
check('U5 deleting shows ONE toast with an Undo action', (await p.locator('[role=status] button:has-text("Urungkan")').count()) === 1 && /Liam Wong.*dihapus/.test(await txt(p, '[role=status]')), await txt(p, '[role=status]'));
await sleep(2800);
const bPull = async () => { await B.p.click('header button').catch(() => {}); await B.p.waitForTimeout(500); await B.p.click('div.fixed button:has-text("Tarik Data dari D1")'); await B.p.waitForTimeout(1500); await B.p.keyboard.press('Escape'); await B.p.waitForTimeout(300); };
await bPull();
check('U5b the delete reached D1 and device B (setup for the cross-device undo)', !(await store(B.p)).students.some((x) => x.id === liam.id));
await p.locator('[role=status] button:has-text("Urungkan")').click().catch(() => {});
await p.waitForTimeout(500);
s = await store(p);
check('U5c Undo restores the student with ALL attendance and evaluations (cascade)', s.students.some((x) => x.id === liam.id) && s.attendanceRecords.filter((r) => r.studentId === liam.id).length === had.att && s.studentEvaluations.filter((e) => e.studentId === liam.id).length === had.ev, `${JSON.stringify(had)}`);
check('U5d the pending tombstones are removed', !(s.tombstones.students || []).some((t) => t.id === liam.id));
check('U5e a "Dikembalikan" confirmation is shown', /Dikembalikan/.test(await txt(p, 'body')));
await sleep(3000);
check('U5f the restore is pushed to D1 (a newer edit revives the soft-deleted row)', (await api()).json.data.students.some((x) => x.id === liam.id) && (await api()).json.data.attendanceRecords.filter((r) => r.studentId === liam.id).length === had.att);
await bPull();
check('U5g and device B gets the student back through its next delta pull', (await store(B.p)).students.some((x) => x.id === liam.id));
// cohort delete + undo
await p.click(sel('Cambridge Starters A1')); await p.click('button[title="Hapus kelas"]'); await p.click('button:has-text("Ya, Hapus Kelas")'); await p.waitForTimeout(400);
check('U5h deleting a cohort also offers Undo', await p.locator('[role=status] button:has-text("Urungkan")').count() === 1);
await p.locator('[role=status] button:has-text("Urungkan")').click(); await p.waitForTimeout(400);
s = await store(p);
check('U5i Undo brings the cohort and its student back', s.cohorts.some((c) => c.id === 'cohort-2') && s.students.some((x) => x.cohortId === 'cohort-2'));
// tasks
await goto.cockpit(p); await p.fill('input[placeholder^="Tambah tugas"]', 'undo me'); await p.click('main button[type=submit]:has-text("Tambah")'); await p.waitForTimeout(300);
await p.locator('xpath=//*[normalize-space(text())="undo me"]/ancestor::div[@data-testid="task-row"][1]').locator('button[title="Hapus tugas"]').click(); await p.waitForTimeout(300);
check('U5j task delete (no confirm dialog) is protected by Undo', !(await store(p)).tasks.some((t) => t.title === 'undo me') && (await p.locator('[role=status] button:has-text("Urungkan")').count()) === 1);
await p.locator('[role=status] button:has-text("Urungkan")').click(); await p.waitForTimeout(300);
check('U5k the task is back', (await store(p)).tasks.some((t) => t.title === 'undo me'));
await B.browser.close();
check('U5l no page errors', p.errs.length === 0, p.errs.join(' | '));
await browser.close();

// ============================ first run: onboarding + empty states ============================
({ browser, p } = await open({ token: null }));
check('U6 first run shows the setup checklist', await p.locator('[data-testid="onboarding"]').count() === 1 && /0 dari 5 langkah/.test(await txt(p, '[data-testid="onboarding"]')), (await txt(p, '[data-testid="onboarding"]')).slice(0, 120));
check('U6b the greeting says there are no classes (not an empty void)', /Tidak ada kelas hari ini/.test(await txt(p, '[data-testid="cockpit-sentence"]')));
await p.click('[data-testid="onboarding"] button:has-text("Buat rombel pertama")'); await p.waitForTimeout(400);
check('U6c the first step navigates to the hub, which shows a purposeful empty state', await p.locator('[data-testid="cohorts-empty"]').count() === 1 && /Buat Rombel Pertama/.test(await txt(p, 'main')));
await p.click('[data-testid="cohorts-empty"] button'); await p.waitForTimeout(300);
await p.fill('input[placeholder^="mis. Cambridge Flyers"]', 'First Cohort'); await p.click('div.fixed button:has-text("Buat Kelas")'); await p.waitForTimeout(500);
check('U6d empty state disappears once a cohort exists', await p.locator('[data-testid="cohorts-empty"]').count() === 0);
await goto.lessons(p); await p.waitForTimeout(700); check('U6e lesson planner empty state has a call to action', await p.locator('[data-testid="plans-empty"] button').count() === 1);
await goto.cockpit(p);
check('U6f checklist progress moved (1 of 5)', /1 dari 5 langkah/.test(await txt(p, '[data-testid="onboarding"]')));
await p.click('[data-testid="onboarding"] button[aria-label^="Sembunyikan"]'); await p.waitForTimeout(200);
await p.reload(); await p.waitForTimeout(2000);
check('U6g dismissing the checklist is remembered', await p.locator('[data-testid="onboarding"]').count() === 0);
await browser.close();
({ browser, p } = await open({ time: MON }));
check('U6h the checklist never shows for a working setup (cohorts + students exist)', await p.locator('[data-testid="onboarding"]').count() === 0);
await browser.close();

// ============================ dark mode ============================
({ browser, p, ctx } = await open({ time: MON }));
const lum = async () => p.evaluate(() => { const c = getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g).map(Number); return (c[0] + c[1] + c[2]) / 3; });
const lightLum = await lum();
check('U7 default is light (no cookie, light OS)', (await p.evaluate(() => document.documentElement.dataset.theme)) === 'light' && lightLum > 200);
await p.click('[data-testid="theme-toggle"]'); await p.waitForTimeout(300);
check('U7b the sidebar toggle switches to dark and writes cq_theme', (await p.evaluate(() => document.documentElement.dataset.theme)) === 'dark' && (await lum()) < 60 && (await ctx.cookies()).find((c) => c.name === 'cq_theme')?.value === 'dark', `lum ${lightLum} -> ${await lum()}`);
const cardBg = await p.evaluate(() => getComputedStyle(document.querySelector('main section, main > div > div')).backgroundColor);
check('U7c cards re-light too (not only the page background)', (await p.evaluate(() => { const el = [...document.querySelectorAll('main div')].find((d) => getComputedStyle(d).backgroundColor !== 'rgba(0, 0, 0, 0)' && d.className.includes('bg-white')); if (!el) return false; const c = getComputedStyle(el).backgroundColor.match(/[\d.]+/g).map(Number); return (c[0] + c[1] + c[2]) / 3 < 80; })));
await p.goto(BASE, { waitUntil: 'domcontentloaded' });
check('U7d no flash on reload: the theme is applied before React renders', (await p.evaluate(() => document.documentElement.dataset.theme)) === 'dark');
await p.waitForTimeout(2000);
await goto.classes(p); await p.click('button[title="Hapus kelas"]'); await p.waitForTimeout(300);
const scrim = await p.evaluate(() => { const el = document.querySelector('.scrim'); const c = getComputedStyle(el).backgroundColor.match(/[\d.]+/g).map(Number); return c.slice(0, 3); });
check('U7e modal backdrops stay a DARK scrim in dark mode (they used to invert to light)', scrim.every((v) => v < 40), scrim.join());
await p.keyboard.press('Escape');
await p.emulateMedia({ media: 'print' });
check('U7f printing is always light even in dark mode', (await lum()) > 200);
await p.emulateMedia({ media: 'screen' });
await goto.settings(p); await p.waitForTimeout(300);
await p.click('[data-testid="theme-picker"] [role=radio]:has-text("Terang")'); await p.waitForTimeout(200);
check('U7g Settings picker: choosing Light flips it back and the radio state follows', (await p.evaluate(() => document.documentElement.dataset.theme)) === 'light' && (await p.locator('[data-testid="theme-picker"] [role=radio][aria-checked=true]').innerText()).includes('Terang'));
await browser.close();
// system preference: OS dark + no cookie -> dark
const { chromium } = await import('playwright-core');
const b2 = await chromium.launch({ executablePath: process.env.CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox'] });
const c2 = await b2.newContext({ colorScheme: 'dark', locale: 'id-ID' }); const p2 = await c2.newPage();
await p2.goto(BASE); await p2.waitForTimeout(1500);
check('U7h with no saved choice the app follows the OS (dark)', (await p2.evaluate(() => document.documentElement.dataset.theme)) === 'dark');
await p2.emulateMedia({ colorScheme: 'light' }); await p2.waitForTimeout(400);
check('U7i ...and live-updates when the OS theme changes', (await p2.evaluate(() => document.documentElement.dataset.theme)) === 'light');
await b2.close();

// ============================ fonts, shortcuts ============================
({ browser, p } = await open({ time: MON, goto: false }));
const reqs = []; p.on('request', (r) => reqs.push(r.url()));
await p.goto(BASE); await p.waitForTimeout(2500);
check('U8 fonts are self-hosted: no request to Google Fonts', !reqs.some((u) => /googleapis|gstatic/.test(u)) && reqs.some((u) => /\.woff2/.test(u)), reqs.filter((u) => /font|woff/.test(u)).join(' ').slice(0, 120));
check('U8b the first-load JS is code-split (hubs are lazy chunks)', reqs.filter((u) => /\/assets\/.*\.js/.test(u)).length >= 2);
await p.keyboard.press('?'); await p.waitForTimeout(300);
check('U9 "?" opens the keyboard shortcuts dialog', await p.locator('[role=dialog]:has-text("Pintasan keyboard")').count() === 1 && /Presensi siswa terpilih/.test(await txt(p, 'body')));
check('U9b focus moves into the dialog', await p.evaluate(() => !!document.activeElement?.closest('[role=dialog]')));
await p.keyboard.press('Escape'); await p.waitForTimeout(250);
check('U9c Esc closes it', await p.locator('[role=dialog]').count() === 0);
await p.fill('input[placeholder^="Tambah tugas"]', ''); await p.locator('input[placeholder^="Tambah tugas"]').focus(); await p.keyboard.type('apa?'); await p.waitForTimeout(200);
check('U9d typing "?" in a field does NOT open the dialog', await p.locator('[role=dialog]').count() === 0);
await browser.close();

// ============================ lazy hubs still open offline ============================
({ browser, p, ctx } = await open({ time: MON }));
await p.evaluate(() => navigator.serviceWorker.ready.then(() => true)); await p.reload(); await p.waitForTimeout(4500); // idle preload warms the cache
await ctx.setOffline(true);
await goto.claims(p); await p.waitForTimeout(800);
check('U10 a lazy-loaded hub (Claims) still opens while offline (preloaded into the service-worker cache)', /Klaim Honorarium Mengajar/.test(await txt(p, 'main')), (await txt(p, 'main')).slice(0, 80));
await goto.settings(p); await p.waitForTimeout(500);
check('U10b ...and so does Settings', /Cloudflare D1 Edge/.test(await txt(p, 'main')));
await browser.close();

// ============================ axe: accessibility audit ============================
const screens = {
  cockpit: async () => {}, classes: (p_) => goto.classes(p_),
  attendance: async (p_) => { await goto.classes(p_); await p_.click('main button:has-text("Riwayat Presensi")'); },
  cefr: async (p_) => { await goto.classes(p_); await p_.click('main button:has-text("Capaian CEFR")'); },
  lessons: (p_) => goto.lessons(p_), claims: (p_) => goto.claims(p_),
  reports: async (p_) => { await goto.claims(p_); await p_.click('main button:has-text("Laporan Wali Murid")'); },
  settings: (p_) => goto.settings(p_),
  live: async (p_) => { await p_.click('main button:has-text("Mulai Kelas Langsung")'); },
  'student-modal': async (p_) => { await goto.classes(p_); await p_.click('button[aria-label="Tambah Siswa"]'); },
  'lesson-modal': async (p_) => { await goto.lessons(p_); await p_.click('main button:has-text("Buat RPP Baru")'); },
};
let violations = [];
for (const [theme, w, h] of [['light', 1400, 900], ['dark', 1400, 900], ['light', 390, 844]]) {
  for (const [name, go] of Object.entries(screens)) {
    const r = await open({ time: MON, width: w, height: h });
    if (theme === 'dark') { await r.ctx.addCookies([{ name: 'cq_theme', value: 'dark', url: BASE }]); await r.p.reload(); await r.p.waitForTimeout(1800); }
    await go(r.p); await r.p.waitForTimeout(400);
    await r.p.evaluate(axeSrc);
    const res = await r.p.evaluate(() => axe.run(document, { resultTypes: ['violations'] }));
    res.violations.forEach((v) => violations.push(`${name}/${theme}/${w} ${v.id}(${v.impact}) x${v.nodes.length}: ${v.nodes[0].html.replace(/class="[^"]*"/, '').slice(0, 90)}`));
    await r.browser.close();
  }
}
check('A11Y axe-core finds no violations on 10 screens x (light, dark, phone)', violations.length === 0, violations.slice(0, 4).join(' || '));
done();
