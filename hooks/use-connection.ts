"use client";

import { useConnectionStore } from "@/stores/connection-store";

export function useConnection() {
  const store = useConnectionStore();

  async function connect(
    url: string,
    transport: "sse" | "streamable-http",
    headers: Record<string, string> = {}
  ) {
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
  }

  async function disconnect() {
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
  }

  return {
    session: store.session,
    status: store.status,
    error: store.error,
    history: store.history,
    connect,
    disconnect,
    clearHistory: store.clearHistory,
  };
}
