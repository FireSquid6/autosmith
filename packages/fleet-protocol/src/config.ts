/**
 * src/config.ts — the Fleet Ship configuration contract.
 *
 * A ship is configured by a small YAML file (default `./fleet-ship-config.yaml`).
 * The host parses/validates it; the CLI only needs the shape + the default port.
 */

/** The parsed `fleet-ship-config.yaml`. */
export interface FleetShipConfig {
  /** Directory that holds all workspaces, laid out as `<fleetDirectory>/<repo>/<name>`. */
  readonly fleetDirectory: string;
  /** Port the ship's HTTP + WebSocket API listens on. */
  readonly port: number;
  /** Human-facing name of this ship (surfaced as `ship` on active workspace status). */
  readonly name: string;
}

/**
 * Port the CLI falls back to when no `--url` is given (`http://localhost:${DEFAULT_PORT}`).
 * Ships are free to configure any port; this is only the client-side default.
 */
export const DEFAULT_PORT = 4700;
