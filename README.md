# Autosmith

Autosmith is an AI agent management system. You create **projects** (backed by a git repository) and assign **agents** to them. Each agent runs inside a Docker container with a cloned copy of the project repo, and you interact with it through a live chat interface in the browser.

Agents can read and write files, run shell commands, manage git history, open pull requests, and more. You can give each agent its own system prompt, assign reusable skill packs, and configure per-scope authentication tokens.

## How it works

```
Browser UI  ──►  Autosmith server  ──►  Docker container
                        │                  (git workspace)
                        │
                   ~/autosmith/
                   (data directory)
```

When you start an agent, Autosmith:

1. Clones (or pulls) the project's git repository into a local workspace directory
2. Creates a Docker container with that workspace bind-mounted inside
3. Injects git credentials so the agent can push and pull without manual auth
4. Loads the agent's assigned skills and resolves its layered instructions
5. Opens a streaming session — every tool call and text response flows back to the browser in real time


## Installation

### Manual
Manual is recommended for now. Requires bun to be installed.

```bash
# clone repo
git clone https://github.com/firesquid6/autosmith
cd autosmith

# install dependencies
bun install --frozen-lockfile

# build and install
./scripts/local-install.sh

# You'll need to add ~/.autosmith/bin to your PATH

```

### Automatic

*One line installs not available yet* 

Alternatively, check the releases and download the binary. Put it where you'd like.

## Getting started

**Prerequisites:** Bun, Docker

```sh
# Build the agent Docker image
docker build -t autosmith/agent:latest .

autosmith init
automsith serve
```

Then open `http://localhost:4456`.

The `init` command walks you through setting up your data directory: AI provider keys, git tokens, and user info. Run it once before your first `serve`.

## Data directory

Everything lives under `~/autosmith` (or wherever you point `--dir`):

```
~/autosmith/
├── AGENT.md            # Root system prompt, applied to every agent
├── providers.yaml      # AI provider keys (e.g. ANTHROPIC_API_KEY)
├── tokens.yaml         # Global git/service tokens
├── skills/
│   └── {skill-name}/
│       ├── SKILL.md    # Frontmatter + full skill content
│       └── scripts/    # Optional executable scripts
└── projects/
    └── {project}/
        ├── project.yaml
        ├── AGENT.md    # Appended to root instructions
        ├── tokens.yaml
        └── {agent}/
            ├── agent.yaml
            ├── AGENT.md     # Appended to project instructions
            ├── tokens.yaml
            └── workspace/   # Git clone, bind-mounted into container
```

**Instructions** are layered: root → project → agent. All three `AGENT.md` files are concatenated into the system prompt.

**Tokens** are layered the same way. A token defined at the project level overrides one with the same name at root, and so on.

## Projects

A project points to a git repository:

| Field | Description |
|-------|-------------|
| `provider` | `github`, `gitlab`, `bitbucket`, or a raw hostname |
| `owner` | Repository owner or organization |
| `repository` | Repository name |
| `tokenName` | Name of the token (from `tokens.yaml`) used to authenticate |

## Agents

An agent belongs to a project:

| Field | Description |
|-------|-------------|
| `dockerImage` | Image to run (default: `autosmith/agent:latest`) |
| `filesystemMountPoint` | Where the workspace is mounted inside the container (default: `/workspace`) |
| `skills` | List of skill names to assign |

The Docker container is named `autosmith-{project}-{agent}` and persists between sessions — only its process state changes when you start or stop an agent.

## Skills

Skills are reusable instruction sets stored in `~/autosmith/skills/{name}/`. Each has a `SKILL.md` with YAML frontmatter:

```markdown
---
title: GitHub CLI
description: Use gh to manage pull requests and issues
---

Use the `gh` CLI for all GitHub operations...
```

Skill titles and descriptions are injected into the system prompt at startup. The agent loads the full content on demand using the `skillRead` tool when it needs the details.

## CLI

```
bun src/index.ts init [--dir <path>]
bun src/index.ts serve [--port <port>] [--dir <path>]
```

## Tech stack

- **Runtime:** Bun
- **Backend:** Covenant-RPC, Vercel AI SDK (Claude Sonnet / Haiku)
- **Frontend:** React 19, React Router 7, Tailwind CSS, DaisyUI
- **Containers:** Docker (CLI via `Bun.$`)
