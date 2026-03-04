"use client";

import { useEffect, useState } from "react";
import { ProtocolMessage } from "@/lib/mcp/protocol-logger";

interface MessageDetailProps {
  message: ProtocolMessage | null;
}

export function MessageDetail({ message }: MessageDetailProps) {
  const [highlighted, setHighlighted] = useState<string>("");
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (!message) {
      setHighlighted("");
      return;
    }

    let cancelled = false;

    async function highlight() {
      const { codeToHtml } = await import("shiki");
      const formatted = JSON.stringify(message!.parsed, null, 2);
      const html = await codeToHtml(formatted, {
        lang: "json",
        theme: "github-dark",
      });
      if (!cancelled) {
        setHighlighted(html);
      }
    }

    highlight().catch(() => {
      // Fall through to unformatted pre block
    });

    return () => {
      cancelled = true;
    };
  }, [message]);

  if (!message) {
    return (
      <div className="p-4 text-muted-foreground text-sm text-center h-full flex items-center justify-center">
        Click a message to see its full content
      </div>
    );
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(
      JSON.stringify(message!.parsed, null, 2)
    );
    setCopying(true);
    setTimeout(() => setCopying(false), 1500);
  }

  const methodLabel = message.method ?? (message.direction === "sent" ? "request" : "response");

  return (
    <div className="p-4 space-y-2 overflow-auto h-full">
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="text-sm font-medium font-mono">
          <span className="text-muted-foreground mr-1">
            {message.direction === "sent" ? "→" : "←"}
          </span>
          {methodLabel}
          {message.latencyMs !== undefined && (
            <span className="text-muted-foreground ml-2 font-normal text-xs">
              ({message.latencyMs}ms)
            </span>
          )}
          {message.isError && (
            <span className="ml-2 text-xs text-red-500 font-normal">
              error
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {copying ? "Copied!" : "Copy"}
        </button>
      </div>

      {highlighted ? (
        <div
          className="rounded-lg overflow-auto text-sm max-h-[calc(100%-2.5rem)] [&>pre]:p-3 [&>pre]:rounded-lg"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      ) : (
        <pre className="text-xs overflow-auto max-h-[calc(100%-2.5rem)] p-3 bg-muted rounded-lg">
          {JSON.stringify(message.parsed, null, 2)}
        </pre>
      )}
    </div>
  );
}
