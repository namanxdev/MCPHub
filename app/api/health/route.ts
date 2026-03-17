import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serverMetrics, serverHealthChecks } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { healthLimiter, getClientIp, checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(healthLimiter, getClientIp(request));
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = request.nextUrl;
  const serverUrl = searchParams.get("serverUrl");
  const serverId = searchParams.get("serverId");
  const range = searchParams.get("range") || "24h";

  if (!serverUrl && !serverId) {
    return NextResponse.json(
      { error: "serverUrl or serverId required" },
      { status: 400 }
    );
  }

  const hoursMap: Record<string, number> = { "24h": 24, "7d": 168, "30d": 720 };
  const hours = hoursMap[range] ?? 24;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  try {
    const whereClause = serverUrl
      ? eq(serverMetrics.serverUrl, serverUrl)
      : eq(serverMetrics.serverId, serverId!);

    const metrics = await db
      .select()
      .from(serverMetrics)
      .where(sql`${whereClause} AND ${serverMetrics.createdAt} >= ${since}`)
      .orderBy(desc(serverMetrics.createdAt));

    if (metrics.length === 0) {
      return NextResponse.json({
        overview: { totalCalls: 0, avgLatencyMs: 0, errorRate: 0, uptime: null },
        perTool: [],
        timeSeries: { interval: "1h", dataPoints: [] },
        recentErrors: [],
      });
    }

    // Overview
    const totalCalls = metrics.length;
    const avgLatencyMs = Math.round(
      metrics.reduce((sum, m) => sum + m.latencyMs, 0) / totalCalls
    );
    const errorCount = metrics.filter((m) => m.isError).length;
    const errorRate = errorCount / totalCalls;

    // Per-tool aggregation
    const toolMap = new Map<string, typeof metrics>();
    for (const m of metrics) {
      if (!toolMap.has(m.toolName)) toolMap.set(m.toolName, []);
      toolMap.get(m.toolName)!.push(m);
    }

    function percentile(arr: number[], p: number): number {
      const sorted = [...arr].sort((a, b) => a - b);
      const idx = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[Math.max(0, idx)];
    }

    const perTool = Array.from(toolMap.entries()).map(([toolName, toolMetrics]) => {
      const latencies = toolMetrics.map((m) => m.latencyMs);
      const errs = toolMetrics.filter((m) => m.isError).length;
      const sizes = toolMetrics.map((m) => m.responseBytes);
      return {
        toolName,
        callCount: toolMetrics.length,
        avgLatencyMs: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
        p50LatencyMs: percentile(latencies, 50),
        p95LatencyMs: percentile(latencies, 95),
        p99LatencyMs: percentile(latencies, 99),
        errorRate: errs / toolMetrics.length,
        avgResponseBytes: Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length),
        lastCalledAt: toolMetrics[0].createdAt,
      };
    });

    // Time-series hourly buckets
    const buckets = new Map<
      string,
      { calls: number; errors: number; totalLatency: number }
    >();
    for (const m of metrics) {
      const d = new Date(m.createdAt);
      d.setMinutes(0, 0, 0);
      const key = d.toISOString();
      if (!buckets.has(key)) buckets.set(key, { calls: 0, errors: 0, totalLatency: 0 });
      const b = buckets.get(key)!;
      b.calls++;
      if (m.isError) b.errors++;
      b.totalLatency += m.latencyMs;
    }

    const dataPoints = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([timestamp, b]) => ({
        timestamp,
        avgLatencyMs: Math.round(b.totalLatency / b.calls),
        callCount: b.calls,
        errorCount: b.errors,
      }));

    // Recent errors (up to 10)
    const recentErrors = metrics
      .filter((m) => m.isError)
      .slice(0, 10)
      .map((m) => ({
        timestamp: m.createdAt,
        toolName: m.toolName,
        errorType: m.errorType,
        errorMessage: m.errorMessage,
      }));

    // Uptime from health checks (only when querying by serverId)
    let uptime: number | null = null;
    if (serverId) {
      const checks = await db
        .select()
        .from(serverHealthChecks)
        .where(
          sql`${eq(serverHealthChecks.serverId, serverId)} AND ${serverHealthChecks.checkedAt} >= ${since}`
        )
        .orderBy(desc(serverHealthChecks.checkedAt));

      if (checks.length > 0) {
        uptime = checks.filter((c) => c.isReachable).length / checks.length;
      }
    }

    return NextResponse.json({
      overview: { totalCalls, avgLatencyMs, errorRate, uptime },
      perTool,
      timeSeries: { interval: "1h", dataPoints },
      recentErrors,
    });
  } catch (error) {
    console.error("Health API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
