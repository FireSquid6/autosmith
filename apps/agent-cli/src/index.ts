#!/usr/bin/env bun
/**
 * index.ts — `fleet-agent`, the CLI an agent invokes from inside a fleet
 * workspace to talk back to its ship.
 *
 * The ship publishes an `atlas.json` at the root of its data directory
 * (`<fleetDirectory>/atlas.json`) with the local port it listens on. Since a
 * workspace lives at `<fleetDirectory>/<repo>/<name>`, these commands can walk
 * up from the current directory to find the ship and derive `(repo, name)`.
 *
 * All three commands are currently stubs — the wiring to the ship is TODO.
 */

import { Command } from "commander";

/** The agent states the ship's `AgentStatus` accepts (see fleet-protocol). */
const AGENT_STATES = ["idle", "planning", "building", "verifying", "awaiting"] as const;

const agentCommand = new Command()
  .name("fleet-agent")
  .description("CLI agents invoke to report back to their fleet ship");

agentCommand
  .command("init")
  .description("start an agent session on this workspace (sets status to idle)")
  .requiredOption("--model <model>", "model driving the agent, e.g. claude-opus-4-8")
  .requiredOption("--provider <provider>", "model provider, e.g. anthropic")
  .requiredOption("--harness <harness>", "agent harness, e.g. claude-code")
  .action((_options: { model: string; provider: string; harness: string }) => {
    // TODO: read atlas.json from the data dir, resolve (repo, name) from cwd,
    // and POST /workspaces/:repo/:name/agent/init with { model, provider, harness }.
    console.error("fleet-agent: init not yet implemented");
  });

agentCommand
  .command("status")
  .description("update this workspace's agent status")
  .argument("<state>", `one of: ${AGENT_STATES.join(", ")}`)
  .requiredOption("-d, --description <text>", "short summary of what you're doing (100-200 characters)")
  .action((_state: string, _options: { description: string }) => {
    // TODO: validate <state> against AGENT_STATES, then push the new
    // state + description to the ship for this workspace.
    console.error("fleet-agent: status not yet implemented");
  });

agentCommand
  .command("in-workspace")
  .description("check whether the current directory is inside a fleet workspace")
  .action(() => {
    // TODO: walk up from cwd to find atlas.json; if found, print the derived
    // `repo/name`, otherwise print "no workspace".
    console.error("fleet-agent: in-workspace not yet implemented");
  });

agentCommand.parse();
