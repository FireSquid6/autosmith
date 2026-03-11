import { Link, useParams } from "react-router-dom";
import { ArrowTopRightOnSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import { client } from "../client";
import AgentCard from "../components/AgentCard";
import TokenManager from "../components/TokenManager";
import InstructionsEditor from "../components/InstructionsEditor";

function getRepoUrl(provider: string, owner: string, repository: string): string {
  if (provider === "github") return `https://github.com/${owner}/${repository}`;
  if (provider === "gitlab") return `https://gitlab.com/${owner}/${repository}`;
  if (provider === "bitbucket") return `https://bitbucket.org/${owner}/${repository}`;
  return `https://${provider}/${owner}/${repository}`;
}

export default function Project() {
  const { projectName } = useParams<{ projectName: string }>();
  const { data: project } = client.useQuery("getProject", { name: projectName! });
  const { data: agents, loading, error } = client.useListenedQuery("listAgents", {
    projectName: projectName!,
  });
  const { data: instructions, loading: instructionsLoading } = client.useListenedQuery("getProjectInstructions", {
    projectName: projectName!,
  });
  const [setProjectInstructions] = client.useMutation("setProjectInstructions");
  const { data: rootTokens, loading: rootTokensLoading } = client.useListenedQuery("getRootTokens", null);
  const { data: projectTokens, loading: projectTokensLoading } = client.useListenedQuery("getProjectTokens", {
    projectName: projectName!,
  });

  const [setRootToken] = client.useMutation("setRootToken");
  const [deleteRootToken] = client.useMutation("deleteRootToken");
  const [setProjectToken] = client.useMutation("setProjectToken");
  const [deleteProjectToken] = client.useMutation("deleteProjectToken");

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="alert alert-error">
          <span>{error.message}</span>
        </div>
      </div>
    );
  }

  const repoUrl = project
    ? getRepoUrl(project.provider, project.owner, project.repository)
    : null;

  return (
    <div className="p-8 space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{projectName}</h1>
            {repoUrl && (
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base-content/40 hover:text-primary transition-colors"
                title="Open repository"
              >
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </a>
            )}
          </div>
          <p className="text-base-content/50 text-sm mt-1">
            {agents?.length ?? 0} agent{agents?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          to={`/projects/${projectName}/agents/new`}
          className="btn btn-primary btn-sm gap-1.5"
        >
          <PlusIcon className="w-4 h-4" />
          New Agent
        </Link>
      </div>

      {/* Agents */}
      <section>
        <h2 className="text-sm font-semibold text-base-content/50 uppercase tracking-wider mb-4">
          Agents
        </h2>
        {agents?.length === 0 ? (
          <div className="text-center py-16 text-base-content/40">
            <p className="text-lg mb-1">No agents yet</p>
            <p className="text-sm">Click "New Agent" to create your first agent.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents?.map((agent) => (
              <AgentCard
                key={agent.name}
                projectName={projectName!}
                agentName={agent.name}
                provider={agent.provider}
                dockerImage={agent.dockerImage}
              />
            ))}
          </div>
        )}
      </section>

      {/* Project AGENT.md */}
      <section>
        <h2 className="text-sm font-semibold text-base-content/50 uppercase tracking-wider mb-4">
          Project Instructions
        </h2>
        <InstructionsEditor
          content={instructions}
          loading={instructionsLoading}
          onSave={(content) => setProjectInstructions({ projectName: projectName!, content })}
        />
      </section>


      {/* Tokens */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-base-content/50 uppercase tracking-wider mb-4">
            Project Tokens
          </h2>
          <TokenManager
            tokens={projectTokens}
            loading={projectTokensLoading}
            onSet={(name, value) => setProjectToken({ projectName: projectName!, name, value })}
            onDelete={(name) => deleteProjectToken({ projectName: projectName!, name })}
          />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-base-content/50 uppercase tracking-wider mb-4">
            Root Tokens
          </h2>
          <TokenManager
            tokens={rootTokens}
            loading={rootTokensLoading}
            onSet={(name, value) => setRootToken({ name, value })}
            onDelete={(name) => deleteRootToken({ name })}
          />
        </div>
      </section>
    </div>
  );
}
