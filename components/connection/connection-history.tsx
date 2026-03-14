"use client";

import { useEffect } from "react";
import { ClockIcon, Trash2Icon, WifiIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConnectionStore } from "@/stores/connection-store";
import type { ConnectionHistoryEntry } from "@/stores/connection-store";
import { useConnection } from "@/hooks/use-connection";

const STORAGE_KEY = "mcphub:connection-history";

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function ConnectionHistory() {
  const history = useConnectionStore((s) => s.history);
  const clearHistory = useConnectionStore((s) => s.clearHistory);
  const addToHistory = useConnectionStore((s) => s.addToHistory);
  const { connect } = useConnection();

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: ConnectionHistoryEntry[] = JSON.parse(stored);
        // Add each entry to the store; filter duplicates is handled by the store
        for (const entry of parsed.slice().reverse()) {
          addToHistory({ ...entry, connectedAt: new Date(entry.connectedAt) });
        }
      }
    } catch {
      // ignore parse errors
    }
  // Only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // ignore storage errors
    }
  }, [history]);

  if (history.length === 0) return null;

  async function handleReconnect(entry: ConnectionHistoryEntry) {
    await connect(entry.url, entry.transport);
  }

  return (
    <div className="border-2 border-foreground/10 bg-background overflow-hidden mt-6">
      <div className="px-6 py-4 border-b-2 border-foreground/10 flex items-center justify-between bg-foreground/[0.02]">
        <h2 className="text-sm font-mono font-bold tracking-widest uppercase flex items-center gap-3 text-foreground">
          <ClockIcon className="size-4 text-foreground/50" />
          RECENT CONNECTIONS
        </h2>
        <button
          onClick={clearHistory}
          className="flex items-center gap-2 border-2 border-transparent text-foreground/40 px-3 py-1 font-mono text-[10px] uppercase font-bold tracking-widest hover:border-foreground hover:bg-foreground hover:text-background transition-colors"
        >
          <Trash2Icon className="size-3" />
          CLEAR
        </button>
      </div>

      <div className="p-0">
        <div className="flex flex-col">
          {history.map((entry, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-foreground/5 last:border-b-0 group hover:bg-foreground/5 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-bold uppercase tracking-wide truncate text-foreground">{entry.serverName}</p>
                <p className="text-[10px] text-foreground/40 font-mono font-bold uppercase tracking-widest truncate mt-1">
                  {entry.url}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="font-mono text-[9px] uppercase tracking-widest border border-foreground/20 px-1.5 py-0.5 text-foreground/60">
                    {entry.transport}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/40 font-bold">
                    {entry.toolCount} {entry.toolCount === 1 ? "TOOL" : "TOOLS"}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/40 font-bold">
                    {formatRelativeTime(entry.connectedAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleReconnect(entry)}
                className="shrink-0 p-3 hover:bg-foreground hover:text-background transition-colors text-foreground/50 border-2 border-transparent hover:border-foreground relative group/btn"
                aria-label={`Reconnect to ${entry.serverName}`}
              >
                <WifiIcon className="size-5" />
                <span className="absolute -top-8 right-0 bg-foreground text-background px-2 py-1 font-mono text-[10px] uppercase tracking-widest opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  RECONNECT
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
