/**
 * Check 8: Tool Smoke Test
 * Invokes each tool with empty/default args to verify the server doesn't crash.
 */
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { CheckResult } from "../types.js";

interface ToolInfo {
  name: string;
  inputSchema?: unknown;
}

interface ToolTestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

function buildDefaultArgs(inputSchema?: unknown): Record<string, unknown> {
  if (!inputSchema || typeof inputSchema !== "object") return {};

  const schema = inputSchema as Record<string, unknown>;
  const properties = schema.properties as Record<string, Record<string, unknown>> | undefined;
  const required = (schema.required as string[]) || [];

  if (!properties) return {};

  const args: Record<string, unknown> = {};

  for (const propName of required) {
    const prop = properties[propName];
    if (!prop) continue;

    switch (prop.type) {
      case "string":
        args[propName] = prop.default ?? "test";
        break;
      case "number":
      case "integer":
        args[propName] = prop.default ?? 0;
        break;
      case "boolean":
        args[propName] = prop.default ?? false;
        break;
      case "array":
        args[propName] = prop.default ?? [];
        break;
      case "object":
        args[propName] = prop.default ?? {};
        break;
      default:
        args[propName] = prop.default ?? "";
    }
  }

  return args;
}

export async function checkSmokeTest(
  client: Client,
  tools: ToolInfo[],
  timeout: number
): Promise<CheckResult> {
  const start = Date.now();
  const perToolTimeout = Math.min(timeout, 15000);
  const results: ToolTestResult[] = [];

  for (const tool of tools) {
    const toolStart = Date.now();
    try {
      const args = buildDefaultArgs(tool.inputSchema);
      const callPromise = client.callTool({ name: tool.name, arguments: args });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timeout after ${perToolTimeout}ms`)),
          perToolTimeout
        )
      );

      await Promise.race([callPromise, timeoutPromise]);

      results.push({
        name: tool.name,
        passed: true,
        durationMs: Date.now() - toolStart,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);

      // Check if server disconnected (crashed)
      const isCrash =
        error.includes("ECONNRESET") ||
        error.includes("socket hang up") ||
        error.includes("connection closed");

      results.push({
        name: tool.name,
        passed: false,
        durationMs: Date.now() - toolStart,
        error: isCrash
          ? `Server crashed during smoke test of tool '${tool.name}'`
          : error,
      });

      // If server crashed, stop testing remaining tools
      if (isCrash) break;
    }
  }

  const passedTools = results.filter((r) => r.passed);
  const failedTools = results.filter((r) => !r.passed);
  const allPassed = failedTools.length === 0;

  const message = allPassed
    ? `All ${results.length} tool${results.length !== 1 ? "s" : ""} responded without crashing`
    : failedTools
        .map((t) => `  - ${t.name}: ${t.error}`)
        .join("\n");

  return {
    name: "Tool Smoke Test",
    passed: allPassed,
    durationMs: Date.now() - start,
    message,
    error: allPassed
      ? undefined
      : `${failedTools.length}/${results.length} tool${failedTools.length !== 1 ? "s" : ""} failed smoke test`,
    details: {
      total: results.length,
      passed: passedTools.length,
      failed: failedTools.length,
      results,
    },
  };
}
