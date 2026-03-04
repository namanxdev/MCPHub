/**
 * Check 6: Resources List
 * Verifies resources/list returns a valid array.
 */
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { CheckResult } from "../types.js";

export async function checkResourcesList(
  client: Client,
  timeout: number
): Promise<CheckResult> {
  const start = Date.now();

  try {
    const listPromise = client.listResources();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), timeout)
    );

    const result = await Promise.race([listPromise, timeoutPromise]);

    if (!result || !Array.isArray(result.resources)) {
      return {
        name: "Resources List",
        passed: false,
        durationMs: Date.now() - start,
        error: "resources/list did not return a valid resources array",
      };
    }

    return {
      name: "Resources List",
      passed: true,
      durationMs: Date.now() - start,
      message: `${result.resources.length} resource${result.resources.length !== 1 ? "s" : ""} found`,
      details: {
        count: result.resources.length,
        resources: result.resources,
      },
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return {
      name: "Resources List",
      passed: false,
      durationMs: Date.now() - start,
      error: error === "Timeout"
        ? `resources/list timed out after ${timeout}ms`
        : `resources/list failed: ${error}`,
    };
  }
}
