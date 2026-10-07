// Stage 05 + W5/W7 — cockpit schedule/KPIs, proximity, live class (stopwatch, hotkeys, Esc, persistence).
import { open, check, done, txt, store, sleep } from '../lib.mjs';

const MON_1350 = '2026-10-05T06:50:00Z'; // Mon 13:50 WIB: Starters 13:15-14:15 is LIVE, Flyers 14:30 upcoming
const kpi = async (p, label) => ((await txt(p, 'main')).match(new RegExp(`${label} \\| ([^|]+)`)) || [])[1]?.trim();

// ============================ schedule, KPIs, roll-call card ============================
let { browser, p, ctx } = await open({ time: MON_1350 });
const slots = await p.$$eval('[data-testid^="slot-"]', (e) => e.map((x) => ({ s: x.getAttribute('data-testid'), t: x.innerText.replace(/\n/g, ' ') })));
check('5.1 timeline is sorted by start time (13:15 before 14:30)', slots.length === 2 && /13:15/.test(slots[0].t) && /14:30/.test(slots[1].t), JSON.stringify(slots.map((x) => x.t.slice(0, 40))));
check('5.2 class already in progress is LIVE, the next one UPCOMING', slots[0]?.s === 'slot-live' && slots[1]?.s === 'slot-upcoming', slots.map((x) => x.s).join());
check('5.3 next-class KPI says live now (not a fake time)', /Sedang Berlangsung/.test((await kpi(p, 'KELAS BERIKUTNYA')) || ''), await kpi(p, 'KELAS BERIKUTNYA'));
const status = await p.locator('[data-testid="next-class-status"]').innerText();
check('5.4 next-class card focuses the live cohort', /Starters/.test(await txt(p, 'main')) && /berlangsung/i.test(status), status);
check('5.5 roll-call card follows the same cohort (Starters has 1 student)', /Cambridge Starters A1 • 1 siswa/.test(await txt(p, 'main')), (await txt(p, 'main')).match(/Cambridge [^|]* • \d+ siswa/)?.[0]);
check('5.6 monthly claim KPI has no hard-coded fallback (no October sessions -> Rp 0)', /^Rp\s?0$/.test((await kpi(p, 'KLAIM BULAN INI')) || ''), await kpi(p, 'KLAIM BULAN INI'));
check('5.7 no unrecorded student is shown as present on the roll-call card', (await p.locator('main [role=radio]').count()) > 0 && (await p.locator('main [role=radio][aria-checked=true]').count()) === 0);
// switch focus to Flyers: countdown + their roster
await p.locator('main select').first().selectOption('cohort-1'); await p.waitForTimeout(300);
const st2 = await p.locator('[data-testid="next-class-status"]').innerText();
check('5.8 upcoming class shows a countdown (starts in 40 min)', /dalam 40 mnt/.test(st2), st2);
check('5.9 roll-call switched to Flyers (5 students)', /Cambridge Flyers A2 • 5 siswa/.test(await txt(p, 'main')));
await browser.close();

// ---- proximity pulse (F30) ----------------------------------------------------------------------
const prox = async (time) => { const r = await open({ time }); const v = await r.p.locator('header [data-proximity]').first().getAttribute('data-proximity'); await r.browser.close(); return v; };
check('9.1 12:50 (class in 25 min) -> proximity "soon"', (await prox('2026-10-05T05:50:00Z')) === 'soon');
check('9.2 10:00 (no class within 30 min) -> "none"', (await prox('2026-10-05T03:00:00Z')) === 'none');
check('9.3 14:40 (class running) -> "live"', (await prox('2026-10-05T07:40:00Z')) === 'live');

// ---- a day with no class -------------------------------------------------------------------------
({ browser, p } = await open({ time: '2026-10-11T03:00:00Z' })); // Sunday: no class scheduled
check('5.11 no class today: empty timeline instead of listing every cohort', await p.locator('[data-testid="timeline-empty"]').count() === 1);
check('5.12 no class today: next-class KPI says none', /Tidak Ada Hari Ini/.test((await kpi(p, 'KELAS BERIKUTNYA')) || ''), await kpi(p, 'KELAS BERIKUTNYA'));
await browser.close();

// ============================ live class ============================
({ browser, p, ctx } = await open({ time: MON_1350 }));
await p.locator('main select').first().selectOption('cohort-1');
await p.click('main button:has-text("Mulai Kelas Langsung")'); await p.waitForTimeout(500);
const modal = () => p.locator('div.fixed').filter({ hasText: 'STOPWATCH SESI MENGAJAR' }).first();
const mtxt = async () => (await modal().innerText()).replace(/\n+/g, ' | ');
const sw = async () => (await mtxt()).match(/\d\d:\d\d:\d\d/)?.[0];
const secs = (t) => { const [h, m, s] = t.split(':').map(Number); return h * 3600 + m * 60 + s; };
const t0 = await sw(); await p.waitForTimeout(2300); const t1 = await sw();
check('5.13 stopwatch ticks', t0 !== t1, `${t0} -> ${t1}`);
await p.locator('div.fixed h2').first().click();
await p.keyboard.press('Space'); await p.waitForTimeout(300); const a = await sw(); await p.waitForTimeout(2100); const a2 = await sw();
check('5.14 Space pauses', a === a2, `${a} ${a2}`);
await p.keyboard.press('Space'); await p.waitForTimeout(2100);
check('5.15 Space resumes', (await sw()) !== a2);
await p.locator('div.fixed textarea').first().fill('Catatan: Budi butuh bantuan');
await p.locator('div.fixed h2').first().click();
await p.click('div.fixed button:has-text("Tahap Selanjutnya")'); await p.waitForTimeout(250);
check('5.16 stage stepper advances', /Penyampaian/.test(await mtxt()));

