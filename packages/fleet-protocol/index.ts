/**
 * fleet-protocol — the shared API + config contract between the Fleet Ship host
 * and the Fleet CLI. Pure types plus a couple of constants; no runtime deps.
 */

export {
  DEFAULT_PORT,
  ATLAS_FILENAME,
  FleetShipConfigSchema,
  type FleetShipConfig,
  AtlasSchema,
  type Atlas,
} from "./src/config";
export { WorkspaceSummarySchema, type WorkspaceSummary } from "./src/workspace";
export type {
  WorkspaceDiff,
  WorkspaceStatus,
  AgentStatus,
  CreateWorkspaceRequest,
  SwitchBranchRequest,
} from "./src/workspace";
export type { SystemResources } from "./src/system";
export type { Repo } from "./src/repo";

export {
  SyncEventSchema,
  WorkspaceCreatedEventSchema,
  WorkspaceBranchChangedEventSchema,
  WorkspaceActivatedEventSchema,
  WorkspaceDeactivatedEventSchema,
  WorkspaceRemovedEventSchema,
  FleetEventSchema,
  decodeFleetEvent,
  type SyncEvent,
  type FleetEvent,
} from "./src/events";
