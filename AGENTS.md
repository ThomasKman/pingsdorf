# AGENTS.md — Shared Agent Guide for Pingsdorf

This file is the **single source of truth** for any AI coding agent working in this repo
(Codex, Claude Code, Cursor, Aider, etc.). Tool-specific files like `CLAUDE.md` should
import or reference this file rather than duplicating its contents.

---

## 1. Project Overview

**Pingsdorf** is a Vite + React + TypeScript web app for "pinging" items on a floor plan
that a significant other forgot to put away. Pings have a position, optional photo,
and are auto-categorised into user-defined rooms (point-in-polygon).

- **Status:** core features implemented, no backend yet, all state in memory.
- **Audience:** the project owner (Thomas) and a partner — multi-user is mocked client-side.

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Language | TypeScript ~5.8 (strict mode on) |
| Framework | React 19.2 + React DOM 19.2 |
| Build | Vite 7.3 |
| Pan/zoom | `react-zoom-pan-pinch` |
| Lint | ESLint 9 flat config + `typescript-eslint` |
| Package mgr | npm |

No backend, no router, no state library, no test runner *yet* — see "Planned" below.

## 3. Repository Layout

```
src/
├── components/         # PingMarker, Sidebar, RoomOverlay, RoomEditor, UserSelector
├── types/              # Ping, Room, User, Point — interface definitions
├── utils/              # geometry.ts (point-in-polygon, screen<->image conversions)
├── App.tsx             # root component (currently very large — see "Known smells")
├── main.tsx            # entry
└── *.css               # co-located styles per component
```

## 4. Commands

```bash
npm install        # install deps
npm run dev        # Vite dev server with HMR
npm run build      # tsc -b && vite build  (use this to verify TS)
npm run lint       # eslint .
npm run preview    # serve the production build
```

**Verification before declaring a task done:** always run `npm run lint` and
`npm run build`. They are the closest thing to a test suite right now.

## 5. Code Style & Conventions

- **TypeScript:** strict mode is on — no `any`. Prefer `unknown` + narrowing.
- **Components:** functional + hooks only. No class components.
- **Types vs interfaces:** `interface` for object shapes, `type` for unions/intersections.
- **Files:** components `PascalCase.tsx`, hooks `useCamelCase.ts`, types `PascalCase.ts`.
- **State:** keep state close to where it's used; lift only when shared.
- **Side effects:** wrap in `useEffect`; memoise expensive derivations with `useMemo`.
- **CSS:** co-located `Component.css` next to `Component.tsx`. No CSS-in-JS.
- **IDs:** use `crypto.randomUUID()` for new entities.
- **Imports:** use `import type { ... }` for type-only imports (required by current ESLint config).
- **No emojis in code/files** unless the user explicitly asks. UI strings already in the app are fine.

## 6. Architectural Notes

- All app state lives in `App.tsx` — pings, rooms, selection, placement mode, mobile
  detection, map rotation. This is the biggest source of complexity.
- Coordinates are stored as **percentages of image dimensions** (0–100), not pixels,
  so they survive zoom/rotation. Conversions live in `src/utils/geometry.ts`.
- Pings are assigned to rooms via ray-casting (`findRoomForPoint`).
- The mobile flow uses a **crosshair + bottom sheet form**; desktop uses **drag-to-place**.
- "Cleaned up" pings stay in state with `cleanedUpAt` set — they are filtered out of
  the active map but remain available for history.

## 7. Known Smells (good first refactors)

- `src/App.tsx` is ~700 lines. Candidates to extract:
  - `usePings()` hook — ping CRUD + cleanup + clustering
  - `useRooms()` hook — room CRUD + drawing-mode state
  - `useMapView()` hook — rotation, fit-scale, transformRef
  - `useMobileViewport()` hook — `isMobile` + resize listener
  - `MobilePingForm` → move to `src/components/`
- No persistence — pings/rooms vanish on refresh. Add `localStorage` (cheap win).
- `FLOOR_PLAN_URL` is hard-coded to a Wikipedia image — should be configurable / uploadable.
- No tests. `utils/geometry.ts` is pure and trivial to cover with Vitest.

## 8. Planned Features (don't implement unless asked)

1. Multi-user with real auth (currently mocked via `MOCK_USERS`).
2. Backend + persistence (likely a separate repo).
3. Mobile polish / responsive overhaul.
4. Docker deployment.
5. Floor-plan upload.

## 9. Doing Work — Agent Checklist

Before changing code:
1. Read the file you're editing **and** its direct callers.
2. Check `package.json` scripts before inventing new ones.
3. Match existing patterns (look at a sibling component) before introducing new ones.

While coding:
- No `any`, no `// @ts-ignore` without a comment explaining why.
- No new dependencies without naming the existing one you considered first.
- Keep diffs minimal and focused on the requested task.

After coding:
- `npm run lint` — must pass.
- `npm run build` — must pass (catches TS errors `tsc --noEmit` would miss).
- Summarise what changed and *why*.

## 10. Security / Data Handling

- Images are stored as base64 in memory, capped at 5 MB per upload.
- No backend, so nothing leaves the browser — but treat user content as untrusted
  once a backend lands. Sanitise before persisting.
- Secrets belong in `.env` files (already gitignored), never in source.

---

*Last updated: 2026-05-23. Keep this file accurate; agents trust it.*
