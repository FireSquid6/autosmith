import { useState } from "react";
import { client } from "../client";
import InstructionsEditor from "../components/InstructionsEditor";

function EnvironmentsEditor() {
  const { data: environments, loading } = client.useListenedQuery("listEnvironments", null);
  const [addEnvironment] = client.useMutation("addEnvironment");
  const [removeEnvironment] = client.useMutation("removeEnvironment");
  const [newImage, setNewImage] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const image = newImage.trim();
    if (!image) return;
    await addEnvironment({ image });
    setNewImage("");
  };

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="loading loading-spinner loading-sm" />
      ) : (
        <ul className="space-y-2">
          {(environments ?? []).map((image) => (
            <li key={image} className="flex items-center justify-between bg-base-200 rounded-lg px-4 py-2">
              <span className="font-mono text-sm">{image}</span>
              <button
                className="btn btn-ghost btn-xs text-error"
                onClick={() => removeEnvironment({ image })}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          className="input input-bordered input-sm font-mono flex-1"
          placeholder="myorg/image:tag"
          value={newImage}
          onChange={(e) => setNewImage(e.target.value)}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={!newImage.trim()}>
          Add
        </button>
      </form>
    </div>
  );
}

export default function Settings() {
  const { data: instructions, loading } = client.useListenedQuery("getRootInstructions", null);
  const [setRootInstructions] = client.useMutation("setRootInstructions");

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-base-content/50 text-sm mt-1">Global configuration applied to all agents.</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-base-content/50 uppercase tracking-wider mb-4">
          Environments
        </h2>
        <p className="text-base-content/50 text-sm mb-4">
          Docker images available when creating agents.
        </p>
        <EnvironmentsEditor />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-base-content/50 uppercase tracking-wider mb-4">
          Root Instructions
        </h2>
        <InstructionsEditor
          content={instructions}
          loading={loading}
          onSave={(content) => setRootInstructions({ content })}
        />
      </section>
    </div>
  );
}
