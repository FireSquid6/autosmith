import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { PaperAirplaneIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { ArrowLeftIcon, PlayIcon } from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { client } from "../client";
import ChatMessage, { type Message, type MessagePart, type ToolPart } from "../components/ChatMessage";

// ── Types ──────────────────────────────────────────────────────────────────────

type Tab = "chat" | "agent-file" | "skills" | "tokens";
type ConnectionState = "connecting" | "connected" | "error";

// ── Helpers ───────────────────────────────────────────────────────────────────

function historyToMessages(history: { role: "user" | "assistant"; parts: { type: string; text?: string; toolName?: string; input?: unknown; result?: unknown; error?: string }[] }[]): Message[] {
  return history.map((entry) => ({
    role: entry.role === "assistant" ? "agent" : "user",
    parts: entry.parts.map((p): MessagePart => {
      if (p.type === "text") return { type: "text", text: p.text! };
      if (p.type === "tool") return { type: "tool", toolName: p.toolName!, input: p.input, result: p.result };
      return { type: "error", error: p.error! };
    }),
  }));
}

// ── Tab content components ────────────────────────────────────────────────────

function AgentFileTab({ projectName, agentName }: { projectName: string; agentName: string }) {
  const { data: instructions, loading } = client.useQuery("getAgentInstructions", { projectName, agentName });

  if (loading) return <div className="flex justify-center py-12"><span className="loading loading-spinner" /></div>;

  return (
    <div className="p-6">
      <div className="bg-base-200 border border-base-300 rounded-xl p-6">
        {instructions?.trim() ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{instructions}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-base-content/40 italic text-sm">No agent-level instructions set.</p>
        )}
      </div>
    </div>
  );
}

