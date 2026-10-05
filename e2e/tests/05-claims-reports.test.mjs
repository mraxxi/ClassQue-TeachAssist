// Stages 06 + 07 / W4 + W6 — claims engine and parent reports.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { open, check, done, txt, store, goto, modalText, sleep } from '../lib.mjs';

const rp = (s) => parseInt(String(s || '').replace(/[^0-9]/g, '')) || 0;
// Sat 12 Sep 2026 (WIB): the seed has a September claim + one September session.
const { browser, p } = await open({ time: '2026-09-12T03:00:00Z' });
const kv = async (k) => ((await txt(p, 'main')).match(new RegExp(`${k} \\| ([^|]+)`)) || [])[1]?.trim();
await goto.claims(p); await p.waitForTimeout(500);

// ============================ months (F19) ============================
const months = await p.$$eval('main select option', (o) => o.map((x) => x.value));
check('6.0 month selector is data-driven and includes the current month', months.includes('2026-09') && months.length >= 1, months.join());
check('6.0b current month is selected by default', (await p.inputValue('main select')) === '2026-09');

// ============================ maths ============================
const base0 = rp(await kv('HONOR POKOK SESI')), grand0 = rp(await kv('GRAND TOTAL KLAIM'));
await p.click('main button:has-text("Catat Sesi Manual")'); await p.waitForTimeout(300);
await p.fill('div.fixed input[type=date]', '2026-09-10');
await p.fill('div.fixed input[type=number][aria-label]', '120');
await p.locator('div.fixed input[type=number]').nth(1).fill('150000');
await p.fill('div.fixed textarea', 'Make-up class');
await p.click('div.fixed button:has-text("Simpan Sesi")'); await p.waitForTimeout(500);
let s = await store(p);
const ms = s.sessions.find((x) => x.sessionDate === '2026-09-10');
check('6.1 manual session saved (2h @150.000 = 300.000)', ms?.durationMinutes === 120 && ms?.hourlyRate === 150000 && ms?.totalClaimAmount === 300000 && ms.endTime === '16:00', JSON.stringify(ms));
check('6.1b base amount +300.000', rp(await kv('HONOR POKOK SESI')) === base0 + 300000);
check('6.1c grand total +300.000', rp(await kv('GRAND TOTAL KLAIM')) === grand0 + 300000);

// ============================ allowance persistence (F17) ============================
await p.fill('main input[type=number]', '250000'); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
s = await store(p);
let claim = s.claims.find((c) => c.claimPeriod === '2026-09');
check('6.2 allowance saved to the claim record immediately', claim?.allowanceAmount === 250000, JSON.stringify(claim));
check('6.2b record totals refreshed (sessions/hours/base/total)', claim?.totalSessions === 2 && claim.baseAmount === base0 + 300000 && claim.totalClaimAmount === base0 + 300000 + 250000, JSON.stringify(claim));
await sleep(2500); await p.reload(); await p.waitForTimeout(2500); await goto.claims(p); await p.waitForTimeout(500);
check('6.2c allowance survives sync + reload', (await p.inputValue('main input[type=number]')) === '250000');

// ============================ status workflow + timestamps (F18) ============================
await p.click('main button:has-text("2. Submitted")'); await p.waitForTimeout(300);
s = await store(p); claim = s.claims.find((c) => c.claimPeriod === '2026-09');
check('6.3 -> submitted sets submittedAt', claim.status === 'submitted' && !!claim.submittedAt && !claim.paidAt, JSON.stringify([claim.status, claim.submittedAt, claim.paidAt]));
check('6.3b submitted claim locks the allowance field', await p.locator('main input[type=number]').isDisabled());
await p.click('main button:has-text("3. Approved")'); await p.waitForTimeout(300);
await p.click('main button:has-text("4. Paid")'); await p.waitForTimeout(300);
s = await store(p); claim = s.claims.find((c) => c.claimPeriod === '2026-09');
check('6.3c -> paid sets paidAt and keeps submittedAt', claim.status === 'paid' && !!claim.paidAt && !!claim.submittedAt);
await p.click('main button:has-text("1. Draft")'); await p.waitForTimeout(300);
s = await store(p); claim = s.claims.find((c) => c.claimPeriod === '2026-09');
check('6.3d back to draft clears both timestamps', claim.status === 'draft' && !claim.submittedAt && !claim.paidAt);

// ============================ new month claim is created on demand ============================
const baseOct = '2026-10';
await p.selectOption('main select', baseOct).catch(() => {});
const hasOct = (await p.$$eval('main select option', (o) => o.map((x) => x.value))).includes(baseOct);
console.log('  (October present in selector:', hasOct, ')');

