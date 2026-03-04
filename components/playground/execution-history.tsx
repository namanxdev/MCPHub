"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlaygroundStore, type ExecutionRecord } from "@/stores/playground-store";
import { cn } from "@/lib/utils";

interface HistoryRowProps {
  record: ExecutionRecord;
  onReplay: (record: ExecutionRecord) => void;
}

function HistoryRow({ record, onReplay }: HistoryRowProps) {
  const [expanded, setExpanded] = useState(false);

  const time = new Date(record.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="border rounded-md overflow-hidden">
      {/* Summary row */}
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? (
          <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span
          className={cn(
            "text-sm shrink-0",
            record.isError ? "text-destructive" : "text-green-600 dark:text-green-400"
          )}
        >
          {record.isError ? "✗" : "✓"}
        </span>
        <span className="font-mono text-xs font-medium truncate flex-1">
          {record.toolName}
        </span>
        <span className="text-xs text-muted-foreground shrink-0">{record.latencyMs}ms</span>
        <span className="text-xs text-muted-foreground shrink-0">{time}</span>
        <Button
          variant="ghost"
          size="icon-xs"
          className="shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onReplay(record);
          }}
          title="Replay"
        >
          <RotateCcwIcon className="size-3" />
        </Button>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t px-3 py-3 space-y-3 bg-muted/30">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Arguments
            </p>
            <pre className="text-xs font-mono bg-muted rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap break-words">
              {JSON.stringify(record.arguments, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Result
            </p>
            <pre className="text-xs font-mono bg-muted rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap break-words">
              {JSON.stringify(record.result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function ExecutionHistory() {
  const history = usePlaygroundStore((s) => s.executionHistory);
  const clearHistory = usePlaygroundStore((s) => s.clearHistory);
  const selectTool = usePlaygroundStore((s) => s.selectTool);
  const setFormValues = usePlaygroundStore((s) => s.setFormValues);

  function handleReplay(record: ExecutionRecord) {
    selectTool(record.toolName);
    // Give selectTool a tick to reset, then set form values
    setTimeout(() => {
      setFormValues(record.arguments);
    }, 0);
  }

  if (history.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Execution History</p>
        <Button
          variant="ghost"
          size="xs"
          onClick={clearHistory}
          className="gap-1 text-muted-foreground hover:text-destructive"
        >
          <Trash2Icon className="size-3" />
          Clear
        </Button>
      </div>
      <ScrollArea className="max-h-64">
        <div className="flex flex-col gap-1.5 pr-1">
          {history.map((record) => (
            <HistoryRow key={record.id} record={record} onReplay={handleReplay} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
