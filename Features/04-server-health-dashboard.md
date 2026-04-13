# Feature 04: Server Health Dashboard

> Aggregate and visualize performance metrics for MCP servers — per-tool latency, error rates, response sizes, and availability.

---

## Table of Contents

1. [Overview](#overview)
2. [User Stories](#user-stories)
3. [Sub-features](#sub-features)
4. [Technical Implementation](#technical-implementation)
5. [UI Specification](#ui-specification)
6. [Edge Cases & Error Handling](#edge-cases--error-handling)
7. [Verification Criteria](#verification-criteria)

---

## Overview

The Health Dashboard is the **observability layer** of MCPHub. Every other feature generates data — the Playground invokes tools, the Inspector captures messages, the Registry tracks servers — and the Dashboard makes that data **actionable** through metrics, charts, and alerts.

### What It Does

1. **Collects** performance data from every `tools/call` execution:
   - Latency (milliseconds from request to response)
   - Response size (bytes)
   - Success/error status
   - Error type and message
   - Tool name
   - Timestamp
2. **Aggregates** data into meaningful metrics:
   - Average, P50, P95, P99 latency per tool
   - Error rate (errors / total calls) per tool and per server
   - Average response size per tool
   - Call frequency per tool
3. **Visualizes** metrics as:
   - Overview cards (total calls, overall error rate, avg latency)
   - Per-tool metrics table
   - Latency-over-time line charts
   - Error distribution charts
4. **Persists** metrics to the Neon database for historical tracking

### Why This Matters

Currently, there is **no way** to answer fundamental questions about MCP server quality:
- "Is this server fast?" → No latency benchmarks exist
- "Is this server reliable?" → No error rate tracking
- "How does it compare to alternatives?" → No comparison data
- "Has performance degraded?" → No historical trends

The Health Dashboard makes MCP server performance **visible and measurable** for the first time.

---

## User Stories

### US-4.1: Server Author Benchmarks Performance
> *As an MCP server author, I want to see latency and error rates for each of my tools after running test scenarios, so I can identify performance bottlenecks before releasing.*

**Acceptance:** After invoking each tool several times through the Playground, I see a dashboard with per-tool avg/p95 latency, error rate, and response sizes. I notice that my `complex_query` tool has a P95 of 2.3 seconds — much higher than others — and can investigate.

### US-4.2: Platform Team Monitors Dependencies
> *As a platform engineer, I want to monitor the health of MCP servers our AI agents depend on, so I can detect reliability issues before they impact users.*

**Acceptance:** I can see a dashboard with historical latency trends, error rate spikes, and availability for each server in our stack. An error rate jump from 1% to 15% is clearly visible in the chart.

### US-4.3: Developer Compares Two Servers
> *As a developer choosing between two MCP servers that offer similar tools, I want to compare their performance metrics side-by-side, so I can pick the more reliable one.*

**Acceptance:** I can view metrics for Server A and Server B in a comparison layout, with latency and error rates shown side-by-side for equivalent tools.

### US-4.4: Registry Shows Health Data
> *As a developer browsing the registry, I want to see health status badges on server listings, so I can quickly tell which servers are responsive and reliable.*

**Acceptance:** Each registry listing shows a green/yellow/red health badge based on recent uptime and error rate data from automated health checks.

---

## Sub-features

### SF-4.1: Overview Metric Cards
Four key metrics displayed as cards at the top of the dashboard:

| Card | Metric | Calculation |
|------|--------|------------|
| **Total Calls** | Count of all `tools/call` executions | `COUNT(*)` |
| **Avg Latency** | Average response time across all calls | `AVG(latency_ms)` |
| **Error Rate** | Percentage of calls that returned errors | `COUNT(WHERE is_error) / COUNT(*)` |
| **Uptime** | Percentage of health checks where server was reachable | `COUNT(WHERE is_reachable) / COUNT(*)` |

Each card shows:
- Current value (large number)
- Trend arrow (↑/↓) vs. previous period
- Sparkline mini-chart (last 24h / last 7d)

### SF-4.2: Per-Tool Metrics Table

| Column | Value | Sort |
|--------|-------|------|
| Tool Name | `search_web`, `get_weather`, etc. | Alphabetical |
| Call Count | Total invocations | Desc |
| Avg Latency | Average response time | Asc = fastest |
| P50 Latency | 50th percentile | Asc |
| P95 Latency | 95th percentile (important for reliability) | Asc |
| P99 Latency | 99th percentile (tail latency) | Asc |
| Error Rate | % of calls that errored | Asc = most reliable |
| Avg Response Size | Average bytes returned | Desc |
| Last Called | Timestamp of most recent invocation | Desc = most recent |

Features:
- Click column headers to sort
- Search/filter by tool name
- Click a tool row to see detailed drill-down (latency distribution histogram, error log, recent calls)
- Highlight rows where P95 > threshold or error rate > threshold (configurable)

### SF-4.3: Latency Over Time Chart
- **X-axis:** Time (auto-scaled: last hour / 24h / 7d / 30d)
- **Y-axis:** Latency (ms)
- **Lines:** One line per tool (or user can select specific tools)
- **Metrics shown:** Average, P50, P95 (toggle-able)
- **Chart library:** Recharts (React-native, composable, responsive)
- **Interactions:** Hover to see exact values, zoom/pan on time range, click to see individual data points

### SF-4.4: Error Distribution Chart
- **Pie/donut chart:** Errors by type (timeout, server error, malformed response, connection lost, etc.)
- **Bar chart:** Errors over time (per hour/day)
- **Error log table:** Recent errors with timestamp, tool name, error message, response payload

### SF-4.5: Alerting Thresholds (Visual)
- User can set thresholds:
  - P95 latency > X ms → row turns yellow (warning) or red (critical)
  - Error rate > Y% → row turns red
  - Server unreachable for > Z minutes → banner alert
- For MVP: visual indicators only (no push notifications/webhooks)
- Thresholds stored in localStorage (per server)

### SF-4.6: Comparison Mode
- Select two servers (or two time periods for the same server)
- Side-by-side dashboard layout
- Aligned time axes for trend comparison
- Highlight which server/period is better on each metric

### SF-4.7: Export & Embeds
- **Export as CSV:** All metrics data in a flat CSV for spreadsheet analysis
- **Export as JSON:** Structured metrics data
- **Health badge URL:** Embeddable badge (shields.io style) showing server status
  - `![MCPHub Health](https://mcphub.dev/badge/[serverId].svg)` → green "healthy" / yellow "degraded" / red "down"
  - Badge reflects last 24h health check data

---

## Technical Implementation

### Data Collection (`lib/mcp/health-collector.ts`)

Every `tools/call` via the backend records a metric entry:

```typescript
interface ToolCallMetric {
  serverId: string;         // Connection or registry server ID
  serverUrl: string;        // Server URL (for grouping)
  toolName: string;         // Name of the tool invoked
  latencyMs: number;        // Response time in milliseconds
  responseBytes: number;    // Size of response payload
  isError: boolean;         // Whether isError was true, or a transport error occurred
  errorType?: string;       // "tool_error" | "timeout" | "connection_lost" | "malformed_response"
  errorMessage?: string;    // Error message content
  timestamp: Date;          // When the call was made
}

class HealthCollector {
  async recordToolCall(metric: ToolCallMetric): Promise<void> {
    // Insert into Neon database
    await db.insert(serverMetrics).values(metric);
    
    // Also update in-memory session metrics (for real-time dashboard)
    this.sessionMetrics.push(metric);
  }

  async getAggregatedMetrics(serverId: string, timeRange: TimeRange): Promise<AggregatedMetrics> {
    // Query Neon with aggregation functions
  }
}
```

### Database Schema (Neon / PostgreSQL)

```sql
-- Individual tool call metrics
CREATE TABLE server_metrics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id     UUID REFERENCES servers(id),
  server_url    TEXT NOT NULL,
  tool_name     TEXT NOT NULL,
  latency_ms    INTEGER NOT NULL,
  response_bytes INTEGER NOT NULL,
  is_error      BOOLEAN NOT NULL DEFAULT false,
  error_type    TEXT,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient aggregation queries
CREATE INDEX idx_metrics_server_time ON server_metrics(server_id, created_at DESC);
CREATE INDEX idx_metrics_server_tool ON server_metrics(server_id, tool_name);
CREATE INDEX idx_metrics_created_at ON server_metrics(created_at DESC);

-- Periodic health check results (from cron job, Feature 05)
CREATE TABLE server_health_checks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id     UUID REFERENCES servers(id),
  is_reachable  BOOLEAN NOT NULL,
  latency_ms    INTEGER,          -- Time to complete initialize handshake
  tools_count   INTEGER,          -- Number of tools reported
  error_message TEXT,
  checked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_checks_server ON server_health_checks(server_id, checked_at DESC);
```

### Drizzle ORM Schema (`lib/db/schema.ts` excerpt)

```typescript
import { pgTable, uuid, text, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";

export const serverMetrics = pgTable("server_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id").references(() => servers.id),
  serverUrl: text("server_url").notNull(),
  toolName: text("tool_name").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  responseBytes: integer("response_bytes").notNull(),
  isError: boolean("is_error").notNull().default(false),
  errorType: text("error_type"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  serverTimeIdx: index("idx_metrics_server_time").on(table.serverId, table.createdAt),
  serverToolIdx: index("idx_metrics_server_tool").on(table.serverId, table.toolName),
}));
```

### API Routes

#### `GET /api/health?serverId=<id>&range=<24h|7d|30d>`

Returns aggregated metrics for a server.

**Response:**
```json
{
  "overview": {
    "totalCalls": 342,
    "avgLatencyMs": 215,
    "errorRate": 0.023,
    "uptime": 0.997
  },
  "perTool": [
    {
      "toolName": "search_web",
      "callCount": 156,
      "avgLatencyMs": 423,
      "p50LatencyMs": 380,
      "p95LatencyMs": 890,
      "p99LatencyMs": 1240,
      "errorRate": 0.013,
      "avgResponseBytes": 2148,
      "lastCalledAt": "2026-03-04T10:30:00Z"
    },
    {
      "toolName": "get_weather",
      "callCount": 186,
      "avgLatencyMs": 122,
      "p50LatencyMs": 105,
      "p95LatencyMs": 245,
      "p99LatencyMs": 380,
      "errorRate": 0.032,
      "avgResponseBytes": 856,
      "lastCalledAt": "2026-03-04T10:28:00Z"
    }
  ],
  "timeSeries": {
    "interval": "1h",
    "dataPoints": [
      { "timestamp": "2026-03-04T00:00:00Z", "avgLatencyMs": 198, "callCount": 12, "errorCount": 0 },
      { "timestamp": "2026-03-04T01:00:00Z", "avgLatencyMs": 210, "callCount": 8, "errorCount": 1 }
    ]
  },
  "recentErrors": [
    {
      "timestamp": "2026-03-04T10:24:30Z",
      "toolName": "search_web",
      "errorType": "tool_error",
      "errorMessage": "Rate limit exceeded"
    }
  ]
}
```

**Aggregation Queries (PostgreSQL):**

```sql
-- Per-tool metrics with percentiles
SELECT
  tool_name,
  COUNT(*) as call_count,
  AVG(latency_ms) as avg_latency,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY latency_ms) as p50_latency,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) as p99_latency,
  AVG(CASE WHEN is_error THEN 1.0 ELSE 0.0 END) as error_rate,
  AVG(response_bytes) as avg_response_bytes,
  MAX(created_at) as last_called_at
FROM server_metrics
WHERE server_id = $1
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY tool_name
ORDER BY call_count DESC;

-- Time series (hourly buckets)
SELECT
  DATE_TRUNC('hour', created_at) as bucket,
  AVG(latency_ms) as avg_latency,
  COUNT(*) as call_count,
  SUM(CASE WHEN is_error THEN 1 ELSE 0 END) as error_count
FROM server_metrics
WHERE server_id = $1
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY bucket
ORDER BY bucket ASC;
```

### Data Flow

```
Playground (tools/call)
        │
        ▼
/api/tools/call ──────► HealthCollector.recordToolCall()
        │                        │
        │                        ▼
        │               Neon DB: server_metrics table
        │                        │
        ▼                        ▼
  Response to user      /api/health (aggregated queries)
                                 │
                                 ▼
                        Dashboard UI (Recharts)
```

---

## UI Specification

### Main Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  🟢 Connected: my-mcp-server v1.2.0            [Disconnect]    │
├─────────────────────────────────────────────────────────────────┤
│  Health Dashboard          Time Range: [24 hours ▾]             │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ Total Calls │ │ Avg Latency │ │ Error Rate  │ │  Uptime   │ │
│  │    342      │ │   215ms     │ │   2.3%      │ │  99.7%    │ │
│  │   ↑ 12%     │ │   ↓ 5%     │ │   ↑ 0.5%   │ │  = 99.7%  │ │
│  │  ▂▃▅▄▆▇█▇  │ │  █▇▆▅▄▃▂▃  │ │  ▁▁▁▁▂▁▁▃  │ │  ████████ │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│                                                                 │
│  ┌─ Latency Over Time ─────────────────────────────────────┐   │
│  │                                                         │   │
│  │  1000ms ┤                                               │   │
│  │         │          ╭──╮                                 │   │
│  │   500ms ┤      ╭──╯  ╰───╮     ╭──╮                   │   │
│  │         │  ╭──╯           ╰───╯    ╰──╮                │   │
│  │   250ms ┤╯                              ╰──────        │   │
│  │         ├──────────────────────────────────────────     │   │
│  │         00:00   04:00   08:00   12:00   16:00          │   │
│  │                                                         │   │
│  │  ── search_web (P95)  ── get_weather (P95)              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Per-Tool Metrics ──────────────────────────────────────┐   │
│  │  TOOL          CALLS  AVG    P50    P95    ERR%  SIZE   │   │
│  │  ────────────────────────────────────────────────────── │   │
│  │  search_web      156  423ms  380ms  890ms  1.3%  2.1KB │   │
│  │  get_weather     186  122ms  105ms  245ms  3.2%  856B  │   │
│  │  send_email       —    —      —      —      —     —    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Recent Errors ─────────────────────────────────────────┐   │
│  │  10:24:30  search_web  Rate limit exceeded              │   │
│  │  09:15:22  get_weather  Location not found               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Export CSV]  [Export JSON]  [Compare Servers]                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key UI Components

| Component | File | Purpose |
|-----------|------|---------|
| `MetricsCards` | `components/dashboard/metrics-cards.tsx` | Four overview metric cards with sparklines |
| `LatencyChart` | `components/dashboard/latency-chart.tsx` | Recharts line chart for latency over time |
| `ToolMetricsTable` | `components/dashboard/tool-metrics-table.tsx` | Sortable table with per-tool stats |
| `ErrorLog` | `components/dashboard/error-log.tsx` | Recent errors list |
| `ErrorDistribution` | `components/dashboard/error-distribution.tsx` | Pie/donut chart of error types |
| `TimeRangeSelector` | `components/dashboard/time-range-selector.tsx` | 24h / 7d / 30d / custom picker |
| `ComparisonView` | `components/dashboard/comparison-view.tsx` | Side-by-side server/period comparison |
| `HealthBadge` | `components/registry/health-badge.tsx` | Green/yellow/red status indicator (shared with Registry) |

### Recharts Implementation Sketch

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

function LatencyChart({ data, tools }: { data: TimeSeriesPoint[]; tools: string[] }) {
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="timestamp" tickFormatter={formatTime} />
        <YAxis unit="ms" />
        <Tooltip />
        <Legend />
        {tools.map((tool, i) => (
          <Line
            key={tool}
            type="monotone"
            dataKey={`${tool}.p95`}
            stroke={colors[i % colors.length]}
            name={`${tool} (P95)`}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|---------|
| **No metrics data yet** | Show empty state: "No metrics collected yet. Run some tools in the Playground to start seeing data." with a "Go to Playground →" link. |
| **Server with many tools** (50+) | Paginate per-tool table (20 per page). Add search filter. Only show top 10 tools in the latency chart by default. |
| **Outlier latencies** skewing average | Always show P50/P95/P99 alongside average. Use percentiles as the primary metric, average as supplementary. Consider using median in overview cards instead of mean. |
| **Sparse data** (few calls, no meaningful P99) | Show "Insufficient data for P99 (need ≥100 calls)" tooltip. Fall back to showing available percentiles. |
| **Time range with no data** | Show "No data in selected time range" message. Suggest the most recent period that has data. |
| **Clock skew** between MCPHub and MCP server | Use MCPHub's server-side timestamps consistently. Don't rely on clocks from the MCP server for timing calculations. |
| **Database latency** for aggregation queries | Cache aggregated results for 30 seconds. Show "Last updated: X seconds ago" indicator. Index all query columns. |
| **Metrics data grows unbounded** | MVP: no retention policy (data in Neon is cheap). Production: add retention — delete metrics older than 90 days via cron job. Aggregate old data into hourly/daily rollups before deleting. |
| **Session metrics vs. persistent metrics** | Two layers: (1) In-memory session metrics for real-time dashboard during active session. (2) Neon-persisted metrics for historical/registry data. Both feed into the same UI. |
| **Server with 0% error rate and flat latency** | Still show the dashboard — "perfect health" is useful information. Show a green "Healthy" badge. |
| **Comparison mode with incomparable servers** | If Server A has tools that Server B doesn't, show "N/A" for missing tools. Compare only overlapping tool names. |

---

## Verification Criteria

- [ ] Every `tools/call` execution records latency, size, and error status to the metrics store
- [ ] Overview cards show total calls, avg latency, error rate, and uptime
- [ ] Per-tool table shows avg/P50/P95/P99 latency, error rate, and response size
- [ ] Per-tool table is sortable by every column
- [ ] Latency-over-time chart renders correctly with Recharts
- [ ] Time range selector switches between 24h / 7d / 30d views
- [ ] Recent errors list shows timestamp, tool name, and error message
- [ ] Empty state displays correctly when no metrics exist
- [ ] Rows with high error rates or latencies are visually highlighted
- [ ] Export CSV produces a valid, complete CSV file
- [ ] Export JSON produces structured metrics data
- [ ] Dashboard refreshes automatically as new tool calls are made
- [ ] Health badge SVG endpoint returns correct status colors
