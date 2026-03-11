import { Link, useParams } from "react-router-dom";
import { ArrowTopRightOnSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import { client } from "../client";
import AgentCard from "../components/AgentCard";

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
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
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

      {agents?.length === 0 ? (
        <div className="text-center py-20 text-base-content/40">
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
    </div>
  );
}
