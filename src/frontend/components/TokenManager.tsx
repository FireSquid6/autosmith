import { useState } from "react";
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

interface TokenManagerProps {
  tokens: Record<string, string> | null | undefined;
  loading?: boolean;
  onSet: (name: string, value: string) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
}

function RevealCell({ value }: { value: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm text-base-content/60 break-all">
        {revealed ? value : "•".repeat(Math.min(value.length, 24))}
      </span>
      <button
        className="shrink-0 text-base-content/30 hover:text-base-content/70 transition-colors"
        onClick={() => setRevealed((v) => !v)}
        title={revealed ? "Hide" : "Reveal"}
      >
        {revealed ? <EyeSlashIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

interface TokenModalProps {
  initialName?: string;
  initialValue?: string;
  isEdit: boolean;
  onConfirm: (name: string, value: string) => Promise<void>;
  onClose: () => void;
}

function TokenModal({ initialName = "", initialValue = "", isEdit, onConfirm, onClose }: TokenModalProps) {
  const [name, setName] = useState(initialName);
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !value.trim()) {
      setError("Both name and value are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onConfirm(name.trim(), value.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save token.");
      setSaving(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">{isEdit ? "Edit Token" : "New Token"}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="form-control">
            <div className="label"><span className="label-text">Name</span></div>
            <input
              className="input input-bordered font-mono"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="TOKEN_NAME"
              disabled={isEdit || saving}
              autoFocus={!isEdit}
            />
          </label>
          <label className="form-control">
            <div className="label"><span className="label-text">Value</span></div>
            <input
              className="input input-bordered font-mono"
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="••••••••"
              disabled={saving}
              autoFocus={isEdit}
            />
          </label>
          {error && <p className="text-error text-sm">{error}</p>}
          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-sm" /> : isEdit ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}

interface DeleteModalProps {
  name: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

function DeleteModal({ name, onConfirm, onClose }: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Delete Token</h3>
        <p className="text-base-content/70 mb-4">
          Delete <span className="font-mono font-semibold text-base-content">{name}</span>? This cannot be undone.
        </p>
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose} disabled={deleting}>Cancel</button>
          <button className="btn btn-error" onClick={handleDelete} disabled={deleting}>
            {deleting ? <span className="loading loading-spinner loading-sm" /> : "Delete"}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}

type ModalState =
  | { type: "create" }
  | { type: "edit"; name: string; value: string }
  | { type: "delete"; name: string };

export default function TokenManager({ tokens, loading, onSet, onDelete }: TokenManagerProps) {
  const [modal, setModal] = useState<ModalState | null>(null);
  const entries = Object.entries(tokens ?? {});

  if (loading) {
    return <div className="flex justify-center py-8"><span className="loading loading-spinner" /></div>;
  }

  return (
    <>
      <div className="border border-base-300 rounded-xl overflow-hidden">
        {entries.length > 0 ? (
          <table className="w-full">
            <tbody className="divide-y divide-base-300">
              {entries.map(([name, value]) => (
                <tr key={name} className="group bg-base-200 hover:bg-base-300/50 transition-colors">
                  <td className="font-mono text-sm py-3 pl-4 pr-2 text-base-content/80 w-1/3">{name}</td>
                  <td className="py-3 pr-2 w-1/2">
                    <RevealCell value={value} />
                  </td>
                  <td className="py-3 pr-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="btn btn-ghost btn-xs btn-square"
                        title="Edit"
                        onClick={() => setModal({ type: "edit", name, value })}
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="btn btn-ghost btn-xs btn-square text-error"
                        title="Delete"
                        onClick={() => setModal({ type: "delete", name })}
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="bg-base-200 px-4 py-6 text-center text-sm text-base-content/40 italic">
            No tokens
          </div>
        )}
        <div className="bg-base-100 border-t border-base-300 px-3 py-2">
          <button
            className="btn btn-ghost btn-sm gap-1.5 text-base-content/60"
            onClick={() => setModal({ type: "create" })}
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Add token
          </button>
        </div>
      </div>

      {modal?.type === "create" && (
        <TokenModal
          isEdit={false}
          onConfirm={onSet}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "edit" && (
        <TokenModal
          isEdit
          initialName={modal.name}
          initialValue={modal.value}
          onConfirm={(_, value) => onSet(modal.name, value)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteModal
          name={modal.name}
          onConfirm={() => onDelete(modal.name)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
