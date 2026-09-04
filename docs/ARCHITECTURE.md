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
                       | Local Cache / IndexedDB           | SQLite Edge Queries
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
| **Client Storage** | IndexedDB (`idb` or Dexie wrapper) | True offline-first classroom usability | Client-side memory |
| **Edge API** | Cloudflare Pages Functions | Native edge routing without managing separate server | 100,000 req/day |
| **Relational DB** | Cloudflare D1 (SQLite) | Edge-replicated ACID relational database | 5M read rows / 100k write rows per day |
| **KV Storage** | Cloudflare KV | Fast session tokens, cached CEFR standard rubrics | 100k reads / 1k writes per day |
| **Deployment** | Wrangler CLI (`wrangler`) | Standard official Cloudflare CLI for reproducible builds | Free |

---

## 3. Data Synchronization Strategy (Local-First)

1. **Client State**:
   - All mutations (taking attendance, logging lesson notes, stopwatch ticks) update local client IndexedDB **immediately** (optimistic UI).
2. **Background Sync Queue**:
   - Every mutation produces a structured change event added to a persistent `sync_queue`.
   - When network connectivity is healthy, `sync_queue` flushes in batches to `/api/sync` on Pages Functions.
3. **Conflict Resolution**:
   - Every record carries `updated_at` (ISO timestamp) and `sync_version`.
   - Resolution algorithm: **Last-Write-Wins (LWW)** with field-level merging where applicable.

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

- **Session Management**: Lightweight edge HMAC-signed JWT cookies or Cloudflare Access token validation.
- **Data Isolation**: Multi-tenant or single-tenant partitioning enforced at SQL query level using parameterized `WHERE teacher_id = ?`.
- **Prepared Statements**: Zero raw SQL concatenation; 100% prepared bindings via `db.prepare(...).bind(...)`.
