# AGENTS.md — Shared Agent Guide for Pingsdorf

This file is the **single source of truth** for any AI coding agent working in this repo
(Codex, Claude Code, Cursor, Aider, etc.). Tool-specific files like `CLAUDE.md` should
import or reference this file rather than duplicating its contents.

---

## 1. Project Overview

**Pingsdorf** is a Vite + React + TypeScript web app for "pinging" items on a floor plan
that a significant other forgot to put away. Pings have a position, optional photo,
and are auto-categorised into user-defined rooms (point-in-polygon). State is persisted
to `localStorage` so pings/rooms survive a page refresh.

- **Status:** core features implemented, no backend yet.
- **Audience:** the project owner (Thomas) and a partner — multi-user is mocked client-side.

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Language | TypeScript ~5.8 (strict mode on) |
| Framework | React 19.2 + React DOM 19.2 |
| Build | Vite 7.3 |
| Pan/zoom | `react-zoom-pan-pinch` |
| Lint | ESLint 9 flat config + `typescript-eslint` |
| Persistence | `localStorage` (versioned schema, see `src/utils/storage.ts`) |
| Package mgr | npm |

No backend, no router, no state library, no test runner *yet* — see "Planned" below.

## 3. Repository Layout

```
src/
├── components/         # PingMarker, Sidebar, RoomOverlay, RoomEditor,
│                       # UserSelector, MobilePingForm
├── hooks/              # usePings, useRooms, useMapView, useMobileViewport
├── types/              # Ping, Room, User, Point — interface definitions
├── utils/
│   ├── geometry.ts     # point-in-polygon, screen<->image conversions
│   └── storage.ts      # versioned localStorage load/save with Date revival
├── App.tsx             # orchestrator — wires hooks, renders the map
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

- **App.tsx is an orchestrator.** It owns only the top-level glue state
  (current user, sidebar open, room editor open, cluster spread). Everything
  domain-shaped lives in hooks.
- **The four hooks** in `src/hooks/`:
  - `usePings(currentUserId, rooms, { initialPings? })` — pings CRUD + selection
    + placement state machine. Re-runs point-in-polygon when rooms change
    *after* the first render (so caller-provided `roomId`s on hydrated state
    are trusted).
  - `useRooms({ initialRooms? })` — rooms CRUD + "drawing a new room" state.
  - `useMapView()` — image/transform/container refs, rotation, fit-scale.
  - `useMobileViewport()` — `isMobile` + resize listener.
- **Coordinates** are stored as percentages of image dimensions (0–100), not
  pixels, so they survive zoom/rotation. Conversions live in `src/utils/geometry.ts`.
- **Persistence** (`src/utils/storage.ts`) reads on mount via lazy `useState`
  initializer, writes on change debounced 250 ms, flushes on `beforeunload`.
  Versioned key `pingsdorf:v1`; corrupt or version-mismatched payloads fall
  back to the empty state instead of crashing. `Date` fields are stored as
  ISO strings and revived on load.
- **Mobile flow** uses a crosshair + bottom sheet form; desktop uses
  drag-to-place. Double-tap on mobile drops a ping directly.
- **"Cleaned up" pings** stay in state with `cleanedUpAt` set — they're
  filtered out of the active map but remain available for history.

## 7. Known Smells (good follow-up tasks)

- `FLOOR_PLAN_URL` is hard-coded to a Wikipedia image — should be configurable
  or user-uploadable.
- No tests. `utils/geometry.ts` and `utils/storage.ts` are both pure-ish and
  trivial to cover with Vitest. Add Vitest + RTL.
- No Prettier — `eslint-config-prettier` + a `format` script would be cheap.
- No CI workflow — a single `lint + build` GitHub Action would catch
  regressions on PRs.
- Images persist as base64 inside `localStorage`. The 5 MB-per-image cap
  combined with the browser's ~5–10 MB localStorage budget will bite once
  pings accumulate. Consider IndexedDB for image blobs when this matters.

## 8. Planned Features (don't implement unless asked)

1. Multi-user with real auth (currently mocked via `MOCK_USERS`).
2. Backend + sync between users (likely a separate repo).
3. Mobile polish / responsive overhaul.
4. Docker deployment.
5. Floor-plan upload.

## 9. Doing Work — Agent Checklist

Before changing code:
1. Read the file you're editing **and** its direct callers.
2. Check `package.json` scripts before inventing new ones.
3. Match existing patterns (look at a sibling component or hook) before
   introducing new ones.

While coding:
- No `any`, no `// @ts-ignore` without a comment explaining why.
- No new dependencies without naming the existing one you considered first.
- Keep diffs minimal and focused on the requested task.
- Touching a hook? Re-read `App.tsx` to make sure the consumer side still
  type-checks and that no behaviour changes leak out.

After coding:
- `npm run lint` — must pass.
- `npm run build` — must pass (catches TS errors `tsc --noEmit` would miss).
- If you changed persisted shape, bump the schema version in `storage.ts`
  and make `loadAppState` reject old payloads gracefully.
- Summarise what changed and *why*.

## 10. Security / Data Handling

- Images are stored as base64 in `localStorage`, capped at 5 MB per upload.
- No backend, so nothing leaves the browser — but treat user content as
  untrusted once a backend lands. Sanitise before persisting.
- Secrets belong in `.env` files (already gitignored), never in source.

## 11. Useful Links

- [Vite documentation](https://vite.dev/guide/)
- [React 19 docs](https://react.dev/)
- [TypeScript handbook](https://www.typescriptlang.org/docs/)
- [react-zoom-pan-pinch](https://github.com/BetterTyped/react-zoom-pan-pinch)

---

*Last updated: 2026-06-19. Keep this file accurate; agents trust it.*
