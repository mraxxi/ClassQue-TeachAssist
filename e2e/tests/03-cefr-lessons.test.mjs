// Stages 03 + 04 — CEFR gradebook and lesson planner (+ print isolation, single A4 page).
import fs from 'fs';
import os from 'os';
import path from 'path';
import { open, check, done, txt, store, goto } from '../lib.mjs';

const { browser, p } = await open();

// =================================== Stage 03: CEFR ===================================
await goto.classes(p); await p.click('main button:has-text("Capaian CEFR")'); await p.waitForTimeout(400);
const row = (code) => p.locator(`xpath=//*[normalize-space(text())="${code}"]/ancestor::div[.//button[contains(.,"4 • M")]][1]`).first();
const pick = async (name) => {
  const select = p.locator('main select').filter({ hasText: name }).first();
  await select.selectOption(await select.locator('option', { hasText: name }).first().getAttribute('value'));
};
let s = await store(p);
const st = (n) => s.students.find((x) => x.fullName.startsWith(n));
const ms = (code) => s.cefrMilestones.find((m) => m.code === code);
const score = (student, code) => s.studentEvaluations.find((e) => e.studentId === st(student).id && e.milestoneId === ms(code).id);

await pick('Liam Wong'); await p.waitForTimeout(300);
await row('A2.SI.1').locator('button:has-text("4 • M")').click(); await p.waitForTimeout(300);
s = await store(p);
check('3.1 rating 4 stored for Liam / A2.SI.1', score('Liam', 'A2.SI.1')?.competencyScore === 4 && !!score('Liam', 'A2.SI.1')?.updatedAt);
const on = await row('A2.SI.1').locator('button:has-text("4 • M")').getAttribute('class');
const off = await row('A2.SI.1').locator('button:has-text("1 • MB")').getAttribute('class');
check('3.2 active rating is visually distinct', on !== off);
await pick('Aisha Khan'); await p.waitForTimeout(300);
s = await store(p);
check('3.3 other student is not affected', score('Aisha', 'A2.SI.1')?.competencyScore !== 4);
await row('A2.SI.1').locator('button:has-text("2 • SB")').click(); await p.waitForTimeout(250);
await pick('Liam Wong'); await p.waitForTimeout(250);
s = await store(p);
check('3.3b scores are independent per student', score('Liam', 'A2.SI.1')?.competencyScore === 4 && score('Aisha', 'A2.SI.1')?.competencyScore === 2);
await p.click('main button:has-text("Produksi Lisan")'); await p.waitForTimeout(300);
let codes = [...(await txt(p, 'main')).matchAll(/A\d\.\w{2}\.\d/g)].map((m) => m[0]);
check('3.4 skill filter shows only that skill', codes.length > 0 && codes.every((c) => c.includes('.SP.')), [...new Set(codes)].join());
await p.click('main button:has-text("Semua Keterampilan")');
await p.click('main button:text-is("B1")'); await p.waitForTimeout(250);
const b1 = (await txt(p, 'main')).match(/DAFTAR INDIKATOR KEMAHIRAN CEFR \((\d+)\)/i)?.[1];
check('3.5 level filter narrows the list', Number(b1) > 0 && Number(b1) < 5, `B1 -> ${b1}`);
await p.click('main button:text-is("A2")'); await p.waitForTimeout(250);

// notes: a note never creates a phantom score (minor finding)
const nBefore = s.studentEvaluations.length;
const unrated = await p.locator('button[title="Tambah catatan kualitatif"]').first();
await unrated.click(); await p.fill('div.fixed textarea', 'orphan note'); await p.click('div.fixed button:has-text("Simpan Catatan")'); await p.waitForTimeout(300);
s = await store(p);
check('3.6 note on an unrated descriptor does not invent a score', s.studentEvaluations.length === nBefore, `${nBefore} -> ${s.studentEvaluations.length}`);
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
check('3.6b Esc closes the note dialog', !(await txt(p, 'body')).includes('Simpan Catatan'));
await row('A2.RD.1').locator('button:has-text("3 • TC")').click(); await p.waitForTimeout(250);
await row('A2.RD.1').locator('button[title="Tambah catatan kualitatif"]').click();
await p.fill('div.fixed textarea', 'Needs more past-tense practice'); await p.click('div.fixed button:has-text("Simpan Catatan")'); await p.waitForTimeout(300);
s = await store(p);
check('3.7 note on a rated descriptor is saved', score('Liam', 'A2.RD.1')?.teacherNotes === 'Needs more past-tense practice' && score('Liam', 'A2.RD.1')?.competencyScore === 3);
await p.click('main button:has-text("Direktori Siswa (")'); await p.waitForTimeout(300);
await p.click('main :text("Liam Wong") >> nth=0'); await p.waitForTimeout(300);
const evs = s.studentEvaluations.filter((e) => e.studentId === st('Liam').id);
const m4 = evs.filter((e) => e.competencyScore === 4).length, m3 = evs.filter((e) => e.competencyScore === 3).length;
check('3.8 profile CEFR counters match', (await txt(p, 'main')).includes(`${m4} Mahir • ${m3} Tercapai`), (await txt(p, 'main')).match(/\d+ Mahir • \d+ Tercapai/)?.[0]);

