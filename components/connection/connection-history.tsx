"use client";

import { useEffect } from "react";
import { ClockIcon, Trash2Icon, WifiIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <Card className="gap-0 py-0 overflow-hidden">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ClockIcon className="size-4" />
          Recent Connections
        </CardTitle>
        <CardAction>
          <Button
            variant="ghost"
            size="xs"
            onClick={clearHistory}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon />
            Clear
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="px-0 py-0">
        <ul className="divide-y">
          {history.map((entry, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{entry.serverName}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {entry.url}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-auto">
                    {entry.transport}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {entry.toolCount} {entry.toolCount === 1 ? "tool" : "tools"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(entry.connectedAt)}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleReconnect(entry)}
                aria-label={`Reconnect to ${entry.serverName}`}
              >
                <WifiIcon />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
