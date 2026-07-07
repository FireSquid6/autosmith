import type { BranchInfo, CommitInfo, FileStatus, StatusInfo, WorktreeInfo } from "./types";

// Field separator woven into every machine-readable `--format`/`--pretty` string.
// ASCII Unit Separator (0x1F) is a control character that never appears in commit
// subjects, author names, branch names, or paths, so splitting on it can't be
// fooled by content the way a space or tab could.
export const FIELD_SEP = "\u001f";

function toInt(value: string | undefined): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isNaN(n) ? 0 : n;
}

// --- log -------------------------------------------------------------------

// %H sha, %h short sha, %an author name, %ae author email, %at author date
// (unix seconds), %s subject. Every field is single-line, so one commit is one
// output line and records split cleanly on "\n".
const LOG_FIELDS = ["%H", "%h", "%an", "%ae", "%at", "%s"] as const;

/** `--pretty` format string that {@link parseLog} knows how to read. */
export const LOG_FORMAT = LOG_FIELDS.join(FIELD_SEP);

export function parseLog(stdout: string): CommitInfo[] {
  return stdout
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => {
      const cols = line.split(FIELD_SEP);
      return {
        sha: cols[0] ?? "",
        shortSha: cols[1] ?? "",
        authorName: cols[2] ?? "",
        authorEmail: cols[3] ?? "",
        authorDate: toInt(cols[4]),
        subject: cols[5] ?? "",
      };
    });
}

// --- status (porcelain v2) -------------------------------------------------

/**
 * Parse `git status --porcelain=v2 --branch` output. v2 is used over v1 because
 * its fields are unambiguous and stable (proper rename detection and
 * ahead/behind counts) rather than the fragile fixed-width XY columns of v1.
 */
export function parseStatus(stdout: string): StatusInfo {
  const info: StatusInfo = { ahead: 0, behind: 0, clean: true, files: [] };
  for (const line of stdout.split("\n")) {
    if (line.length === 0) continue;
    if (line.startsWith("# branch.head ")) {
      const head = line.slice("# branch.head ".length);
      // git prints "(detached)" when there is no branch.
      if (head !== "(detached)") info.branch = head;
    } else if (line.startsWith("# branch.upstream ")) {
      info.upstream = line.slice("# branch.upstream ".length);
    } else if (line.startsWith("# branch.ab ")) {
      const m = /\+(\d+) -(\d+)/.exec(line);
      if (m) {
        info.ahead = toInt(m[1]);
        info.behind = toInt(m[2]);
      }
    } else if (line.startsWith("1 ") || line.startsWith("2 ")) {
      info.files.push(parseChangedEntry(line));
    } else if (line.startsWith("? ")) {
      info.files.push({ path: line.slice(2), code: "??", staged: false });
    }
    // "! " (ignored) and "u " (unmerged) lines are not surfaced by default.
  }
  info.clean = info.files.length === 0;
  return info;
}

// Ordinary "1 XY ..." and rename/copy "2 XY ..." entries share the same leading
// layout; the path is the final space-delimited field, and a rename entry
// carries the original path after a tab.
function parseChangedEntry(line: string): FileStatus {
  const isRename = line.startsWith("2 ");
  const parts = line.split(" ");
  const code = parts[1] ?? "";
  // Ordinary entries have 8 leading fields before the path; rename/copy entries
  // add an "<X><score>" field, so their path starts at index 9.
  const rest = parts.slice(isRename ? 9 : 8).join(" ");
  if (isRename) {
    const [path = "", origPath] = rest.split("\t");
    return { path, code, staged: code[0] !== ".", origPath };
  }
  return { path: rest, code, staged: code[0] !== "." };
}

// --- worktree list (porcelain) ---------------------------------------------

export function parseWorktrees(stdout: string): WorktreeInfo[] {
  return stdout
    .split("\n\n")
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block) => {
      const wt: WorktreeInfo = {
        path: "",
        sha: "",
        detached: false,
        bare: false,
        locked: false,
      };
      for (const line of block.split("\n")) {
        if (line.startsWith("worktree ")) wt.path = line.slice("worktree ".length);
        else if (line.startsWith("HEAD ")) wt.sha = line.slice("HEAD ".length);
        else if (line.startsWith("branch ")) wt.branch = line.slice("branch refs/heads/".length);
        else if (line === "detached") wt.detached = true;
        else if (line === "bare") wt.bare = true;
        else if (line === "locked" || line.startsWith("locked ")) wt.locked = true;
      }
      return wt;
    });
}

// --- branch (--format) -----------------------------------------------------

// %(refname:short) name, %(objectname) sha, %(HEAD) "*" for the current branch,
// %(upstream:short) tracking branch (empty when unset).
const BRANCH_FIELDS = ["%(refname:short)", "%(objectname)", "%(HEAD)", "%(upstream:short)"] as const;

/** `--format` string that {@link parseBranches} knows how to read. */
export const BRANCH_FORMAT = BRANCH_FIELDS.join(FIELD_SEP);

export function parseBranches(stdout: string): BranchInfo[] {
  return stdout
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => {
      const cols = line.split(FIELD_SEP);
      return {
        name: cols[0] ?? "",
        sha: cols[1] ?? "",
        current: cols[2]?.trim() === "*",
        upstream: cols[3] ? cols[3] : undefined,
      };
    });
}
