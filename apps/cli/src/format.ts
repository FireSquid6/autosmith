/**
 * format.ts — pure formatting helpers for CLI output (no network, no I/O).
 */

import type { WorkspaceSummary } from "fleet-protocol";
import type { Repo } from "fleet-protocol";
import type { ShipInfo, BridgeWorkspaceSummary } from "fleet-bridge/types";

/**
 * Render an aligned, human-readable table: a header row followed by one row per
 * entry, each column padded to its widest cell. With no rows, only the header is
 * returned.
 */
export function renderTable(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const widths = headers.map((header, col) =>
    Math.max(header.length, ...rows.map((row) => (row[col] ?? "").length)),
  );

  const formatRow = (cells: readonly string[]): string =>
    cells.map((cell, col) => cell.padEnd(widths[col] ?? 0)).join("  ").trimEnd();

  return [formatRow(headers), ...rows.map((row) => formatRow(row))].join("\n");
}

/** Render a list of workspace summaries as an aligned, human-readable table. */
export function formatWorkspaceTable(rows: readonly WorkspaceSummary[]): string {
  return renderTable(
    ["REPO", "NAME", "BRANCH", "ACTIVE"],
    rows.map((row) => [row.repoName, row.name, row.branch, row.active ? "yes" : "no"]),
  );
}

/** Render a fleet-wide workspace list, annotating each row with its owning ship. */
export function formatFleetWorkspaceTable(rows: readonly BridgeWorkspaceSummary[]): string {
  return renderTable(
    ["SHIP", "REPO", "NAME", "BRANCH", "ACTIVE"],
    rows.map((row) => [row.ship, row.repoName, row.name, row.branch, row.active ? "yes" : "no"]),
  );
}

/** Render the bridge's registered ships as a table. */
export function formatShipTable(rows: readonly ShipInfo[]): string {
  return renderTable(
    ["NAME", "URL", "STATUS"],
    rows.map((row) => [row.name, row.url, row.status]),
  );
}

/** Render the bridge's registered repos as a table. */
export function formatRepoTable(rows: readonly Repo[]): string {
  return renderTable(
    ["NAME", "URL", "PROVIDER"],
    rows.map((row) => [row.name, row.url, row.provider]),
  );
}
