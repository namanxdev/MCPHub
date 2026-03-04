import { create } from "zustand";

export interface ProtocolMessage {
  id: string;
  timestamp: number;
  direction: "sent" | "received";
  raw: string;
  parsed: Record<string, unknown>;
  correlationId?: number | string;
  latencyMs?: number;
  sizeBytes: number;
}

interface InspectorStore {
  messages: ProtocolMessage[];
  selectedMessageId: string | null;
  directionFilter: "all" | "sent" | "received";
  searchQuery: string;
  autoScroll: boolean;

  addMessage: (msg: ProtocolMessage) => void;
  selectMessage: (id: string | null) => void;
  setDirectionFilter: (f: "all" | "sent" | "received") => void;
  setSearchQuery: (q: string) => void;
  toggleAutoScroll: () => void;
  clearMessages: () => void;
}

export const useInspectorStore = create<InspectorStore>((set) => ({
  messages: [],
  selectedMessageId: null,
  directionFilter: "all",
  searchQuery: "",
  autoScroll: true,

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  selectMessage: (id) => set({ selectedMessageId: id }),
  setDirectionFilter: (f) => set({ directionFilter: f }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  toggleAutoScroll: () =>
    set((state) => ({ autoScroll: !state.autoScroll })),
  clearMessages: () => set({ messages: [], selectedMessageId: null }),
}));
