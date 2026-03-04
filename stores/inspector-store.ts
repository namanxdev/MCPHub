import { create } from "zustand";
import type { ProtocolMessage } from "@/lib/mcp/protocol-logger";

export type { ProtocolMessage };

interface InspectorStore {
  messages: ProtocolMessage[];
  selectedMessageId: string | null;
  directionFilter: "all" | "sent" | "received";
  statusFilter: "all" | "success" | "error";
  searchQuery: string;
  minLatencyMs: number | null;
  autoScroll: boolean;

  addMessage: (msg: ProtocolMessage) => void;
  selectMessage: (id: string | null) => void;
  setDirectionFilter: (f: "all" | "sent" | "received") => void;
  setStatusFilter: (f: "all" | "success" | "error") => void;
  setSearchQuery: (q: string) => void;
  setMinLatencyMs: (ms: number | null) => void;
  toggleAutoScroll: () => void;
  clearMessages: () => void;
}

export const useInspectorStore = create<InspectorStore>((set) => ({
  messages: [],
  selectedMessageId: null,
  directionFilter: "all",
  statusFilter: "all",
  searchQuery: "",
  minLatencyMs: null,
  autoScroll: true,

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  selectMessage: (id) => set({ selectedMessageId: id }),
  setDirectionFilter: (f) => set({ directionFilter: f }),
  setStatusFilter: (f) => set({ statusFilter: f }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setMinLatencyMs: (ms) => set({ minLatencyMs: ms }),
  toggleAutoScroll: () =>
    set((state) => ({ autoScroll: !state.autoScroll })),
  clearMessages: () => set({ messages: [], selectedMessageId: null }),
}));
