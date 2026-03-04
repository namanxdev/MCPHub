#!/usr/bin/env node
/**
 * MCPHub CLI — Entry Point
 * MCP server testing tool — Postman for MCP
 */
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
  .option(
    "-t, --transport <type>",
    "Transport type: sse, streamable-http, stdio, auto",
    "auto"
  )
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
