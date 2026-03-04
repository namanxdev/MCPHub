"use client";
import { useState, useEffect } from "react";
import { ProtocolMessage } from "@/lib/mcp/protocol-logger";

export function useProtocolMessages(sessionId: string | undefined) {
  const [messages, setMessages] = useState<ProtocolMessage[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      // Return a cleanup that resets state when sessionId becomes undefined,
      // avoiding a synchronous setState inside the effect body.
      return () => {
        setMessages([]);
        setConnected(false);
      };
    }

    const eventSource = new EventSource(
      `/api/messages/stream?sessionId=${encodeURIComponent(sessionId)}`
    );

    eventSource.onopen = () => setConnected(true);
    eventSource.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ProtocolMessage;
      setMessages((prev) => [...prev, msg]);
    };
    eventSource.onerror = () => setConnected(false);

    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, [sessionId]);

  return { messages, connected };
}
