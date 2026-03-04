"use client";

import { Badge } from "@/components/ui/badge";

interface ErrorEntry {
  timestamp: string;
  toolName: string;
  errorType: string | null | undefined;
  errorMessage: string | null | undefined;
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function ErrorLog({ errors }: { errors: ErrorEntry[] }) {
  if (errors.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No errors recorded in this time range.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {errors.map((err, i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row sm:items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm"
        >
          <span className="text-muted-foreground whitespace-nowrap shrink-0">
            {formatTimestamp(err.timestamp)}
          </span>
          <span className="font-mono font-medium shrink-0">{err.toolName}</span>
          {err.errorType && (
            <Badge variant="destructive" className="shrink-0">
              {err.errorType}
            </Badge>
          )}
          {err.errorMessage && (
            <span className="text-muted-foreground truncate max-w-md" title={err.errorMessage}>
              {err.errorMessage}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
