/**
 * MCPHub CLI — Checks Runner
 * Orchestrates all health checks against an MCP server
 */
import { checkConnection } from "./connection.js";
import { checkInitialize } from "./initialize.js";
import { checkProtocolVersion } from "./protocol-version.js";
import { checkToolsList } from "./tools-list.js";
import { checkToolSchemas } from "./tool-schemas.js";
import { checkResourcesList } from "./resources-list.js";
import { checkPromptsList } from "./prompts-list.js";
import { checkSmokeTest } from "./smoke-test.js";
import type {
  CheckResult,
  TestResult,
  ServerTarget,
  TestOptions,
} from "../types.js";

function buildResult(
  target: ServerTarget,
  checks: CheckResult[],
  startTime: number
): TestResult {
  const passed = checks.filter((c) => c.passed).length;
  const failed = checks.filter((c) => !c.passed).length;
  const total = checks.length;
  const skipped = 0;

  // Extract capabilities from check details
  const toolsCheck = checks.find((c) => c.name === "Tools List");
  const resourcesCheck = checks.find((c) => c.name === "Resources List");
  const promptsCheck = checks.find((c) => c.name === "Prompts List");

  const capabilities =
    toolsCheck || resourcesCheck || promptsCheck
      ? {
          tools: (toolsCheck?.details?.count as number) ?? 0,
          resources: (resourcesCheck?.details?.count as number) ?? 0,
          prompts: (promptsCheck?.details?.count as number) ?? 0,
        }
      : undefined;

  return {
    server: target.name || target.url,
    transport: target.transport,
    timestamp: new Date().toISOString(),
    totalDurationMs: Date.now() - startTime,
    checks,
    passed: failed === 0,
    summary: { total, passed, failed, skipped },
    capabilities,
  };
}

export async function runChecks(
  target: ServerTarget,
  options: TestOptions
): Promise<TestResult> {
  const startTime = Date.now();
  const checks: CheckResult[] = [];

  // Check 1: Connection
  const connResult = await checkConnection(target);
  checks.push(connResult);

  if (!connResult.passed || !connResult.details?.client) {
    // Can't continue without a connection
    return buildResult(target, checks, startTime);
  }

  const client = connResult.details.client as import("@modelcontextprotocol/sdk/client/index.js").Client;
  const serverInfo = connResult.details.serverInfo as Record<string, string>;

  // Check 2: Initialize (already done during connection, verify result)
  const initResult = checkInitialize(serverInfo);
  checks.push(initResult);

  // Check 3: Protocol Version
  const versionResult = checkProtocolVersion(serverInfo);
  checks.push(versionResult);

  // Check 4: Tools List
  const toolsResult = await checkToolsList(client, target.timeout);
  checks.push(toolsResult);

  // Check 5: Tool Schemas (only if tools were listed successfully)
  if (toolsResult.passed && toolsResult.details?.tools) {
    const tools = toolsResult.details.tools as Array<{ name: string; inputSchema?: unknown }>;
    if (tools.length > 0) {
      const schemasResult = checkToolSchemas(tools);
      checks.push(schemasResult);
    }
  }

  // Check 6: Resources List
  const resourcesResult = await checkResourcesList(client, target.timeout);
  checks.push(resourcesResult);

  // Check 7: Prompts List
  const promptsResult = await checkPromptsList(client, target.timeout);
  checks.push(promptsResult);

  // Check 8: Smoke Test (optional)
  if (target.smokeTest && toolsResult.passed && toolsResult.details?.tools) {
    const tools = toolsResult.details.tools as Array<{ name: string; inputSchema?: unknown }>;
    if (tools.length > 0) {
      const smokeResult = await checkSmokeTest(client, tools, target.timeout);
      checks.push(smokeResult);
    }
  }

  // Cleanup
  try {
    await client.close();
  } catch {
    // Ignore close errors
  }

  return buildResult(target, checks, startTime);
}
