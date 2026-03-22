import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/sdk/types.js";
import { ProtocolLogger } from "./protocol-logger";

const ALLOWED_COMMANDS = new Set([
  "node",
  "npx",
  "python",
  "python3",
  "pip",
  "pipx",
  "uvx",
  "uv",
  "deno",
  "bun",
  "bunx",
  "tsx",
  "ts-node",
  "docker",
  "go",
  "cargo",
]);

const SHELL_METACHARACTERS = /[;&|`$(){}<>\n]/;

const MAX_CONNECTIONS = 100;

export function validateStdioCommand(command: string): void {
  if (SHELL_METACHARACTERS.test(command)) {
    throw new Error(
      `Invalid stdio command: shell metacharacters are not allowed`
    );
  }

  const firstPart = command.trim().split(/\s+/)[0];
  // Extract the base name from a path (e.g. /usr/bin/node -> node, node.exe -> node)
  const baseName = firstPart.replace(/^.*[\\/]/, "").replace(/\.exe$/i, "");

  if (!ALLOWED_COMMANDS.has(baseName)) {
    throw new Error(
      `Invalid stdio command: "${baseName}" is not in the list of allowed commands`
    );
  }
}

interface StoredConnection {
  client: Client;
  transport: SSEClientTransport | StreamableHTTPClientTransport | StdioClientTransport;
  serverInfo: {
    name: string;
    version: string;
    protocolVersion: string;
  };
  url?: string;
  command?: string;
  transport_type: "sse" | "streamable-http" | "stdio";
  userId?: string;
  connectedAt: Date;
  lastActivity: Date;
  logger: ProtocolLogger;
}

class ConnectionManager {
  private connections: Map<string, StoredConnection> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupTimer();
  }

  async connect(
    url: string,
    transportType: "sse" | "streamable-http",
    headers?: Record<string, string>,
    userId?: string
  ): Promise<{
    sessionId: string;
    serverInfo: StoredConnection["serverInfo"];
    client: Client;
  }> {
    if (this.connections.size >= MAX_CONNECTIONS) {
      throw new Error("Maximum number of concurrent connections reached. Please disconnect an existing session first.");
    }

    const sessionId = crypto.randomUUID();

    const parsedUrl = new URL(url);
    const requestInit: RequestInit = headers ? { headers } : {};

    const transport =
      transportType === "sse"
        ? new SSEClientTransport(parsedUrl, { requestInit })
        : new StreamableHTTPClientTransport(parsedUrl, { requestInit });

    const client = new Client(
      { name: "mcphub", version: "1.0.0" },
      { capabilities: {} }
    );

    await client.connect(transport);

    const serverVersion = client.getServerVersion();
    // protocolVersion is negotiated internally; use the transport's value for
    // StreamableHTTP (which exposes a public getter) or fall back to the SDK's
    // latest version constant as a safe default.
    const protocolVersion =
      transport instanceof StreamableHTTPClientTransport
        ? (transport.protocolVersion ?? LATEST_PROTOCOL_VERSION)
        : LATEST_PROTOCOL_VERSION;

    const serverInfo = {
      name: serverVersion?.name ?? "Unknown",
      version: serverVersion?.version ?? "0.0.0",
      protocolVersion,
    };

    const logger = new ProtocolLogger();

    // Patch transport.send to log outgoing messages.
    // SSEClientTransport.send only accepts one argument while
    // StreamableHTTPClientTransport accepts an optional second argument.
    // We cast through `unknown` so TypeScript accepts the reassignment on
    // both transport union members.
    const originalSend = transport.send.bind(transport) as (
      msg: Parameters<typeof transport.send>[0],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...rest: any[]
    ) => Promise<void>;
    (transport as { send: typeof originalSend }).send = async (
      msg,
      ...rest
    ) => {
      logger.logMessage("sent", msg);
      return originalSend(msg, ...rest);
    };

    // Patch transport.onmessage to log incoming messages.
    // The concrete SSE/StreamableHTTP transport types declare onmessage with a
    // single argument, so we match that signature exactly.
    const originalOnmessage = transport.onmessage;
    transport.onmessage = (msg) => {
      logger.logMessage("received", msg);
      if (originalOnmessage) {
        originalOnmessage(msg);
      }
    };

    this.connections.set(sessionId, {
      client,
      transport,
      serverInfo,
      url,
      transport_type: transportType,
      userId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      logger,
    });

    return { sessionId, serverInfo, client };
  }

  async connectStdio(
    command: string,
    env?: Record<string, string>,
    userId?: string
  ): Promise<{
    sessionId: string;
    serverInfo: StoredConnection["serverInfo"];
    client: Client;
  }> {
    validateStdioCommand(command);

    if (this.connections.size >= MAX_CONNECTIONS) {
      throw new Error("Maximum number of concurrent connections reached. Please disconnect an existing session first.");
    }

    const sessionId = crypto.randomUUID();

    const parts = command.split(/\s+/);
    const [cmd, ...args] = parts;

    const transport = new StdioClientTransport({
      command: cmd,
      args,
      env: { ...process.env, ...env } as Record<string, string>,
      stderr: "pipe",
    });

    const client = new Client(
      { name: "mcphub", version: "1.0.0" },
      { capabilities: {} }
    );

    await client.connect(transport);

    const serverVersion = client.getServerVersion();
    const serverInfo = {
      name: serverVersion?.name ?? "Unknown",
      version: serverVersion?.version ?? "0.0.0",
      protocolVersion: LATEST_PROTOCOL_VERSION,
    };

    const logger = new ProtocolLogger();

    // Patch transport.send to log outgoing messages
    const originalSend = transport.send.bind(transport);
    (transport as { send: typeof originalSend }).send = async (msg) => {
      logger.logMessage("sent", msg);
      return originalSend(msg);
    };

    // Patch transport.onmessage to log incoming messages
    const originalOnmessage = transport.onmessage;
    transport.onmessage = (msg) => {
      logger.logMessage("received", msg);
      if (originalOnmessage) {
        originalOnmessage(msg);
      }
    };

    this.connections.set(sessionId, {
      client,
      transport,
      serverInfo,
      command,
      transport_type: "stdio",
      userId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      logger,
    });

    return { sessionId, serverInfo, client };
  }

  async disconnect(sessionId: string, userId?: string): Promise<void> {
    const conn = this.connections.get(sessionId);
    if (!conn) return;
    if (userId && conn.userId && conn.userId !== userId) return;
    try {
      await conn.client.close();
    } catch {
      // ignore close errors
    }
    this.connections.delete(sessionId);
  }

  getClient(sessionId: string): Client | undefined {
    const conn = this.connections.get(sessionId);
    if (conn) conn.lastActivity = new Date();
    return conn?.client;
  }

  getConnection(sessionId: string): StoredConnection | undefined {
    return this.connections.get(sessionId);
  }

  /** Get a connection only if it belongs to the given user. */
  getConnectionForUser(sessionId: string, userId: string): StoredConnection | undefined {
    const conn = this.connections.get(sessionId);
    if (!conn) return undefined;
    if (conn.userId && conn.userId !== userId) return undefined;
    conn.lastActivity = new Date();
    return conn;
  }

  getLogger(sessionId: string): ProtocolLogger | undefined {
    const conn = this.connections.get(sessionId);
    if (conn) conn.lastActivity = new Date();
    return conn?.logger;
  }

  private startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [id, conn] of this.connections) {
        if (now - conn.lastActivity.getTime() > 30 * 60 * 1000) {
          conn.client.close().catch(() => {});
          this.connections.delete(id);
        }
      }
    }, 5 * 60 * 1000);

    // Prevent the timer from keeping the process alive in tests
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }
}

// Singleton — persists across requests in the same Node.js process
const globalForConnectionManager = global as unknown as {
  connectionManager: ConnectionManager;
};
export const connectionManager =
  globalForConnectionManager.connectionManager ?? new ConnectionManager();
if (process.env.NODE_ENV !== "production") {
  globalForConnectionManager.connectionManager = connectionManager;
}
