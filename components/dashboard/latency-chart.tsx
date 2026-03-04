"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface TimeSeriesPoint {
  timestamp: string;
  avgLatencyMs: number;
  callCount: number;
  errorCount: number;
}

export function LatencyChart({ data }: { data: TimeSeriesPoint[] }) {
  const formatted = data.map((d) => ({
    ...d,
    time: new Date(d.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  if (formatted.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
        No latency data available for this time range.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
        <YAxis unit="ms" tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => `${v}ms`} />
        <Legend />
        <Line
          type="monotone"
          dataKey="avgLatencyMs"
          stroke="#3b82f6"
          name="Avg Latency"
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
