import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFleet } from "@/data/FleetContext";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteModal, Field, ModalActions } from "./ReposRoute";

const COLS = "1fr 1.6fr 110px 34px";

export function ShipsRoute() {
  const { ships, createShip, deleteShip } = useFleet();
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  return (
    <div className="px-[30px] pb-[60px] pt-[28px]">
      <Link to="/" className="font-mono text-[11px] font-medium text-dim transition-colors hover:text-text">
        ← bridge
      </Link>

      <div className="mb-[22px] mt-[14px] flex flex-wrap items-start justify-between gap-[18px]">
        <div>
          <h1 className="font-mono text-[22px] font-bold text-text">▦ Ships</h1>
          <p className="mt-2 font-prose text-[12.5px] text-dim">
            Hosts the bridge connects to for running workspaces.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-md border border-line bg-panel px-[14px] py-[8px] font-mono text-[11px] font-semibold text-text transition-colors hover:bg-panel2"
        >
          + New Ship
        </button>
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-panel">
        <div
          className="grid gap-3 bg-bg px-4 py-[10px] font-mono text-[9px] font-semibold tracking-[.14em] text-dim2"
          style={{ gridTemplateColumns: COLS }}
        >
          <span>NAME</span>
          <span>SPEC</span>
          <span className="text-right">STATUS</span>
          <span />
        </div>

        {ships.length === 0 && (
          <div className="border-t border-line px-4 py-[18px] font-mono text-[11px] text-dim2">
            No ships registered yet.
          </div>
        )}

        {ships.map((s) => (
          <div
            key={s.name}
            className="grid items-center gap-3 border-t border-line px-4 py-[13px] font-mono"
            style={{ gridTemplateColumns: COLS }}
          >
            <span className="text-[12px] font-semibold text-text">▦ {s.name}</span>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-dim">{s.spec}</span>
            <span className="flex items-center justify-end gap-[7px] text-[10.5px] font-medium text-dim">
              <span
                className={cn("h-1.5 w-1.5 flex-none rounded-full", s.status === "online" ? "bg-accent" : "bg-dim2")}
              />
              {s.status}
            </span>
            <button
              type="button"
              onClick={() => setPendingDelete(s.name)}
              aria-label={`Delete ${s.name}`}
              className="flex items-center justify-center rounded p-[5px] text-dim2 transition-colors hover:bg-panel2 hover:text-red-400"
            >
              <Trash2 className="size-[15px]" />
            </button>
          </div>
        ))}
      </div>

      {creating && <CreateShipModal onClose={() => setCreating(false)} onCreate={createShip} />}
      {pendingDelete && (
        <ConfirmDeleteModal
          name={pendingDelete}
          kind="ship"
          onClose={() => setPendingDelete(null)}
          onConfirm={() => deleteShip(pendingDelete)}
        />
      )}
    </div>
  );
}

function CreateShipModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (url: string) => Promise<void>;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await onCreate(url.trim());
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open title="New Ship" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="URL">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://ship-host:4800" autoFocus />
        </Field>
        <p className="font-prose text-[11px] text-dim2">
          The bridge connects to this URL and learns the ship's name on first sync.
        </p>
        {error && <p className="font-mono text-[11px] text-red-400">{error}</p>}
        <ModalActions onCancel={onClose} confirmLabel="Create" pending={pending} disabled={!url.trim()} />
      </form>
    </Modal>
  );
}
