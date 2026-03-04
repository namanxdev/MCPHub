/**
 * Check 2: Initialize Handshake
 * Verifies the server properly responded to the initialize request.
 */
import type { CheckResult } from "../types.js";

export function checkInitialize(
  serverInfo: Record<string, string>
): CheckResult {
  const start = Date.now();

  try {
    if (!serverInfo) {
      return {
        name: "Initialize Handshake",
        passed: false,
        durationMs: Date.now() - start,
        error: "Server did not return server info during initialization",
      };
    }

    const protocolVersion = serverInfo.protocolVersion || "unknown";

    return {
      name: "Initialize Handshake",
      passed: true,
      durationMs: Date.now() - start,
      message: `Protocol version: ${protocolVersion}`,
      details: { serverInfo },
    };
  } catch (err) {
    return {
      name: "Initialize Handshake",
      passed: false,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
