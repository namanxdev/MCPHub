import { create } from "zustand";

export interface ExecutionRecord {
  id: string;
  timestamp: Date;
  toolName: string;
  arguments: Record<string, unknown>;
  result: unknown;
  isError: boolean;
  latencyMs: number;
  responseBytes: number;
}

interface PlaygroundStore {
  selectedToolName: string | null;
  formValues: Record<string, unknown>;
  isExecuting: boolean;
  lastResult: unknown | null;
  executionHistory: ExecutionRecord[];

  selectTool: (name: string | null) => void;
  setFormValues: (values: Record<string, unknown>) => void;
  setExecuting: (v: boolean) => void;
  addResult: (record: ExecutionRecord) => void;
  clearHistory: () => void;
}

export const usePlaygroundStore = create<PlaygroundStore>((set) => ({
  selectedToolName: null,
  formValues: {},
  isExecuting: false,
  lastResult: null,
  executionHistory: [],

  selectTool: (name) =>
    set({ selectedToolName: name, formValues: {}, lastResult: null }),
  setFormValues: (values) => set({ formValues: values }),
  setExecuting: (v) => set({ isExecuting: v }),
  addResult: (record) =>
    set((state) => ({
      lastResult: record.result,
      executionHistory: [record, ...state.executionHistory].slice(0, 100),
    })),
  clearHistory: () => set({ executionHistory: [] }),
}));
