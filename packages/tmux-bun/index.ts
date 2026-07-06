// tmux-bun: a typed, headless API over the tmux CLI for Bun.
//
// The object-oriented surface (Tmux -> Session -> Window -> Pane) is the primary
// way to drive tmux. The low-level TmuxCommand helper is exported as an escape
// hatch for subcommands this library does not wrap, and TmuxBackend is the seam
// for alternative transports (e.g. a future control-mode backend).

export { Tmux, type TmuxOptions } from "./src/tmux";
export { Session } from "./src/session";
export { Window } from "./src/window";
export { Pane } from "./src/pane";

export {
  TmuxCommand,
  type TmuxCommandOptions,
} from "./src/command";
export {
  ShellBackend,
  type TmuxBackend,
  type TmuxRunResult,
} from "./src/backend";
export { TmuxError } from "./src/errors";

export { FIELD_SEP } from "./src/format";
export { buildTarget, type TargetParts } from "./src/target";

export type {
  SessionInfo,
  WindowInfo,
  PaneInfo,
  NewSessionOptions,
  NewWindowOptions,
  SplitOptions,
  SplitDirection,
  ResizeOptions,
  ResizeDirection,
  SendKeysOptions,
  CaptureOptions,
  RunOptions,
  OptionScope,
} from "./src/types";
