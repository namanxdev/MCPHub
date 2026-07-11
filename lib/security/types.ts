// lib/security/types.ts
export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type Status = "pass" | "fail" | "advisory" | "error" | "info";
export type Exposure = "exposed" | "inconclusive" | "enforced" | "unreachable";

export interface Finding {
  id: string;
  title: string;
  category: string;
  severity: Severity;
  status: Status;
  detail: string;
}

export interface ToolFingerprint {
  name: string;
  hash: string; // sha256 of name + description + inputSchema
}

export interface ScanResult {
  target: string;
  serverId: string | null;
  scannedAt: string;
  score: number;
  grade: string;
  findings: Finding[];
  tools: ToolFingerprint[];
}

/** One tool as returned by tools/list (only fields the scanner reads). */
export interface ProbedTool {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

/** Normalized entry mapped from the official MCP registry API. */
export interface RegistryEntry {
  name: string;
  title: string;
  description: string;
  version: string;
  url: string;
}

/** Parsed OAuth `.well-known` metadata documents (shape is server-defined). */
export interface WellKnownDocs {
  prm: Record<string, unknown> | null;
  asm: Record<string, unknown> | null;
}
