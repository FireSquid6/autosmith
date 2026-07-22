import { useState, type FormEvent } from "react";
import { useFleet } from "@/data/FleetContext";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Field, ModalActions } from "@/routes/ReposRoute";

interface Props {
  repo: string;
  name: string;
  currentBranch: string;
  onClose: () => void;
}

export function SwitchBranchModal({ repo, name, currentBranch, onClose }: Props) {
  const { switchBranch } = useFleet();
  const [branch, setBranch] = useState(currentBranch);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await switchBranch(repo, name, branch.trim());
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  };

  const target = branch.trim();

  return (
    <Modal open title="Switch Branch" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="Branch">
          <Input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" autoFocus />
        </Field>
        {error && <p className="font-mono text-[11px] text-red-400">{error}</p>}
        <ModalActions
          onCancel={onClose}
          confirmLabel="Switch"
          pending={pending}
          disabled={!target || target === currentBranch}
        />
      </form>
    </Modal>
  );
}
