

export interface WorkspaceInfo {
  workspaceName: string;
  branch: string;
  repo: string;
}


// TODO - get the workspace based on the filepath and git. Use the git library we have
export function getWorkspace(): WorkspaceInfo | null {
  return null;
}
