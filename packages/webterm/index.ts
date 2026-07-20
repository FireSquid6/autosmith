/**
 * webterm — the JSON-over-WebSocket terminal protocol plus the server-side
 * bridge that turns a PTY into streamed grid snapshots.
 *
 * Import `webterm/protocol` (type-only, browser-safe) from the client; import
 * from `webterm` on the server for the bridge + encoder.
 */

export { TerminalBridge, type TerminalBridgeOptions } from "./server";
export { serializeGrid, encodeCell } from "./encode";

export {
  ATTR,
  UNDERLINE,
  WIDTH,
  type ClientMsg,
  type InitMsg,
  type InputMsg,
  type ResizeMsg,
  type ServerMsg,
  type GridMsg,
  type ExitMsg,
  type WireCursor,
  type WireCursorShape,
  type WireCell,
  type WireCellObject,
  type WireColor,
} from "./protocol";
