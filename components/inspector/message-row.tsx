"use client";

import { cn } from "@/lib/utils";
import { ProtocolMessage } from "@/lib/mcp/protocol-logger";

interface MessageRowProps {
  message: ProtocolMessage;
  isSelected: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

export function MessageRow({
  message,
  isSelected,
  onClick,
  style,
}: MessageRowProps) {
  const isSent = message.direction === "sent";
  const isInitialize =
    message.method === "initialize" || message.method === "initialized";

  const methodLabel = message.method ?? (isSent ? "request" : "response");

  const methodColorClass = (() => {
    if (isInitialize) return "text-purple-500 dark:text-purple-400";
    if (!isSent && message.isError)
      return "text-red-500 dark:text-red-400";
    if (!isSent && message.isNotification)
      return "text-amber-500 dark:text-amber-400";
    if (!isSent) return "text-green-500 dark:text-green-400";
    return "text-blue-500 dark:text-blue-400";
  })();

  return (
    <button
      type="button"
      style={style}
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 h-12 flex items-center gap-3 border-b transition-colors hover:bg-accent/50 font-mono text-xs",
        isSelected && "bg-accent"
      )}
    >
      {/* Timestamp */}
      <span className="text-muted-foreground shrink-0 w-20">
        {formatTime(message.timestamp)}
      </span>

      {/* Direction arrow */}
      <span
        className={cn("shrink-0 font-bold text-sm w-4 text-center", methodColorClass)}
        aria-label={isSent ? "sent" : "received"}
      >
        {isSent ? "→" : "←"}
      </span>

      {/* Method / label */}
      <span className={cn("flex-1 truncate font-semibold", methodColorClass)}>
        {methodLabel}
        {message.isError && (
          <span className="ml-1.5 text-red-500 font-normal">[error]</span>
        )}
        {message.isNotification && !isInitialize && (
          <span className="ml-1.5 text-amber-500 dark:text-amber-400 font-normal">[notify]</span>
        )}
      </span>

      {/* Latency */}
      {message.latencyMs !== undefined && (
        <span className="text-muted-foreground shrink-0 w-16 text-right">
          {message.latencyMs}ms
        </span>
      )}

      {/* Size */}
      <span className="text-muted-foreground shrink-0 w-12 text-right">
        {formatSize(message.sizeBytes)}
      </span>

      {/* Error icon */}
      {message.isError && (
        <span className="shrink-0 text-red-500 text-base leading-none">!</span>
      )}
    </button>
  );
}
