import { client } from "../client";
import InstructionsEditor from "../components/InstructionsEditor";

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
