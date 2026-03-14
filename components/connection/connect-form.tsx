"use client";

import { useState } from "react";
import { PlusIcon, Trash2Icon, ChevronDownIcon, ChevronUpIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface HeaderPair {
  key: string;
  value: string;
}

export function ConnectForm() {
  const [url, setUrl] = useState("");
  const [transport, setTransport] = useState<"sse" | "streamable-http">("sse");
  const [headers, setHeaders] = useState<HeaderPair[]>([]);
  const [showHeaders, setShowHeaders] = useState(false);

  const { status, connect } = useConnection();
  const isConnecting = status === "connecting";

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

  async function handleConnect() {
    if (!url.trim()) return;

    const headersObj = headers.reduce<Record<string, string>>((acc, h) => {
      if (h.key && h.value) acc[h.key] = h.value;
      return acc;
    }, {});

    await connect(url.trim(), transport, headersObj);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleConnect();
  }

  return (
    <div className="flex flex-col gap-6">
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

      <div className="flex flex-col gap-3">
        <Label htmlFor="transport-select" className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/60">Transport Protocol</Label>
        <Select
          value={transport}
          onValueChange={(v) => setTransport(v as "sse" | "streamable-http")}
          disabled={isConnecting}
        >
          <SelectTrigger id="transport-select" className="w-full h-12 rounded-none border-2 border-foreground/20 bg-foreground/[0.02] px-4 font-mono text-sm font-bold tracking-widest uppercase focus:ring-0 focus:border-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none border-2 border-foreground">
            <SelectItem value="sse" className="font-mono text-xs uppercase cursor-pointer rounded-none focus:bg-foreground focus:text-background font-bold tracking-widest">SSE</SelectItem>
            <SelectItem value="streamable-http" className="font-mono text-xs uppercase cursor-pointer rounded-none focus:bg-foreground focus:text-background font-bold tracking-widest">Streamable HTTP</SelectItem>
          </SelectContent>
        </Select>
      </div>

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

      <button
        onClick={handleConnect}
        disabled={isConnecting || !url.trim()}
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
