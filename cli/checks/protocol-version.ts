/**
 * Check 3: Protocol Version
 * Verifies the server reports a known MCP protocol version.
 */
import type { CheckResult } from "../types.js";

const KNOWN_PROTOCOL_VERSIONS = [
  "2024-11-05",
  "2024-10-07",
  "2025-03-26",
];

export function checkProtocolVersion(
  serverInfo: Record<string, string>
): CheckResult {
  const start = Date.now();

  try {
    const version = serverInfo?.protocolVersion;

    if (!version) {
      return {
        name: "Protocol Version",
        passed: false,
        durationMs: Date.now() - start,
        error: "Server did not report a protocol version",
      };
    }

    // Accept known versions or any date-formatted version (YYYY-MM-DD)
    const isKnown = KNOWN_PROTOCOL_VERSIONS.includes(version);
    const isDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(version);

    if (isKnown) {
      return {
        name: "Protocol Version",
        passed: true,
        durationMs: Date.now() - start,
        message: `Version ${version} is supported`,
        details: { version, known: true },
      };
    }

    if (isDateFormat) {
      return {
        name: "Protocol Version",
        passed: true,
        durationMs: Date.now() - start,
        message: `Version ${version} (unrecognized but valid format)`,
        details: { version, known: false },
      };
    }

    return {
      name: "Protocol Version",
      passed: false,
      durationMs: Date.now() - start,
      error: `Unknown protocol version format: "${version}"`,
      details: { version },
    };
  } catch (err) {
    return {
      name: "Protocol Version",
      passed: false,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
