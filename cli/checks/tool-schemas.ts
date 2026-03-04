/**
 * Check 5: Tool Schemas
 * Validates each tool's inputSchema is valid JSON Schema.
 */
import AjvModule from "ajv";
import type { CheckResult } from "../types.js";

interface ToolInfo {
  name: string;
  inputSchema?: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Ajv = (AjvModule as any).default || AjvModule;

export function checkToolSchemas(tools: ToolInfo[]): CheckResult {
  const start = Date.now();
  const ajv = new Ajv({ allErrors: true, strict: false });
  const errors: string[] = [];

  for (const tool of tools) {
    if (!tool.inputSchema) {
      errors.push(`${tool.name}: missing inputSchema`);
      continue;
    }

    if (typeof tool.inputSchema !== "object" || tool.inputSchema === null) {
      errors.push(`${tool.name}: inputSchema is not an object`);
      continue;
    }

    const schema = tool.inputSchema as Record<string, unknown>;

    // Check for required "type" property
    if (!schema.type) {
      errors.push(`${tool.name}: inputSchema missing "type" property`);
      continue;
    }

    // Validate as JSON Schema
    try {
      ajv.compile(schema);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${tool.name}: invalid JSON Schema — ${msg}`);
    }
  }

  if (errors.length === 0) {
    return {
      name: "Tool Schemas",
      passed: true,
      durationMs: Date.now() - start,
      message: `All ${tools.length} tool schema${tools.length !== 1 ? "s are" : " is"} valid JSON Schema`,
      details: { validCount: tools.length },
    };
  }

  return {
    name: "Tool Schemas",
    passed: false,
    durationMs: Date.now() - start,
    error: `${errors.length} tool${errors.length !== 1 ? "s have" : " has"} invalid schemas`,
    message: errors.map((e) => `  - ${e}`).join("\n"),
    details: { errors, invalidCount: errors.length },
  };
}
