# Pingsdorf

A web app where you can "ping" items on a floor plan that your significant other
forgot to put away. Pan, zoom, drop a pin, snap a photo, watch the chaos accumulate.

> Disclaimer: this project is 100% vibe-coded for research purposes.

## Features

- Pan/zoom floor plan with `react-zoom-pan-pinch`.
- Drop pings with name, description, and optional photo.
- Define rooms by clicking corners on the map; pings auto-categorise via
  point-in-polygon.
- Sidebar grouped by room, with per-ping edit / delete / "cleaned up".
- Mobile flow: crosshair + bottom-sheet form, double-tap to drop.
- Mock multi-user view (own vs. partner pings colour-coded).

## Quick start

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually <http://localhost:5173>).

## Scripts

| Command           | What it does                              |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Vite dev server with HMR                  |
| `npm run build`   | `tsc -b && vite build` (use to verify TS) |
| `npm run preview` | Serve the production build locally        |
| `npm run lint`    | ESLint on the whole tree                  |

## Tech stack

- **Vite 7** + **React 19** + **TypeScript** (strict)
- **react-zoom-pan-pinch** for the map
- **ESLint 9** flat config with `typescript-eslint`

No backend yet — state lives in browser memory and disappears on refresh.

## Project layout

```
src/
├── components/   # PingMarker, Sidebar, RoomOverlay, RoomEditor, UserSelector
├── types/        # Ping, Room, User, Point
├── utils/        # geometry helpers (point-in-polygon, screen<->image coords)
├── App.tsx       # root — currently holds most app state
└── main.tsx
```

## Roadmap

- Persist state to `localStorage`
- Floor-plan upload (replace the hard-coded Wikipedia sample)
- Real auth + multi-user backend
- Vitest + React Testing Library
- Docker deployment

## Working with AI agents

This repo is set up for both **Claude Code** and **OpenAI Codex**:

- `AGENTS.md` — shared rules (read by Codex natively, imported by Claude).
- `CLAUDE.md` — Claude-specific workflow (git worktrees, harness tips).

If you're contributing via an agent, read `AGENTS.md` first.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## License

Not yet specified — treat as "all rights reserved" until a `LICENSE` file lands.
