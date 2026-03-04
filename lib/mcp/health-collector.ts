import { db } from "@/lib/db";
import { serverMetrics } from "@/lib/db/schema";

export interface ToolCallMetric {
  serverId?: string;
  serverUrl: string;
  toolName: string;
  latencyMs: number;
  responseBytes: number;
  isError: boolean;
  errorType?: string;
  errorMessage?: string;
}

export async function recordToolCall(metric: ToolCallMetric): Promise<void> {
  try {
    await db.insert(serverMetrics).values({
      serverId: metric.serverId ?? null,
      serverUrl: metric.serverUrl,
      toolName: metric.toolName,
      latencyMs: metric.latencyMs,
      responseBytes: metric.responseBytes,
      isError: metric.isError,
      errorType: metric.errorType,
      errorMessage: metric.errorMessage,
    });
  } catch (error) {
    // Silently fail metrics recording — don't break tool calls
    console.error("Failed to record metric:", error);
  }
}
