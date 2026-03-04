/**
 * MCPHub CLI — `mcphub test` command
 */
import pc from "picocolors";
import { loadConfig } from "../config/loader.js";
import { runChecks } from "../checks/index.js";
import { TerminalReporter } from "../reporters/terminal.js";
import { JsonReporter } from "../reporters/json.js";
import { JunitReporter } from "../reporters/junit.js";
import type { ServerTarget, TestOptions, Reporter } from "../types.js";

function parseHeaders(headerArgs?: string[]): Record<string, string> | undefined {
  if (!headerArgs || headerArgs.length === 0) return undefined;
  const headers: Record<string, string> = {};
  for (const h of headerArgs) {
    const colonIndex = h.indexOf(":");
    if (colonIndex === -1) {
      console.warn(`Warning: Ignoring malformed header "${h}" (missing ":")`);
      continue;
    }
    const key = h.slice(0, colonIndex).trim();
    const value = h.slice(colonIndex + 1).trim();
    headers[key] = value;
  }
  return Object.keys(headers).length > 0 ? headers : undefined;
}

function resolveTransport(
  url: string,
  transportOpt: string
): "sse" | "streamable-http" | "stdio" {
  if (transportOpt !== "auto") {
    return transportOpt as "sse" | "streamable-http" | "stdio";
  }
  // Auto-detect: if it doesn't look like a URL, assume stdio
  if (!url.includes("://")) {
    return "stdio";
  }
  // Default to SSE for URLs
  if (url.endsWith("/sse") || url.includes("/sse?")) {
    return "sse";
  }
  return "streamable-http";
}

export async function testCommand(
  server: string | undefined,
  options: TestOptions
): Promise<void> {
  const headers = parseHeaders(options.header);
  const timeout = parseInt(options.timeout, 10);

  // Resolve server targets from argument or config file
  let targets: ServerTarget[];

  if (server) {
    const transport = resolveTransport(server, options.transport);
    targets = [
      {
        url: server,
        name: server,
        transport,
        timeout,
        headers,
        smokeTest: options.smokeTest,
      },
    ];
  } else {
    const config = loadConfig();
    targets = config.servers;
    if (targets.length === 0) {
      console.error(
        pc.red(
          "No server specified. Usage: mcphub test <server-url>\n\nOr create a .mcphubrc.json file."
        )
      );
      process.exit(1);
    }
  }

  // Select reporter
  let reporter: Reporter;
  if (options.json) {
    reporter = new JsonReporter();
  } else if (options.junit) {
    reporter = new JunitReporter(options.junit);
  } else {
    reporter = new TerminalReporter({
      verbose: options.verbose ?? false,
      color: options.color !== false,
    });
  }

  // Watch mode
  if (options.watch) {
    const interval = parseInt(options.watchInterval || "10000", 10);
    await runWatch(targets, options, reporter, interval);
    return;
  }

  // Single run
  let allPassed = true;
  for (const target of targets) {
    const mergedTarget: ServerTarget = {
      ...target,
      timeout: target.timeout || timeout,
      headers: target.headers || headers,
      smokeTest: target.smokeTest || options.smokeTest,
    };
    const result = await runChecks(mergedTarget, options);
    reporter.report(result);
    if (!result.passed) allPassed = false;
  }

  reporter.finish();
  process.exit(allPassed ? 0 : 1);
}

async function runWatch(
  targets: ServerTarget[],
  options: TestOptions,
  reporter: Reporter,
  intervalMs: number
): Promise<void> {
  let runCount = 0;

  const handleSignal = () => {
    console.log(pc.dim("\nExiting watch mode..."));
    process.exit(0);
  };
  process.on("SIGINT", handleSignal);

  // Listen for keypress if stdin is a TTY
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (key: string) => {
      if (key === "q" || key === "\u0003") {
        handleSignal();
      }
    });
  }

  const runOnce = async () => {
    runCount++;
    console.clear();
    console.log(pc.dim(`Watch mode — Run #${runCount}\n`));

    let allPassed = true;
    for (const target of targets) {
      const result = await runChecks(target, options);
      reporter.report(result);
      if (!result.passed) allPassed = false;
    }

    const status = allPassed
      ? pc.green(`Run #${runCount} — All servers passed`)
      : pc.red(`Run #${runCount} — Some checks failed`);
    console.log(pc.dim("\n" + status));
    console.log(pc.dim("Press q to quit, waiting for next run..."));
  };

  await runOnce();
  setInterval(runOnce, intervalMs);

  // Keep alive
  await new Promise(() => {});
}
