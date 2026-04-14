"use client";

import { useCallback, useEffect, useRef } from "react";
import { useConnectionStore } from "@/stores/connection-store";
import { sendRequest, type SessionInfo } from "./use-desktop-agent";

export type ConnectParams =
  | { transport: "sse" | "streamable-http"; url: string; headers?: Record<string, string> }
  | { transport: "stdio"; command: string; env?: Record<string, string> };

export interface ConnectOptions {
  agentMode?: boolean;
}

export function useConnection() {
  const store = useConnectionStore();
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(
    async (params: ConnectParams, options?: ConnectOptions) => {
      const { agentMode = false } = options || {};

      store.setConnecting();
      try {
        let data;
        if (agentMode) {
          // Connect through agent WebSocket
          const payload: Record<string, unknown> = {
            transport: params.transport,
          };

          if (params.transport === "stdio") {
            payload.command = params.command;
            if (params.env) payload.env = params.env;
          } else {
            payload.url = params.url;
            if (params.headers) payload.headers = params.headers;
          }

          const sessionInfo = await sendRequest("connect", payload) as SessionInfo;
          
          data = {
            sessionId: sessionInfo.sessionId,
            serverInfo: sessionInfo.serverInfo,
            capabilities: {
              tools: sessionInfo.capabilities.tools || [],
              resources: sessionInfo.capabilities.resources || [],
              prompts: sessionInfo.capabilities.prompts || [],
            },
          };
        } else {
          // Connect through regular API route
          const res = await fetch("/api/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error ?? "Connection failed");
          }

          data = await res.json();
        }

        const sessionData = {
          sessionId: data.sessionId,
          url: params.transport !== "stdio" ? params.url : undefined,
          command: params.transport === "stdio" ? params.command : undefined,
          transport: params.transport,
          serverInfo: data.serverInfo,
          tools: Array.isArray(data.capabilities.tools) ? data.capabilities.tools : [],
          resources: Array.isArray(data.capabilities.resources) ? data.capabilities.resources : [],
          prompts: Array.isArray(data.capabilities.prompts) ? data.capabilities.prompts : [],
          connectedAt: new Date(),
          isAgentSession: agentMode,
        };

        store.setConnected(sessionData);

        store.addToHistory({
          url: params.transport !== "stdio" ? params.url : undefined,
          command: params.transport === "stdio" ? params.command : undefined,
          transport: params.transport,
          serverName: data.serverInfo.name,
          toolCount: Array.isArray(data.capabilities.tools) ? data.capabilities.tools.length : 0,
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

    const isAgentSession = store.isAgentSession;

    try {
      if (isAgentSession) {
        // Send disconnect through agent WebSocket
        await sendRequest("disconnect", { sessionId });
      } else {
        await fetch("/api/disconnect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
      }
    } catch {
      // ignore fetch errors on disconnect
    } finally {
      store.setDisconnected();
    }
  }, [store, sendRequest]);

  const attemptReconnect = useCallback(async () => {
    const {
      lastConnectionParams,
      reconnectAttempts,
      maxReconnectAttempts,
      isReconnecting,
      isAgentSession,
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
      const success = await connect(lastConnectionParams, { agentMode: isAgentSession });
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
    isAgentSession: store.isAgentSession,
    connect,
    disconnect,
    attemptReconnect,
    clearHistory: store.clearHistory,
  };
}