// 1-4 roll-call hotkeys (F22)
await p.keyboard.press('2'); await p.waitForTimeout(250); await p.keyboard.press('1'); await p.waitForTimeout(250);
let s = await store(p);
const today = '2026-10-05';
const att = s.attendanceRecords.filter((r) => r.attendanceDate === today && r.cohortId === 'cohort-1');
const liam = s.students.find((x) => x.fullName === 'Liam Wong'), aisha = s.students.find((x) => x.fullName === 'Aisha Khan');
check('5.17 key 2 marks the highlighted student Absent, then advances; key 1 marks the next Present',
  att.find((r) => r.studentId === liam.id)?.status === 'absent' && att.find((r) => r.studentId === aisha.id)?.status === 'present', JSON.stringify(att.map((r) => r.status)));
await p.keyboard.type('55'); // typing in a field must not trigger hotkeys
// micro-grade
await p.locator('div.fixed button:text-is("2")').first().click(); await p.waitForTimeout(250);
s = await store(p);
check('5.18 micro-grade writes the evaluation', s.studentEvaluations.some((e) => e.competencyScore === 2 && e.updatedAt));

// persistence (F14): reload while the class is running
await p.waitForTimeout(500);
s = await store(p);
check('7.1 live session is persisted (cohort, start, scratchpad)', s.live?.cohortId === 'cohort-1' && s.live?.scratchpad?.includes('Budi') && s.live?.startTime === '13:50', JSON.stringify(s.live));
await p.reload(); await p.waitForTimeout(2500);
check('7.2 reload mid-class restores the Live Cockpit with notes and running time', (await modal().count()) === 1 && (await mtxt()).includes('Catatan: Budi') === false && (await p.locator('div.fixed textarea').first().inputValue()).includes('Budi butuh bantuan'));
const afterReload = secs(await sw());
check('7.3 elapsed time survived the reload', afterReload >= 6, `${afterReload}s`);
// wall-clock accuracy (F14): jump 10 minutes
await ctx.clock.fastForward(10 * 60 * 1000); await p.waitForTimeout(1500);
const jumped = secs(await sw());
check('7.4 stopwatch is wall-clock based (10 min later -> ~10 min more)', jumped - afterReload >= 590 && jumped - afterReload <= 630, `${afterReload}s -> ${jumped}s`);

// Esc asks for confirmation (F13)
p.dialogs.length = 0;
await p.locator('div.fixed h2').first().click(); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
check('5.19 Esc asks for confirmation before leaving the cockpit view', p.dialogs.some((d) => /Tutup tampilan Kokpit/.test(d)), p.dialogs.join('|'));
check('5.19b view closed but the class keeps running', (await modal().count()) === 0 && /Sedang Berlangsung/.test((await kpi(p, 'KELAS BERIKUTNYA')) || ''), await kpi(p, 'KELAS BERIKUTNYA'));
await p.click('main button:has-text("Kelas Sedang Berlangsung")'); await p.waitForTimeout(400);
check('5.19c reopening resumes the same session (notes intact)', (await p.locator('div.fixed textarea').first().inputValue()).includes('Budi butuh bantuan'));

// finish
await p.click('div.fixed button:has-text("Selesai & Catat Honor")'); await p.waitForTimeout(800);
s = await store(p);
const ns = s.sessions.find((x) => x.scratchpadNotes?.includes('Budi'));
const dur = ns?.durationMinutes;
check('5.20 finishing creates the Teaching Session with the notes', !!ns && ns.status === 'completed' && ns.cohortId === 'cohort-1', JSON.stringify(ns));
check('F15 startTime is when the class STARTED (13:50) and endTime is after it', ns?.startTime === '13:50' && !!ns?.endTime && ns.endTime > ns.startTime, `${ns?.startTime}-${ns?.endTime} (${dur}m)`);
check('F8 session date is the local date', ns?.sessionDate === '2026-10-05');
check('5.21 rate comes from the cohort override (Flyers 175.000/h)', ns?.hourlyRate === 175000 && ns?.totalClaimAmount === Math.round((dur / 60) * 175000), `${ns?.hourlyRate} x ${dur}m = ${ns?.totalClaimAmount}`);
check('5.22 live state cleared', s.live === null || s.live === undefined);
const claimKpi = (await kpi(p, 'KLAIM BULAN INI')) || '';
check('5.23 monthly claim KPI now reflects the real session', parseInt(claimKpi.replace(/\D/g, '')) === ns.totalClaimAmount, claimKpi);
await p.reload(); await p.waitForTimeout(2500);
check('5.24 finished session does not reopen after reload', (await modal().count()) === 0);
check('5.25 timeline marks Flyers as completed', (await p.locator('[data-testid="slot-completed"]').count()) === 1);
check('5.26 no page errors', p.errs.length === 0, p.errs.join(' | '));
await browser.close();
done();
