# Stage 18 — Optional task deadline, unified top bar, multi-user

Delivered one step at a time; each step is reviewed before the next starts.

## Step 1 — Tasks have no due date unless the teacher chooses one
**Problem:** the quick-add form silently stamped every task with today's date (`customDate` defaulted to
today and was used even when the options panel was never opened).
**Change:** `UrgentTasksCard` only.
- Deadline method gets a third, default option: **No deadline** (`Tanpa batas`). Calendar date / Cohort lesson stay as they are.
- A task created without choosing a method is stored with `dueDate: ''` (the API already round-trips `''` <-> `NULL`; `due_date` is nullable; sorting and the overdue / notification logic already ignore empty dates).
- A task without a due date shows no "Due …" chip and can never be overdue.
- No migration, no API change.
**Tests:** quick-add stores `dueDate === ''`; no overdue chip / notification; picking a date or a lesson still works; i18n in both languages.

## Step 2 — One top bar (sync badge, language, theme, notifications, user)
**Problem:** the D1 sync badge appears twice (sidebar footer + top bar); user chip, language/theme toggles and notifications shrink with the sidebar.
**Change:** layout only.
- Top bar (`App.tsx` header) becomes the single home for: sync badge (diagnostics modal), shortcuts, clock, language, theme, notifications bell, user chip (name, institution; click -> Settings).
- Sidebar keeps navigation + collapse toggle only; its sync badge, toggles, bell and user chip are removed.
- `NotificationsPopover` re-anchored under the bell in the top bar.
- Phone: the mobile bar gets the same compact controls (icons only).
**Tests:** update `aside ...` selectors (07, 11), theme/language/notification tests; axe stays at zero; collapse no longer hides any of these.

## Step 3 — Multi-user: data model
- Migration `0005_multi_user.sql`: `owner_email` (TEXT NOT NULL DEFAULT '') on every synced table + index; existing rows are claimed by the first authenticated owner.
- `sync.ts`: every SELECT/UPSERT/tombstone is scoped by the request's identity; cross-owner ids can never be read or overwritten.
- Local-dev identity: a test header, so e2e can simulate two users.

## Step 4 — Multi-user: login and identity
- Identity comes from Cloudflare Access (email OTP / Google): `_middleware.ts` validates the `Cf-Access-Jwt-Assertion` JWT (team domain + AUD), resolves the email; the shared `SYNC_TOKEN` stays as a fallback for the legacy single-user setup until the teacher opts in.
- Client: per-user localStorage namespace, user chip shows the email, sign-out link.
- Docs: `CLOUDFLARE_SETUP.md` gets the Access setup (dashboard steps the user performs).

## Step 5 — Multi-user: tests and docs
- e2e: two users, no cross-reads, no cross-writes, delta sync per owner, legacy token still works.
- Architecture / terminology docs, backlog (shared cohorts and roles are out of scope).

## Out of scope
Co-teaching / shared cohorts, roles, admin view.
