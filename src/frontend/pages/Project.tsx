import { useParams } from "react-router-dom";
import { client } from "../client";
import AgentCard from "../components/AgentCard";

export default function Project() {
  const { projectName } = useParams<{ projectName: string }>();
  const { data: agents, loading, error } = client.useQuery("listAgents", {
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

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{projectName}</h1>
        <p className="text-base-content/50 text-sm mt-1">
          {agents?.length ?? 0} agent{agents?.length !== 1 ? "s" : ""}
        </p>
      </div>

      {agents?.length === 0 ? (
        <div className="text-center py-20 text-base-content/40">
          <p className="text-lg mb-1">No agents yet</p>
          <p className="text-sm">Create an agent using the Autosmith CLI to get started.</p>
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
