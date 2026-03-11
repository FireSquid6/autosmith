import { useState } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface InstructionsEditorProps {
  content: string | null | undefined;
  loading?: boolean;
  onSave: (content: string) => Promise<void>;
}

function EditModal({ initial, onSave, onClose }: {
  initial: string;
  onSave: (content: string) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await onSave(value);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
      setSaving(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-3xl flex flex-col" style={{ maxHeight: "80vh" }}>
        <h3 className="font-bold text-lg mb-4">Edit AGENT.md</h3>
        <textarea
          className="textarea textarea-bordered flex-1 font-mono text-sm resize-none"
          style={{ minHeight: "400px" }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={saving}
          autoFocus
        />
        {error && <p className="text-error text-sm mt-2">{error}</p>}
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="loading loading-spinner loading-sm" /> : "Save"}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}

export default function InstructionsEditor({ content, loading, onSave }: InstructionsEditorProps) {
  const [editing, setEditing] = useState(false);

  if (loading) {
    return <div className="flex justify-center py-8"><span className="loading loading-spinner" /></div>;
  }

  return (
    <>
      <div className="bg-base-200 border border-base-300 rounded-xl">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-base-300">
          <span className="text-xs font-mono text-base-content/40">AGENT.md</span>
          <button
            className="btn btn-ghost btn-xs gap-1.5"
            onClick={() => setEditing(true)}
          >
            <PencilIcon className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
        <div className="p-5">
          {content?.trim() ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-base-content/40 italic text-sm">No instructions set.</p>
          )}
        </div>
      </div>

      {editing && (
        <EditModal
          initial={content ?? ""}
          onSave={onSave}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