function SkillsTab({ projectName, agentName }: { projectName: string; agentName: string }) {
  const { data: skills, loading } = client.useQuery("getAgentSkills", { projectName, agentName });
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) return <div className="flex justify-center py-12"><span className="loading loading-spinner" /></div>;

  if (!skills?.length) {
    return (
      <div className="p-6 text-center text-base-content/40 italic text-sm py-16">
        No skills assigned to this agent.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-3">
      {skills.map((skill) => (
        <div key={skill.name} className="border border-base-300 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-start gap-3 px-4 py-3 bg-base-200 hover:bg-base-300 transition-colors text-left"
            onClick={() => setExpanded(expanded === skill.name ? null : skill.name)}
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{skill.title}</p>
              <p className="text-xs text-base-content/50 font-mono">{skill.name}</p>
              {skill.description && (
                <p className="text-sm text-base-content/60 mt-1">{skill.description}</p>
              )}
            </div>
            <span className="text-xs text-base-content/40 shrink-0 pt-0.5">
              {expanded === skill.name ? "▲" : "▼"}
            </span>
          </button>
          {expanded === skill.name && skill.content && (
            <div className="px-5 py-4 border-t border-base-300 bg-base-100">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{skill.content}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


function TokensTab({ projectName, agentName }: { projectName: string; agentName: string }) {
  const { data: tokens, loading } = client.useQuery("getAgentTokens", { projectName, agentName });

  if (loading) return <div className="flex justify-center py-12"><span className="loading loading-spinner" /></div>;

  const sections: { key: "root" | "project" | "agent"; label: string }[] = [
    { key: "root", label: "Root" },
    { key: "project", label: "Project" },
    { key: "agent", label: "Agent" },
  ];

  // Compute the effective value for each token name across all scopes
  const allKeys = new Set([
    ...Object.keys(tokens?.root ?? {}),
    ...Object.keys(tokens?.project ?? {}),
    ...Object.keys(tokens?.agent ?? {}),
  ]);

  // Effective resolved view: each token name maps to which scope wins
  const resolved: { name: string; value: string; source: string }[] = [];
  for (const name of allKeys) {
    if (tokens?.agent[name] !== undefined) {
      resolved.push({ name, value: tokens.agent[name], source: "agent" });
    } else if (tokens?.project[name] !== undefined) {
      resolved.push({ name, value: tokens.project[name], source: "project" });
    } else if (tokens?.root[name] !== undefined) {
      resolved.push({ name, value: tokens.root[name], source: "root" });
    }
  }

  return (
    <div className="p-6 space-y-8">
      {/* Resolved view */}
      {resolved.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-3">
            Effective Tokens
          </h3>
          <div className="bg-base-200 border border-base-300 rounded-xl overflow-hidden">
            <table className="w-full px-4 py-2">
              <tbody className="divide-y divide-base-300">
                {resolved.map(({ name, value, source }) => (
                  <tr key={name} className="px-4">
                    <td className="font-mono text-sm py-2.5 pl-4 pr-4 text-base-content/80">{name}</td>
                    <td className="py-2.5 pr-4">
                      <RevealCell value={value} />
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        source === "agent" ? "bg-primary/15 text-primary" :
                        source === "project" ? "bg-secondary/15 text-secondary" :
                        "bg-base-300 text-base-content/50"
                      }`}>
                        {source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-scope breakdown */}
      <div>
        <h3 className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-3">
          By Scope
        </h3>
        <div className="space-y-4">
          {sections.map(({ key, label }) => {
            const entries = Object.entries(tokens?.[key] ?? {});
            return (
              <div key={key}>
                <p className="text-sm font-medium text-base-content/70 mb-2">{label}</p>
                {entries.length === 0 ? (
                  <p className="text-sm text-base-content/30 italic pl-1">None</p>
                ) : (
                  <div className="bg-base-200 border border-base-300 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <tbody className="divide-y divide-base-300">
                        {entries.map(([name, value]) => (
                          <tr key={name}>
                            <td className="font-mono text-sm py-2.5 pl-4 pr-4 text-base-content/80">{name}</td>
                            <td className="py-2.5 pr-4">
                              <RevealCell value={value} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {resolved.length === 0 && (
        <p className="text-center text-base-content/40 italic text-sm py-8">No tokens configured.</p>
      )}
    </div>
  );
}

function RevealCell({ value }: { value: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm text-base-content/60">
        {revealed ? value : "•".repeat(Math.min(value.length, 24))}
      </span>
      <button
        className="text-base-content/30 hover:text-base-content/70 transition-colors"
        onClick={() => setRevealed((v) => !v)}
        title={revealed ? "Hide" : "Reveal"}
      >
        {revealed
          ? <EyeSlashIcon className="w-3.5 h-3.5" />
          : <EyeIcon className="w-3.5 h-3.5" />
        }
      </button>
    </div>
  );
}

// ── Chat tab ──────────────────────────────────────────────────────────────────

function ChatTab({
  connectionState,
  connectionError,
  messages,
  streamingMessage,
  input,
  isSending,
  onInput,
  onSend,
  onKeyDown,
  onStart,
  isStarting,
  bottomRef,
}: {
  connectionState: ConnectionState;
  connectionError: string;
  messages: Message[];
  streamingMessage: Message | null;
  input: string;
  isSending: boolean;
  onInput: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onStart: () => void;
  isStarting: boolean;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}) {
  const allMessages = streamingMessage ? [...messages, streamingMessage] : messages;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {connectionState === "error" && (
        <div className="alert alert-error rounded-none border-x-0 border-t-0 flex items-center justify-between shrink-0">
          <span>{connectionError || "Could not connect to agent. Make sure it is running."}</span>
          <button
            className="btn btn-sm btn-neutral gap-1.5 shrink-0"
            onClick={onStart}
            disabled={isStarting}
          >
            {isStarting ? <span className="loading loading-spinner loading-xs" /> : <PlayIcon className="w-4 h-4" />}
            Start Agent
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {allMessages.length === 0 && connectionState === "connected" && (
          <div className="flex items-center justify-center h-full text-base-content/30 text-sm italic">
            Send a message to start the conversation
          </div>
        )}
        {allMessages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-base-300 bg-base-100 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            className="textarea textarea-bordered flex-1 resize-none min-h-[2.75rem] max-h-40"
            placeholder={
              connectionState === "connected"
                ? "Message agent… (Enter to send, Shift+Enter for newline)"
                : "Waiting for connection…"
            }
            value={input}
            onChange={(e) => onInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={connectionState !== "connected" || isSending}
            rows={1}
          />
          <button
            className="btn btn-primary btn-square shrink-0"
            onClick={onSend}
            disabled={!input.trim() || connectionState !== "connected" || isSending}
            title="Send"
          >
            {isSending
              ? <span className="loading loading-spinner loading-sm" />
              : <PaperAirplaneIcon className="w-5 h-5" />
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AgentChat() {
  const { projectName, agentName } = useParams<{ projectName: string; agentName: string }>();

  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [connectionError, setConnectionError] = useState<string>("");
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const tokenRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const params = { projectName: projectName!, agentName: agentName! };
  const [startAgent, { loading: isStarting }] = client.useMutation("startAgent");

  useEffect(() => {
    let active = true;
    let unsub: (() => void) | null = null;

    const connect = async () => {
      setConnectionState("connecting");
      setConnectionError("");

      const result = await client.connect("agentSession", params, {});
      if (!active) return;

      if (!result.success) {
        setConnectionState("error");
        setConnectionError(result.error.message);
        return;
      }

      tokenRef.current = result.token;

      const historyResult = await client.query("getAgentHistory", params);
      if (active && historyResult.success && historyResult.data.length > 0) {
        setMessages(historyToMessages(historyResult.data));
      }

      unsub = await client.subscribe("agentSession", params, result.token, (msg) => {
        if (!active) return;

        if (msg.type === "text") {
          setStreamingMessage((prev) => {
            if (!prev) return { role: "agent", parts: [{ type: "text", text: msg.text }], isStreaming: true };
            const parts = [...prev.parts];
            const last = parts[parts.length - 1];
            if (last?.type === "text") {
              parts[parts.length - 1] = { type: "text", text: last.text + msg.text };
            } else {
              parts.push({ type: "text", text: msg.text });
            }
            return { ...prev, parts };
          });
        } else if (msg.type === "tool-call") {
          setStreamingMessage((prev) => {
            const newPart: ToolPart = { type: "tool", toolName: msg.toolName, input: msg.input };
            if (!prev) return { role: "agent", parts: [newPart], isStreaming: true };
            return { ...prev, parts: [...prev.parts, newPart] };
          });
        } else if (msg.type === "tool-result") {
          setStreamingMessage((prev) => {
            if (!prev) return prev;
            const parts = prev.parts.map<MessagePart>((p) => {
              if (p.type === "tool" && p.toolName === msg.toolName && p.result === undefined) {
                return { ...p, result: msg.result };
              }
              return p;
            });
            return { ...prev, parts };
          });
        } else if (msg.type === "error") {
          setStreamingMessage((prev) => {
            const errorPart: MessagePart = { type: "error", error: msg.error };
            if (!prev) return { role: "agent", parts: [errorPart], isStreaming: true };
            return { ...prev, parts: [...prev.parts, errorPart] };
          });
        } else if (msg.type === "done") {
          setStreamingMessage((prev) => {
            if (prev && prev.parts.length > 0) {
              setMessages((msgs) => [...msgs, { ...prev, isStreaming: false }]);
            }
            setIsSending(false);
            return null;
          });
        }
      });

      if (active) setConnectionState("connected");
    };

    connect();
    return () => {
      active = false;
      unsub?.();
      tokenRef.current = null;
    };
  }, [projectName, agentName, retryCount]);

  useEffect(() => {
    if (activeTab === "chat") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingMessage, activeTab]);

  const handleStart = useCallback(async () => {
    await startAgent(params);
    setRetryCount((c) => c + 1);
  }, [projectName, agentName]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || !tokenRef.current || isSending || connectionState !== "connected") return;

    setInput("");
    setIsSending(true);
    setMessages((msgs) => [...msgs, { role: "user", parts: [{ type: "text", text }] }]);
    setStreamingMessage({ role: "agent", parts: [], isStreaming: true });

    await client.send("agentSession", params, tokenRef.current, { type: "input", text });
  }, [input, isSending, connectionState, projectName, agentName]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "chat", label: "Chat" },
    { id: "agent-file", label: "AGENT File" },
    { id: "skills", label: "Skills" },
    { id: "tokens", label: "Tokens" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-base-300 bg-base-100 flex items-center gap-3 shrink-0">
        <Link
          to={`/projects/${projectName}`}
          className="btn btn-ghost btn-sm btn-square"
          title="Back to project"
        >
          <ArrowLeftIcon className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-lg font-bold leading-tight">{agentName}</h2>
          <p className="text-xs text-base-content/50">{projectName}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {connectionState === "connecting" && (
            <span className="flex items-center gap-1.5 text-xs text-base-content/50">
              <span className="loading loading-spinner loading-xs" />
              Connecting…
            </span>
          )}
          {connectionState === "connected" && (
            <span className="flex items-center gap-1.5 text-xs text-success">
              <span className="w-2 h-2 rounded-full bg-success inline-block" />
              Connected
            </span>
          )}
          {connectionState === "error" && (
            <span className="flex items-center gap-1.5 text-xs text-error">
              <span className="w-2 h-2 rounded-full bg-error inline-block" />
              Disconnected
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-base-300 bg-base-100 shrink-0">
        <div className="flex px-6 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-base-content/50 hover:text-base-content"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "chat" ? (
        <ChatTab
          connectionState={connectionState}
          connectionError={connectionError}
          messages={messages}
          streamingMessage={streamingMessage}
          input={input}
          isSending={isSending}
          onInput={setInput}
          onSend={sendMessage}
          onKeyDown={handleKeyDown}
          onStart={handleStart}
          isStarting={isStarting}
          bottomRef={bottomRef}
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {activeTab === "agent-file" && (
            <AgentFileTab projectName={projectName!} agentName={agentName!} />
          )}
          {activeTab === "skills" && (
            <SkillsTab projectName={projectName!} agentName={agentName!} />
          )}
          {activeTab === "tokens" && (
            <TokensTab projectName={projectName!} agentName={agentName!} />
          )}
        </div>
      )}
    </div>
  );
}
