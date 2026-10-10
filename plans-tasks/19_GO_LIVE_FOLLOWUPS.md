# Stage 19: Go-live follow-ups (pick up when the project is unarchived)

State on 2026-10-07: Stage 18 and the Access login are deployed to production
(`https://classque-teachassist.pages.dev`), `main` carries the same code, migrations 0004 and 0005 are applied,
`SYNC_TOKEN` is removed from the Pages variables.

## What happened at go-live (so nobody repeats it)
- `wrangler pages deploy` replaced the production variables with the `[vars]` of the local `wrangler.toml`, which dropped
  `CF_ACCESS_*` and `LEGACY_OWNER_EMAIL`. Result: every login got 401 ("Sign-in Needed"). Fixed by setting the variables
  again and deploying from a folder without `wrangler.toml`. Rule is now in `docs/CLOUDFLARE_SETUP.md` ("Deploying safely").
- Chrome showed empty data and Firefox the old data because each browser keeps its own offline copy per login; the server
  copy only reaches a browser after a successful sync.

## Checked from lab-arm on 2026-10-10
- `classque-teachassist.pages.dev` redirects to the Access login; `/api/*` without a login is refused.
- The owner's PC has no unpushed work, but its `wrangler.toml` lacks the `CF_ACCESS_*` and `LEGACY_OWNER_EMAIL` variables:
  do not deploy from the PC. lab-arm's copy has them.

## Still to do
1. **Live check after the fix (needs the owner).** Sign in as rofiiqyla@gmail.com in Chrome and Firefox. Expect: badge shows synced, both browsers show the same data
   (the old data was claimed through `LEGACY_OWNER_EMAIL`). If a browser still shows "DB not connected", read the `/api/me` and `/api/sync`
   responses in the browser network tab (401 = variables, 503 `unbound` = D1 binding) and fix from `docs/CLOUDFLARE_SETUP.md` section 7.
2. In a private window, `/api/sync` must ask for a login (Access) and never return data.
3. **Two Pages variables with secret-looking names** (`U5BK1c5c...=` and `e155d1eb-...`) look like values pasted into the name field. Not touched. Check them in the dashboard and delete them if unused (do not copy their values anywhere).
4. **Custom domain not behind Access (needs the owner).** `classque.pmandiri.com` is attached to the Pages project but is not a
   hostname of the Access application. It serves the app, `/api/*` answers 401, so the data is safe but nobody can sign in there.
   Add the hostname to the same Access application (Zero Trust -> Access -> Applications -> the app -> add public hostname).
5. **Backup:** a D1 backup was taken before migration 0005 but lives only in an old cloud session. Export a fresh one with
   `wrangler d1 export classque_db --remote --output backups/<utc>.sql`. `backups/` is gitignored; the dump holds teachers' and students'
   personal data, so keep the folder `chmod 700` and never paste the dump into another tool. Wrangler on lab-arm is not logged in yet
   (2026-10-10); the owner has to run `wrangler login` there first.
6. Optional hardening: the e2e runner has no CI; consider running it on pull requests.
7. Move `working_on/18_...` to `finished_tested/` after items 1 and 2 pass.

## Out of scope (backlog)
Shared cohorts / co-teaching, roles, admin view.