// =================================== Stage 04: Lessons ===================================
await goto.lessons(p); await p.waitForTimeout(400);
await p.click('main button:has-text("Buat RPP Baru")'); await p.waitForTimeout(300);
await p.fill('input[placeholder^="e.g. Unit 4"]', 'Unit 7: Weather Reports');
await p.fill('input[placeholder^="e.g. Dinosaurs"]', 'Weather vocabulary and forecasts');
await p.locator('div.fixed select').first().selectOption('cohort-2');
await p.locator('div.fixed textarea').nth(0).fill('Warm-up: weather charades');
await p.locator('div.fixed textarea').nth(2).fill('Practice: matching weather icons to words');
await p.fill('input[placeholder^="Word (e.g."]', 'drizzle');
await p.fill('input[placeholder^="Definisi"]', 'hujan rintik-rintik');
await p.fill('input[placeholder^="Example sentence"]', 'It drizzled all morning.');
await p.fill('input[placeholder^="e.g. Past Simple"]', 'Present continuous for forecasts');
await p.fill('input[placeholder^="e.g. Activity Book"]', 'Workbook p.30');
await p.fill('input[type=url]', 'https://youtube.com/watch?v=abc'); await p.click('div.fixed button:has-text("+ Tambah Tautan")'); await p.waitForTimeout(200);
await p.click('div.fixed button[type=submit]:has-text("Buat RPP")'); await p.waitForTimeout(500);
s = await store(p);
const lp = s.lessonPlans.find((x) => x.title === 'Unit 7: Weather Reports');
check('4.1 plan created with 5 stages, vocab, links, homework', lp && lp.cohortId === 'cohort-2' && lp.warmUp.includes('charades') && lp.practice.includes('matching') && lp.presentation && lp.production && lp.wrapUp && lp.vocabulary.some((v) => v.word === 'drizzle') && lp.materialsLinks.length >= 1 && lp.homework === 'Workbook p.30', JSON.stringify(lp && { v: lp.vocabulary.length, l: lp.materialsLinks }));
check('4.2 appears in the list', (await txt(p, 'main')).includes('Unit 7: Weather Reports'));
await p.click('main button[title="Edit Lesson Plan"]'); await p.waitForTimeout(300);
await p.locator('div.fixed textarea').nth(2).fill('Practice EDITED: gap-fill forecast');
await p.click('div.fixed button[type=submit]'); await p.waitForTimeout(400);
s = await store(p);
check('4.3 edit Stage 3 persisted', s.lessonPlans.find((x) => x.id === lp.id)?.practice === 'Practice EDITED: gap-fill forecast');
const n0 = s.lessonPlans.length;
await p.click('main button[title="Duplicate Lesson Plan"]'); await p.waitForTimeout(400);
s = await store(p);
const copy = s.lessonPlans.find((x) => /\(Copy\)/.test(x.title));
check('4.4 duplicate creates "(Copy)" with the same content and a new id', s.lessonPlans.length === n0 + 1 && copy && copy.id !== lp.id && copy.practice === 'Practice EDITED: gap-fill forecast');
const si = 'input[placeholder^="Cari judul"]';
await p.fill(si, 'weather'); await p.waitForTimeout(250);
let t = await txt(p, 'main'); check('4.5 search by title/topic', /KOLEKSI RPP \(2\)/.test(t), t.match(/KOLEKSI RPP \(\d+\)/)?.[0]);
await p.fill(si, 'zzzz'); await p.waitForTimeout(250); check('4.5b empty state', /Tidak ada RPP/.test(await txt(p, 'main')));
await p.fill(si, '');

// print isolation + single page
await p.click('main button[title^="Print"]'); await p.waitForTimeout(500);
await p.emulateMedia({ media: 'print' }); await p.waitForTimeout(300);
const vis = await p.evaluate(() => ({
  root: getComputedStyle(document.querySelector('#root')).display,
  sheet: !!document.querySelector('.print-sheet') && getComputedStyle(document.querySelector('.print-sheet')).display !== 'none',
  sheetInRoot: !!document.querySelector('#root .print-sheet'),
}));
check('4.6 print hides the whole app (sidebar, toasts) and shows only the sheet', vis.root === 'none' && vis.sheet && !vis.sheetInRoot, JSON.stringify(vis));
const pdfPath = path.join(os.tmpdir(), 'classque-lesson.pdf');
await p.pdf({ path: pdfPath, format: 'A4', preferCSSPageSize: true });
const pages = (fs.readFileSync(pdfPath, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
check('4.6b lesson scaffold prints on a single A4 page', pages === 1, `${pages} page(s)`);
await p.emulateMedia({ media: 'screen' });
await p.keyboard.press('Escape'); await p.waitForTimeout(300);

// delete (the last plan can be deleted too)
await p.reload(); await p.waitForTimeout(2500); await goto.lessons(p); await p.waitForTimeout(300);
s = await store(p);
let remaining = s.lessonPlans.length;
for (let i = remaining; i > 0; i--) {
  await p.click('main button[title="Delete Lesson Plan"]'); await p.waitForTimeout(250);
  await p.click('button:has-text("Ya, Hapus")'); await p.waitForTimeout(300);
}
s = await store(p);
check('4.7 delete with confirmation, including the last remaining plan', s.lessonPlans.length === 0 && (s.tombstones.lessonPlans || []).length === remaining, `left ${s.lessonPlans.length}, tombstones ${(s.tombstones.lessonPlans || []).length}`);
check('4.8 no page errors', p.errs.length === 0, p.errs.join(' | '));
await browser.close();
done();
