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
    <div className="border-b-2 border-foreground/10 mb-2 overflow-hidden bg-foreground/[0.02] group/row">
      {/* Summary row */}
      <div
        role="button"
        tabIndex={0}
        className="w-full flex items-center gap-4 px-4 py-4 hover:bg-foreground/5 transition-colors text-left cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded((v) => !v); }}
      >
        {expanded ? (
          <ChevronDownIcon className="size-4 shrink-0 text-foreground" />
        ) : (
          <ChevronRightIcon className="size-4 shrink-0 text-foreground/40 group-hover/row:text-foreground" />
        )}
        <span
          className={cn(
            "text-sm shrink-0 font-bold",
            record.isError ? "text-foreground bg-background px-1" : "text-background bg-foreground px-1"
          )}
        >
          {record.isError ? "ERR" : "OK"}
        </span>
        <span className="font-mono text-sm font-bold uppercase tracking-wide truncate flex-1 text-foreground">
          {record.toolName}
        </span>
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/40 shrink-0">{record.latencyMs}ms</span>
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/40 shrink-0">{time}</span>
        <button
          className="shrink-0 p-2 hover:bg-foreground hover:text-background transition-colors text-foreground/50 border-2 border-transparent hover:border-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onReplay(record);
          }}
          title="Replay"
        >
          <RotateCcwIcon className="size-4" />
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t-2 border-foreground/5 px-6 py-6 space-y-6 bg-background">
          <div>
            <p className="font-mono text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-3">
              Arguments
            </p>
            <pre className="font-mono text-xs bg-foreground/[0.02] border-2 border-foreground/10 p-4 overflow-auto max-h-40 whitespace-pre-wrap break-words text-foreground/80">
              {JSON.stringify(record.arguments, null, 2)}
            </pre>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-3">
              Result
            </p>
            <pre className="font-mono text-xs bg-foreground/[0.02] border-2 border-foreground/10 p-4 overflow-auto max-h-40 whitespace-pre-wrap break-words text-foreground/80">
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b-2 border-foreground/10 pb-4">
        <p className="font-mono text-sm tracking-widest font-bold uppercase text-foreground/40">Execution History</p>
        <button
          onClick={clearHistory}
          className="flex items-center gap-2 border-2 border-transparent text-foreground/40 px-3 py-1 font-mono text-[10px] uppercase font-bold tracking-widest hover:border-foreground hover:bg-foreground hover:text-background transition-colors"
        >
          <Trash2Icon className="size-3" />
          CLEAR
        </button>
      </div>
      <ScrollArea className="max-h-[500px]">
        <div className="flex flex-col gap-0 pr-4">
          {history.map((record) => (
            <HistoryRow key={record.id} record={record} onReplay={handleReplay} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
