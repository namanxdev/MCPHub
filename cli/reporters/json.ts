/**
 * MCPHub CLI — JSON Reporter
 * Outputs test results as structured JSON.
 */
import type { TestResult, Reporter } from "../types.js";

export class JsonReporter implements Reporter {
  private results: TestResult[] = [];

  report(result: TestResult): void {
    // Strip non-serializable details (like client instances)
    const cleanResult = {
      ...result,
      checks: result.checks.map((check) => ({
        name: check.name,
        passed: check.passed,
        durationMs: check.durationMs,
        message: check.message,
        error: check.error,
        // Only include serializable details
        details: check.details
          ? sanitizeDetails(check.details)
          : undefined,
      })),
    };
    this.results.push(cleanResult);
  }

  finish(): void {
    const output =
      this.results.length === 1 ? this.results[0] : this.results;
    console.log(JSON.stringify(output, null, 2));
  }
}

/**
 * Remove non-serializable values from details object
 */
function sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    // Skip client instances and transport objects
    if (key === "client" || key === "transport") continue;
    // Skip functions
    if (typeof value === "function") continue;
    clean[key] = value;
  }
  return clean;
}
