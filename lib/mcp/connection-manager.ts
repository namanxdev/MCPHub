import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/sdk/types.js";

interface StoredConnection {
  client: Client;
  transport: SSEClientTransport | StreamableHTTPClientTransport;
  serverInfo: {
    name: string;
    version: string;
    protocolVersion: string;
  };
  url: string;
  transport_type: "sse" | "streamable-http";
  connectedAt: Date;
  lastActivity: Date;
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
    headers?: Record<string, string>
  ): Promise<{
    sessionId: string;
    serverInfo: StoredConnection["serverInfo"];
    client: Client;
  }> {
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

    this.connections.set(sessionId, {
      client,
      transport,
      serverInfo,
      url,
      transport_type: transportType,
      connectedAt: new Date(),
      lastActivity: new Date(),
    });

    return { sessionId, serverInfo, client };
  }

  async disconnect(sessionId: string): Promise<void> {
    const conn = this.connections.get(sessionId);
    if (!conn) return;
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
