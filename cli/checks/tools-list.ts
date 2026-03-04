/**
 * Check 4: Tools List
 * Verifies tools/list returns a valid array.
 */
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { CheckResult } from "../types.js";

export async function checkToolsList(
  client: Client,
  timeout: number
): Promise<CheckResult> {
  const start = Date.now();

  try {
    const listPromise = client.listTools();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), timeout)
    );

    const result = await Promise.race([listPromise, timeoutPromise]);

    if (!result || !Array.isArray(result.tools)) {
      return {
        name: "Tools List",
        passed: false,
        durationMs: Date.now() - start,
        error: "tools/list did not return a valid tools array",
      };
    }

    return {
      name: "Tools List",
      passed: true,
      durationMs: Date.now() - start,
      message: `${result.tools.length} tool${result.tools.length !== 1 ? "s" : ""} found`,
      details: {
        count: result.tools.length,
        tools: result.tools,
      },
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return {
      name: "Tools List",
      passed: false,
      durationMs: Date.now() - start,
      error: error === "Timeout"
        ? `tools/list timed out after ${timeout}ms`
        : `tools/list failed: ${error}`,
    };
  }
}
