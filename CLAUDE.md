# CLAUDE.md — Claude Code notes for Pingsdorf

> **Read [AGENTS.md](./AGENTS.md) first.** It is the source of truth for project
> overview, tech stack, commands, code style, architecture, and the agent
> checklist. This file only contains Claude-Code-specific guidance that
> doesn't belong in a tool-neutral file.
>
> Claude Code resolves `@AGENTS.md` imports automatically — treat the contents
> of that file as if they were inlined here.

@AGENTS.md

---

## Claude-Code-specific workflow

### Git worktrees (preferred for non-trivial work)

We use **git worktrees** so that multiple Claude/Codex sessions, experiments,
or PRs can coexist without stomping on each other's working tree. The main
checkout stays clean; every task gets its own branch + directory.

**Default layout** (matches the Omnara harness already in use):

```
C:\Users\Thomas\.omnara\worktrees\pingsdorf\<task-slug>\
```

#### When to spin up a worktree

- Any task expected to touch more than a couple of files.
- Anything you want to keep reviewable as its own branch / PR.
- Parallel experiments ("try approach A here, approach B there").

#### Creating one manually

```bash
# from the main pingsdorf checkout
git worktree add ../worktrees/<task-slug> -b <task-slug>
cd ../worktrees/<task-slug>
npm install            # node_modules is not shared across worktrees
```

#### Cleaning up

```bash
# from anywhere in the repo
git worktree list                       # see what exists
git worktree remove ../worktrees/<slug> # removes dir + prunes
git branch -d <task-slug>               # delete the branch if merged
```

#### Rules of thumb

- **One branch per worktree.** Never check out the same branch in two worktrees.
- **`node_modules` is per-worktree** — `npm install` after creating one.
- **Don't commit cross-worktree paths.** Use repo-relative paths in code.
- The `EnterWorktree` / `ExitWorktree` tools in this harness do the same thing;
  prefer them over raw `git worktree` commands when available.

### Verification commands Claude should run

Before reporting a task complete, in this order:

```bash
npm run lint
npm run build
```

If either fails, fix it before handing back — don't paper over with `// eslint-disable`
or `@ts-ignore`.

### Harness-specific notes

- This repo lives on Windows; prefer the `Bash` tool (Git Bash) for `git`/`npm`
  commands, or `PowerShell` for Windows-native tasks. Don't mix syntaxes in one call.
- Use `Read` / `Edit` / `Write` / `Grep` / `Glob` rather than `cat`/`sed`/`find`/`grep`
  via Bash — the tool-specific versions handle Windows paths and permissions correctly.
- When asked to "use a subagent," dispatch via the `Agent` tool. Don't spawn agents
  for tasks you can handle inline.

### When in doubt

Ask the user. A clarifying question is cheaper than a wrong refactor of a 700-line
component.

---

*Last updated: 2026-05-23.*
