import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { WorkspaceDiff } from "fleet-protocol";
import { cn } from "@/lib/utils";
import { useFleet } from "@/data/FleetContext";
import type { LineType, LogLine } from "@/data/types";

interface TerminalProps {
  repo: string;
  name: string;
  ship: string;
  branch: string;
  active: boolean;
  onActivate: () => void;
}

/** Log-line color against the fixed terminal palette (see globals.css). */
const LINE_CLASS: Record<LineType, string> = {
  sys: "text-term-sys",
  agent: "text-term-agent",
  cmd: "text-term-cmd",
  out: "text-term-out",
  ok: "text-term-cmd",
  warn: "text-term-warn",
  add: "text-term-cmd",
  del: "text-term-err",
  err: "text-term-err",
  blank: "text-term-sys",
};

export function Terminal({ repo, name, ship, branch, active, onActivate }: TerminalProps) {
  const { openSession, sendCommand, getWorkspace } = useFleet();
  const [log, setLog] = useState<LogLine[]>([]);
  const [cmd, setCmd] = useState("");
  const [diff, setDiff] = useState<WorkspaceDiff | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) {
      setLog([]);
      setDiff(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const [session, detail] = await Promise.all([openSession(repo, name), getWorkspace(repo, name)]);
      if (cancelled) return;
      setLog(session);
      setDiff(detail.state === "active" ? detail.diff : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [active, repo, name, openSession, getWorkspace]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  const onKey = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const v = cmd.trim();
    if (!v) return;
    setCmd("");
    const added = await sendCommand(repo, name, v);
    setLog((prev) => [...prev, ...added]);
  };

  const footer = active
    ? `⎇ ${branch}   ·   ↑${diff?.commits ?? 0} ↓0   ·   +${diff?.added ?? 0} −${diff?.removed ?? 0}   ·   last exit 0   ·   uptime 00:12:47`
    : `⎇ ${branch}   ·   session stopped   ·   last active 14m ago`;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-line bg-term-bg">
      <div className="flex flex-none items-center justify-between gap-3 border-b border-term-line bg-term-chrome px-[14px] py-[9px]">
        <div className="flex items-center gap-[10px]">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-term-err" />
            <span className="h-2.5 w-2.5 rounded-full bg-term-warn" />
            <span className="h-2.5 w-2.5 rounded-full bg-term-cmd" />
          </span>
          <span className="font-mono text-[10.5px] font-medium text-[#8b949e]">
            {name} — agent@{ship}
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#4d5560]">tty/0 · utf-8</span>
      </div>

      {active ? (
        <div
          ref={bodyRef}
          className="min-h-0 flex-1 overflow-auto px-4 py-[14px] font-mono text-[12px] leading-[1.7]"
        >
          {log.map((l, i) => (
            <div key={i} className={cn("whitespace-pre-wrap break-words", LINE_CLASS[l.type])}>
              {l.text}
            </div>
          ))}
          <div className="mt-2 flex items-center gap-[9px]">
            <span className="text-term-cmd">$</span>
            <input
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              onKeyDown={onKey}
              placeholder="send to agent session…"
              className="min-w-0 flex-1 border-none bg-transparent font-mono text-[12px] text-term-out outline-none"
            />
            <span className="term-caret h-[15px] w-2 flex-none bg-term-cmd" />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[15px] bg-term-bg p-10 text-center">
          <div className="font-mono text-[30px] leading-none text-[#3a424c]">◼</div>
          <div className="font-mono text-[15px] font-bold tracking-[.05em] text-[#9aa4af]">Workspace Inactive</div>
          <div className="max-w-[360px] font-mono text-[11.5px] leading-[1.6] text-[#4d5560]">
            No agent session is attached. Activate to spin one up on ▦ {ship} against ⎇ {branch}.
          </div>
          <button
            type="button"
            onClick={onActivate}
            className="mt-1 rounded-[4px] bg-accent px-5 py-[9px] font-mono text-[12px] font-bold text-[#06140b] transition-[filter] hover:brightness-110"
          >
            ▸ Activate session
          </button>
        </div>
      )}

      <div className="flex-none border-t border-term-line bg-term-chrome px-[14px] py-[7px] font-mono text-[10px] text-term-footer">
        {footer}
      </div>
    </div>
  );
}
