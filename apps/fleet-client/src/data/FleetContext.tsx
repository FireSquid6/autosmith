import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { bridge } from "./mock";
import type { FleetRepo, LogLine, Ship, Workspace, WorkspaceDetail } from "./types";

interface FleetValue {
  ships: Ship[];
  repos: FleetRepo[];
  workspaces: Workspace[];
  loading: boolean;
  /** Number of active workspaces across the fleet (drives "N sessions live"). */
  liveCount: number;
  activate: (repo: string, name: string) => Promise<void>;
  deactivate: (repo: string, name: string) => Promise<void>;
  getWorkspace: (repo: string, name: string) => Promise<WorkspaceDetail>;
  openSession: (repo: string, name: string) => Promise<LogLine[]>;
  sendCommand: (repo: string, name: string, cmd: string) => Promise<LogLine[]>;
}

const FleetContext = createContext<FleetValue | null>(null);

/**
 * Loads the fleet snapshot once and shares it with every view. Mutations refresh
 * the workspace list from the bridge, so all derived indicators — grid dots,
 * repo ACTIVE counts, sibling dots, the sidebar live counter — update together.
 */
export function FleetProvider({ children }: { children: ReactNode }) {
  const [ships, setShips] = useState<Ship[]>([]);
  const [repos, setRepos] = useState<FleetRepo[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [s, r, w] = await Promise.all([bridge.listShips(), bridge.listRepos(), bridge.listWorkspaces()]);
      if (cancelled) return;
      setShips(s);
      setRepos(r);
      setWorkspaces(w);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    setWorkspaces(await bridge.listWorkspaces());
  }, []);

  const activate = useCallback(
    async (repo: string, name: string) => {
      await bridge.activateWorkspace(repo, name);
      await refresh();
    },
    [refresh],
  );

  const deactivate = useCallback(
    async (repo: string, name: string) => {
      await bridge.deactivateWorkspace(repo, name);
      await refresh();
    },
    [refresh],
  );

  const getWorkspace = useCallback((repo: string, name: string) => bridge.getWorkspace(repo, name), []);
  const openSession = useCallback((repo: string, name: string) => bridge.openSession(repo, name), []);
  const sendCommand = useCallback(
    (repo: string, name: string, cmd: string) => bridge.sendCommand(repo, name, cmd),
    [],
  );

  const value: FleetValue = {
    ships,
    repos,
    workspaces,
    loading,
    liveCount: workspaces.filter((w) => w.active).length,
    activate,
    deactivate,
    getWorkspace,
    openSession,
    sendCommand,
  };

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
}

export function useFleet(): FleetValue {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error("useFleet must be used within a FleetProvider");
  return ctx;
}
