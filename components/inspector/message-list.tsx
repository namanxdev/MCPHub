"use client";

import { useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ProtocolMessage } from "@/lib/mcp/protocol-logger";
import { MessageRow } from "./message-row";

interface MessageListProps {
  messages: ProtocolMessage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  autoScroll: boolean;
}

export function MessageList({
  messages,
  selectedId,
  onSelect,
  autoScroll,
}: MessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, autoScroll]);

  if (messages.length === 0) {
    return (
      <div
        ref={parentRef}
        className="h-full flex items-center justify-center text-sm text-muted-foreground"
      >
        No messages captured yet. Send a request from the Playground.
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{ height: virtualizer.getTotalSize(), position: "relative" }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: virtualItem.start,
              left: 0,
              width: "100%",
              height: virtualItem.size,
            }}
          >
            <MessageRow
              message={messages[virtualItem.index]}
              isSelected={messages[virtualItem.index].id === selectedId}
              onClick={() => onSelect(messages[virtualItem.index].id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
