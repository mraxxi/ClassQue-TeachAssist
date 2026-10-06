// Stages 10 + 13 / W1 + W5 — lesson-based task deadlines, overdue marker, dynamic notifications.
import { open, check, done, txt, store, goto, api, sleep } from '../lib.mjs';

const bell = (p) => p.locator('aside button[title*="Notif"]').first();
const popover = async (p) => (await p.locator('div.absolute').filter({ hasText: /Notifikasi|Notifications/ }).last().innerText()).replace(/\n+/g, ' | ');

// ============================ Stage 10: tasks ============================
let { browser, p } = await open({ time: '2026-10-05T03:00:00Z' }); // Mon 10:00 WIB
const add = async () => p.click('main button[type=submit]:has-text("Tambah")');
await p.fill('input[placeholder^="Tambah tugas"]', 'Plain task'); await add(); await p.waitForTimeout(300);
{ const pt = (await store(p)).tasks.find((x) => x.title === 'Plain task');
  check('10.0 a task added without picking a deadline has NO due date', !!pt && pt.dueDate === '', JSON.stringify(pt));
  check('10.0b it shows no "Batas" chip and is never overdue', !/Batas|Overdue|Terlambat/.test(await p.locator('p:text-is("Plain task")').locator('xpath=..').innerText()), await p.locator('p:text-is("Plain task")').locator('xpath=..').innerText() && (await p.locator('[data-testid="task-overdue"]').count()) === 0); }
await p.fill('input[placeholder^="Tambah tugas"]', 'Date task'); await p.click('main button:has-text("Tanpa Batas")'); await p.click('main button:has-text("Tanggal Kalender")'); await p.waitForTimeout(200);
await p.fill('main input[type=date]', '2026-10-10'); await p.click('main button:has-text("High")'); await add(); await p.waitForTimeout(400);
let s = await store(p); let tk = s.tasks.find((x) => x.title === 'Date task');
check('10.1 calendar-date task', tk?.deadlineType === 'date' && tk.dueDate === '2026-10-10' && tk.priority === 'high' && !!tk.updatedAt, JSON.stringify(tk));
check('10.1b shows "Batas 2026-10-10"', (await txt(p, 'main')).includes('Batas 2026-10-10'));

await p.fill('input[placeholder^="Tambah tugas"]', 'Lesson task'); await p.click('main button:has-text("Tanpa Batas")'); await p.click('main button:has-text("Tanggal Kalender")'); await p.waitForTimeout(200);
await p.click('main button:has-text("Sesi Kelas")'); await p.waitForTimeout(300);
await p.locator('main select').nth(1).selectOption('cohort-1'); await p.waitForTimeout(200);
const slotSel = p.locator('main select').nth(2);
const slots = await slotSel.locator('option').evaluateAll((o) => o.map((x) => ({ v: x.value, t: x.textContent.trim() })));
check('10.2 upcoming lesson slots: Mon/Wed/Fri 14:30, chronological, first is "Sesi Terdekat"', slots.length === 5 && slots[0].v === '2026-10-05' && /Sesi Terdekat/.test(slots[0].t) && slots.every((x) => ['Mon', 'Wed', 'Fri'].includes(new Date(x.v + 'T12:00:00Z').toUTCString().slice(0, 3))), slots.map((x) => x.t).join(' ; '));
await slotSel.selectOption(slots[2].v); await add(); await p.waitForTimeout(400);
s = await store(p); tk = s.tasks.find((x) => x.title === 'Lesson task');
check('10.3 lesson task keeps cohort, date and a CLEAN label (no "• +3" artifact)', tk?.deadlineType === 'lesson' && tk.cohortId === 'cohort-1' && tk.dueDate === slots[2].v && /^Cambridge Flyers A2 • .*\(14:30\)$/.test(tk.dueLessonLabel) && !/\+3/.test(tk.dueLessonLabel), tk?.dueLessonLabel);
check('10.3b badge shows the cohort and the chosen lesson', (await txt(p, 'main')).includes(tk.dueLessonLabel));
// toggle + completedAt
const row = (title) => p.locator(`xpath=//*[normalize-space(text())="${title}"]/ancestor::div[@data-testid="task-row"][1]`).first();
await row('Date task').locator('button').first().click(); await p.waitForTimeout(300);
s = await store(p);
check('10.4 completion toggle stamps completedAt', s.tasks.find((x) => x.title === 'Date task').isCompleted === true && !!s.tasks.find((x) => x.title === 'Date task').completedAt);
check('10.4b pending KPI counts open tasks only', /TUGAS TERTUNDA \| 6/.test(await txt(p, 'main')), (await txt(p, 'main')).match(/TUGAS TERTUNDA \| \d+/)?.[0]);
const order = await p.$$eval('[data-testid="task-row"]', (e) => e.map((x) => x.innerText.split('\n')[0]));
check('10.5 completed tasks sink to the bottom', order[order.length - 1] === 'Date task', order.join('|'));
check('10.6 past-due open tasks carry an overdue marker (4 seeded September tasks)', (await p.locator('[data-testid="task-overdue"]').count()) === 4);
await row('Lesson task').locator('button[title="Hapus tugas"]').click(); await p.waitForTimeout(300);
s = await store(p);
check('10.7 delete task + tombstone', !s.tasks.some((x) => x.title === 'Lesson task') && (s.tombstones.tasks || []).some((t) => t.id === tk.id));
await sleep(2500);
const d1 = (await api()).json.data.tasks;
check('10.8 D1 round-trip (deadline type, completion) and the deleted task is gone', d1.find((x) => x.title === 'Date task')?.isCompleted === true && !d1.some((x) => x.title === 'Lesson task'));
await browser.close();

