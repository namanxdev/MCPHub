/**
 * MCPHub CLI — Shared Types
 */

export interface CheckResult {
  name: string;
  passed: boolean;
  durationMs: number;
  message?: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface TestResult {
  server: string;
  transport: string;
  timestamp: string;
  totalDurationMs: number;
  checks: CheckResult[];
  passed: boolean;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  capabilities?: {
    tools: number;
    resources: number;
    prompts: number;
  };
}

export interface ServerTarget {
  url: string;
  name?: string;
  transport: "sse" | "streamable-http" | "stdio" | "auto";
  timeout: number;
  headers?: Record<string, string>;
  smokeTest?: boolean;
}

export interface TestOptions {
  transport: string;
  timeout: string;
  json?: boolean;
  verbose?: boolean;
  smokeTest?: boolean;
  header?: string[];
  junit?: string;
  color?: boolean;
  watch?: boolean;
  watchInterval?: string;
}

export interface MCPHubConfig {
  servers: ServerTarget[];
  defaults?: {
    timeout?: number;
    transport?: "sse" | "streamable-http" | "stdio" | "auto";
  };
}

export interface Reporter {
  report(result: TestResult): void;
  finish(): void;
}
