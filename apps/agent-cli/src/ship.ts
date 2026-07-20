/**
 * ship.ts — thin fetch wrapper for the agent-facing ship routes.
 *
 * Kept dependency-light (plain `fetch`, no Eden client) since this CLI runs on
 * the workspace side and only touches a couple of endpoints.
 */

import type { AgentStatus } from "fleet-protocol";
import type { WorkspaceLocation } from "./workspace";

/** POST JSON to a ship route and return the parsed `AgentStatus` (exits on error). */
async function post(location: WorkspaceLocation, path: string, body: unknown): Promise<AgentStatus> {
  const url = `${location.baseUrl}/workspaces/${location.repo}/${location.name}/${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(`fleet-agent: could not reach ship at ${location.baseUrl}: ${(err as Error).message}`);
    process.exit(1);
  }

  const text = await res.text();
  const parsed = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const message = parsed && typeof parsed === "object" && "error" in parsed ? parsed.error : text;
    console.error(`fleet-agent: request failed (${res.status}): ${message}`);
    process.exit(1);
  }
  return parsed as AgentStatus;
}

export function initAgent(
  location: WorkspaceLocation,
  body: { model: string; provider: string; harness: string },
): Promise<AgentStatus> {
  return post(location, "agent/init", body);
}

export function updateStatus(
  location: WorkspaceLocation,
  body: { state: string; description: string },
): Promise<AgentStatus> {
  return post(location, "agent/status", body);
}
