"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useConnectionStore } from "@/stores/connection-store";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { LatencyChart } from "@/components/dashboard/latency-chart";
import { ToolMetricsTable } from "@/components/dashboard/tool-metrics-table";
import type { ToolMetric } from "@/components/dashboard/tool-metrics-table";
import { ErrorLog } from "@/components/dashboard/error-log";
import { TimeRangeSelector } from "@/components/dashboard/time-range-selector";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface OverviewMetrics {
  totalCalls: number;
  avgLatencyMs: number;
  errorRate: number;
  uptime: number | null;
}

interface TimeSeriesPoint {
  timestamp: string;
  avgLatencyMs: number;
  callCount: number;
  errorCount: number;
}

interface ErrorEntry {
  timestamp: string;
  toolName: string;
  errorType: string | null | undefined;
  errorMessage: string | null | undefined;
}

interface HealthData {
  overview: OverviewMetrics;
  perTool: ToolMetric[];
  timeSeries: { interval: string; dataPoints: TimeSeriesPoint[] };
  recentErrors: ErrorEntry[];
}

const REFRESH_INTERVAL_MS = 30_000;

function exportCsv(perTool: ToolMetric[]) {
  const headers = [
    "Tool",
    "Calls",
    "Avg ms",
    "P50 ms",
    "P95 ms",
    "P99 ms",
    "Error%",
    "Avg Size (bytes)",
  ];
  const rows = perTool.map((t) => [
    t.toolName,
    t.callCount,
    t.avgLatencyMs,
    t.p50LatencyMs,
    t.p95LatencyMs,
    t.p99LatencyMs,
    (t.errorRate * 100).toFixed(1),
    t.avgResponseBytes,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tool-metrics.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function exportJson(data: HealthData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "health-metrics.json";
  a.click();
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const session = useConnectionStore((s) => s.session);
  const [range, setRange] = useState("24h");
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!session?.url) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        serverUrl: session.url,
        range,
      });
      const res = await fetch(`/api/health?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        if (res.status === 500 && (body as { error?: string }).error === "Failed to fetch metrics") {
          setError("database_error");
        } else {
          setError((body as { error?: string }).error ?? "Failed to fetch health data");
        }
        return;
      }
      const json = (await res.json()) as HealthData;
      setData(json);
      setLastRefreshed(new Date());
    } catch {
      setError("Failed to fetch health data. Check your network connection.");
    } finally {
      setLoading(false);
    }
  }, [session?.url, range]);

  // Initial fetch and range changes
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!session?.url) return;
    const timer = setInterval(() => {
      void fetchData();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [session?.url, fetchData]);

  // No active connection
  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Server Health Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          Connect to a server from the Playground to see health metrics.
        </p>
        <Button asChild>
          <Link href="/playground">Go to Playground</Link>
        </Button>
      </div>
    );
  }

  const serverName = session.serverInfo.name;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Health Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            <span className="font-medium">{serverName}</span>
            <span className="mx-1.5 text-muted-foreground/50">·</span>
            <span className="font-mono text-xs">{session.url}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TimeRangeSelector value={range} onChange={setRange} />
          <Button
            size="sm"
            variant="outline"
            onClick={() => void fetchData()}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Last refreshed */}
      {lastRefreshed && (
        <p className="text-xs text-muted-foreground -mt-2">
          Last updated: {lastRefreshed.toLocaleTimeString()} · Auto-refreshes
          every 30s
        </p>
      )}

      {/* Database error state */}
      {error === "database_error" && (
        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
          Database not configured. Set the{" "}
          <code className="font-mono">DATABASE_URL</code> environment variable
          to enable metrics recording.
        </div>
      )}

      {/* Generic error state */}
      {error && error !== "database_error" && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Metrics cards */}
      {data && <MetricsCards data={data.overview} />}

      {/* Latency chart */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latency Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <LatencyChart data={data.timeSeries.dataPoints} />
          </CardContent>
        </Card>
      )}

      {/* Tool metrics table */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Per-Tool Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ToolMetricsTable data={data.perTool} />
          </CardContent>
        </Card>
      )}

      {/* Error log */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorLog errors={data.recentErrors} />
          </CardContent>
        </Card>
      )}

      {/* Export buttons */}
      {data && (
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportCsv(data.perTool)}
            disabled={data.perTool.length === 0}
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportJson(data)}
          >
            Export JSON
          </Button>
        </div>
      )}

      {/* Loading skeleton when no data yet */}
      {loading && !data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border bg-card py-6 px-6 animate-pulse">
                <div className="h-3 w-20 bg-muted rounded mb-3" />
                <div className="h-8 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border bg-card py-6 px-6 h-48 animate-pulse" />
        </div>
      )}
    </div>
  );
}
