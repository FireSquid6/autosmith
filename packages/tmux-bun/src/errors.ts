import type { TmuxRunResult } from "./backend";

/**
 * Thrown when a tmux command that is expected to succeed exits non-zero.
 * Existence probes (`hasSession`, `exists`) do not throw this — they translate
 * the non-zero exit into `false` — so a TmuxError always signals a genuine
 * failure worth surfacing.
 */
export class TmuxError extends Error {
  readonly args: readonly string[];
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;

  constructor(args: readonly string[], result: TmuxRunResult) {
    // Prefer stderr for the message; fall back to stdout since some tmux errors
    // land on stdout depending on the subcommand.
    const detail = result.stderr.trim() || result.stdout.trim() || "no output";
    super(`tmux ${args.join(" ")} failed (exit ${result.exitCode}): ${detail}`);
    this.name = "TmuxError";
    this.args = args;
    this.stdout = result.stdout;
    this.stderr = result.stderr;
    this.exitCode = result.exitCode;
  }
}