// time-of-day awareness (F31): at 16:00 the 14:30 class is over
({ browser, p } = await open({ time: '2026-10-05T09:00:00Z' }));
await p.fill('input[placeholder^="Tambah tugas"]', 'x'); await p.click('main button:has-text("Tanpa Batas")'); await p.click('main button:has-text("Tanggal Kalender")'); await p.click('main button:has-text("Sesi Kelas")'); await p.waitForTimeout(300);
await p.locator('main select').nth(1).selectOption('cohort-1'); await p.waitForTimeout(200);
const late = await p.locator('main select').nth(2).locator('option').evaluateAll((o) => o.map((x) => x.value));
check('10.9 after the class finished today, the nearest slot is the NEXT lesson (Wed 7 Oct)', late[0] === '2026-10-07', late.join());
await browser.close();

// English UI has no Indonesian strings in the task card
({ browser, p } = await open({ time: '2026-10-05T03:00:00Z', lang: 'en' }));
await p.fill('input[placeholder^="Add a quick"]', 'x'); await p.click('main button:has-text("No Deadline")'); await p.click('main button:has-text("Calendar Date")'); await p.waitForTimeout(300);
const card = (await txt(p, 'main')).match(/Urgent Tasks.*/)?.[0] || '';
check('10.10 EN task card is fully translated (incl. Overdue)', /Overdue/.test(card) && !/(Prioritas|Metode Batas|Tanggal Kalender|Sesi Kelas|Pilih Tanggal|Batas |Terlambat|Tambah|Tugas Mendesak)/.test(card), card.slice(0, 200));
await browser.close();

// ============================ Stage 13: notifications ============================
({ browser, p } = await open({ time: '2026-10-05T07:00:00Z' })); // Mon 14:00 WIB: Starters live, Flyers 14:30
s = await store(p);
let pop;
check('13.1 bell shows an unread dot', /bg-rose/.test(await bell(p).innerHTML()));
await bell(p).click(); await p.waitForTimeout(500); pop = await popover(p);
check('13.2 schedule alerts name the real cohort and the real time (14:30, not a hard-coded 14:00)', /Cambridge Flyers A2 dijadwalkan hari ini pukul 14:30/.test(pop), pop.slice(0, 260));
check('13.2b a class that is running is announced as in progress', /Kelas Sedang Berlangsung/.test(pop) && /Cambridge Starters A1/.test(pop));
check('13.3 overdue seeded tasks produce task alerts', /Tugas Terlambat/.test(pop) && /Grade Assignment/.test(pop));
check('13.4 timestamps are relative and computed (no fixed "1 jam lalu" / "Kemarin")', /(dalam \d+ mnt|\d+ (mnt|jam|hari) lalu)/.test(pop) && !/Kemarin/.test(pop), pop.match(/dalam \d+ \w+|\d+ \w+ lalu/g)?.join(','));
check('13.5 no claim alert yet (no sessions this month)', !/Klaim Honor Siap/.test(pop));
const n = (await txt(p, 'body')).match(/(\d+) baru/)?.[1];
await p.click('button:has-text("Tandai Dibaca")'); await p.waitForTimeout(300);
check('13.6 mark all read clears the badge', !/bg-rose/.test(await bell(p).innerHTML()), `was ${n} new`);
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
check('13.7 Esc closes the popover', !/Tandai Dibaca/.test(await txt(p, 'body')));
await p.reload(); await p.waitForTimeout(2500);
check('13.8 read state survives regeneration and reload', !/bg-rose/.test(await bell(p).innerHTML()));
// new overdue task -> new unread alert; completing it removes the alert
await p.fill('input[placeholder^="Tambah tugas"]', 'Fresh overdue'); await p.click('main button:has-text("Tanpa Batas")'); await p.click('main button:has-text("Tanggal Kalender")'); await p.fill('main input[type=date]', '2026-10-01'); await add(); await p.waitForTimeout(500);
check('13.9 a newly overdue task raises an unread alert', /bg-rose/.test(await bell(p).innerHTML()));
await bell(p).click(); await p.waitForTimeout(400);
check('13.9b the alert names the task', /Fresh overdue/.test(await popover(p)));
await p.keyboard.press('Escape');
await row('Fresh overdue').locator('button').first().click(); await p.waitForTimeout(500);
await bell(p).click(); await p.waitForTimeout(400);
check('13.10 completing the task removes its alert', !/Fresh overdue/.test(await popover(p)));
await p.keyboard.press('Escape');
// navigation
await goto.settings(p); await bell(p).click(); await p.waitForTimeout(300);
await p.locator('text=Tugas Terlambat').first().click(); await p.waitForTimeout(500);
check('13.11 clicking a task alert opens the cockpit', /Tugas Mendesak/.test(await txt(p, 'main')));
// clear all is remembered
await bell(p).click(); await p.waitForTimeout(300); await p.click('button:has-text("Bersihkan Semua")'); await p.waitForTimeout(300);
check('13.12 Clear All empties the list', /Tidak ada notifikasi/.test(await txt(p, 'body')));
await p.keyboard.press('Escape');
await sleep(500); await p.reload(); await p.waitForTimeout(2500);
await bell(p).click(); await p.waitForTimeout(300);
check('13.13 cleared alerts do not come back on reload', /Tidak ada notifikasi/.test(await txt(p, 'body')) , (await txt(p, 'body')).match(/Pusat Notifikasi[^|]*\|[^|]*/)?.[0]);
check('13.14 no page errors', p.errs.length === 0, p.errs.join(' | '));
await browser.close();
done();
