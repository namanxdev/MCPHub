import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  servers,
  serverTools,
  serverResources,
  serverPrompts,
  serverHealthChecks,
} from "@/lib/db/schema";
import { eq, or, desc } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;

  try {
    // Fetch server by ID (UUID) or slug (string)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(serverId);
    const whereClause = isUuid
      ? or(eq(servers.id, serverId), eq(servers.slug, serverId))
      : eq(servers.slug, serverId);

    const serverResults = await db
      .select()
      .from(servers)
      .where(whereClause)
      .limit(1);

    if (serverResults.length === 0) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const server = serverResults[0];

    // Fetch capabilities and recent health checks in parallel
    const [tools, resources, prompts, healthChecks] = await Promise.all([
      db
        .select()
        .from(serverTools)
        .where(eq(serverTools.serverId, server.id)),
      db
        .select()
        .from(serverResources)
        .where(eq(serverResources.serverId, server.id)),
      db
        .select()
        .from(serverPrompts)
        .where(eq(serverPrompts.serverId, server.id)),
      db
        .select()
        .from(serverHealthChecks)
        .where(eq(serverHealthChecks.serverId, server.id))
        .orderBy(desc(serverHealthChecks.checkedAt))
        .limit(10),
    ]);

    return NextResponse.json({
      server,
      capabilities: { tools, resources, prompts },
      healthChecks,
    });
  } catch (error) {
    console.error("Registry [serverId] GET error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
