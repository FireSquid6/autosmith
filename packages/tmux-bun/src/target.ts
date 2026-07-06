/** Components of a tmux target string, any of which may be omitted. */
export interface TargetParts {
  /** Session name or id (`$N`). */
  session?: string;
  /** Window name, index, or id (`@N`). */
  window?: string | number;
  /** Pane index or id (`%N`). */
  pane?: string | number;
}

/**
 * Build a tmux target of the form `session:window.pane`. tmux server-unique ids
 * (`$N`, `@N`, `%N`) are valid targets on their own, so this is only needed when
 * addressing entities by name/index; the handle classes accept ids directly.
 *
 * Examples: `{ session: "build" }` -> `"build"`;
 * `{ session: "build", window: "server" }` -> `"build:server"`;
 * `{ session: "build", window: 1, pane: 0 }` -> `"build:1.0"`.
 */
export function buildTarget(parts: TargetParts): string {
  let target = parts.session ?? "";
  if (parts.window !== undefined) target += `:${parts.window}`;
  if (parts.pane !== undefined) target += `.${parts.pane}`;
  return target;
}
