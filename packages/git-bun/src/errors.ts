import type { GitRunResult } from "./backend";

/**
 * Thrown when a git command that is expected to succeed exits non-zero.
 * Existence probes (`isRepo`, `getConfig`) do not throw this — they translate
 * the expected non-zero exit into `false`/`undefined` — so a GitError always
 * signals a genuine failure worth surfacing.
 */
export class GitError extends Error {
  readonly args: readonly string[];
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;

  constructor(args: readonly string[], result: GitRunResult) {
    // Prefer stderr for the message; fall back to stdout since some git errors
    // land on stdout depending on the subcommand.
    const detail = result.stderr.trim() || result.stdout.trim() || "no output";
    super(`git ${args.join(" ")} failed (exit ${result.exitCode}): ${detail}`);
    this.name = "GitError";
    this.args = args;
    this.stdout = result.stdout;
    this.stderr = result.stderr;
    this.exitCode = result.exitCode;
  }
}
