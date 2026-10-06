# Architecture Specification — ClassQue-TeachAssist

## 1. System Architecture Overview

```
                      +---------------------------------------+
                      |         Cloudflare Edge Network        |
                      |  - Custom Domain DNS & SSL Proxy     |
                      +-------------------+-------------------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
                        v                                   v
             +--------------------+              +--------------------+
             |  Cloudflare Pages  |              |  Pages Functions   |
             |  (React/Vite SPA)  |              | (Edge Workers API) |
             +---------+----------+              +---------+----------+
                       |                                   |
                       | Zustand + localStorage            | SQLite Edge Queries
                       v                                   v
             +--------------------+              +--------------------+
             | Browser Client     | <=== Sync ===> |   Cloudflare D1    |
             | (Offline-First)    |              | (Relational DB)    |
             +--------------------+              +---------+----------+
                                                           |
                                                 +---------+----------+
                                                 |   Cloudflare KV    |
                                                 | (Tokens / Presets) |
                                                 +--------------------+
```

---

## 2. Technology Stack & Decision Matrix

| Layer | Selected Tech | Rationale | Free-Tier Budget |
|---|---|---|---|
| **Frontend UI** | React 19 / Vite + TypeScript | Blazing fast DX, component ecosystem, type safety | Unlimited requests on Cloudflare Pages |
| **Styling** | Vanilla CSS / Tailored CSS Modules | Zero runtime bloat, precise control over print/A4 styles | N/A |
| **Client Storage** | Zustand store persisted to `localStorage` (+ service-worker app shell) | One synchronous source of truth; survives reloads and Wi-Fi drops | Client-side memory |
| **Edge API** | Cloudflare Pages Functions | Native edge routing without managing separate server | 100,000 req/day |
| **Relational DB** | Cloudflare D1 (SQLite) | Edge-replicated ACID relational database | 5M read rows / 100k write rows per day |
| **KV Storage** | Cloudflare KV | Fast session tokens, cached CEFR standard rubrics | 100k reads / 1k writes per day |
| **Deployment** | Wrangler CLI (`wrangler`) | Standard official Cloudflare CLI for reproducible builds | Free |

---

## 3. Data Synchronization Strategy (Local-First)

> Implemented in `src/store/useTeacherStore.ts` and `functions/api/sync.ts`. An earlier Dexie/IndexedDB
> read layer was removed in Stage 16: it was never written to, so every screen rendered empty.

1. **Client state (single source of truth)**
   - The Zustand store is persisted to `localStorage` (`classque_teacher_os_v1`) on every mutation, synchronously.
     No roll-call, note or lesson edit can be lost to a network failure.
   - Every mutated entity is stamped with `updatedAt`.
   - The **live class** (running stopwatch, scratchpad, start time) is persisted too; elapsed time is derived
     from wall-clock timestamps, so a reload or a throttled tab does not lose or distort it.
2. **Debounced delta push (`scheduleAutoSync`)**
   - ~1.5 s after the last mutation the client `POST`s **only the records edited since the last successful push**
     (the `dirty` id map: `id -> updatedAt`) plus timestamped deletion tombstones. A first sync, an upgrade or seeding
     an empty D1 sends everything once (`fullPushPending`).
   - One request at a time (`syncInFlight`). Edits made while a request is on the wire stay dirty and trigger another
     push. Transient failures retry with capped back-off; auth failures do not.
3. **Incremental pull**
   - On boot, on the browser `online` event, when the tab becomes visible and once a minute, unsynced edits are pushed
     **first**, then `GET /api/sync?since=<cursor>` returns only rows changed after the last cursor, plus the ids
     deleted since. The first pull (no cursor) is a full download.
   - Records are merged **per record** (`mergeCollection`): a local copy that is strictly newer than the remote one is
     kept; remote deletes apply unless a newer local edit exists; local deletes that have not been pushed yet are not
     resurrected by an incoming copy.
   - A brand-new empty D1 seeds itself from the device instead of wiping it.
