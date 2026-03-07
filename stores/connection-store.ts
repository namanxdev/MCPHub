import { create } from "zustand";

export interface ServerInfo {
  name: string;
  version: string;
  protocolVersion: string;
}

export interface Tool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
  };
}

export interface Resource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

export interface Prompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface ConnectionSession {
  sessionId: string;
  url: string;
  transport: "sse" | "streamable-http";
  serverInfo: ServerInfo;
  tools: Tool[];
  resources: Resource[];
  prompts: Prompt[];
  connectedAt: Date;
}

export interface ConnectionHistoryEntry {
  url: string;
  transport: "sse" | "streamable-http";
  serverName: string;
  toolCount: number;
  connectedAt: Date;
}

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface ConnectionStore {
  // Active session
  session: ConnectionSession | null;
  status: ConnectionStatus;
  error: string | null;

  // History
  history: ConnectionHistoryEntry[];

  // Reconnect state
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  isReconnecting: boolean;
  lastConnectionParams: { url: string; transport: "sse" | "streamable-http" } | null;

  // Actions
  setConnecting: () => void;
  setConnected: (session: ConnectionSession) => void;
  setError: (error: string) => void;
  setDisconnected: () => void;
  addToHistory: (entry: ConnectionHistoryEntry) => void;
  clearHistory: () => void;

  // Reconnect actions
  setReconnecting: (v: boolean) => void;
  incrementReconnectAttempts: () => void;
  resetReconnect: () => void;
  setLastConnectionParams: (params: { url: string; transport: "sse" | "streamable-http" } | null) => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  session: null,
  status: "disconnected",
  error: null,
  history: [],

  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  isReconnecting: false,
  lastConnectionParams: null,

  setConnecting: () => set({ status: "connecting", error: null }),
  setConnected: (session) =>
    set({
      session,
      status: "connected",
      error: null,
      reconnectAttempts: 0,
      isReconnecting: false,
      lastConnectionParams: { url: session.url, transport: session.transport },
    }),
  setError: (error) => set({ status: "error", error }),
  setDisconnected: () =>
    set({ session: null, status: "disconnected", error: null }),
  addToHistory: (entry) =>
    set((state) => ({
      history: [
        entry,
        ...state.history.filter((h) => h.url !== entry.url),
      ].slice(0, 10),
    })),
  clearHistory: () => set({ history: [] }),

  setReconnecting: (v) => set({ isReconnecting: v }),
  incrementReconnectAttempts: () =>
    set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 })),
  resetReconnect: () => set({ reconnectAttempts: 0, isReconnecting: false }),
  setLastConnectionParams: (params) => set({ lastConnectionParams: params }),
}));
