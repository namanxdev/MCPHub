"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OverviewMetrics {
  totalCalls: number;
  avgLatencyMs: number;
  errorRate: number;
  uptime: number | null;
}

export function MetricsCards({ data }: { data: OverviewMetrics }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Calls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {data.totalCalls.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Tool invocations recorded
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg Latency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-3xl font-bold ${
              data.avgLatencyMs > 2000
                ? "text-destructive"
                : data.avgLatencyMs > 1000
                  ? "text-yellow-500"
                  : ""
            }`}
          >
            {data.avgLatencyMs}ms
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Mean response time
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Error Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-3xl font-bold ${
              data.errorRate > 0.1
                ? "text-destructive"
                : data.errorRate > 0.05
                  ? "text-yellow-500"
                  : ""
            }`}
          >
            {(data.errorRate * 100).toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Failed tool calls
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Uptime
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-3xl font-bold ${
              data.uptime !== null && data.uptime < 0.95
                ? "text-destructive"
                : ""
            }`}
          >
            {data.uptime !== null
              ? `${(data.uptime * 100).toFixed(1)}%`
              : "N/A"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {data.uptime !== null ? "Server availability" : "No health checks"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