4. **Deletes**
   - Deleting an entity cascades locally (student → attendance/evaluations/reports; cohort → students and their
     data; lesson plans/tasks are un-linked; Teaching Sessions are kept for claim history) and records
     **tombstones** `{ id, at }`. The edge soft-deletes (`deleted_at`), and `GET` reports them in `deleted`, so
     deleted rows never resurrect and other devices drop them.
5. **Conflict resolution — per-record last-write-wins**
   - Every record carries the client's `updatedAt`; the edge stores it as `client_updated_at` and applies an upsert or
     delete **only if it is newer** than what is stored (`rejected` is reported; the winner arrives with the next
     pull). A newer upsert also revives a soft-deleted row ("edit beats delete", and what makes *Undo* work across
     devices). Unstamped legacy records get the oldest timestamp so they can never override a real edit.
   - Caveat: "newer" compares *client* clocks; a device with a badly wrong clock can win or lose unfairly.
     Free-tier effect: a typical push writes a handful of rows instead of the whole dataset.
6. **Restore / reload**
   - JSON restore is validated completely before anything changes, **replaces** the dataset (missing records are
     tombstoned) and is flagged for sync. "Reload from D1" discards local state after a double confirmation.
7. **Offline app shell**
   - `public/sw.js` caches the shell (network-first for HTML, cache-first for hashed assets, `/api/*` never
     intercepted) so the app opens when the school Wi-Fi is down.

---

## 4. API & Route Structure

```
/api/
  ├── auth/
  │   ├── login
  │   └── session
  ├── cohorts/
  │   ├── [GET]  /             (List active cohorts)
  │   ├── [POST] /             (Create cohort)
  │   └── [PUT]  /:id          (Update cohort)
  ├── students/
  │   ├── [GET]  /?cohortId=   (List students in cohort)
  │   └── [POST] /             (Create/update student)
  ├── attendance/
  │   ├── [GET]  /?cohortId=&date=
  │   └── [POST] /batch        (Bulk roll-call sync)
  ├── milestones/
  │   ├── [GET]  /framework    (Get CEFR descriptors)
  │   └── [POST] /evaluations  (Save student milestone scores)
  ├── lesson-plans/
  │   ├── [GET]  /             (Search & list lesson plans)
  │   └── [POST] /             (Save lesson plan)
  ├── claims/
  │   ├── [GET]  /monthly?month=2026-09
  │   └── [POST] /generate-invoice
  ├── reports/
  │   ├── [GET]  /?studentId=&period=
  │   └── [POST] /             (Save/generate parent report)
  └── sync/
      └── [POST] /             (Batch sync offline mutations)
```

---

## 5. Security & Authentication

- **Edge API authentication**: every `/api/*` request must carry a valid **Cloudflare Access** login
  (`functions/_lib/auth.ts` verifies the signed JWT: signature, audience, issuer, expiry). The email inside picks the
  teacher row; reads and writes are limited to that teacher. The API **fails closed**: with no valid login (and no
  `DEV_USER_EMAIL` locally) every request is answered `401`. The browser holds no secret. See `docs/CLOUDFLARE_SETUP.md` §5.
- **Why**: the dataset contains minors' names and guardian contact details. A public Pages URL must never expose them.
- **Validation**: `POST /api/sync` rejects malformed JSON / shapes with `400` and a problem list; optional fields
  are normalised (`undefined → null`) and numeric defaults only apply to missing values (`0` is a real value).
- **Prepared Statements**: Zero raw SQL concatenation; 100% prepared bindings via `db.prepare(...).bind(...)`.
- **Future**: multi-teacher tenancy would need per-user tokens / Cloudflare Access and `WHERE teacher_id = ?` isolation.

---

## 6. Printing

Printable sheets (report card, lesson scaffold, claim invoice) render through a React portal into `<body>`
(class `print-portal`) so `@media print` can hide `#root` entirely and print only the A4 sheet
(`src/index.css`). Toasts, sidebar and modal chrome can never leak into a printout.
