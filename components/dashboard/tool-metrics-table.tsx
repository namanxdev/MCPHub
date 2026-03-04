"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface ToolMetric {
  toolName: string;
  callCount: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRate: number;
  avgResponseBytes: number;
  lastCalledAt: string;
}

type SortKey = keyof ToolMetric;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface SortIconProps {
  column: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
}

function SortIcon({ column, sortKey, sortDir }: SortIconProps) {
  if (column !== sortKey)
    return <span className="ml-1 text-muted-foreground/40">&#8597;</span>;
  return (
    <span className="ml-1 text-foreground">
      {sortDir === "asc" ? "↑" : "↓"}
    </span>
  );
}

export function ToolMetricsTable({ data }: { data: ToolMetric[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("callCount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = data
    .filter((t) =>
      t.toolName.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === "string" && typeof bv === "string"
          ? av.localeCompare(bv)
          : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const columns: { key: SortKey; label: string }[] = [
    { key: "toolName", label: "Tool Name" },
    { key: "callCount", label: "Calls" },
    { key: "avgLatencyMs", label: "Avg ms" },
    { key: "p50LatencyMs", label: "P50 ms" },
    { key: "p95LatencyMs", label: "P95 ms" },
    { key: "p99LatencyMs", label: "P99 ms" },
    { key: "errorRate", label: "Error%" },
    { key: "avgResponseBytes", label: "Avg Size" },
    { key: "lastCalledAt", label: "Last Called" },
  ];

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search tools..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {data.length === 0 ? "No tool metrics available." : "No tools match your search."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-3 py-2 text-left font-medium cursor-pointer select-none hover:text-foreground whitespace-nowrap"
                  >
                    {col.label}
                    <SortIcon column={col.key} sortKey={sortKey} sortDir={sortDir} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const isHighError = row.errorRate > 0.1;
                const isSlowP95 = row.p95LatencyMs > 2000;
                const rowClass = isHighError
                  ? "bg-destructive/5 hover:bg-destructive/10"
                  : isSlowP95
                    ? "bg-yellow-500/5 hover:bg-yellow-500/10"
                    : "hover:bg-muted/50";

                return (
                  <tr key={row.toolName} className={`border-b last:border-0 ${rowClass}`}>
                    <td className="px-3 py-2 font-mono font-medium">
                      {row.toolName}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {row.callCount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{row.avgLatencyMs}</td>
                    <td className="px-3 py-2 tabular-nums">{row.p50LatencyMs}</td>
                    <td
                      className={`px-3 py-2 tabular-nums ${
                        row.p95LatencyMs > 2000 ? "text-yellow-600 font-medium" : ""
                      }`}
                    >
                      {row.p95LatencyMs}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{row.p99LatencyMs}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {row.errorRate > 0.1 ? (
                        <Badge variant="destructive">
                          {(row.errorRate * 100).toFixed(1)}%
                        </Badge>
                      ) : row.errorRate > 0.05 ? (
                        <span className="text-yellow-600 font-medium">
                          {(row.errorRate * 100).toFixed(1)}%
                        </span>
                      ) : (
                        `${(row.errorRate * 100).toFixed(1)}%`
                      )}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatBytes(row.avgResponseBytes)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(row.lastCalledAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
