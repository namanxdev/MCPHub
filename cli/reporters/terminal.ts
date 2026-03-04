/**
 * MCPHub CLI — Terminal Reporter
 * Colorized terminal output for test results.
 */
import pc from "picocolors";
import type { TestResult, Reporter } from "../types.js";

interface TerminalReporterOptions {
  verbose: boolean;
  color: boolean;
}

export class TerminalReporter implements Reporter {
  private options: TerminalReporterOptions;
  private resultCount = 0;

  constructor(options: TerminalReporterOptions) {
    this.options = options;
  }

  report(result: TestResult): void {
    this.resultCount++;

    console.log();
    console.log(pc.bold(`  MCPHub Test — ${result.server}`));
    console.log(
      pc.dim(`  Transport: ${result.transport} | ${result.timestamp}`)
    );
    console.log();

    for (const check of result.checks) {
      const icon = check.passed ? pc.green("✓") : pc.red("✗");
      const duration = pc.dim(`(${check.durationMs}ms)`);
      const name = check.passed ? check.name : pc.red(check.name);

      // Pad check name for alignment
      const paddedName = name.padEnd(check.passed ? 26 : 26 + 10); // account for ANSI codes
      console.log(`  ${icon} ${paddedName} ${duration}`);

      if (check.message) {
        // Support multi-line messages (e.g. schema error list)
        const lines = check.message.split("\n");
        for (const line of lines) {
          console.log(pc.dim(`    ${line}`));
        }
      }

      if (!check.passed && check.error) {
        console.log(pc.red(`    Error: ${check.error}`));
      }

      // Verbose: show raw details
      if (this.options.verbose && check.details) {
        console.log(pc.dim("    Details:"));
        const detailStr = JSON.stringify(check.details, null, 2);
        for (const line of detailStr.split("\n")) {
          console.log(pc.dim(`      ${line}`));
        }
      }
    }

    console.log();
    console.log(pc.dim("  ─────────────────────────────────────"));

    const { passed, failed, total } = result.summary;
    const status = result.passed
      ? pc.green(pc.bold(`  ${passed}/${total} checks passed`))
      : pc.red(pc.bold(`  ${failed}/${total} checks failed`));

    console.log(status);
    console.log(pc.dim(`  Total time: ${result.totalDurationMs}ms`));

    if (result.capabilities) {
      console.log(
        pc.dim(
          `  Capabilities: ${result.capabilities.tools} tools, ${result.capabilities.resources} resources, ${result.capabilities.prompts} prompts`
        )
      );
    }

    console.log();
  }

  finish(): void {
    if (this.resultCount > 1) {
      console.log(pc.dim("  All servers tested."));
      console.log();
    }
  }
}
