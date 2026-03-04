"use client";

import { useMemo, useState, useEffect } from "react";
import { ProtocolMessage } from "@/lib/mcp/protocol-logger";

interface MessageStatsProps {
  messages: ProtocolMessage[];
  connectedAt: number | null;
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function formatKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function MessageStats({ messages, connectedAt }: MessageStatsProps) {
  // Tick once per second so the duration counter updates live without
  // calling Date.now() directly inside render (which is impure).
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (connectedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [connectedAt]);

  const stats = useMemo(() => {
    const sent = messages.filter((m) => m.direction === "sent");
    const received = messages.filter((m) => m.direction === "received");
    const errors = messages.filter((m) => m.isError);

    const latencies = messages
      .filter((m) => m.latencyMs !== undefined)
      .map((m) => m.latencyMs!);

    const avgLatency =
      latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : null;

    const sentBytes = sent.reduce((a, m) => a + m.sizeBytes, 0);
    const receivedBytes = received.reduce((a, m) => a + m.sizeBytes, 0);

    return {
      total: messages.length,
      sentCount: sent.length,
      receivedCount: received.length,
      errorCount: errors.length,
      avgLatency,
      sentBytes,
      receivedBytes,
    };
  }, [messages]);

  const duration = connectedAt !== null ? now - connectedAt : null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1.5 border-b bg-muted/30 shrink-0 text-xs text-muted-foreground font-mono">
      <span>
        <span className="font-semibold text-foreground">{stats.total}</span>{" "}
        msgs ({stats.sentCount} sent, {stats.receivedCount} recv)
      </span>

      {stats.avgLatency !== null && (
        <span>
          avg latency:{" "}
          <span className="font-semibold text-foreground">
            {stats.avgLatency}ms
          </span>
        </span>
      )}

      {stats.errorCount > 0 && (
        <span className="text-red-500 dark:text-red-400">
          <span className="font-semibold">{stats.errorCount}</span>{" "}
          {stats.errorCount === 1 ? "error" : "errors"}
        </span>
      )}

      {duration !== null && (
        <span>
          duration:{" "}
          <span className="font-semibold text-foreground">
            {formatDuration(duration)}
          </span>
        </span>
      )}

      <span>
        data:{" "}
        <span className="font-semibold text-foreground">
          {formatKB(stats.sentBytes)}
        </span>{" "}
        sent,{" "}
        <span className="font-semibold text-foreground">
          {formatKB(stats.receivedBytes)}
        </span>{" "}
        recv
      </span>
    </div>
  );
}