// ============================ invoice ============================
await p.click('main button:has-text("Cetak Faktur Klaim")'); await p.waitForTimeout(500);
const inv = await modalText(p);
check('6.4 invoice: school, teacher, reference, items, signature block', /Garuda/.test(inv) && /Jenkins/.test(inv) && /CLM-202609/.test(inv) && /Cambridge/.test(inv) && /Tanda Tangan/.test(inv), inv.slice(0, 160));
const pdf = path.join(os.tmpdir(), 'classque-invoice.pdf');
await p.emulateMedia({ media: 'print' }); await p.waitForTimeout(300);
await p.pdf({ path: pdf, format: 'A4', preferCSSPageSize: true });
await p.emulateMedia({ media: 'screen' });
check('6.4b invoice prints on one A4 page', (fs.readFileSync(pdf, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length === 1);
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
check('6.4c Esc closes the invoice', !(await txt(p, 'body')).includes('Formal Teaching Honorarium'));

// ============================ edit / delete session (F21) ============================
await p.locator('main button[title="Edit session"]').first().click(); await p.waitForTimeout(300);
check('6.5 edit opens the session prefilled', (await p.inputValue('div.fixed input[type=number][aria-label]')) !== '' && /Ubah Sesi/.test(await modalText(p)));
const target = await p.inputValue('div.fixed input[type=date]');
await p.fill('div.fixed input[type=number][aria-label]', '75'); await p.click('div.fixed button:has-text("Simpan Sesi")'); await p.waitForTimeout(400);
s = await store(p);
const edited = s.sessions.find((x) => x.sessionDate === target && x.durationMinutes === 75);
check('6.5b duration adjusted and amount recalculated', !!edited && edited.totalClaimAmount === Math.round((75 / 60) * edited.hourlyRate), JSON.stringify(edited));
check('6.5c draft claim totals follow the edit', (await store(p)).claims.find((c) => c.claimPeriod === '2026-09').totalClaimAmount === (await store(p)).sessions.filter((x) => x.sessionDate.startsWith('2026-09')).reduce((a, x) => a + x.totalClaimAmount, 0) + 250000);
const n0 = s.sessions.length;
await p.locator('main button[title="Delete session"]').first().click(); await p.waitForTimeout(300);
await p.click('button:has-text("Ya, Hapus Sesi")'); await p.waitForTimeout(400);
s = await store(p);
check('6.6 delete session (confirm) + tombstone', s.sessions.length === n0 - 1 && (s.tombstones.sessions || []).length === 1);

// ============================ Stage 07: parent reports ============================
await p.click('main button:has-text("Laporan Wali Murid")'); await p.waitForTimeout(500);
const pick = async (n) => { await p.locator(`main :text("${n}")`).first().click(); await p.waitForTimeout(400); };
// F23: a student with no data must not get invented numbers
await pick('Siti Rahma');
let t = await txt(p, 'main');
check('7.1 no attendance recorded -> says so (no fabricated 100% / 8 sessions)', !/100% \(8\/8/.test(t) && /Belum ada data presensi/.test(t), t.match(/KEHADIRAN \| [^|]+/)?.[0]);
check('7.1b no evaluations -> no invented CEFR scores / praise', !/Sangat baik dan antusias/.test(t) && !/Capaian Kompetensi/.test(t));
await p.fill('main textarea', ''); // Siti's profile notes pre-fill the narrative; clear it -> nothing at all to report
await p.click('main button:has-text("Simpan ke Riwayat Rapor")'); await p.waitForTimeout(300);
s = await store(p);
check('7.1c saving a report with no data and no narrative is refused', !s.parentReports.some((r) => r.studentId === s.students.find((x) => x.fullName === 'Siti Rahma').id));
// real data: Liam, in September, via the attendance tab
await goto.classes(p); await p.click('main button:has-text("Riwayat Presensi")'); await p.waitForTimeout(300);
const liamRow = () => p.locator('xpath=//*[normalize-space(text())="Liam Wong"]/ancestor::div[.//button[contains(.,"Terlambat")]][1]').first();
for (const [d, l] of [['2026-09-14', 'Hadir (H)'], ['2026-09-15', 'Alpa (A)'], ['2026-09-16', 'Terlambat (T)'], ['2026-08-20', 'Alpa (A)']]) {
  await p.fill('input[type=date]', d); await p.waitForTimeout(200); await liamRow().locator(`button:has-text("${l}")`).click(); await p.waitForTimeout(150);
}
await goto.claims(p); await p.click('main button:has-text("Laporan Wali Murid")'); await p.waitForTimeout(400); await pick('Liam Wong');
t = await txt(p, 'main');
check('7.2 attendance computed for the SELECTED month only (Sept: 2/3 = 67%, the August absence is excluded)', /67% \(2\/3/.test(t), t.match(/KEHADIRAN \| [^|]+/)?.[0]);
check('7.2b CEFR taken from real evaluations only', /SPOKEN_PRODUCTION: \*M/.test(t) && /LISTENING: \*TC/.test(t));
await p.locator('main select[aria-label]').selectOption('2026-08'); await p.waitForTimeout(300);
check('7.2c switching the report period changes the numbers (Aug: 0/1 = 0%)', /0% \(0\/1/.test(await txt(p, 'main')), (await txt(p, 'main')).match(/KEHADIRAN \| [^|]+/)?.[0]);
await p.locator('main select[aria-label]').selectOption('2026-09'); await p.waitForTimeout(300);
await p.fill('main textarea', 'UNIQUE_NARRATIVE_TOKEN Liam makes great progress.');
t = await txt(p, 'main');
check('7.3 narrative flows into the WhatsApp text', t.includes('UNIQUE_NARRATIVE_TOKEN'));
await p.click('main button:has-text("Salin Teks WA")'); await p.waitForTimeout(400);
const clip = await p.evaluate(() => navigator.clipboard.readText());
check('7.4 clipboard holds the formatted message (emoji, name, narrative)', /LAPORAN PERKEMBANGAN/.test(clip) && /📚/.test(clip) && /Liam Wong/.test(clip) && /UNIQUE_NARRATIVE_TOKEN/.test(clip));
const href = await p.$eval('main a[href*="wa.me"]', (a) => a.href).catch(() => '');
check('7.5 Open WA link = wa.me/<guardian digits>?text=…', href.startsWith('https://wa.me/6281234567890?text=') && decodeURIComponent(href).includes('Liam Wong'));
await p.click('main button:has-text("Simpan ke Riwayat Rapor")'); await p.waitForTimeout(400);
s = await store(p);
let rep = s.parentReports.find((r) => r.studentId === 'student-1' && r.reportPeriod === '2026-09');
check('7.6 report saved with real numbers', rep?.attendanceRate === 67 && rep.totalSessionsCount === 3 && rep.presentCount === 2 && rep.teacherNarrativeFeedback.includes('UNIQUE_NARRATIVE'), JSON.stringify(rep && [rep.attendanceRate, rep.totalSessionsCount, rep.presentCount]));
await p.fill('main textarea', 'UPDATED narrative'); await p.click('main button:has-text("Simpan ke Riwayat Rapor")'); await p.waitForTimeout(400);
s = await store(p);
const same = s.parentReports.filter((r) => r.studentId === 'student-1' && r.reportPeriod === '2026-09');
check('7.7 saving the same student + period updates instead of duplicating (F25)', same.length === 1 && same[0].teacherNarrativeFeedback === 'UPDATED narrative', `${same.length} report(s)`);
await p.click('main button:has-text("Belum Kirim")'); await p.waitForTimeout(300);
s = await store(p); rep = s.parentReports.find((r) => r.studentId === 'student-1');
check('7.8 sent toggle sets sentAt', rep.isSent && !!rep.sentAt);
await p.click('main button:has-text("Terkirim")'); await p.waitForTimeout(300);
check('7.8b toggling back clears it', (await store(p)).parentReports.find((r) => r.studentId === 'student-1').isSent === false);
await p.click('main button:has-text("Simpan ke Riwayat Rapor")'); await p.waitForTimeout(300);
check('7.8c re-saving an existing report keeps its sent state', (await store(p)).parentReports.find((r) => r.studentId === 'student-1').isSent === false);
await p.click('main button:has-text("Pratinjau & Cetak A4")'); await p.waitForTimeout(500);
const card = await modalText(p);
check('7.9 A4 preview: attendance, CEFR table, narrative, ref', /67%/.test(card) && /A2\.SP\.1/.test(card) && /UPDATED narrative/.test(card) && /Ref: 2026-09-/.test(card), card.slice(0, 120));
const pdf2 = path.join(os.tmpdir(), 'classque-report.pdf');
await p.emulateMedia({ media: 'print' }); await p.waitForTimeout(300);
await p.pdf({ path: pdf2, format: 'A4', preferCSSPageSize: true });
await p.emulateMedia({ media: 'screen' });
check('7.9b report card prints on ONE A4 page', (fs.readFileSync(pdf2, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length === 1);
await p.keyboard.press('Escape');
// printed card for a student without data: honest empty states
await p.waitForTimeout(300); await pick('Siti Rahma');
await p.click('main button:has-text("Pratinjau & Cetak A4")'); await p.waitForTimeout(400);
const empty = await modalText(p);
check('7.10 printed card for a student without data has no invented content', /Belum ada data presensi/.test(empty) && /Belum ada evaluasi CEFR/.test(empty) && !/antusiasme belajar yang sangat baik/.test(empty), empty.slice(0, 200));
await p.keyboard.press('Escape');
check('7.11 no page errors', p.errs.length === 0, p.errs.join(' | '));
await browser.close();
done();
