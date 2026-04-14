"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PlusIcon, Trash2Icon, ChevronDownIcon, ChevronUpIcon, Loader2Icon, ZapIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConnection } from "@/hooks/use-connection";
import { useDesktopAgent } from "@/hooks/use-desktop-agent";

interface KeyValuePair {
  key: string;
  value: string;
}

type TransportType = "sse" | "streamable-http" | "stdio";

function ConnectFormInner() {
  const searchParams = useSearchParams();
  const initialTransport = (searchParams.get("transport") as TransportType) ?? "sse";
  const [url, setUrl] = useState(searchParams.get("url") ?? "");
  const [transport, setTransport] = useState<TransportType>(initialTransport);
  const [headers, setHeaders] = useState<KeyValuePair[]>([]);
  const [showHeaders, setShowHeaders] = useState(false);

  // Stdio-specific state
  const [command, setCommand] = useState(searchParams.get("command") ?? "");
  const [envVars, setEnvVars] = useState<KeyValuePair[]>(() => {
    const requiredEnvVars = searchParams.get("requiredEnvVars");
    if (requiredEnvVars) {
      return requiredEnvVars.split(",").map((key) => ({ key: key.trim(), value: "" }));
    }
    return [];
  });
  const [showEnvVars, setShowEnvVars] = useState(() => {
    return !!searchParams.get("requiredEnvVars");
  });

  // Desktop Agent state
  const { isAvailable: isAgentAvailable } = useDesktopAgent();
  const [agentMode, setAgentMode] = useState(false);

  const { status, connect } = useConnection();
  const isConnecting = status === "connecting";
  const isStdio = transport === "stdio";

  // Reset agent mode when agent becomes unavailable
  useEffect(() => {
    if (!isAgentAvailable && agentMode) {
      // Use setTimeout to avoid synchronous state update in effect
      const timer = setTimeout(() => {
        setAgentMode(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isAgentAvailable, agentMode]);

  function addHeader() {
    setHeaders((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeHeader(index: number) {
    setHeaders((prev) => prev.filter((_, i) => i !== index));
  }

  function updateHeader(index: number, field: "key" | "value", val: string) {
    setHeaders((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: val } : h))
    );
  }

  function addEnvVar() {
    setEnvVars((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeEnvVar(index: number) {
    setEnvVars((prev) => prev.filter((_, i) => i !== index));
  }

  function updateEnvVar(index: number, field: "key" | "value", val: string) {
    setEnvVars((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: val } : h))
    );
  }

  async function handleConnect() {
    if (isStdio) {
      if (!command.trim()) return;
      const env = envVars.reduce<Record<string, string>>((acc, h) => {
        if (h.key && h.value) acc[h.key] = h.value;
        return acc;
      }, {});
      await connect({
        transport: "stdio",
        command: command.trim(),
        env: Object.keys(env).length > 0 ? env : undefined,
      }, { agentMode });
    } else {
      if (!url.trim()) return;
      const headersObj = headers.reduce<Record<string, string>>((acc, h) => {
        if (h.key && h.value) acc[h.key] = h.value;
        return acc;
      }, {});
      await connect({
        transport,
        url: url.trim(),
        headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
      }, { agentMode });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleConnect();
  }

  const canConnect = isStdio ? !!command.trim() : !!url.trim();

  return (
    <div className="flex flex-col gap-6">
      {/* Desktop Agent Banner */}
      {isAgentAvailable && (
        <div className="border-2 border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ZapIcon className="size-5 text-emerald-500" />
              <div className="flex flex-col">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-500">
                  ⚡ DESKTOP AGENT DETECTED
                </span>
                <span className="font-mono text-[10px] text-emerald-500/70 uppercase tracking-widest">
                  Route connections through local agent
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAgentMode(!agentMode)}
              disabled={isConnecting}
              className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-none border-2 transition-colors ${
                agentMode 
                  ? 'border-emerald-500 bg-emerald-500' 
                  : 'border-foreground/20 bg-foreground/[0.02]'
              }`}
              aria-label={agentMode ? "Disable agent mode" : "Enable agent mode"}
            >
              <span
                className={`pointer-events-none inline-block h-full w-1/2 transform transition-transform ${
                  agentMode ? 'translate-x-full' : 'translate-x-0'
                }`}
              >
                <span className="absolute inset-0 flex h-full w-full items-center justify-center bg-background border">
                  <span className="h-4 w-0.5" />
                </span>
              </span>
            </button>
          </div>
          {agentMode && (
            <div className="mt-3 pt-3 border-t border-emerald-500/20">
              <span className="font-mono text-[10px] text-emerald-500/70 uppercase tracking-widest">
                • Connection will use ws://localhost:54319
                <br />
                • Tool calls will route through local agent
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Label htmlFor="transport-select" className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/60">Transport Protocol</Label>
        <Select
          value={transport}
          onValueChange={(v) => setTransport(v as TransportType)}
          disabled={isConnecting}
        >
          <SelectTrigger id="transport-select" className="w-full h-12 rounded-none border-2 border-foreground/20 bg-foreground/[0.02] px-4 font-mono text-sm font-bold tracking-widest uppercase focus:ring-0 focus:border-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none border-2 border-foreground">
            <SelectItem value="sse" className="font-mono text-xs uppercase cursor-pointer rounded-none focus:bg-foreground focus:text-background font-bold tracking-widest">SSE</SelectItem>
            <SelectItem value="streamable-http" className="font-mono text-xs uppercase cursor-pointer rounded-none focus:bg-foreground focus:text-background font-bold tracking-widest">Streamable HTTP</SelectItem>
            <SelectItem value="stdio" className="font-mono text-xs uppercase cursor-pointer rounded-none focus:bg-foreground focus:text-background font-bold tracking-widest">Command (Stdio)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isStdio ? (
        <>
          {/* Command input */}
          <div className="flex flex-col gap-3">
            <Label htmlFor="server-command" className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/60">Command</Label>
            <Input
              id="server-command"
              type="text"
              placeholder="npx -y @modelcontextprotocol/server-github"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isConnecting}
              className="h-12 rounded-none border-2 border-foreground/20 bg-foreground/[0.02] px-4 font-mono text-sm focus-visible:ring-0 focus-visible:border-foreground transition-colors"
            />
          </div>

          {/* Environment Variables */}
          <div className="flex flex-col gap-4 mt-2">
            <button
              type="button"
              onClick={() => setShowEnvVars((v) => !v)}
              className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground transition-colors w-fit group"
            >
              <span className="border border-foreground/20 p-0.5 group-hover:border-foreground/50 transition-colors">
                {showEnvVars ? <ChevronUpIcon className="size-3" /> : <ChevronDownIcon className="size-3" />}
              </span>
              ENVIRONMENT VARIABLES
              {envVars.length > 0 && (
                <span className="ml-2 text-[10px] bg-foreground text-background rounded-none px-1.5 py-0 font-bold">
                  {envVars.length}
                </span>
              )}
            </button>

            {showEnvVars && (
              <div className="flex flex-col gap-3 pl-4 border-l-2 border-foreground/10 ml-2">
                {envVars.map((envVar, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-center gap-3">
                    <Input
                      placeholder="VARIABLE_NAME"
                      value={envVar.key}
                      onChange={(e) => updateEnvVar(i, "key", e.target.value)}
                      disabled={isConnecting}
                      className="font-mono text-xs rounded-none border-2 border-foreground/20 bg-foreground/[0.02] h-10 px-3 flex-1 focus-visible:ring-0 focus-visible:border-foreground uppercase"
                    />
                    <Input
                      placeholder="VALUE"
                      value={envVar.value}
                      onChange={(e) => updateEnvVar(i, "value", e.target.value)}
                      disabled={isConnecting}
                      className="font-mono text-xs rounded-none border-2 border-foreground/20 bg-foreground/[0.02] h-10 px-3 flex-1 focus-visible:ring-0 focus-visible:border-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => removeEnvVar(i)}
                      disabled={isConnecting}
                      className="shrink-0 p-2 hover:bg-foreground hover:text-background transition-colors text-foreground/50 border-2 border-transparent hover:border-foreground disabled:opacity-50"
                      aria-label="Remove environment variable"
                    >
                      <Trash2Icon className="size-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEnvVar}
                  disabled={isConnecting}
                  className="inline-flex items-center justify-center gap-2 border-2 border-foreground/20 text-foreground px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest hover:border-foreground transition-colors w-fit disabled:opacity-50"
                >
                  <PlusIcon className="size-3" />
                  ADD VARIABLE
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* URL input */}
          <div className="flex flex-col gap-3">
            <Label htmlFor="server-url" className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/60">Server URL</Label>
            <Input
              id="server-url"
              type="url"
              placeholder="HTTPS://YOUR-MCP-SERVER.COM/SSE"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isConnecting}
              className="h-12 rounded-none border-2 border-foreground/20 bg-foreground/[0.02] px-4 font-mono text-sm focus-visible:ring-0 focus-visible:border-foreground transition-colors uppercase"
            />
          </div>

          {/* Authentication Headers */}
          <div className="flex flex-col gap-4 mt-2">
            <button
              type="button"
              onClick={() => setShowHeaders((v) => !v)}
              className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground transition-colors w-fit group"
            >
              <span className="border border-foreground/20 p-0.5 group-hover:border-foreground/50 transition-colors">
                {showHeaders ? <ChevronUpIcon className="size-3" /> : <ChevronDownIcon className="size-3" />}
              </span>
              AUTHENTICATION HEADERS
              {headers.length > 0 && (
                <span className="ml-2 text-[10px] bg-foreground text-background rounded-none px-1.5 py-0 font-bold">
                  {headers.length}
                </span>
              )}
            </button>

            {showHeaders && (
              <div className="flex flex-col gap-3 pl-4 border-l-2 border-foreground/10 ml-2">
                {headers.map((header, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-center gap-3">
                    <Input
                      placeholder="HEADER-NAME"
                      value={header.key}
                      onChange={(e) => updateHeader(i, "key", e.target.value)}
                      disabled={isConnecting}
                      className="font-mono text-xs rounded-none border-2 border-foreground/20 bg-foreground/[0.02] h-10 px-3 flex-1 focus-visible:ring-0 focus-visible:border-foreground uppercase"
                    />
                    <Input
                      placeholder="VALUE"
                      value={header.value}
                      onChange={(e) => updateHeader(i, "value", e.target.value)}
                      disabled={isConnecting}
                      className="font-mono text-xs rounded-none border-2 border-foreground/20 bg-foreground/[0.02] h-10 px-3 flex-1 focus-visible:ring-0 focus-visible:border-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => removeHeader(i)}
                      disabled={isConnecting}
                      className="shrink-0 p-2 hover:bg-foreground hover:text-background transition-colors text-foreground/50 border-2 border-transparent hover:border-foreground disabled:opacity-50"
                      aria-label="Remove header"
                    >
                      <Trash2Icon className="size-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addHeader}
                  disabled={isConnecting}
                  className="inline-flex items-center justify-center gap-2 border-2 border-foreground/20 text-foreground px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest hover:border-foreground transition-colors w-fit disabled:opacity-50"
                >
                  <PlusIcon className="size-3" />
                  ADD HEADER
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <button
        onClick={handleConnect}
        disabled={isConnecting || !canConnect}
        className="mt-6 w-full inline-flex items-center justify-center gap-3 border-2 border-foreground bg-background text-foreground px-6 py-4 font-mono text-lg font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:pointer-events-none"
      >
        {isConnecting ? (
          <>
            <Loader2Icon className="size-5 animate-spin" />
            CONNECTING...
          </>
        ) : (
          "INITIALIZE"
        )}
      </button>
    </div>
  );
}

export function ConnectForm() {
  return (
    <Suspense fallback={null}>
      <ConnectFormInner />
    </Suspense>
  );
}
