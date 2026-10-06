// Stage 18 — the top-bar sync badge names the real cause of a 503: missing D1 binding vs another server problem.
import { open, check, done } from '../lib.mjs';

const badge = (p) => p.locator('header button[title*="sync" i], header button[title*="Diagnostik"], header button[title*="D1"]').first();
const mock503 = (p, status) => p.route('**/api/sync*', (route) =>
  route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'x', status }) }));

// D1 binding missing on the server -> "D1 Not Linked" (not a generic message)
let { browser, p } = await open({ lang: 'en', goto: false });
await mock503(p, 'unbound');
await p.goto('http://localhost:8789'); await p.waitForTimeout(2500);
let label = await badge(p).innerText(); let title = await badge(p).getAttribute('title');
check('S1 unbound 503 shows "D1 Not Linked"', /D1 Not Linked/.test(label), label);
check('S2 unbound tooltip names the DB binding, not a generic message', /DB binding/.test(title) && !/not ready/i.test(title), title);
await browser.close();

// Any other 503 -> "Server Not Ready"
({ browser, p } = await open({ lang: 'en', goto: false }));
await mock503(p, 'unconfigured');
await p.goto('http://localhost:8789'); await p.waitForTimeout(2500);
label = await badge(p).innerText(); title = await badge(p).getAttribute('title');
check('S3 unconfigured 503 shows "Server Not Ready"', /Server Not Ready/.test(label), label);
check('S4 unconfigured tooltip says the server is not ready', /not ready/i.test(title), title);
await browser.close();

// A bare 503 (no JSON body, e.g. a proxy error) falls back to the same wording
({ browser, p } = await open({ lang: 'en', goto: false }));
await p.route('**/api/sync*', (route) => route.fulfill({ status: 503, body: 'Service Unavailable' }));
await p.goto('http://localhost:8789'); await p.waitForTimeout(2500);
label = await badge(p).innerText();
check('S5 non-JSON 503 falls back to "Server Not Ready"', /Server Not Ready/.test(label), label);
check('S6 no page errors', p.errs.length === 0, p.errs.join(' | '));
await browser.close();
done();
