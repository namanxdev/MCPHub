/**
 * MCPHub CLI — Config Loader
 * Reads .mcphubrc.json from the current working directory
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { MCPHubConfig, ServerTarget } from "../types.js";

/**
 * Interpolate environment variables in the format ${VAR_NAME}
 */
function interpolateEnvVars(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, varName: string) => {
    const envVal = process.env[varName.trim()];
    if (envVal === undefined) {
      console.warn(
        `Warning: Environment variable "${varName.trim()}" is not set`
      );
      return "";
    }
    return envVal;
  });
}

/**
 * Recursively interpolate environment variables in an object
 */
function interpolateObject<T>(obj: T): T {
  if (typeof obj === "string") {
    return interpolateEnvVars(obj) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => interpolateObject(item)) as T;
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = interpolateObject(value);
    }
    return result as T;
  }
  return obj;
}

/**
 * Load and parse .mcphubrc.json configuration
 */
export function loadConfig(): MCPHubConfig {
  const configPath = resolve(process.cwd(), ".mcphubrc.json");

  if (!existsSync(configPath)) {
    return { servers: [] };
  }

  try {
    const raw = readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    const config = interpolateObject(parsed) as MCPHubConfig;

    // Validate and normalize servers
    if (!Array.isArray(config.servers)) {
      throw new Error('"servers" must be an array');
    }

    config.servers = config.servers.map(
      (server: Partial<ServerTarget>, index: number): ServerTarget => {
        if (!server.url) {
          throw new Error(`Server at index ${index} is missing "url"`);
        }
        return {
          url: server.url,
          name: server.name || server.url,
          transport: server.transport || config.defaults?.transport || "auto",
          timeout: server.timeout || config.defaults?.timeout || 30000,
          headers: server.headers,
          smokeTest: server.smokeTest ?? false,
        };
      }
    );

    return config;
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.error(`Error reading .mcphubrc.json: ${err.message}`);
    } else if (err instanceof Error) {
      console.error(`Error in .mcphubrc.json: ${err.message}`);
    }
    process.exit(1);
  }
}
