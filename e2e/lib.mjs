// Shared helpers for the ClassQue e2e suite (Playwright + system Chromium).
import { chromium } from 'playwright-core';

export const BASE = process.env.E2E_BASE || 'http://localhost:8789';
export const TOKEN = process.env.E2E_TOKEN || 'e2e-token';
export const CHROMIUM = process.env.CHROMIUM || '/usr/bin/chromium';
export const STORAGE_KEY = 'classque_teacher_os_v1';

let failures = 0;
let total = 0;

/** Records one assertion. Prints PASS/FAIL; the process exit code reflects any failure (see `done`). */
export function check(name, ok, detail = '') {
  total++;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? `  -- ${String(detail).slice(0, 220)}` : ''}`);
  return !!ok;
}

export function done() {
  console.log(`\n${total - failures}/${total} checks passed${failures ? ` — ${failures} FAILED` : ''}`);
  process.exit(failures ? 1 : 0);
}

/**
 * Opens a fresh browser context + page.
 *  - time:   ISO instant to pin the browser clock to (clock keeps ticking)
 *  - tz:     IANA timezone (default Asia/Jakarta)
 *  - token:  sync token to pre-load (default the e2e token; pass null for "no token configured")
 *  - lang:   'id' | 'en' to pre-set the language cookie
 */
export async function open({ time, tz = 'Asia/Jakarta', token = TOKEN, lang, width = 1400, height = 900, goto = true } = {}) {
  const browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({
    viewport: { width, height },
    permissions: ['clipboard-read', 'clipboard-write'],
    timezoneId: tz,
    locale: 'id-ID',
    serviceWorkers: 'allow',
  });
  if (time) await ctx.clock.install({ time: new Date(time) });
  if (token) {
    await ctx.addInitScript((t) => {
      try { if (!localStorage.getItem('classque_sync_token')) localStorage.setItem('classque_sync_token', t); } catch { /* ignore */ }
    }, token);
  }
  if (lang) await ctx.addCookies([{ name: 'cq_lang', value: lang, url: BASE }]);
  const page = await ctx.newPage();
  page.dialogs = [];
  page.on('dialog', (d) => { page.dialogs.push(d.message()); d.accept(); });
  page.errs = [];
  page.on('pageerror', (e) => page.errs.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text())) page.errs.push(`console.error: ${m.text()}`); });
  if (goto) {
    await page.goto(BASE);
    await page.waitForTimeout(2500);
  }
  return { browser, ctx, page, p: page };
}

export const txt = async (p, sel = 'body') => (await p.innerText(sel)).replace(/\n+/g, ' | ');
export const store = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), STORAGE_KEY);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Authenticated call to the edge API. */
export async function api(path = '/api/sync', init = {}) {
  const headers = { ...(init.token === null ? {} : { Authorization: `Bearer ${init.token ?? TOKEN}` }), ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(init.headers || {}) };
  const res = await fetch(BASE + path, { method: init.method || 'GET', headers, body: init.body ? (typeof init.body === 'string' ? init.body : JSON.stringify(init.body)) : undefined });
  let json = null;
  try { json = await res.clone().json(); } catch { /* not json */ }
  return { status: res.status, json, headers: res.headers };
}

/** Last visible modal/dialog overlay text (excludes the mobile nav bar). */
export const modalText = async (p) => (await p.locator('div.fixed:not(.md\\:hidden)').last().innerText()).replace(/\n+/g, ' | ');

/** Nav helpers (Indonesian/English labels). Works on desktop (sidebar) and phones (bottom bar). */
const nav = (p, re) => p.locator('aside button, div.md\\:hidden button').filter({ hasText: re }).locator('visible=true').first().click();
export const goto = {
  cockpit: (p) => nav(p, /Dasbor Hari Ini|Today's Cockpit/),
  classes: (p) => nav(p, /Kelas & Siswa|Classes & Students/),
  lessons: (p) => nav(p, /Rencana Mengajar|Lesson Planner/),
  claims: (p) => nav(p, /Klaim & Laporan|Claims & Reports/),
  settings: (p) => nav(p, /Pengaturan|Settings/),
};
