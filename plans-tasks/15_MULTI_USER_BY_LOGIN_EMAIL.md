# 📋 Stage 15: Multi-User Separation by Login Email

**Lifecycle Stage**: `implemented` on the Stage 18 line (delta sync, `SYNC_TOKEN`); checked locally by e2e, not deployed  
**Target Domain**: Domain 5: Settings & Data Sync (`functions/api/sync.ts`, `src/store/useTeacherStore.ts`, `migrations/`)  
**Ubiquitous Language**: `Teacher` (one account per login email), `Central Source of Truth` (Cloudflare D1), `Local-First Buffer`

---

## 🔍 Where we are today

- There is **no login**. Anyone who opens the site reads and writes the same D1 data.
- `GET /api/sync` returns every row of every table and the client takes `teachers[0]`.
- `POST /api/sync` upserts by `id` and trusts whatever `teacherId` the browser sends (falls back to `'teacher-1'`).
- New record IDs are `cohort-${Date.now()}` style, so two teachers can produce the same ID and overwrite each other on upsert.
- `localStorage` uses one fixed key (`classque_teacher_os_v1`), so two teachers on one browser would share data.
- `cohorts`, `lesson_plans`, `teaching_sessions`, `teaching_claims` and `tasks` already have `teacher_id`. `students`, `attendance_records`, `student_milestone_evaluations` and `parent_reports` belong to a teacher only through `cohort_id` / `student_id`. `cefr_milestones` is shared reference data.

> **Port note.** This plan was first written against the original `master` (PR #8). It is re-applied here on top of the
> Stage 16/17/18 code. Differences: the `SYNC_TOKEN` check stays (a request needs the token **and** a login); the scoping
> is applied to the per-record last-write-wins upserts and to delta pulls; the migration is `0005_multi_user_indexes.sql`
> (`0003`/`0004` were taken); demo data stays in migration `0002` (claimed through `LEGACY_OWNER_EMAIL`) instead of moving to `seeds/`.
> The two sync gaps listed under "Where we are today" below (only teacher/cohort/student saved; attendance read from
> `session_date`) were already fixed by Stage 16/17 and are not part of this plan.

## 🔐 Login mechanism (decision)

**Cloudflare Access (Zero Trust), recommended.** Free for up to 50 users. A teacher opens the site, Cloudflare asks for their email, emails a one-time PIN (or lets them use Google login), and then every request to the app carries a signed JWT (`Cf-Access-Jwt-Assertion`) with the verified email. We never store passwords and need no email-sending service.

Alternative: our own magic-link login (store tokens in KV, send email through a third-party provider like Resend). More code, more moving parts, still free-tier-possible.

## 🪜 Steps (one at a time)

1. **Server-side identity helper.** `functions/_lib/auth.ts` verifies the Access JWT (signature against the team's public certs, audience, expiry) and returns the email. A `DEV_USER_EMAIL` variable stands in for it during `wrangler pages dev`. New `GET /api/me` returns the signed-in email. Requests without a valid identity get `401`.
2. **Teacher row per email.** On each request, look up `teachers` by email; create the row on first login with a server-generated ID. The server, not the browser, decides `teacher_id` from now on.
3. **Scope reads.** Every query in `GET /api/sync` filters by the signed-in teacher (`students` via `cohorts`, attendance, evaluations and parent reports via their cohort or student). `cefr_milestones` stays shared.
4. **Scope writes.** `POST /api/sync` forces `teacher_id` to the signed-in teacher and skips any row whose `id` already belongs to someone else (ownership check before upsert).
5. **Collision-proof IDs.** Replace `Date.now()` IDs in the client with `crypto.randomUUID()`.
6. **Per-user local buffer.** `localStorage` key includes the email (`classque_teacher_os_v1:<email>`); on login the client calls `/api/me` first, loads that user's buffer, and never pushes one user's unsynced changes under another user. Settings shows "Signed in as …" with a sign-out link (`/cdn-cgi/access/logout`).
7. **Migration + existing data.** (done) No email is written into the repo and nothing is run against the live database:
   - `LEGACY_OWNER_EMAIL` (Pages env var): the first time that email logs in, the old `teacher-1` row is renamed to it, so all existing cohorts, lessons, claims and tasks become theirs. Set it **before** the owner's first login; if their first login happens without it, they get a new empty account and the old data stays under `teacher-1` (fix: delete that empty account, set the variable, log in again). If the email typed in Settings already equals the login email, no variable is needed.
   - `migrations/0005_multi_user_indexes.sql`: schema only (case-insensitive unique email, `teaching_sessions(teacher_id)` index).

8. **Setup docs.** Add a Cloudflare Access section to `docs/CLOUDFLARE_SETUP.md` (create the Access application for the custom domain and `*.pages.dev`, add allowed emails, copy the team domain and AUD into Pages env vars). No deploy is part of this plan.
