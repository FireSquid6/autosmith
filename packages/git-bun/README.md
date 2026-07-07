# git-bun

A strict-TypeScript library for [Bun](https://bun.com) that programmatically
drives git by wrapping the git CLI in a typed, object-oriented API. Every
instance is bound to a **working directory** at construction and confined to it,
so operations can never wander into the wrong repository — the mechanism that
lets a fleet of agents each work in an isolated directory.

## Install

This package lives in the fleet monorepo workspace; from the repo root:

```bash
bun install
```

To depend on it from another workspace package, reference it by name (`git-bun`)
and import from its entry point.

## Usage

```ts
import { Git } from "git-bun";

// Bind to an existing repo...
const repo = new Git({ cwd: "/srv/app" });

// ...or create one. init/clone return a handle bound to the new directory.
const fresh = await Git.init("/srv/new-repo", { initialBranch: "main" });

// Stage and commit — commit() returns the new commit's hash.
await Bun.write("/srv/new-repo/README.md", "# hi\n");
await fresh.add(".");
const sha = await fresh.commit("initial commit", { author: "Bot <bot@x.io>" });

// Inspect — typed structs parsed from git plumbing output.
const status = await fresh.status();     // { branch, ahead, behind, clean, files }
const history = await fresh.log({ maxCount: 10 });
const branches = await fresh.branches();

// Branches.
await fresh.createBranch("feature");
await fresh.switchBranch("feature");

// A worktree gives a task its own working directory — the returned Git handle is
// already bound to it, so hand it straight to whatever will work there.
const agent = await repo.worktreeAdd("/srv/agents/1", { newBranch: "agent/1" });
await agent.status(); // runs in /srv/agents/1, on branch agent/1
await repo.worktreeRemove("/srv/agents/1", { force: true });

// Config. Unset keys read back as undefined rather than throwing.
await repo.setConfig("user.name", "CI");
const name = await repo.getConfig("user.name");
```

Existence checks return values, not exceptions (`repo.isRepo()`,
`repo.getConfig(...)` → `undefined` when unset); genuine failures throw a
`GitError` carrying the args, exit code, and stderr.

### The low-level escape hatch

Every call goes through a single command helper, exported as an escape hatch for
subcommands this library does not wrap. It is still `-C <cwd>`-confined:

```ts
const notes = await repo.command.run(["notes", "show", "HEAD"]);
```

## No interactive commands

This library is for automation, so it deliberately exposes **no** interactive
git — no `rebase -i`, no editor-driven commit (`commit` always passes `-m`), no
credential prompts. All work happens through one-shot CLI invocations whose
output is captured and parsed. To do interactive work by hand, run git yourself
in the directory a handle is bound to.

## How isolation works

Directory confinement is a hard guarantee, not a convention. Each `Git` instance
is bound to a `cwd` at construction and **cannot run against any other
directory**, because a single command helper injects `-C <cwd>` into **every**
invocation:

- `new Git({ cwd: "/srv/app" })` runs every command as `git -C /srv/app …`.
- `Git.init`/`Git.clone` create a directory that does not exist yet, so their
  creating command is scoped to the parent (`dirname(dir)`, which must already
  exist); the returned handle is then bound to the new directory.
- `worktreeAdd` runs from the current repo and returns a handle bound to the new
  worktree — the same "return a bound handle" pattern.

No higher-level method ever constructs the `-C` flag itself, so none of them can
escape their directory. The command helper is also the single transport seam: it
is the only place that spawns git, so an alternative backend (e.g. a libgit2
binding or a batched plumbing process) could be added later without changing any
call site.

For deterministic commits independent of the machine's git identity, pass an
`env` with `GIT_AUTHOR_NAME`/`GIT_AUTHOR_EMAIL` (and the `COMMITTER` variants) —
it is merged into every invocation's environment.

## Testing

```bash
bun test
```

The pure output parsers are unit-tested without git. The end-to-end suite runs
against throwaway repositories created in a temp directory — never your own
repos — and skips gracefully if `git` is not installed.
