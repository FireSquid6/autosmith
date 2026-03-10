import { Agent } from "../agent";
import { LocalDockerFilesystem } from "../filesystem/local-docker";
import { GitHubRepository } from "../code-repository/github";
import type { FleetStore } from "../store";

export class AgentManager {
  private running = new Map<string, Agent>();
  private store: FleetStore;

  constructor(store: FleetStore) {
    this.store = store;
  }

  private async imageExists(image: string): Promise<boolean> {
    const result = await Bun.$`docker image inspect ${image}`.quiet().catch(() => null);
    return result !== null && result.exitCode === 0;
  }

  private async containerExists(id: string): Promise<boolean> {
    const result = await Bun.$`docker container inspect ${id}`.quiet().catch(() => null);
    return result !== null && result.exitCode === 0;
  }

  private key(projectName: string, agentName: string): string {
    return `${projectName}/${agentName}`;
  }

  private containerId(projectName: string, agentName: string): string {
    return `fleet-${projectName}-${agentName}`;
  }

  async start(projectName: string, agentName: string): Promise<void> {
    const key = this.key(projectName, agentName);
    if (this.running.has(key)) return;

    const [project, agentConfig, instructions] = await Promise.all([
      this.store.getProject(projectName),
      this.store.getAgent(projectName, agentName),
      this.store.getAgentInstructions(projectName, agentName),
    ]);

    const token = await this.store.tokens.get(project.tokenName);
    const containerId = this.containerId(projectName, agentName);
    const hostWorkspacePath = this.store.agentWorkspacePath(projectName, agentName);

    if (!await this.imageExists(agentConfig.dockerImage)) {
      throw new Error(`Docker image "${agentConfig.dockerImage}" not found locally. Build it first.`);
    }

    const gitUrl = `https://${token}@github.com/${project.owner}/${project.repository}.git`;

    const workspaceExists = await Bun.file(`${hostWorkspacePath}/.git/HEAD`).exists();
    if (workspaceExists) {
      await Bun.$`git -C ${hostWorkspacePath} pull`.quiet();
    } else {
      await Bun.$`git clone ${gitUrl} ${hostWorkspacePath}`.quiet();
    }

    if (!await this.containerExists(containerId)) {
      await Bun.$`docker create --name ${containerId} -v ${hostWorkspacePath}:${agentConfig.filesystemMountPoint} ${agentConfig.dockerImage}`.quiet();
    }

    await Bun.$`docker start ${containerId}`.quiet();

    const fs = new LocalDockerFilesystem({
      containerId,
      hostWorkspacePath,
      containerWorkspacePath: agentConfig.filesystemMountPoint,
    });

    const repo = new GitHubRepository({
      token: token ?? "",
      owner: project.owner,
      repo: project.repository,
    });

    const agent = new Agent({ id: key, fs, repo, instructions });
    this.running.set(key, agent);
  }

  async stop(projectName: string, agentName: string): Promise<void> {
    const key = this.key(projectName, agentName);
    this.running.delete(key);
    await Bun.$`docker stop ${this.containerId(projectName, agentName)}`.quiet();
  }

  get(projectName: string, agentName: string): Agent | undefined {
    return this.running.get(this.key(projectName, agentName));
  }

  isRunning(projectName: string, agentName: string): boolean {
    return this.running.has(this.key(projectName, agentName));
  }

  async stopAll(): Promise<void> {
    await Promise.all(
      [...this.running.keys()].map(key => {
        const slash = key.indexOf("/");
        return this.stop(key.slice(0, slash), key.slice(slash + 1));
      }),
    );
  }
}
