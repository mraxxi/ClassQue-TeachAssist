# 📋 Stage 12: Cookie Storage for Language & User Preferences

> **Re-verified 2026-10-06 (Stage 16).** The checkboxes below were previously unchecked or unreliable; each item is now backed by an automated browser check in `e2e/tests/07-sync-offline.test.mjs`. See `docs/VERIFICATION_REPORT_2026-10.md`.


**Lifecycle Stage**: `working_on`  
**Target Domain**: Cross-Cutting Utilities (`src/utils/cookies.ts`) & Store State  
**Ubiquitous Language**: `Preference Cookies` (Kuki Preferensi Pengguna), `Persistent Configuration` (Pengaturan Tersimpan)

---

## 🎯 Objectives & Deliverables
Store user configuration and interface preferences in persistent first-party cookies (with multi-month expiration and `SameSite=Lax`) to ensure language, sidebar collapse state, and future UI settings survive across sessions and edge renders.

### 1. Cookie Utility Layer (`src/utils/cookies.ts`)
- [x] Safe `getCookie(name: string): string | null`
- [x] `setCookie(name: string, value: string, days?: number): void` (defaults to 365 days, `path=/`, `SameSite=Lax`)
- [x] `deleteCookie(name: string): void`

### 2. Preference Keys & Store Integration
- [x] Keys supported:
  - `cq_lang`: `id` or `en` (language preference)
  - `cq_sidebar_expanded`: `true` or `false`
  - ~~`cq_theme`: `light` or `dark`~~ — **deferred**: there is no theme switcher yet (tracked as FR-021); only `cq_lang` and `cq_sidebar_expanded` exist.
- [x] In `useTeacherStore.ts`:
  - On store creation, check `cq_lang` cookie before falling back to local storage or browser default.
  - When `setLanguage(lang)` is called, write to both cookie and `localStorage`.
- [x] In `SideNav.tsx`:
  - Sync `isExpanded` state to `cq_sidebar_expanded` cookie.

---

## 🧪 Verification & Testing Checklist
- [x] Toggle language between Indonesian and English, inspect browser cookies (`document.cookie`), verify `cq_lang` updates.
- [x] Toggle sidebar collapse state, verify `cq_sidebar_expanded` cookie updates.
- [x] Refresh page, verify language and sidebar state persist cleanly from cookies.
