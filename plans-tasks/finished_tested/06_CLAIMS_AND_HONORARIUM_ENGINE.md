# 📋 Stage 06: Teaching Claims & Honorarium Engine

**Lifecycle Stage**: `finished_tested`  
**Target Domain**: Domain 4: Claims & Reports Hub (`src/components/hub/ClaimsReportsHub.tsx`)  
**Ubiquitous Language**: `Teaching Claim` (Klaim Honorarium), `Teaching Session` (Sesi Pembelajaran), `Hourly Rate` (Tarif Honor per Jam)

---

## 🎯 Objectives & Deliverables
Provide teachers and institutions with an automated, transparent claim generation engine that aggregates completed teaching sessions, computes base honorarium + allowances, supports status tracking, and exports formal printable invoices.

### 1. Dynamic Session & Claims Aggregation
- [x] **Monthly Claims Calculator**:
  - Filter claims by month selector (`2026-09`, `2026-08`, etc.).
  - Total Hours calculation: $\sum \text{durationMinutes} / 60$.
  - Base Amount: $\sum (\text{hours} \times \text{hourlyRate})$.
  - Custom Extra Allowances (Preparation allowance, Transport allowance, Materials allowance).
  - Total Claim: $\text{Base Amount} + \text{Allowances}$.
- [x] **Manual Session Add / Edit Modal**:
  - Ability to log past or off-schedule teaching sessions with custom date, time, duration, and rate.
  - Delete or adjust session durations.

### 2. Claim Invoice Workflow & Statuses
- [x] **Claim Status Transition Controls**:
  - `Draft` ➔ `Submitted` ➔ `Approved` ➔ `Paid`.
  - Timestamp tracking (`submittedAt`, `paidAt`).
- [x] **Claim Invoice Document Generator**:
  - Dedicated Printable / PDF Claim Invoice Modal (`ClaimInvoiceModal.tsx`).
  - Formatted breakdown table with date, cohort name, duration, hourly rate, session earnings.
  - Teacher signature block, school name header, and invoice reference number.

### 3. Store State & Claim Actions
- [x] In `src/store/useTeacherStore.ts`:
  - `addManualSession(session: TeachingSession)`
  - `updateSession(id: string, data: Partial<TeachingSession>)`
  - `deleteSession(id: string)`
  - `updateClaimStatus(claimId: string, status: ClaimStatus)`
  - `updateClaimAllowances(claimId: string, allowanceAmount: number, notes?: string)`

---

## 🧪 Verification & Testing Checklist
- [x] Add a new manual teaching session in Claims Hub (e.g., 2 hours at Rp 150,000/hr).
- [x] Verify total claim amount immediately recalculates to reflect the new session.
- [x] Add an allowance of Rp 50,000 for transport, verify grand total updates.
- [x] Transition claim status from `Draft` to `Submitted`, verify status badge updates.
- [x] Click "Print Invoice / Export", verify clean A4 invoice rendering with teacher details and signature area.
