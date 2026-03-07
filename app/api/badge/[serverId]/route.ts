import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { servers, serverHealthChecks } from "@/lib/db/schema";
import { eq, or, desc } from "drizzle-orm";

function renderBadge(label: string, message: string, color: string): string {
  const labelWidth = Math.max(label.length * 6.5 + 10, 30);
  const messageWidth = Math.max(message.length * 6.5 + 10, 30);
  const totalWidth = labelWidth + messageWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${message}">
  <title>${label}: ${message}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${messageWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text aria-hidden="true" x="${labelWidth + messageWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${message}</text>
    <text x="${labelWidth + messageWidth / 2}" y="14">${message}</text>
  </g>
</svg>`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;

  try {
    const db = getDb();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(serverId);
    const whereClause = isUuid
      ? or(eq(servers.id, serverId), eq(servers.slug, serverId))
      : eq(servers.slug, serverId);

    const serverResults = await db
      .select({ id: servers.id, name: servers.name, status: servers.status })
      .from(servers)
      .where(whereClause)
      .limit(1);

    if (serverResults.length === 0) {
      const svg = renderBadge("MCP", "not found", "#9f9f9f");
      return new Response(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    const server = serverResults[0];

    const checks = await db
      .select()
      .from(serverHealthChecks)
      .where(eq(serverHealthChecks.serverId, server.id))
      .orderBy(desc(serverHealthChecks.checkedAt))
      .limit(1);

    let statusText: string;
    let color: string;

    if (server.status === "unreachable") {
      statusText = "down";
      color = "#e05d44";
    } else if (server.status === "degraded") {
      statusText = "degraded";
      color = "#dfb317";
    } else if (checks.length === 0) {
      statusText = "unknown";
      color = "#9f9f9f";
    } else if (checks[0].isReachable) {
      const latency = checks[0].latencyMs;
      statusText = latency ? `up (${latency}ms)` : "up";
      color = "#4c1";
    } else {
      statusText = "down";
      color = "#e05d44";
    }

    const svg = renderBadge(server.name, statusText, color);
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "max-age=300, s-maxage=300",
      },
    });
  } catch {
    const svg = renderBadge("MCP", "unavailable", "#9f9f9f");
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache",
      },
    });
  }
}
