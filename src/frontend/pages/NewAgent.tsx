import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { client } from "../client";

export default function NewAgent() {
  const { projectName } = useParams<{ projectName: string }>();
  const navigate = useNavigate();
  const [createAgent, { loading, error }] = client.useMutation("createAgent", {
    onSuccess: () => navigate(`/projects/${projectName}`),
  });

  const [form, setForm] = useState({
    name: "",
    provider: "anthropic",
    dockerImage: "autosmith/agent:latest",
    filesystemMountPoint: "/workspace",
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await createAgent({ projectName: projectName!, ...form, skills: [] });
  };

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">New Agent</h1>
      <p className="text-base-content/50 text-sm mb-6">
        Adding agent to <span className="font-medium text-base-content">{projectName}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Agent Name</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            placeholder="my-agent"
            value={form.name}
            onChange={set("name")}
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Provider</span>
          </label>
          <select
            className="select select-bordered"
            value={form.provider}
            onChange={set("provider")}
          >
            <option value="anthropic">Anthropic</option>
            <option value="openai">OpenAI</option>
          </select>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Docker Image</span>
          </label>
          <input
            type="text"
            className="input input-bordered font-mono"
            placeholder="autosmith/agent:latest"
            value={form.dockerImage}
            onChange={set("dockerImage")}
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Workspace Mount Point</span>
          </label>
          <input
            type="text"
            className="input input-bordered font-mono"
            placeholder="/workspace"
            value={form.filesystemMountPoint}
            onChange={set("filesystemMountPoint")}
            required
          />
        </div>

        {error && (
          <div className="alert alert-error">
            <span>{error.message}</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading && <span className="loading loading-spinner loading-sm" />}
            Create Agent
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
