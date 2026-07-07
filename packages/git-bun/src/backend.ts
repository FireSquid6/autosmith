// The transport seam. Every git invocation in this library flows through a
// GitBackend, so an alternative backend (e.g. a long-lived `git cat-file --batch`
// process, or a libgit2 binding) could be dropped in without touching any call
// site — only this interface must be satisfied.

/** Raw result of a single `git` invocation. */
export interface GitRunResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
}

/**
 * A transport that runs one git command and reports its raw result. The `args`
 * it receives already include the `-C <cwd>` working-directory flags, so a
 * backend must never inject its own — it just executes what it is given.
 */
export interface GitBackend {
  run(args: readonly string[]): Promise<GitRunResult>;
}

/**
 * Default backend: spawn one-shot `git` processes via Bun's shell. Bun.$
 * escapes every interpolated array element into a distinct argv entry, so there
 * is no shell to inject into and no manual quoting to get wrong.
 */
export class ShellBackend implements GitBackend {
  private readonly binary: string;
  private readonly env?: Record<string, string>;

  constructor(binary: string = "git", env?: Record<string, string>) {
    this.binary = binary;
    this.env = env;
  }

  async run(args: readonly string[]): Promise<GitRunResult> {
    const argv = [this.binary, ...args];
    // `.quiet()` keeps output out of the parent's stdio; `.nothrow()` lets us
    // inspect the exit code instead of Bun.$ throwing on non-zero. Extra env is
    // merged over the inherited process environment so callers can set e.g.
    // GIT_AUTHOR_NAME without clobbering PATH.
    let shell = Bun.$`${argv}`.quiet().nothrow();
    if (this.env) shell = shell.env({ ...process.env, ...this.env });
    const res = await shell;
    return {
      stdout: res.stdout.toString(),
      stderr: res.stderr.toString(),
      exitCode: res.exitCode,
    };
  }
}
