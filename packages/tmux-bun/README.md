# tmux-bun

A strict-TypeScript library for [Bun](https://bun.com) that programmatically
controls tmux — sessions, windows, and panes — by wrapping the tmux CLI in a
typed, object-oriented API. It drives tmux **headlessly**: it never attaches to
a terminal, and every instance is confined to its own isolated tmux server.

## Install

This package lives in the fleet monorepo workspace; from the repo root:

```bash
bun install
```

To depend on it from another workspace package, reference it by name
(`tmux-bun`) and import from its entry point.

## Usage

```ts
import { Tmux } from "tmux-bun";

// Bound to the "autosmith" namespace — its own private tmux server.
const tmux = new Tmux({ namespace: "autosmith" });

// Create a detached session (never attaches to your terminal).
const session = await tmux.newSession({
  name: "build",
  dir: "/srv/app",
  width: 200,
  height: 50,
});

// Windows and panes.
const window = await session.newWindow({ name: "server" });
const right = await window.split({ direction: "horizontal", percent: true, size: 40 });

// Interaction.
await right.sendKeys("bun run dev", { enter: true });
const output = await right.run("git rev-parse HEAD"); // run a command, get its output
const screen = await right.capture();                 // capture-pane -p

// Introspection — typed structs parsed from tmux -F format strings.
for (const s of await tmux.listSessions()) {
  console.log(s.id, s.name, s.windows, s.attached);
}

// Options.
await tmux.setOption("history-limit", "50000", { global: true });

// Tear down only this namespace's server.
await tmux.killServer();
```

Handles (`Session`, `Window`, `Pane`) are addressed by tmux's **stable server
ids** (`$0`, `@0`, `%0`), so they keep working across renames and reindexing.
Existence checks return booleans (`tmux.hasSession(...)`, `session.exists()`);
genuine failures throw a `TmuxError` carrying the args, exit code, and stderr.

### The low-level escape hatch

Every call goes through a single command helper, exported as an escape hatch for
subcommands this library does not wrap. It is still namespace-confined:

```ts
const raw = await tmux.command.run(["display-message", "-p", "#{client_termname}"]);
```

## No "attach"

This library is for automation, so it deliberately exposes **no** `attach`
command — or anything else that would hand your terminal over to tmux. All work
happens through one-shot CLI invocations (`new-session -d`, `send-keys`,
`capture-pane -p`, …). To watch a session by hand, attach yourself from a shell:

```bash
tmux -L autosmith attach -t build
```

## How isolation works

Namespace isolation is a hard guarantee, not a convention. Each `Tmux` instance
is bound to a namespace at construction and **cannot see or mutate any tmux
state outside it** — your own everyday sessions are never listed, touched, or
killed.

It works because a single command helper injects the server-selecting flags into
**every** invocation:

- `new Tmux({ namespace: "autosmith" })` adds `-L autosmith` to every command,
  which runs a **separate tmux server** on its own socket.
- `new Tmux({ namespace: "autosmith", socketPath: "/run/x.sock" })` overrides
  that with `-S /run/x.sock`.

No higher-level method ever constructs the socket flags itself, so none of them
can escape the namespace. `killServer()` tears down only this namespace's
server. For fully deterministic behavior independent of your personal
`~/.tmux.conf` (e.g. `base-index`), pass `configFile: "/dev/null"`.

The command helper is also the single transport seam: it is the only place that
spawns tmux, so an alternative backend (e.g. a persistent control-mode
`tmux -C` connection) could be added later without changing any call site.

## Testing

```bash
bun test
```

The end-to-end suite runs against a dedicated test namespace on a throwaway
socket — never your default tmux server — and includes a test proving isolation
from the default socket. It skips gracefully if `tmux` is not installed.
