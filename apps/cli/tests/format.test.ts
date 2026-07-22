import { describe, expect, test } from "bun:test";
import {
  formatFleetWorkspaceTable,
  formatRepoTable,
  formatShipTable,
  formatWorkspaceTable,
} from "../src/format";

describe("formatWorkspaceTable", () => {
  test("renders headers only for an empty list", () => {
    const out = formatWorkspaceTable([]);
    expect(out).toBe("REPO  NAME  BRANCH  ACTIVE");
  });

  test("aligns columns to the widest cell", () => {
    const out = formatWorkspaceTable([
      { repoName: "Hello-World", name: "ws1", branch: "master", active: true, agent: null },
      { repoName: "x", name: "y", branch: "main", active: false, agent: null },
    ]);

    const lines = out.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("REPO         NAME  BRANCH  ACTIVE");
    expect(lines[1]).toBe("Hello-World  ws1   master  yes");
    expect(lines[2]).toBe("x            y     main    no");
  });
});

describe("formatFleetWorkspaceTable", () => {
  test("renders headers only for an empty list", () => {
    expect(formatFleetWorkspaceTable([])).toBe("SHIP  REPO  NAME  BRANCH  ACTIVE");
  });

  test("includes the owning ship and aligns columns", () => {
    const out = formatFleetWorkspaceTable([
      { ship: "orca", repoName: "Hello-World", name: "ws1", branch: "master", active: true, agent: null },
      { ship: "a", repoName: "x", name: "y", branch: "main", active: false, agent: null },
    ]);

    const lines = out.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("SHIP  REPO         NAME  BRANCH  ACTIVE");
    expect(lines[1]).toBe("orca  Hello-World  ws1   master  yes");
    expect(lines[2]).toBe("a     x            y     main    no");
  });
});

describe("formatShipTable", () => {
  test("renders headers only for an empty list", () => {
    expect(formatShipTable([])).toBe("NAME  URL  STATUS");
  });

  test("aligns columns to the widest cell", () => {
    const out = formatShipTable([
      { name: "orca", url: "http://localhost:4700", status: "online" },
      { name: "a", url: "http://x:1", status: "offline" },
    ]);

    const lines = out.split("\n");
    expect(lines[0]).toBe("NAME  URL                    STATUS");
    expect(lines[1]).toBe("orca  http://localhost:4700  online");
    expect(lines[2]).toBe("a     http://x:1             offline");
  });
});

describe("formatRepoTable", () => {
  test("renders headers only for an empty list", () => {
    expect(formatRepoTable([])).toBe("NAME  URL  PROVIDER");
  });

  test("aligns columns to the widest cell", () => {
    const out = formatRepoTable([
      { name: "Hello-World", url: "git@github.com:x/y.git", provider: "github" },
      { name: "x", url: "u", provider: "custom" },
    ]);

    const lines = out.split("\n");
    expect(lines[0]).toBe("NAME         URL                     PROVIDER");
    expect(lines[1]).toBe("Hello-World  git@github.com:x/y.git  github");
    expect(lines[2]).toBe("x            u                       custom");
  });
});
