# AI Agent Developer Guide (ClassQue-TeachAssist)

Welcome to the internal AI agent context document. If you are an LLM agent instructed to modify this codebase, **read and obey these rules.**

## 1. Core Principles
- **No Prototype Slop:** This is a production-grade Cloudflare free-tier application. Do not introduce bloated libraries, slow UI, or disorganized CSS. 
- **Strict Terminology:** Use canonical terms ONLY (see `docs/TERMINOLOGY.md`). Examples: `Cohort`, `Teaching Session`, `Live Cockpit`, `Roll-Call`, `Teaching Claim`.
- **Local-First Resilience:** Teachers often have bad Wi-Fi. Write operations must be optimistic and sync to Cloudflare D1 asynchronously.

## 2. Technical Stack
- **React 19 & Vite** (Strict Mode Enabled).
- **Tailwind CSS v4** (Using `@import "tailwindcss"` in `index.css`).
- **Zustand** (`src/store/useTeacherStore.ts`) for global state. Do not use Redux or Context API for state management.
- **Lucide-React** for all icons. Do not import random SVGs or font-awesome.

## 3. Architecture & File Structure
```
src/
├── components/
│   ├── cockpit/      # Today's Cockpit widgets (Stopwatch, Roll-Call card)
│   ├── common/       # ToastContainer, ErrorBoundary
│   ├── hub/          # The core domains (Classes, Reports, Planner)
│   └── layout/       # SideNav, SyncBadges
├── store/
│   ├── useTeacherStore.ts  # Central state & actions
│   └── seedData.ts         # Initial mock payload
├── types/
│   └── index.ts            # Canonical TS definitions
├── utils/
│   └── i18n.ts             # Language dictionary (EN/ID)
└── App.tsx                 # Main layout routing (Flex-row with SideNav)
```

## 4. UI/UX Rules
- **Aesthetic:** Warm neutral background (`#F6F4EF`), Teal/Emerald accents (`#0F766E`).
- **Navigation:** Left-aligned hybrid `SideNav` (collapsible). Do not add top navigation bars.
- **Interactivity:** Non-functional buttons should trigger the `addToast()` from Zustand to acknowledge user intent.

## 5. Deployment
- **Command:** `npm run deploy` (Runs `tsc -b && vite build` followed by `wrangler pages deploy`).
- **Platform:** Cloudflare Pages (`classque.siskaeee.dpdns.org`).
