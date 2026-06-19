# Contributing to Pingsdorf

Thanks for poking around! This is a small, vibe-coded research project, so the bar
for contributions is "don't break the build and keep the style consistent."

## Getting started

```bash
git clone <repo-url>
cd pingsdorf
npm install
npm run dev
```

Open the printed `localhost` URL. Hot reload is on.

## Before you push

```bash
npm run lint     # ESLint must pass
npm run build    # TypeScript + Vite build must pass
```

If you added behaviour, please also add a test once the test runner exists
(Vitest is on the roadmap — see `AGENTS.md` §7).

## Branching & worktrees

We use **git worktrees** for parallel work. Either:

- Create a branch the normal way: `git checkout -b feat/<short-name>`, **or**
- Create a worktree (preferred for AI-agent sessions):
  ```bash
  git worktree add ../worktrees/<task-slug> -b feat/<task-slug>
  cd ../worktrees/<task-slug>
  npm install
  ```

Open a PR against `main` with:

1. A short description of *what* and *why* (not *how* — the diff shows that).
2. Screenshots/GIFs for any UI change.
3. A note on anything you punted on.

## Code style

See `AGENTS.md` §5 for the full list. The short version:

- TypeScript strict, no `any`.
- Functional React components + hooks.
- Co-located `Component.css` next to `Component.tsx`.
- Use `crypto.randomUUID()` for IDs.
- Match the style of the file you're editing before introducing a new pattern.

## AI agents

If you're using Claude Code, Codex, Cursor, or similar:

- Read `AGENTS.md` first (it's the shared rules).
- Tool-specific tweaks live in `CLAUDE.md` (and would live in `CODEX.md` if we needed one).
- Don't let the agent invent new dependencies, scripts, or folder structures
  without checking against `AGENTS.md`.

## Reporting bugs

Open an issue with:

- What you did.
- What you expected.
- What happened instead.
- Browser + OS (especially relevant for the mobile/touch flows).
