"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useConnectionStore } from "@/stores/connection-store";
import { useInspectorStore } from "@/stores/inspector-store";
import { useProtocolMessages } from "@/hooks/use-protocol-messages";
import { InspectorToolbar } from "@/components/inspector/inspector-toolbar";
import { MessageFilters } from "@/components/inspector/message-filters";
import { MessageStats } from "@/components/inspector/message-stats";
import { MessageList } from "@/components/inspector/message-list";
import { MessageDetail } from "@/components/inspector/message-detail";
import { ConnectForm } from "@/components/connection/connect-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InspectorPage() {
  const session = useConnectionStore((s) => s.session);
  const sessionId = session?.sessionId;

  const { messages: streamMessages } = useProtocolMessages(sessionId);

  const storeMessages = useInspectorStore((s) => s.messages);
  const selectedMessageId = useInspectorStore((s) => s.selectedMessageId);
  const directionFilter = useInspectorStore((s) => s.directionFilter);
  const statusFilter = useInspectorStore((s) => s.statusFilter);
  const searchQuery = useInspectorStore((s) => s.searchQuery);
  const minLatencyMs = useInspectorStore((s) => s.minLatencyMs);
  const autoScroll = useInspectorStore((s) => s.autoScroll);
  const addMessage = useInspectorStore((s) => s.addMessage);
  const selectMessage = useInspectorStore((s) => s.selectMessage);
  const clearMessages = useInspectorStore((s) => s.clearMessages);

  // Track how many stream messages we've already processed
  const processedCountRef = useRef(0);

  // Sync new SSE messages into the store
  useEffect(() => {
    const newMessages = streamMessages.slice(processedCountRef.current);
    for (const msg of newMessages) {
      addMessage(msg);
    }
    processedCountRef.current = streamMessages.length;
  }, [streamMessages, addMessage]);

  // Clear store + reset counter when session changes
  useEffect(() => {
    clearMessages();
    processedCountRef.current = 0;
  }, [sessionId, clearMessages]);

  const connectedAt = session?.connectedAt
    ? new Date(session.connectedAt).getTime()
    : null;

  // Memoized filtered messages
  const filteredMessages = useMemo(() => {
    return storeMessages.filter((msg) => {
      if (directionFilter !== "all" && msg.direction !== directionFilter) {
        return false;
      }
      if (statusFilter === "error" && !msg.isError) {
        return false;
      }
      if (statusFilter === "success" && msg.isError) {
        return false;
      }
      if (
        minLatencyMs !== null &&
        (msg.latencyMs === undefined || msg.latencyMs < minLatencyMs)
      ) {
        return false;
      }
      if (searchQuery.trim() !== "") {
        const lower = searchQuery.toLowerCase();
        if (!msg.raw.toLowerCase().includes(lower)) {
          return false;
        }
      }
      return true;
    });
  }, [storeMessages, directionFilter, statusFilter, minLatencyMs, searchQuery]);

  const selectedMessage = useMemo(
    () =>
      selectedMessageId
        ? (storeMessages.find((m) => m.id === selectedMessageId) ?? null)
        : null,
    [storeMessages, selectedMessageId]
  );

  if (!session) {
    return (
      <motion.div
        className="max-w-7xl mx-auto px-4 py-8 flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Protocol Inspector</h1>
          <p className="text-muted-foreground text-sm max-w-md">
            Connect to an MCP server to start capturing JSON-RPC messages in
            real time.
          </p>
        </div>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect to an MCP Server</CardTitle>
          </CardHeader>
          <CardContent>
            <ConnectForm />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Toolbar */}
      <InspectorToolbar />

      {/* Stats bar */}
      <MessageStats messages={storeMessages} connectedAt={connectedAt} />

      {/* Filters */}
      <MessageFilters />

      {/* Main panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Message list */}
        <div className="flex flex-col border-r w-[55%] min-w-0">
          <div className="px-3 py-1.5 border-b bg-muted/30 text-xs font-mono text-muted-foreground flex items-center gap-2 shrink-0">
            <span>
              {filteredMessages.length === storeMessages.length
                ? `${storeMessages.length} messages`
                : `${filteredMessages.length} of ${storeMessages.length} messages`}
            </span>
            <span className="text-xs">
              {session.serverInfo.name} v{session.serverInfo.version}
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <MessageList
              messages={filteredMessages}
              selectedId={selectedMessageId}
              onSelect={selectMessage}
              autoScroll={autoScroll}
            />
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <MessageDetail message={selectedMessage} />
        </div>
      </div>
    </div>
  );
}
