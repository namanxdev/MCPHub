"use client";

import { XCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConnection } from "@/hooks/use-connection";
import { cn } from "@/lib/utils";

function StatusDot({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block size-2.5 rounded-full flex-shrink-0", className)}
    />
  );
}

export function ConnectionStatus() {
  const { status, session, error, disconnect } = useConnection();

  if (status === "disconnected") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <StatusDot className="bg-muted-foreground/50" />
        Disconnected
      </div>
    );
  }

  if (status === "connecting") {
    return (
      <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
        <StatusDot className="bg-yellow-500 animate-pulse" />
        Connecting...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <StatusDot className="bg-destructive" />
        <span className="flex items-center gap-1.5">
          <XCircleIcon className="size-4 flex-shrink-0" />
          {error ?? "Connection error"}
        </span>
      </div>
    );
  }

  if (status === "connected" && session) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <StatusDot className="bg-green-500" />
          <span className="font-medium">{session.serverInfo.name}</span>
          <span className="text-muted-foreground">
            v{session.serverInfo.version}
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
            MCP {session.serverInfo.protocolVersion}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={disconnect}
          className="text-destructive hover:text-destructive"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return null;
}
