"use client";

import { useState } from "react";
import { Trash2Icon, DownloadIcon, ChevronsDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInspectorStore } from "@/stores/inspector-store";
import { cn } from "@/lib/utils";

export function InspectorToolbar() {
  const messages = useInspectorStore((s) => s.messages);
  const autoScroll = useInspectorStore((s) => s.autoScroll);
  const clearMessages = useInspectorStore((s) => s.clearMessages);
  const toggleAutoScroll = useInspectorStore((s) => s.toggleAutoScroll);

  const [confirmClear, setConfirmClear] = useState(false);

  function handleClear() {
    if (messages.length > 100 && !confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearMessages();
    setConfirmClear(false);
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(messages, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mcp-messages-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0 bg-background">
      <span className="text-sm font-medium flex-1">Protocol Inspector</span>

      {/* Auto-scroll toggle */}
      <Button
        variant="outline"
        size="xs"
        onClick={toggleAutoScroll}
        className={cn(
          "gap-1",
          autoScroll && "border-primary text-primary hover:text-primary"
        )}
        title={autoScroll ? "Auto-scroll: On" : "Auto-scroll: Off"}
      >
        <ChevronsDownIcon className="size-3" />
        {autoScroll ? "Auto-scroll On" : "Auto-scroll Off"}
      </Button>

      {/* Export */}
      <Button
        variant="outline"
        size="xs"
        onClick={handleExport}
        disabled={messages.length === 0}
        title="Export messages as JSON"
      >
        <DownloadIcon className="size-3" />
        Export
      </Button>

      {/* Clear */}
      {confirmClear ? (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">
            Clear {messages.length} messages?
          </span>
          <Button
            variant="destructive"
            size="xs"
            onClick={handleClear}
          >
            Confirm
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setConfirmClear(false)}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="xs"
          onClick={handleClear}
          disabled={messages.length === 0}
          title="Clear all messages"
          className="text-destructive hover:text-destructive"
        >
          <Trash2Icon className="size-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
