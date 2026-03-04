/**
 * Check 7: Prompts List
 * Verifies prompts/list returns a valid array.
 */
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { CheckResult } from "../types.js";

export async function checkPromptsList(
  client: Client,
  timeout: number
): Promise<CheckResult> {
  const start = Date.now();

  try {
    const listPromise = client.listPrompts();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), timeout)
    );

    const result = await Promise.race([listPromise, timeoutPromise]);

    if (!result || !Array.isArray(result.prompts)) {
      return {
        name: "Prompts List",
        passed: false,
        durationMs: Date.now() - start,
        error: "prompts/list did not return a valid prompts array",
      };
    }

    return {
      name: "Prompts List",
      passed: true,
      durationMs: Date.now() - start,
      message: `${result.prompts.length} prompt${result.prompts.length !== 1 ? "s" : ""} found`,
      details: {
        count: result.prompts.length,
        prompts: result.prompts,
      },
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return {
      name: "Prompts List",
      passed: false,
      durationMs: Date.now() - start,
      error: error === "Timeout"
        ? `prompts/list timed out after ${timeout}ms`
        : `prompts/list failed: ${error}`,
    };
  }
}
