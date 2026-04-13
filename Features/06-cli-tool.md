# Feature 06: CLI Tool

> `npx mcphub test <server>` — Automated MCP server health checks from the command line, CI/CD-ready.

---

## Table of Contents

1. [Overview](#overview)
2. [User Stories](#user-stories)
3. [Sub-features](#sub-features)
4. [Technical Implementation](#technical-implementation)
5. [CLI Output Specification](#cli-output-specification)
6. [Edge Cases & Error Handling](#edge-cases--error-handling)
7. [Verification Criteria](#verification-criteria)

---

## Overview

The CLI tool brings MCPHub's testing capabilities to the **terminal and CI/CD pipelines**. It's the answer to "does my MCP server work?" — answered in one command, with machine-readable output.

### What It Does

1. User runs `npx mcphub test <server-url>`
2. The CLI connects to the MCP server, performs the protocol handshake, and runs a battery of checks:
   - Can it connect? (handshake + `initialize`)
   - Does it report tools? (`tools/list`)
   - Does it report resources? (`resources/list`)
   - Does it report prompts? (`prompts/list`)
   - Are tool schemas valid? (JSON Schema validation)
   - (Optional) Can each tool be invoked without crashing? (smoke test)
3. Results are displayed as a colorized pass/fail report in the terminal
4. Exit code: `0` = all checks passed, `1` = at least one check failed
5. `--json` flag outputs machine-readable JSON for CI/CD integration

### Why a CLI?

| Use Case | Why Web UI Isn't Enough |
|----------|------------------------|
| **CI/CD pipelines** | GitHub Actions, GitLab CI, etc. need a command-line tool that returns exit codes. Can't open a browser in CI. |
| **Pre-commit hooks** | Run `mcphub test` before pushing server code. Automatic, no manual steps. |
| **Quick terminal check** | Sometimes you just want to verify a server is up without opening a browser tab. 5 seconds in the terminal. |
| **Automation scripts** | Monitoring scripts, cron jobs, and DevOps tools operate in the terminal. |
| **Offline development** | Test a local MCP server (`http://localhost:3001`) without needing the hosted MCPHub web app. |

---

## User Stories

### US-6.1: Server Developer Adds Tests to CI
> *As an MCP server developer, I want to add `npx mcphub test http://localhost:3001` to my GitHub Actions workflow so broken builds are caught before merge.*

**Acceptance:** My CI pipeline runs the test command after starting my server. If any check fails, the pipeline fails with exit code 1 and the error is visible in the CI log.

### US-6.2: DevOps Engineer Runs Scheduled Checks
> *As a DevOps engineer, I want to run `mcphub test <server> --json` in a cron job and pipe the output to our monitoring system.*

**Acceptance:** The command outputs structured JSON with pass/fail per check, latency values, and timestamps. My monitoring script parses this and alerts on failures.

### US-6.3: Developer Quickly Checks a Server
> *As a developer, I heard about a new MCP server and want to quickly check if it's working before investing time in integration.*

**Acceptance:** I run `npx mcphub test https://server.example.com/sse` and within 10 seconds I see whether the server is responsive, what tools it has, and if there are any issues.

### US-6.4: Server Developer Tests During Development
> *As an MCP server developer, I want to run `mcphub test --watch` during development so I see test results update automatically as I change my server code.*

**Acceptance:** The CLI re-runs all checks on file change or on a configurable interval, showing updated results each time.

---

## Sub-features

### SF-6.1: `mcphub test <server>` — Core Test Command

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| `<server>` | Yes | Server URL (SSE) or command (stdio). Examples: `https://server.example.com/sse`, `node ./my-server.js` |

**Options:**
| Flag | Default | Description |
|------|---------|-------------|
| `--transport, -t` | `auto` | Force transport type: `sse`, `streamable-http`, `stdio` |
| `--timeout` | `30000` | Global timeout in milliseconds |
| `--json` | `false` | Output results as JSON (for CI/CD) |
| `--verbose, -v` | `false` | Include raw JSON-RPC messages in output |
| `--smoke-test` | `false` | Invoke each tool with empty/default args to check for crashes |
| `--header, -H` | — | Add custom headers (repeatable). Example: `-H "Authorization: Bearer sk-..."` |
| `--junit` | — | Output JUnit XML to specified file path (for CI integration) |
| `--no-color` | `false` | Disable colorized output |

### SF-6.2: Test Suite — What Gets Checked

The test suite runs a series of checks in order. Each check is independent — a failure in one doesn't prevent the others from running.

| # | Check | Pass Criteria | Failure |
|---|-------|--------------|---------|
| 1 | **Connection** | Successfully connects via specified transport | Timeout, refused, DNS failure |
| 2 | **Initialize Handshake** | Server responds to `initialize` with valid capabilities | Invalid response, timeout, protocol version mismatch |
| 3 | **Protocol Version** | Server reports a known MCP protocol version | Unknown or missing version |
| 4 | **Tools List** | `tools/list` returns an array (can be empty) | Error, timeout, invalid format |
| 5 | **Tool Schemas** | Each tool's `inputSchema` is valid JSON Schema | Missing schema, invalid JSON Schema |
| 6 | **Resources List** | `resources/list` returns an array (can be empty) | Error, timeout, invalid format |
| 7 | **Prompts List** | `prompts/list` returns an array (can be empty) | Error, timeout, invalid format |
| 8 | **Tool Smoke Test** *(optional, `--smoke-test`)* | Each tool invoked with empty/default args doesn't crash the server | Server crashes, unhandled error, timeout |

**Additional metrics collected (always):**
- Connection latency (ms)
- `initialize` round-trip time (ms)
- `tools/list` round-trip time (ms)
- `resources/list` round-trip time (ms)
- `prompts/list` round-trip time (ms)
- Per-tool smoke test latency (ms, if `--smoke-test`)
- Total test duration (ms)

### SF-6.3: `mcphub test --watch` — Continuous Mode

- Re-runs the full test suite on a configurable interval (default: 10 seconds)
- Clears the terminal between runs (like `jest --watch`)
- Shows "Run #N — 2/2 passed" summary
- Press `q` to quit, `r` to force re-run
- Useful during development: keep a terminal running while editing server code

### SF-6.4: `mcphub inspect <server>` — Interactive REPL (Future)

> *Not in MVP scope, but designed for extensibility.*

An interactive terminal session where you can:
- List tools, resources, prompts
- Invoke tools by typing `call search_web {"query": "test"}`
- See raw JSON-RPC messages
- Tab completion for tool names

### SF-6.5: `mcphub registry search <query>` — Registry Search (Future)

> *Not in MVP scope, but designed for extensibility.*

Search the MCPHub registry from the CLI:
```
$ npx mcphub registry search "postgresql"

 🟢 pg-mcp — PostgreSQL query & schema access (8 tools)
    https://pg-mcp.example.com/sse
 🟢 supabase-mcp — Supabase database operations (12 tools)
    https://supabase-mcp.example.com/sse
```

### SF-6.6: Configuration File (`.mcphubrc.json`)

Optional config file in the project root for persisting test settings:

```json
{
  "servers": [
    {
      "name": "my-server",
      "url": "http://localhost:3001/sse",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer ${MCP_API_KEY}"
      },
      "timeout": 15000,
      "smokeTest": true
    }
  ],
  "defaults": {
    "timeout": 30000,
    "transport": "auto"
  }
}
```

When run without a `<server>` argument, `mcphub test` reads from `.mcphubrc.json` and tests all configured servers.

Environment variable interpolation (`${VAR}`) is supported for secrets.

---

## Technical Implementation

### Package Structure

```
cli/
├── package.json
├── tsconfig.json
├── bin/
│   └── mcphub.ts           # Entry point: #!/usr/bin/env node
├── commands/
│   ├── test.ts              # `mcphub test` command
│   ├── inspect.ts           # `mcphub inspect` command (future)
│   └── registry.ts          # `mcphub registry` command (future)
├── checks/
│   ├── connection.ts        # Check 1: Can we connect?
│   ├── initialize.ts        # Check 2: Does initialize work?
│   ├── protocol-version.ts  # Check 3: Valid protocol version?
│   ├── tools-list.ts        # Check 4: tools/list works?
│   ├── tool-schemas.ts      # Check 5: Valid JSON Schemas?
│   ├── resources-list.ts    # Check 6: resources/list works?
│   ├── prompts-list.ts      # Check 7: prompts/list works?
│   └── smoke-test.ts        # Check 8: Tool invocations don't crash?
├── reporters/
│   ├── terminal.ts          # Colorized terminal output
│   ├── json.ts              # JSON output (--json flag)
│   └── junit.ts             # JUnit XML output (--junit flag)
├── config/
│   └── loader.ts            # .mcphubrc.json loader
└── types.ts                 # Shared types
```

### `package.json`

```json
{
  "name": "mcphub",
  "version": "1.0.0",
  "description": "MCP server testing tool — Postman for MCP",
  "bin": {
    "mcphub": "./dist/bin/mcphub.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx bin/mcphub.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "commander": "^12.0.0",
    "picocolors": "^1.0.0",
    "ajv": "^8.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsx": "^4.0.0"
  },
  "engines": {
    "node": ">=18"
  },
  "keywords": ["mcp", "model-context-protocol", "testing", "cli"]
}
```

### Entry Point (`bin/mcphub.ts`)

```typescript
#!/usr/bin/env node
import { Command } from "commander";
import { testCommand } from "../commands/test.js";

const program = new Command();

program
  .name("mcphub")
  .description("MCP server testing tool — Postman for MCP")
  .version("1.0.0");

program
  .command("test [server]")
  .description("Run health checks against an MCP server")
  .option("-t, --transport <type>", "Transport type: sse, streamable-http, stdio", "auto")
  .option("--timeout <ms>", "Global timeout in milliseconds", "30000")
  .option("--json", "Output results as JSON")
  .option("-v, --verbose", "Include raw JSON-RPC messages")
  .option("--smoke-test", "Invoke each tool with empty args")
  .option("-H, --header <header...>", "Custom headers (key: value)")
  .option("--junit <path>", "Output JUnit XML to file")
  .option("--no-color", "Disable colors")
  .option("--watch", "Re-run on interval")
  .option("--watch-interval <ms>", "Watch interval in ms", "10000")
  .action(testCommand);

program.parse();
```

### Test Command (`commands/test.ts`)

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import pc from "picocolors";
import { loadConfig } from "../config/loader.js";
import { runChecks } from "../checks/index.js";
import { TerminalReporter } from "../reporters/terminal.js";
import { JsonReporter } from "../reporters/json.js";
import { JunitReporter } from "../reporters/junit.js";

interface CheckResult {
  name: string;
  passed: boolean;
  durationMs: number;
  message?: string;      // Human-readable result description
  error?: string;        // Error message if failed
  details?: any;         // Additional data (tool count, schema errors, etc.)
}

interface TestResult {
  server: string;
  transport: string;
  timestamp: string;
  totalDurationMs: number;
  checks: CheckResult[];
  passed: boolean;        // All checks passed?
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  capabilities?: {
    tools: number;
    resources: number;
    prompts: number;
  };
}

export async function testCommand(server: string | undefined, options: any) {
  // Resolve server from argument or config file
  const targets = server
    ? [{ url: server, ...options }]
    : loadConfig().servers;

  if (targets.length === 0) {
    console.error(pc.red("No server specified. Usage: mcphub test <server-url>"));
    process.exit(1);
  }

  // Select reporter
  const reporter = options.json
    ? new JsonReporter()
    : options.junit
    ? new JunitReporter(options.junit)
    : new TerminalReporter({ verbose: options.verbose, color: options.color !== false });

  let allPassed = true;

  for (const target of targets) {
    const result = await runChecks(target, options);
    reporter.report(result);
    if (!result.passed) allPassed = false;
  }

  reporter.finish();

  // Exit code: 0 = all passed, 1 = at least one failure
  process.exit(allPassed ? 0 : 1);
}
```

### Checks Runner (`checks/index.ts`)

```typescript
import { checkConnection } from "./connection.js";
import { checkInitialize } from "./initialize.js";
import { checkProtocolVersion } from "./protocol-version.js";
import { checkToolsList } from "./tools-list.js";
import { checkToolSchemas } from "./tool-schemas.js";
import { checkResourcesList } from "./resources-list.js";
import { checkPromptsList } from "./prompts-list.js";
import { checkSmokeTest } from "./smoke-test.js";

export async function runChecks(target: ServerTarget, options: TestOptions): Promise<TestResult> {
  const startTime = Date.now();
  const checks: CheckResult[] = [];
  let client: Client | null = null;

  // Check 1: Connection
  const connResult = await checkConnection(target);
  checks.push(connResult);
  if (!connResult.passed) {
    return buildResult(target, checks, startTime);  // Can't continue without connection
  }
  client = connResult.details.client;

  // Check 2: Initialize (already done during connection)
  const initResult = await checkInitialize(client, connResult.details);
  checks.push(initResult);

  // Check 3: Protocol Version
  const versionResult = checkProtocolVersion(connResult.details.serverInfo);
  checks.push(versionResult);

  // Check 4: Tools List
  const toolsResult = await checkToolsList(client, target.timeout);
  checks.push(toolsResult);

  // Check 5: Tool Schemas (only if tools were listed)
  if (toolsResult.passed && toolsResult.details.tools.length > 0) {
    const schemasResult = checkToolSchemas(toolsResult.details.tools);
    checks.push(schemasResult);
  }

  // Check 6: Resources List
  const resourcesResult = await checkResourcesList(client, target.timeout);
  checks.push(resourcesResult);

  // Check 7: Prompts List
  const promptsResult = await checkPromptsList(client, target.timeout);
  checks.push(promptsResult);

  // Check 8: Smoke Test (optional)
  if (options.smokeTest && toolsResult.passed) {
    const smokeResult = await checkSmokeTest(client, toolsResult.details.tools, target.timeout);
    checks.push(smokeResult);
  }

  // Cleanup
  if (client) {
    try { await client.close(); } catch {}
  }

  return buildResult(target, checks, startTime);
}
```

### Terminal Reporter (`reporters/terminal.ts`)

```typescript
import pc from "picocolors";

export class TerminalReporter {
  report(result: TestResult) {
    console.log();
    console.log(pc.bold(`  MCPHub Test — ${result.server}`));
    console.log(pc.dim(`  Transport: ${result.transport} | ${result.timestamp}`));
    console.log();

    for (const check of result.checks) {
      const icon = check.passed ? pc.green("✓") : pc.red("✗");
      const duration = pc.dim(`(${check.durationMs}ms)`);
      const name = check.passed ? check.name : pc.red(check.name);
      
      console.log(`  ${icon} ${name} ${duration}`);
      
      if (check.message) {
        console.log(pc.dim(`    ${check.message}`));
      }
      if (!check.passed && check.error) {
        console.log(pc.red(`    Error: ${check.error}`));
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
      console.log(pc.dim(`  Capabilities: ${result.capabilities.tools} tools, ${result.capabilities.resources} resources, ${result.capabilities.prompts} prompts`));
    }
    
    console.log();
  }

  finish() {
    // No aggregation needed for single-server terminal output
  }
}
```

### JSON Reporter (`reporters/json.ts`)

```typescript
export class JsonReporter {
  private results: TestResult[] = [];

  report(result: TestResult) {
    this.results.push(result);
  }

  finish() {
    // Output as JSON (single object if one server, array if multiple)
    const output = this.results.length === 1 ? this.results[0] : this.results;
    console.log(JSON.stringify(output, null, 2));
  }
}
```

### JUnit Reporter (`reporters/junit.ts`)

```typescript
import { writeFileSync } from "fs";

export class JunitReporter {
  constructor(private outputPath: string) {}
  private results: TestResult[] = [];

  report(result: TestResult) {
    this.results.push(result);
  }

  finish() {
    const xml = this.buildXml();
    writeFileSync(this.outputPath, xml, "utf-8");
    console.log(`JUnit report written to ${this.outputPath}`);
  }

  private buildXml(): string {
    const testsuites = this.results.map(result => {
      const testcases = result.checks.map(check => {
        if (check.passed) {
          return `    <testcase name="${escapeXml(check.name)}" time="${check.durationMs / 1000}" />`;
        } else {
          return `    <testcase name="${escapeXml(check.name)}" time="${check.durationMs / 1000}">
      <failure message="${escapeXml(check.error || 'Check failed')}" />
    </testcase>`;
        }
      }).join("\n");

      return `  <testsuite name="${escapeXml(result.server)}" tests="${result.summary.total}" failures="${result.summary.failed}" time="${result.totalDurationMs / 1000}">
${testcases}
  </testsuite>`;
    }).join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
${testsuites}
</testsuites>`;
  }
}
```

### GitHub Actions Integration Example

```yaml
# .github/workflows/mcp-test.yml
name: MCP Server Tests
on: [push, pull_request]

jobs:
  test-mcp:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install dependencies
        run: npm ci
      
      - name: Start MCP server
        run: npm run start:server &
        env:
          PORT: 3001
      
      - name: Wait for server
        run: sleep 5
      
      - name: Run MCPHub tests
        run: npx mcphub test http://localhost:3001/sse --smoke-test --junit test-results.xml
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: mcp-test-results
          path: test-results.xml
```

---

## CLI Output Specification

### Default (Terminal) Output — All Passing

```
  MCPHub Test — https://my-server.example.com/sse
  Transport: sse | 2026-03-04T10:30:00Z

  ✓ Connection                (142ms)
    Connected to my-mcp-server v1.2.0
  ✓ Initialize Handshake      (130ms)
    Protocol version: 2024-11-05
  ✓ Protocol Version          (0ms)
    Version 2024-11-05 is supported
  ✓ Tools List                (85ms)
    5 tools found
  ✓ Tool Schemas              (2ms)
    All 5 tool schemas are valid JSON Schema
  ✓ Resources List            (62ms)
    2 resources found
  ✓ Prompts List              (58ms)
    1 prompt found

  ─────────────────────────────────────
  7/7 checks passed
  Total time: 479ms
  Capabilities: 5 tools, 2 resources, 1 prompt
```

### Default (Terminal) Output — With Failures

```
  MCPHub Test — https://broken-server.example.com/sse
  Transport: sse | 2026-03-04T10:30:00Z

  ✓ Connection                (2341ms)
    Connected to broken-server v0.1.0
  ✓ Initialize Handshake      (2200ms)
    Protocol version: 2024-11-05
  ✓ Protocol Version          (0ms)
    Version 2024-11-05 is supported
  ✓ Tools List                (156ms)
    3 tools found
  ✗ Tool Schemas              (1ms)
    Error: 2 tools have invalid schemas
      - get_data: inputSchema missing "type" property
      - process_file: inputSchema has invalid "properties" value
  ✓ Resources List            (89ms)
    0 resources found
  ✓ Prompts List              (72ms)
    0 prompts found

  ─────────────────────────────────────
  1/7 checks failed
  Total time: 4859ms
  Capabilities: 3 tools, 0 resources, 0 prompts
```

### JSON Output (`--json`)

```json
{
  "server": "https://my-server.example.com/sse",
  "transport": "sse",
  "timestamp": "2026-03-04T10:30:00Z",
  "totalDurationMs": 479,
  "passed": true,
  "summary": {
    "total": 7,
    "passed": 7,
    "failed": 0,
    "skipped": 0
  },
  "capabilities": {
    "tools": 5,
    "resources": 2,
    "prompts": 1
  },
  "checks": [
    {
      "name": "Connection",
      "passed": true,
      "durationMs": 142,
      "message": "Connected to my-mcp-server v1.2.0"
    },
    {
      "name": "Initialize Handshake",
      "passed": true,
      "durationMs": 130,
      "message": "Protocol version: 2024-11-05"
    }
  ]
}
```

### Verbose Output (`--verbose`)

Includes raw JSON-RPC messages for each check:

```
  ✓ Initialize Handshake      (130ms)
    Protocol version: 2024-11-05

    → Request:
    {
      "jsonrpc": "2.0",
      "method": "initialize",
      "params": {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": { "name": "mcphub-cli", "version": "1.0.0" }
      },
      "id": 1
    }

    ← Response:
    {
      "jsonrpc": "2.0",
      "id": 1,
      "result": {
        "protocolVersion": "2024-11-05",
        "capabilities": { "tools": {}, "resources": {} },
        "serverInfo": { "name": "my-mcp-server", "version": "1.2.0" }
      }
    }
```

---

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|---------|
| **Server unreachable** (DNS failure, connection refused) | Check 1 fails immediately with clear error: "Could not connect: ECONNREFUSED" or "DNS resolution failed for hostname". Exit code 1. Other checks skipped. |
| **Connection timeout** | Fail Check 1 after `--timeout` duration. Show: "Connection timed out after 30000ms". Suggest checking URL and server status. |
| **Server partially implements MCP** (e.g., no `resources/list`) | Each check is independent. Report `resources/list` as failed, but still test tools and prompts. Summary shows which parts work. |
| **stdio server** | Detect non-URL argument (no `://`). Use `StdioClientTransport` to spawn as subprocess. Pass remaining args as command arguments. Example: `mcphub test node ./server.js --stdio-arg foo` |
| **Very slow server** (tools take >10s each) | Per-check timeout using `--timeout`. Show progress indicator for long-running checks. Smoke tests use a shorter per-tool timeout (15s default). |
| **Server requires authentication** | Pass via `--header`: `mcphub test <url> -H "Authorization: Bearer sk-..."`. Config file supports `${ENV_VAR}` interpolation for secrets. |
| **Server returns 0 tools, 0 resources, 0 prompts** | Checks 4, 6, 7 still pass (empty array is valid). Check 5 (schema validation) and Check 8 (smoke test) are skipped. Show: "Server reports no capabilities." |
| **No server argument and no config file** | Print help text: "Usage: mcphub test <server-url>\n\nOr create a .mcphubrc.json file." Exit code 1. |
| **Invalid config file** | Parse error shown with line number if possible: "Error reading .mcphubrc.json: Unexpected token at line 5". Exit code 1. |
| **Multiple servers in config** | Run checks for each server sequentially. Show summary per server and an overall summary at the end. Exit code 1 if *any* server has failures. |
| **npx execution** | Works via `npx mcphub test <url>`. Package published to npm with `"bin"` field. Version check: warn if a newer version is available. |
| **Tool smoke test crashes the server** | Detect connection drop during smoke test. Report: "Server crashed during smoke test of tool 'dangerous_tool'". Mark as failed. Continue with remaining tools. |
| **Non-UTF8 output from stdio server** | Handle binary/non-standard output gracefully. Show: "Server produced non-UTF8 output" as a warning. |
| **SIGINT (Ctrl+C)** | Clean up: close MCP connection, print partial results if any checks completed. Exit code 130 (standard SIGINT). |
| **Watch mode + server restart** | In `--watch` mode, reconnect on each run. If server was restarted between runs, a fresh connection is established automatically. |

---

## Verification Criteria

- [ ] `npx mcphub test <url>` connects to an SSE MCP server and runs all checks
- [ ] Each check shows ✓ (pass) or ✗ (fail) with duration
- [ ] Exit code is `0` when all checks pass, `1` when any fail
- [ ] `--json` outputs valid structured JSON
- [ ] `--verbose` includes raw JSON-RPC messages
- [ ] `--smoke-test` invokes each tool and reports results
- [ ] `--timeout` is respected for all network operations
- [ ] `--header` passes custom headers to the MCP connection
- [ ] `--junit` writes valid JUnit XML to the specified path
- [ ] `.mcphubrc.json` is read when no server argument is provided
- [ ] Environment variable interpolation works in config files
- [ ] Multiple servers from config are tested sequentially with individual reports
- [ ] Unreachable servers fail gracefully with clear error messages
- [ ] The CLI can be installed globally (`npm install -g mcphub`) and run via `mcphub test`
- [ ] Output is properly colorized in terminal (and respects `--no-color`)
- [ ] Ctrl+C cleanly terminates with partial results printed
