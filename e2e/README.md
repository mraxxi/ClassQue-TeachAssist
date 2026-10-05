# ClassQue e2e suite

Playwright (`playwright-core`, system Chromium) driving the **real production build** served by
`wrangler pages dev` with a local D1. Every test file gets a **fresh D1** (migrations + demo seed) and its own
server started with `SYNC_TOKEN=e2e-token`.

```bash
npm run test:e2e                 # build + run everything
SKIP_BUILD=1 bash e2e/run.sh 07  # reuse dist/, only files containing "07"
bash e2e/serve.sh                # just start the authenticated dev server for manual debugging
CHROMIUM=/usr/bin/chromium-browser npm run test:e2e
```

| File | Covers |
|---|---|
| `01-cohorts-students` | Stage 01, W3 (cascade deletes, tombstones, no resurrection), W9 (WhatsApp numbers) |
| `02-attendance` | Stage 02, W4/W5 (unrecorded ≠ present, local dates, Enter-to-save notes, matrix) |
| `03-cefr-lessons` | Stages 03 + 04, print isolation, single-page A4 |
| `04-cockpit-live` | Stage 05, W5/W7 (time-aware schedule, KPIs, proximity, hotkeys, Esc, persistence, wall-clock) |
| `05-claims-reports` | Stages 06 + 07, W4/W6 (months, allowance, timestamps, edit session, honest reports) |
| `06-settings-backup` | Stage 08, W3 (restore, malformed files, reload-from-D1), sync-token UX |
| `07-sync-offline` | Stages 11, 12, 14, W8 (debounce, in-flight edits, offline reload via service worker, diagnostics, cookies) |
| `08-api` / `08b-api-unconfigured` | Stage 15, W2 (auth, fail-closed, validation, falsy values, tombstones, summary) |
| `09-tasks-notifications` | Stages 10 + 13 (lesson deadlines, overdue, dynamic notifications) |

## Conventions
- Pin time with `open({ time })` (the clock keeps ticking) and use `Asia/Jakarta`; many bugs only show near
  midnight UTC (before 07:00 WIB).
- The UI is Indonesian by default; `open({ lang: 'en' })` presets the language cookie.
- `window.confirm` dialogs are auto-accepted and recorded in `page.dialogs`.
- A file whose first line is `// e2e: no-token` runs against a server **without** `SYNC_TOKEN`.
- Never `pkill -f` a pattern that also appears in your own command line (it kills your shell).
