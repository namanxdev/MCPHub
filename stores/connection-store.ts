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

  // Actions
  setConnecting: () => void;
  setConnected: (session: ConnectionSession) => void;
  setError: (error: string) => void;
  setDisconnected: () => void;
  addToHistory: (entry: ConnectionHistoryEntry) => void;
  clearHistory: () => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  session: null,
  status: "disconnected",
  error: null,
  history: [],

  setConnecting: () => set({ status: "connecting", error: null }),
  setConnected: (session) => set({ session, status: "connected", error: null }),
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
}));
