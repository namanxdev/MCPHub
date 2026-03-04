/**
 * Check 1: Connection
 * Attempts to connect to the MCP server and perform the initialize handshake.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { CheckResult, ServerTarget } from "../types.js";

export async function checkConnection(target: ServerTarget): Promise<CheckResult> {
  const start = Date.now();

  try {
    const parsedUrl = new URL(target.url);
    const requestInit: RequestInit = target.headers ? { headers: target.headers } : {};

    let transport: SSEClientTransport | StreamableHTTPClientTransport;

    if (target.transport === "sse") {
      transport = new SSEClientTransport(parsedUrl, { requestInit });
    } else if (target.transport === "streamable-http") {
      transport = new StreamableHTTPClientTransport(parsedUrl, { requestInit });
    } else {
      // Auto-detect: try streamable-http first, fall back to SSE
      try {
        transport = new StreamableHTTPClientTransport(parsedUrl, { requestInit });
        const testClient = new Client({ name: "mcphub-cli", version: "1.0.0" });

        const connectPromise = testClient.connect(transport);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Connection timeout")), target.timeout)
        );
        await Promise.race([connectPromise, timeoutPromise]);

        const serverImpl = testClient.getServerVersion();
        const durationMs = Date.now() - start;
        // Protocol version may be available on extended info
        const serverInfoObj = serverImpl as Record<string, unknown> | undefined;

        return {
          name: "Connection",
          passed: true,
          durationMs,
          message: `Connected to ${serverImpl?.name || "unknown"} v${serverImpl?.version || "unknown"}`,
          details: {
            client: testClient as unknown,
            transport: "streamable-http",
            serverInfo: {
              name: serverImpl?.name || "unknown",
              version: serverImpl?.version || "unknown",
              protocolVersion: (serverInfoObj?.protocolVersion as string) || "unknown",
            },
          },
        };
      } catch {
        // Fall back to SSE
        transport = new SSEClientTransport(parsedUrl, { requestInit });
      }
    }

    const client = new Client({ name: "mcphub-cli", version: "1.0.0" });

    const connectPromise = client.connect(transport);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Connection timeout")), target.timeout)
    );

    await Promise.race([connectPromise, timeoutPromise]);

    const serverImpl = client.getServerVersion();
    const durationMs = Date.now() - start;
    const serverInfoObj = serverImpl as Record<string, unknown> | undefined;

    return {
      name: "Connection",
      passed: true,
      durationMs,
      message: `Connected to ${serverImpl?.name || "unknown"} v${serverImpl?.version || "unknown"}`,
      details: {
        client: client as unknown,
        transport: target.transport,
        serverInfo: {
          name: serverImpl?.name || "unknown",
          version: serverImpl?.version || "unknown",
          protocolVersion: (serverInfoObj?.protocolVersion as string) || "unknown",
        },
      },
    };
  } catch (err) {
    const durationMs = Date.now() - start;
    const error = err instanceof Error ? err.message : String(err);

    let userMessage = `Could not connect: ${error}`;
    if (error.includes("ECONNREFUSED")) {
      userMessage = `Could not connect: Connection refused. Is the server running at ${target.url}?`;
    } else if (error.includes("ENOTFOUND") || error.includes("getaddrinfo")) {
      userMessage = `DNS resolution failed for ${new URL(target.url).hostname}`;
    } else if (error.includes("timeout") || error.includes("Timeout")) {
      userMessage = `Connection timed out after ${target.timeout}ms`;
    }

    return {
      name: "Connection",
      passed: false,
      durationMs,
      error: userMessage,
    };
  }
}
