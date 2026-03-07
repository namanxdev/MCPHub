"use client";

import { useCallback, useEffect, useRef } from "react";
import { useConnectionStore } from "@/stores/connection-store";

export function useConnection() {
  const store = useConnectionStore();
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(
    async (
      url: string,
      transport: "sse" | "streamable-http",
      headers: Record<string, string> = {}
    ) => {
      store.setConnecting();
      try {
        const res = await fetch("/api/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, transport, headers }),
        });

        const data = await res.json();

        if (!res.ok) {
          store.setError(data.error ?? "Connection failed");
          return false;
        }

        store.setConnected({
          sessionId: data.sessionId,
          url,
          transport,
          serverInfo: data.serverInfo,
          tools: data.capabilities.tools,
          resources: data.capabilities.resources,
          prompts: data.capabilities.prompts,
          connectedAt: new Date(),
        });

        store.addToHistory({
          url,
          transport,
          serverName: data.serverInfo.name,
          toolCount: data.capabilities.tools.length,
          connectedAt: new Date(),
        });

        return true;
      } catch (e) {
        store.setError(e instanceof Error ? e.message : "Connection failed");
        return false;
      }
    },
    [store]
  );

  const disconnect = useCallback(async () => {
    // Cancel any pending reconnect
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    store.resetReconnect();

    const sessionId = store.session?.sessionId;
    if (!sessionId) return;

    try {
      await fetch("/api/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
    } catch {
      // ignore fetch errors on disconnect
    } finally {
      store.setDisconnected();
    }
  }, [store]);

  const attemptReconnect = useCallback(async () => {
    const {
      lastConnectionParams,
      reconnectAttempts,
      maxReconnectAttempts,
      isReconnecting,
    } = useConnectionStore.getState();

    if (!lastConnectionParams || isReconnecting) return;
    if (reconnectAttempts >= maxReconnectAttempts) {
      store.setError(
        `Reconnection failed after ${maxReconnectAttempts} attempts`
      );
      store.resetReconnect();
      return;
    }

    store.setReconnecting(true);
    store.incrementReconnectAttempts();

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);

    reconnectTimerRef.current = setTimeout(async () => {
      const success = await connect(
        lastConnectionParams.url,
        lastConnectionParams.transport
      );
      if (!success) {
        store.setReconnecting(false);
        // Schedule next attempt
        attemptReconnect();
      }
    }, delay);
  }, [connect, store]);

  // Clean up reconnect timer on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, []);

  return {
    session: store.session,
    status: store.status,
    error: store.error,
    history: store.history,
    isReconnecting: store.isReconnecting,
    reconnectAttempts: store.reconnectAttempts,
    connect,
    disconnect,
    attemptReconnect,
    clearHistory: store.clearHistory,
  };
}
