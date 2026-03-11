import { useEffect } from "react";
import { Link } from "react-router-dom";
import { client } from "../client";

interface AgentCardProps {
  projectName: string;
  agentName: string;
  provider: string;
  dockerImage: string;
}

const statusConfig = {
  stopped: {
    label: "stopped",
    className: "bg-base-300 text-base-content/50",
    dot: "bg-base-content/30",
  },
  idle: {
    label: "idle",
    className: "bg-warning/15 text-warning",
    dot: "bg-warning",
  },
  running: {
    label: "running",
    className: "bg-success/20 text-success",
    dot: "bg-success",
  },
} as const;

export default function AgentCard({ projectName, agentName, provider, dockerImage }: AgentCardProps) {
  const params = { projectName, agentName };
  const { data: status } = client.useListenedQuery("getAgentStatus", params);

  // Poll while the container is active so running↔idle transitions stay fresh.
  useEffect(() => {
    if (status === "stopped" || status === undefined) return;
    const id = setInterval(() => client.invalidateCache("getAgentStatus", params), 2000);
    return () => clearInterval(id);
  }, [status, projectName, agentName]);

  const cfg = status ? statusConfig[status] : null;

  return (
    <Link
      to={`/projects/${projectName}/agents/${agentName}`}
      className="card bg-base-200 border border-base-300 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="card-body p-4 gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="card-title text-base leading-tight">{agentName}</h3>
          {cfg ? (
            <span className={`shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot} ${status === "running" ? "animate-pulse" : ""}`} />
              {cfg.label}
            </span>
          ) : (
            <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium bg-base-300 text-base-content/30">…</span>
          )}
        </div>
        <p className="text-sm text-base-content/60">{provider}</p>
        <p className="text-xs text-base-content/40 font-mono truncate">{dockerImage}</p>
      </div>
    </Link>
  );
}
