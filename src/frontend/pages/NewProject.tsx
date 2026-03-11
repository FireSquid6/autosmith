import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { client } from "../client";

export default function NewProject() {
  const navigate = useNavigate();
  const [createProject, { loading, error }] = client.useMutation("createProject");

  const [form, setForm] = useState({
    name: "",
    provider: "github",
    owner: "",
    repository: "",
    tokenName: "",
    filesystemType: "local-docker",
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createProject(form);
    if (result.success) {
      navigate(`/projects/${form.name}`);
    }
  };

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">New Project</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Project Name</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            placeholder="my-project"
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
            <option value="github">GitHub</option>
            <option value="gitlab">GitLab</option>
            <option value="bitbucket">Bitbucket</option>
          </select>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Owner</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            placeholder="acme-corp"
            value={form.owner}
            onChange={set("owner")}
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Repository</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            placeholder="my-repo"
            value={form.repository}
            onChange={set("repository")}
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Token Name</span>
            <span className="label-text-alt text-base-content/40">Key in tokens.yaml</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            placeholder="github-token"
            value={form.tokenName}
            onChange={set("tokenName")}
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
            Create Project
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
