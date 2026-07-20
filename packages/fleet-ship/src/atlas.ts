/**
 * atlas.ts — writes the ship's `atlas.json` discovery file.
 *
 * The file lives at the root of the ship's data directory (`fleetDirectory`).
 * Since workspaces live at `<fleetDirectory>/<repo>/<name>`, an agent inside a
 * workspace can walk up to find it and learn the local port to reach the ship.
 */

import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { ATLAS_FILENAME, type Atlas } from "fleet-protocol";

export function atlasPath(fleetDirectory: string): string {
  return join(fleetDirectory, ATLAS_FILENAME);
}

export async function writeAtlas(fleetDirectory: string, atlas: Atlas): Promise<void> {
  await mkdir(fleetDirectory, { recursive: true });
  await Bun.write(atlasPath(fleetDirectory), JSON.stringify(atlas, null, 2));
}
