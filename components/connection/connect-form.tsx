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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="server-url">Server URL</Label>
        <Input
          id="server-url"
          type="url"
          placeholder="https://your-mcp-server.com/sse"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isConnecting}
          className="font-mono text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="transport-select">Transport</Label>
        <Select
          value={transport}
          onValueChange={(v) => setTransport(v as "sse" | "streamable-http")}
          disabled={isConnecting}
        >
          <SelectTrigger id="transport-select" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sse">SSE</SelectItem>
            <SelectItem value="streamable-http">Streamable HTTP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowHeaders((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          {showHeaders ? (
            <ChevronUpIcon className="size-4" />
          ) : (
            <ChevronDownIcon className="size-4" />
          )}
          Authentication Headers
          {headers.length > 0 && (
            <span className="ml-1 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
              {headers.length}
            </span>
          )}
        </button>

        {showHeaders && (
          <div className="flex flex-col gap-2 pl-1 border-l-2 border-border ml-1">
            {headers.map((header, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="Header name"
                  value={header.key}
                  onChange={(e) => updateHeader(i, "key", e.target.value)}
                  disabled={isConnecting}
                  className="font-mono text-sm flex-1"
                />
                <Input
                  placeholder="Value"
                  value={header.value}
                  onChange={(e) => updateHeader(i, "value", e.target.value)}
                  disabled={isConnecting}
                  className="font-mono text-sm flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeHeader(i)}
                  disabled={isConnecting}
                  aria-label="Remove header"
                >
                  <Trash2Icon />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addHeader}
              disabled={isConnecting}
              className="w-fit"
            >
              <PlusIcon />
              Add Header
            </Button>
          </div>
        )}
      </div>

      <Button
        onClick={handleConnect}
        disabled={isConnecting || !url.trim()}
        className="w-full"
      >
        {isConnecting ? (
          <>
            <Loader2Icon className="animate-spin" />
            Connecting...
          </>
        ) : (
          "Connect"
        )}
      </Button>
    </div>
  );
}
