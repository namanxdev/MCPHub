import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { servers, serverHealthChecks } from "@/lib/db/schema";
import { ne, eq, desc, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const allServers = await db
    .select()
    .from(servers)
    .where(and(
      ne(servers.status, "removed"),
      eq(servers.serverType, "hosted")
    ));

  const results: Array<{
    serverId: string;
    name: string;
    status: string;
    latencyMs?: number;
    error?: string;
  }> = [];

  for (const server of allServers) {
    const startTime = Date.now();
    try {
      if (!server.url) {
        throw new Error("Server has no URL configured");
      }

      const { Client } = await import(
        "@modelcontextprotocol/sdk/client/index.js"
      );
      const { SSEClientTransport } = await import(
        "@modelcontextprotocol/sdk/client/sse.js"
      );
      const { StreamableHTTPClientTransport } = await import(
        "@modelcontextprotocol/sdk/client/streamableHttp.js"
      );

      const parsedUrl = new URL(server.url);
      const transport =
        server.transportType === "streamable-http"
          ? new StreamableHTTPClientTransport(parsedUrl)
          : new SSEClientTransport(parsedUrl);

      const client = new Client(
        { name: "mcphub-healthcheck", version: "1.0.0" },
        { capabilities: {} }
      );

      await Promise.race([
        client.connect(transport),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Connection timeout")), 15000)
        ),
      ]);

      const toolsResult = await client.listTools();
      await client.close();

      const latencyMs = Date.now() - startTime;
      const toolsCount = toolsResult.tools.length;

      await db.insert(serverHealthChecks).values({
        serverId: server.id,
        isReachable: true,
        latencyMs,
        toolsCount,
      });

      // Reset status to active if it was degraded/unreachable
      if (server.status === "degraded" || server.status === "unreachable") {
        await db
          .update(servers)
          .set({ status: "active", updatedAt: new Date() })
          .where(eq(servers.id, server.id));
      }

      results.push({
        serverId: server.id,
        name: server.name,
        status: "healthy",
        latencyMs,
      });
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";

      await db.insert(serverHealthChecks).values({
        serverId: server.id,
        isReachable: false,
        errorMessage: errorMsg,
      });

      // Count consecutive failures from recent checks
      const recentChecks = await db
        .select({ isReachable: serverHealthChecks.isReachable })
        .from(serverHealthChecks)
        .where(eq(serverHealthChecks.serverId, server.id))
        .orderBy(desc(serverHealthChecks.checkedAt))
        .limit(5);

      const consecutiveFailures = recentChecks.filter(
        (c) => !c.isReachable
      ).length;

      const newStatus =
        consecutiveFailures >= 5
          ? "unreachable"
          : consecutiveFailures >= 2
          ? "degraded"
          : server.status;

      if (newStatus !== server.status) {
        await db
          .update(servers)
          .set({ status: newStatus, updatedAt: new Date() })
          .where(eq(servers.id, server.id));
      }

      results.push({
        serverId: server.id,
        name: server.name,
        status: "failed",
        error: errorMsg,
      });
    }
  }

  return NextResponse.json({ checked: results.length, results });
}
