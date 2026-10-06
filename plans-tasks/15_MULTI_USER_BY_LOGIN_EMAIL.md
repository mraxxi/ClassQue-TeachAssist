# 📋 Stage 15: Multi-User Separation by Login Email

**Lifecycle Stage**: `working_on` (steps 1-5 done)  
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
7. **Migration + existing data.** Migration `0003` re-assigns the current `teacher-1` rows to your real email so nothing is lost, and stops the demo seed from running in production.
8. **Setup docs.** Add a Cloudflare Access section to `docs/CLOUDFLARE_SETUP.md` (create the Access application for the custom domain and `*.pages.dev`, add allowed emails, copy the team domain and AUD into Pages env vars). No deploy is part of this plan.
