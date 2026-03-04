/**
 * MCPHub CLI — JUnit XML Reporter
 * Outputs test results as JUnit XML for CI integration.
 */
import { writeFileSync } from "fs";
import type { TestResult, Reporter } from "../types.js";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export class JunitReporter implements Reporter {
  private results: TestResult[] = [];

  constructor(private outputPath: string) {}

  report(result: TestResult): void {
    this.results.push(result);
  }

  finish(): void {
    const xml = this.buildXml();
    writeFileSync(this.outputPath, xml, "utf-8");
    console.log(`JUnit report written to ${this.outputPath}`);
  }

  private buildXml(): string {
    const testsuites = this.results
      .map((result) => {
        const testcases = result.checks
          .map((check) => {
            if (check.passed) {
              return `    <testcase name="${escapeXml(check.name)}" classname="${escapeXml(result.server)}" time="${(check.durationMs / 1000).toFixed(3)}" />`;
            } else {
              return `    <testcase name="${escapeXml(check.name)}" classname="${escapeXml(result.server)}" time="${(check.durationMs / 1000).toFixed(3)}">
      <failure message="${escapeXml(check.error || "Check failed")}">${escapeXml(check.message || check.error || "Check failed")}</failure>
    </testcase>`;
            }
          })
          .join("\n");

        return `  <testsuite name="${escapeXml(result.server)}" tests="${result.summary.total}" failures="${result.summary.failed}" time="${(result.totalDurationMs / 1000).toFixed(3)}" timestamp="${result.timestamp}">
${testcases}
  </testsuite>`;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
${testsuites}
</testsuites>
`;
  }
}
