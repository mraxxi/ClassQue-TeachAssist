// Stage 02 + W4/W5 — attendance engine: navigation, unrecorded != present, notes, matrix, profile gauge, LOCAL dates.
import { open, check, done, txt, store, goto } from '../lib.mjs';

// 2026-10-05T20:00Z = Tue 6 Oct 03:00 WIB. A UTC-based "today" would say 2026-10-05.
const { browser, p } = await open({ time: '2026-10-05T20:00:00Z' });
await goto.classes(p); await p.click('main button:has-text("Riwayat Presensi")'); await p.waitForTimeout(400);
const dateOnPage = async () => (await txt(p, 'main')).match(/Sesi: (\d{4}-\d{2}-\d{2})/)?.[1];

check('F8 default date is the LOCAL date (2026-10-06 at 03:00 WIB)', (await dateOnPage()) === '2026-10-06', await dateOnPage());
await p.click('button[title="Previous Day"]'); await p.waitForTimeout(200);
check('2.1 previous day', (await dateOnPage()) === '2026-10-05');
await p.click('button[title="Next Day"]'); await p.waitForTimeout(200);
check('2.2 next day', (await dateOnPage()) === '2026-10-06');
await p.click('button[title="Previous Day"]'); await p.click('button[title="Previous Day"]'); await p.click('main button:has-text("Hari Ini")'); await p.waitForTimeout(200);
check('2.3 Today button returns to today', (await dateOnPage()) === '2026-10-06');
await p.fill('input[type=date]', '2026-09-28'); await p.waitForTimeout(300);
check('2.4 date picker jump', (await dateOnPage()) === '2026-09-28');

// ---- unrecorded is NOT present (F9) --------------------------------------------------------------
let t = await txt(p, 'main');
const kpi = (label) => t.match(new RegExp(`${label} \\| (\\d+|—)`))?.[1];
check('9.1 nothing recorded -> rate shows "—" (not 100%)', kpi('TINGKAT KEHADIRAN') === '—', t.match(/TINGKAT KEHADIRAN \| [^|]*/)?.[0]);
check('9.2 nothing recorded -> 0 present, all "Belum Dicatat"', kpi('HADIR') === '0' && /BELUM DICATAT \| 5/.test(t), t.match(/HADIR \| \d+/)?.[0] + ' ' + t.match(/BELUM DICATAT \| \d+/)?.[0]);

const row = (name) => p.locator(`xpath=//*[normalize-space(text())="${name}"]/ancestor::div[.//button[contains(.,"Terlambat")]][1]`).first();
await row('Liam Wong').locator('button:has-text("Terlambat (T)")').click(); await p.waitForTimeout(250);
let s = await store(p); const liam = s.students.find((x) => x.fullName === 'Liam Wong');
let rec = s.attendanceRecords.find((r) => r.studentId === liam.id && r.attendanceDate === '2026-09-28');
check('2.5 mark Late', rec?.status === 'late' && !!rec.updatedAt, JSON.stringify(rec));
// note: Enter saves (F10)
await row('Liam Wong').locator('button[title*="catatan"]').click();
await p.fill('main input[placeholder^="e.g. Izin"]', 'Traffic jam'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
s = await store(p); rec = s.attendanceRecords.find((r) => r.studentId === liam.id && r.attendanceDate === '2026-09-28');
check('2.6 note saved with Enter', rec?.note === 'Traffic jam', rec?.note);
check('2.6b note visible in the row', (await txt(p, 'main')).includes('Traffic jam'));
// note on an unmarked student requires a status first
await row('Aisha Khan').locator('button[title*="catatan"]').click();
await p.fill('main input[placeholder^="e.g. Izin"]', 'x'); await p.click('main button:has-text("Simpan")'); await p.waitForTimeout(250);
s = await store(p);
check('2.6c note without status is not silently recorded as present', !s.attendanceRecords.some((r) => r.studentId === s.students.find((x) => x.fullName === 'Aisha Khan').id && r.attendanceDate === '2026-09-28'));
await p.keyboard.press('Escape');
await row('Aisha Khan').locator('button:has-text("Izin (I)")').click(); await p.waitForTimeout(250);
t = await txt(p, 'main');
check('2.7 KPIs computed from recorded rows only (1 late, 1 excused, 3 unrecorded, rate 50%)', kpi('TERLAMBAT') === '1' && kpi('IZIN') === '1' && /BELUM DICATAT \| 3/.test(t) && /TINGKAT KEHADIRAN \| 50%/.test(t), t.match(/TINGKAT KEHADIRAN.*?BELUM DICATAT \| \d+/)?.[0]);
await p.click('button:has-text("Tandai Semua Hadir")'); await p.waitForTimeout(400);
s = await store(p);
const day = s.attendanceRecords.filter((r) => r.attendanceDate === '2026-09-28' && s.students.find((x) => x.id === r.studentId)?.cohortId === liam.cohortId);
check('2.8 Mark All Present records every student', day.length === 5 && day.every((r) => r.status === 'present'));
check('2.8b Mark All Present keeps notes', day.find((r) => r.studentId === liam.id)?.note === 'Traffic jam');

// ---- matrix --------------------------------------------------------------------------------------------------
await p.click('button:has-text("Matriks 7 Hari")'); await p.waitForTimeout(400);
const matrixRow = (await p.locator('tbody tr', { hasText: 'Liam Wong' }).first().innerText()).replace(/\s+/g, ' ');
check('9.3 matrix shows "·" for unrecorded days and no fabricated H', /·/.test(matrixRow) && !/ H /.test(matrixRow.replace('Liam Wong', '')), matrixRow);
await p.locator('tbody tr', { hasText: 'Liam Wong' }).first().locator('button').first().click(); await p.waitForTimeout(250);
s = await store(p);
check('2.9 clicking an unrecorded matrix cell records Present first', s.attendanceRecords.some((r) => r.studentId === liam.id && r.attendanceDate === '2026-09-30' && r.status === 'present'));

// ---- profile gauge ---------------------------------------------------------------------------------------------
await p.click('main button:has-text("Riwayat Presensi")').catch(() => {});
await p.click('main button:has-text("Direktori Siswa (")'); await p.waitForTimeout(300);
await p.click('main :text("Liam Wong") >> nth=0'); await p.waitForTimeout(300);
s = await store(p);
const recs = s.attendanceRecords.filter((r) => r.studentId === liam.id);
const att = recs.filter((r) => r.status === 'present' || r.status === 'late').length;
const expected = Math.round((att / recs.length) * 100);
t = await txt(p, 'main');
check('2.10 profile attendance % matches records', t.includes(`${expected}%`), `expected ${expected}% from ${recs.length} records`);
await p.click('button[title="Open Attendance"]'); await p.waitForTimeout(400);
check('2.11 quick link opens the attendance tab', (await txt(p, 'main')).includes('Matriks 7 Hari'));
await p.waitForTimeout(2500); await p.reload(); await p.waitForTimeout(2500);
s = await store(p);
check('2.12 records persist across sync + reload', s.attendanceRecords.filter((r) => r.attendanceDate === '2026-09-28').length >= 5);
check('2.13 no page errors', p.errs.length === 0, p.errs.join(' | '));
await browser.close();
done();
