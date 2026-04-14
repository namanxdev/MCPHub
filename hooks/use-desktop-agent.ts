"use client";

import { useEffect, useState, useCallback } from "react";

const AGENT_WS_URL = "ws://localhost:54319";

// Minimal types based on agent/src/types.ts
export interface AgentRequest {
  id: string;
  type: "connect" | "disconnect" | "call_tool" | "list_tools" |
        "list_resources" | "read_resource" | "list_prompts" | "get_prompt" |
        "list_resource_templates" | "complete";
  payload: {
    transport?: "sse" | "streamable-http" | "stdio";
    url?: string;
    command?: string;
    args?: string[];
    headers?: Record<string, string>;
    env?: Record<string, string>;
    sessionId?: string;
    name?: string;
    arguments?: Record<string, unknown>;
    uri?: string;
    promptName?: string;
    promptArguments?: Record<string, string>;
    ref?: {
      type: "ref/resource" | "ref/prompt";
      uri?: string;
      name?: string;
    };
    argument?: {
      name: string;
      value: string;
    };
  };
}

export interface AgentResponse {
  id: string;
  type: "result" | "error";
  payload: unknown;
  error?: string;
}

export interface SessionInfo {
  sessionId: string;
  capabilities: {
    tools?: unknown;
    resources?: unknown;
    prompts?: unknown;
    logging?: unknown;
  };
  serverInfo: {
    name: string;
    version: string;
    protocolVersion?: string;
  };
}

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
};

// Module-level singleton for WebSocket connection
let ws: WebSocket | null = null;
const pendingRequests = new Map<string, PendingRequest>();
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

function connectWebSocket(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ws?.readyState === WebSocket.OPEN) {
      resolve();
      return;
    }

    if (ws) {
      ws.close();
    }

    try {
      ws = new WebSocket(AGENT_WS_URL);

      ws.onopen = () => {
        connectionAttempts = 0;
        resolve();
      };

      ws.onmessage = (event) => {
        try {
          const response: AgentResponse = JSON.parse(event.data);
          const pending = pendingRequests.get(response.id);
          if (pending) {
            if (response.type === "error") {
              pending.reject(new Error(response.error || "Agent request failed"));
            } else {
              pending.resolve(response.payload);
            }
            pendingRequests.delete(response.id);
          }
        } catch (error) {
          console.error("Failed to parse agent response:", error);
        }
      };

      ws.onclose = () => {
        ws = null;
        // Reject all pending requests
        for (const [id, pending] of pendingRequests) {
          pending.reject(new Error("Agent WebSocket closed"));
        }
        pendingRequests.clear();
        reject(new Error("Agent WebSocket closed"));
      };

      ws.onerror = (error) => {
        console.error("Agent WebSocket error:", error);
        reject(new Error("Agent WebSocket error"));
      };
    } catch (error) {
      reject(error);
    }
  });
}

export async function sendRequest(type: AgentRequest["type"], payload: AgentRequest["payload"]): Promise<unknown> {
  const id = crypto.randomUUID();
  
  // Try to connect if not already connected
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    try {
      await connectWebSocket();
    } catch (error) {
      throw new Error(`Agent not available: ${error instanceof Error ? error.message : "Connection failed"}`);
    }
  }

  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });

    const request: AgentRequest = { id, type, payload };

    try {
      ws!.send(JSON.stringify(request));
      
      // Set timeout for request (30 seconds)
      const timeoutId = setTimeout(() => {
        pendingRequests.delete(id);
        reject(new Error("Agent request timeout"));
      }, 30000);

      // Clean up timeout when request completes
      const pending = pendingRequests.get(id);
      if (pending) {
        const originalResolve = pending.resolve;
        const originalReject = pending.reject;
        
        pending.resolve = (value) => {
          clearTimeout(timeoutId);
          originalResolve(value);
        };
        
        pending.reject = (reason) => {
          clearTimeout(timeoutId);
          originalReject(reason);
        };
      }
    } catch (error) {
      pendingRequests.delete(id);
      reject(new Error(`Failed to send request: ${error instanceof Error ? error.message : "Unknown error"}`));
    }
  });
}

export function useDesktopAgent() {
  const [isAvailable, setIsAvailable] = useState(false);

  const checkAgentAvailability = useCallback(async () => {
    try {
      await connectWebSocket();
      setIsAvailable(true);
    } catch {
      setIsAvailable(false);
    }
  }, []);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let mounted = true;

    const setupPolling = () => {
      checkAgentAvailability();
      
      if (mounted) {
        pollInterval = setInterval(() => {
          if (!ws || ws.readyState !== WebSocket.OPEN) {
            checkAgentAvailability();
          }
        }, 5000); // Poll every 5 seconds
      }
    };

    setupPolling();

    return () => {
      mounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      // Do NOT close ws here — it's a module-level singleton shared across all
      // components. Closing on unmount would tear down the connection for other
      // components still mounted (e.g. playground-content after connect-form unmounts).
    };
  }, [checkAgentAvailability]);

  return {
    isAvailable,
    sendRequest: useCallback((type: AgentRequest["type"], payload: AgentRequest["payload"]) => 
      sendRequest(type, payload), [])
  };
}