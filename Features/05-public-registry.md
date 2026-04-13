# Feature 05: Public Registry

> A searchable, health-checked directory of MCP servers — community-submitted, automatically validated, and integrated with the Playground.

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

The Public Registry is MCPHub's **discovery engine**. It's the answer to "what MCP servers exist, and which ones work?"

### What It Does

1. **Hosts a searchable directory** of MCP servers with metadata:
   - Name, description, author, repository URL
   - Categories and tags (e.g., "Search", "Database", "DevOps", "Communication")
   - Transport type (SSE, Streamable HTTP)
   - Full list of tools, resources, and prompts the server exposes
2. **Validates servers automatically:**
   - On submission: MCPHub connects to the server, performs the MCP handshake, enumerates capabilities
   - Periodically (cron): re-checks all servers for availability and capability changes
3. **Shows live health status:**
   - Each server listing displays a health badge (green/yellow/red) based on automated checks
   - Click through to see full health metrics (Feature 04)
4. **Integrates with the Playground:**
   - "Test in Playground" button on every server listing
   - Pre-connects and navigates to `/playground/[serverId]`

### Seeding Strategy

The registry is initially seeded with **20–30 MCP servers** from the [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) GitHub list. For each server:
1. Parse the awesome-mcp-servers README to extract names, descriptions, and URLs
2. Attempt to connect and enumerate capabilities
3. Create a registry entry with auto-populated metadata
4. Run an initial health check

After seeding, the registry grows through community submissions.

---

## User Stories

### US-5.1: Developer Discovers Servers by Category
> *As a developer building an AI agent that needs web search capabilities, I want to browse MCP servers in the "Search" category, so I can find and evaluate candidates.*

**Acceptance:** I navigate to the registry, filter by "Search" category, and see a list of relevant servers with descriptions, tool counts, and health badges. I can compare them and click "Test" on the most promising ones.

### US-5.2: Server Author Submits a New Server
> *As an MCP server author, I want to submit my server to the MCPHub registry so other developers can discover and use it.*

**Acceptance:** I fill out a submission form with my server's URL, name, description, and categories. MCPHub automatically connects to my server, verifies it responds, and lists it in the registry with auto-populated tool information.

### US-5.3: Developer Checks Server Health Before Integrating
> *As a developer, I found an MCP server I want to integrate. Before committing, I want to see whether it's been consistently up and responsive.*

**Acceptance:** The server's detail page shows a health history chart (last 7 days), current uptime percentage, average latency, and any recent error spikes. I see it's been 99.8% uptime with sub-200ms latency — I'm confident to integrate.

### US-5.4: Developer Searches by Keyword
> *As a developer, I need an MCP server for "PostgreSQL" but don't know what category it's in. I want to search by keyword.*

**Acceptance:** I type "PostgreSQL" in the search bar and see all servers whose name, description, or tool names mention PostgreSQL — regardless of what category they're in.

### US-5.5: API Consumer Queries Registry Programmatically
> *As a developer building a tool that recommends MCP servers, I want to query the MCPHub registry via API to get server listings and health data.*

**Acceptance:** I can call `GET /api/registry?q=search&category=Search` and receive a JSON array of matching servers with metadata and health status.

---

## Sub-features

### SF-5.1: Server Listing Card
Each server in the registry is displayed as a card:

```
┌─ Server Card ──────────────────────────────────────────┐
│  🟢 web-search-mcp                          ★ Featured │
│  by @author-name                                       │
│                                                        │
│  Search the web using multiple search engines with     │
│  configurable result limits and filtering.             │
│                                                        │
│  [Search] [Web] [API]                    5 tools       │
│                                                        │
│  Avg latency: 215ms  |  Uptime: 99.8%  |  ↗ GitHub    │
│                                                        │
│  [Test in Playground →]        [View Details →]        │
└────────────────────────────────────────────────────────┘
```

**Card elements:**
- Health badge (green/yellow/red dot)
- Server name (linked to detail page)
- Author name (linked to author URL if provided)
- Short description (first 2 lines, truncated)
- Category/tag badges
- Tool count
- Key metrics: avg latency, uptime percentage
- GitHub/repo link
- Action buttons: Test in Playground, View Details

### SF-5.2: Browse & Search
- **Search bar:** Full-text search across name, description, tool names, and tags
- **Category filter:** Dropdown or sidebar with categories:
  - Search & Web
  - Database & Storage
  - DevOps & Infrastructure
  - Communication (Email, Slack, etc.)
  - File System & Documents
  - AI & ML
  - Development Tools
  - Finance & Business
  - Media & Content
  - Other
- **Sort by:** Newest, Most Tools, Best Health (uptime), Most Popular (call count), Alphabetical
- **Health filter:** All / Healthy only / Include degraded / Include unreachable
- **Transport filter:** All / SSE / Streamable HTTP
- **Results layout:** Grid (default) or list view toggle

### SF-5.3: Server Detail Page (`/registry/[serverId]`)
A full-page view of a single server with:

1. **Header:** Server name, author, description, repo link, submit date, last updated
2. **Health Overview:** Uptime badge, avg latency, error rate, health history chart (last 7 days)
3. **Capabilities:**
   - **Tools tab:** Full list with name, description, input schema (expandable)
   - **Resources tab:** Full list with URI, name, MIME type
   - **Prompts tab:** Full list with name, description, arguments
4. **Tags & Categories:** Editable by author (future), set on submission initially
5. **Action buttons:**
   - "Test in Playground" → navigates to `/playground/[serverId]` with pre-connection
   - "Copy Server URL"
   - "View on GitHub" (if repo URL provided)
6. **Health History:** Full dashboard integration (links to Feature 04 data for this server)

### SF-5.4: Submission Flow

**Step 1: Submit Form (`/registry/submit`)**
- Fields:
  - Server URL (required) — the MCP endpoint
  - Server Name (required) — human-readable name
  - Short Description (required) — max 280 characters
  - Long Description (optional) — markdown, max 5000 characters
  - Categories (required) — multi-select from predefined list
  - Tags (optional) — free-form, comma-separated
  - Author Name (required)
  - Author URL (optional) — personal site or GitHub profile
  - Repository URL (optional) — GitHub/GitLab/etc.
  - Transport Type (required) — SSE or Streamable HTTP

**Step 2: Automatic Validation**
- MCPHub backend connects to the provided URL
- Performs MCP handshake (`initialize`)
- Enumerates capabilities (`tools/list`, `resources/list`, `prompts/list`)
- If successful: submission is auto-approved and listed immediately
- If connection fails: submission goes to "pending" state with error message; user is prompted to verify their server is running and the URL is correct

**Step 3: Listing Created**
- Server appears in registry search results
- Capabilities are auto-populated from the live connection
- Initial health check is performed
- Author receives a confirmation (shown in UI after submit)

### SF-5.5: Automated Health Checks (Cron Job)

**Schedule:** Every 30 minutes via Vercel Cron

**Process for each registered server:**
1. Attempt MCP connection (15s timeout)
2. If successful:
   - Record `is_reachable: true`
   - Record connection latency
   - Enumerate tools count (check for capability changes)
   - Record in `server_health_checks` table
3. If failed:
   - Record `is_reachable: false`
   - Record error message
   - Update server status to "degraded" (after 2 consecutive failures) or "unreachable" (after 5)

**Health Status Logic:**
| Status | Criteria | Badge Color |
|--------|----------|-------------|
| **Healthy** | Reachable in last check, avg latency < 2s, error rate < 5% | 🟢 Green |
| **Degraded** | Reachable but: latency > 2s, error rate > 5%, or 1-2 consecutive failures | 🟡 Yellow |
| **Unreachable** | 3+ consecutive failed health checks | 🔴 Red |
| **Unknown** | Never been checked (brand new submission) | ⚪ Gray |

### SF-5.6: Category Pages
- `/registry?category=search` — filtered view showing only servers in a category
- Category header with description and server count
- Category-specific sorting (e.g., "Search" category might default sort by latency)

### SF-5.7: Trending & Recently Added
- **Recently Added:** Last 10 servers submitted, sorted by date
- **Trending:** Servers with the most playground test invocations in the last 7 days
- Featured on the registry home page

### SF-5.8: JSON API Access
All registry data is available via the same API the frontend uses:

| Endpoint | Method | Description |
|----------|--------|------------|
| `/api/registry` | GET | List servers (supports `?q=`, `?category=`, `?sort=`, `?status=`, `?page=`, `?limit=`) |
| `/api/registry` | POST | Submit a new server |
| `/api/registry/[serverId]` | GET | Get server details (metadata + capabilities + health) |
| `/api/registry/[serverId]` | PATCH | Update server (author only, future) |
| `/api/registry/[serverId]` | DELETE | Remove server (admin only, future) |
| `/api/registry/categories` | GET | List all categories with server counts |
| `/api/registry/trending` | GET | Trending servers (last 7d) |

---

## Technical Implementation

### Database Schema (Neon / PostgreSQL)

```sql
-- Server listings
CREATE TABLE servers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,  -- URL-friendly name
  url             TEXT NOT NULL UNIQUE,  -- MCP endpoint URL
  transport_type  TEXT NOT NULL CHECK (transport_type IN ('sse', 'streamable-http')),
  short_description TEXT NOT NULL,
  long_description  TEXT,
  author_name     TEXT NOT NULL,
  author_url      TEXT,
  repo_url        TEXT,
  categories      TEXT[] NOT NULL DEFAULT '{}',
  tags            TEXT[] NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'degraded', 'unreachable', 'removed')),
  is_featured     BOOLEAN NOT NULL DEFAULT false,
  tools_count     INTEGER NOT NULL DEFAULT 0,
  resources_count INTEGER NOT NULL DEFAULT 0,
  prompts_count   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_servers_status ON servers(status);
CREATE INDEX idx_servers_categories ON servers USING GIN(categories);
CREATE INDEX idx_servers_tags ON servers USING GIN(tags);
CREATE INDEX idx_servers_slug ON servers(slug);

-- Full-text search index
ALTER TABLE servers ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(short_description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C')
  ) STORED;
CREATE INDEX idx_servers_search ON servers USING GIN(search_vector);

-- Server capabilities (auto-populated from live connection)
CREATE TABLE server_tools (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id   UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  tool_name   TEXT NOT NULL,
  description TEXT,
  input_schema JSONB,  -- The tool's inputSchema as JSON
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_server_tools_server ON server_tools(server_id);

CREATE TABLE server_resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id   UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  uri         TEXT NOT NULL,
  name        TEXT,
  description TEXT,
  mime_type   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_server_resources_server ON server_resources(server_id);

CREATE TABLE server_prompts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id   UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  prompt_name TEXT NOT NULL,
  description TEXT,
  arguments   JSONB,  -- Array of {name, description, required}
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_server_prompts_server ON server_prompts(server_id);

-- Health checks (see Feature 04 for server_health_checks table)
-- server_metrics table also referenced here for playground usage stats
```

### Drizzle ORM Schema (`lib/db/schema.ts` excerpt)

```typescript
import { pgTable, uuid, text, boolean, integer, timestamp, index, jsonb } from "drizzle-orm/pg-core";

export const servers = pgTable("servers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  url: text("url").notNull().unique(),
  transportType: text("transport_type").notNull(),
  shortDescription: text("short_description").notNull(),
  longDescription: text("long_description"),
  authorName: text("author_name").notNull(),
  authorUrl: text("author_url"),
  repoUrl: text("repo_url"),
  categories: text("categories").array().notNull().default([]),
  tags: text("tags").array().notNull().default([]),
  status: text("status").notNull().default("active"),
  isFeatured: boolean("is_featured").notNull().default(false),
  toolsCount: integer("tools_count").notNull().default(0),
  resourcesCount: integer("resources_count").notNull().default(0),
  promptsCount: integer("prompts_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("idx_servers_status").on(table.status),
  slugIdx: index("idx_servers_slug").on(table.slug),
}));

export const serverTools = pgTable("server_tools", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id").notNull().references(() => servers.id, { onDelete: "cascade" }),
  toolName: text("tool_name").notNull(),
  description: text("description"),
  inputSchema: jsonb("input_schema"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  serverIdx: index("idx_server_tools_server").on(table.serverId),
}));
```

### API Route: `GET /api/registry`

```typescript
// app/api/registry/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const category = searchParams.get("category");
  const status = searchParams.get("status") || "active";
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = (page - 1) * limit;

  let query = db.select().from(servers).where(eq(servers.status, status));

  // Full-text search
  if (q) {
    query = query.where(
      sql`search_vector @@ plainto_tsquery('english', ${q})`
    );
  }

  // Category filter
  if (category) {
    query = query.where(sql`${category} = ANY(categories)`);
  }

  // Sorting
  switch (sort) {
    case "newest": query = query.orderBy(desc(servers.createdAt)); break;
    case "tools": query = query.orderBy(desc(servers.toolsCount)); break;
    case "health": /* join with health_checks, order by uptime */ break;
    case "name": query = query.orderBy(asc(servers.name)); break;
  }

  const results = await query.limit(limit).offset(offset);
  const total = await db.select({ count: count() }).from(servers).where(eq(servers.status, status));

  return Response.json({
    servers: results,
    pagination: { page, limit, total: total[0].count, pages: Math.ceil(total[0].count / limit) }
  });
}
```

### API Route: `POST /api/registry` (Submit Server)

```typescript
export async function POST(request: Request) {
  const body = await request.json();
  
  // 1. Validate input
  const parsed = serverSubmissionSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error }, { status: 400 });
  
  // 2. Check for duplicates
  const existing = await db.select().from(servers).where(eq(servers.url, parsed.data.url));
  if (existing.length > 0) return Response.json({ error: "Server URL already registered" }, { status: 409 });
  
  // 3. Attempt MCP connection to validate
  let capabilities;
  let status = "pending";
  try {
    const client = await mcpConnect(parsed.data.url, parsed.data.transportType);
    capabilities = {
      tools: await client.listTools(),
      resources: await client.listResources(),
      prompts: await client.listPrompts(),
    };
    await client.close();
    status = "active";  // Connection succeeded — auto-approve
  } catch (error) {
    // Connection failed — mark as pending
    status = "pending";
  }
  
  // 4. Create server record
  const slug = generateSlug(parsed.data.name);
  const [server] = await db.insert(servers).values({
    name: parsed.data.name,
    slug,
    url: parsed.data.url,
    transportType: parsed.data.transportType,
    shortDescription: parsed.data.shortDescription,
    longDescription: parsed.data.longDescription,
    authorName: parsed.data.authorName,
    authorUrl: parsed.data.authorUrl,
    repoUrl: parsed.data.repoUrl,
    categories: parsed.data.categories,
    tags: parsed.data.tags,
    status,
    toolsCount: capabilities?.tools.tools.length ?? 0,
    resourcesCount: capabilities?.resources.resources.length ?? 0,
    promptsCount: capabilities?.prompts.prompts.length ?? 0,
  }).returning();
  
  // 5. Store capabilities
  if (capabilities) {
    for (const tool of capabilities.tools.tools) {
      await db.insert(serverTools).values({
        serverId: server.id,
        toolName: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      });
    }
    // Similarly for resources and prompts...
  }
  
  // 6. Record initial health check
  await db.insert(serverHealthChecks).values({
    serverId: server.id,
    isReachable: status === "active",
    latencyMs: /* measured during connection */,
    toolsCount: capabilities?.tools.tools.length ?? 0,
  });
  
  return Response.json({ server, status: status === "active" ? "approved" : "pending" }, { status: 201 });
}
```

### Cron Job: `GET /api/cron/health-check`

```typescript
// app/api/cron/health-check/route.ts
// Triggered by Vercel Cron every 30 minutes

export async function GET(request: Request) {
  // Verify cron secret (Vercel sends CRON_SECRET header)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const allServers = await db.select().from(servers)
    .where(ne(servers.status, "removed"));

  const results = [];

  for (const server of allServers) {
    const startTime = Date.now();
    try {
      const client = await mcpConnect(server.url, server.transportType, { timeout: 15000 });
      const tools = await client.listTools();
      await client.close();

      const latencyMs = Date.now() - startTime;

      await db.insert(serverHealthChecks).values({
        serverId: server.id,
        isReachable: true,
        latencyMs,
        toolsCount: tools.tools.length,
      });

      // Update server capabilities if tool count changed
      if (tools.tools.length !== server.toolsCount) {
        await refreshServerCapabilities(server.id, tools);
      }

      // Reset status to active if it was degraded
      if (server.status === "degraded") {
        await db.update(servers).set({ status: "active" }).where(eq(servers.id, server.id));
      }

      results.push({ serverId: server.id, status: "healthy" });
    } catch (error) {
      await db.insert(serverHealthChecks).values({
        serverId: server.id,
        isReachable: false,
        errorMessage: error.message,
      });

      // Check consecutive failures
      const recentChecks = await db.select().from(serverHealthChecks)
        .where(eq(serverHealthChecks.serverId, server.id))
        .orderBy(desc(serverHealthChecks.checkedAt))
        .limit(5);

      const consecutiveFailures = recentChecks.filter(c => !c.isReachable).length;

      if (consecutiveFailures >= 5) {
        await db.update(servers).set({ status: "unreachable" }).where(eq(servers.id, server.id));
      } else if (consecutiveFailures >= 2) {
        await db.update(servers).set({ status: "degraded" }).where(eq(servers.id, server.id));
      }

      results.push({ serverId: server.id, status: "failed", error: error.message });
    }
  }

  return Response.json({ checked: results.length, results });
}
```

**Vercel Cron config (`vercel.json`):**
```json
{
  "crons": [
    {
      "path": "/api/cron/health-check",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

---

## UI Specification

### Registry Browse Page (`/registry`)

```
┌─────────────────────────────────────────────────────────────────┐
│  MCPHub     [Playground]  [Registry]  [Inspector]  [Dashboard]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MCP Server Registry                    [+ Submit Server]       │
│  Discover and test community MCP servers                        │
│                                                                 │
│  [🔍 Search servers...                                        ] │
│                                                                 │
│  Categories: [All] [Search] [Database] [DevOps] [Comms] [More]  │
│  Sort by: [Newest ▾]  Status: [Healthy ▾]  View: [Grid] [List] │
│                                                                 │
│  ── Recently Added ─────────────────────────────────────────    │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ 🟢 web-search    │  │ 🟢 pg-mcp        │  │ 🟡 slack-mcp   │ │
│  │ Search the web   │  │ PostgreSQL query  │  │ Send Slack     │ │
│  │ using multiple...│  │ & schema access...│  │ messages and...│ │
│  │                  │  │                  │  │                │ │
│  │ [Search] [Web]   │  │ [Database] [SQL] │  │ [Comms] [Slack]│ │
│  │ 5 tools  215ms   │  │ 8 tools  145ms   │  │ 3 tools  890ms│ │
│  │                  │  │                  │  │                │ │
│  │ [Test →] [View]  │  │ [Test →] [View]  │  │ [Test →] [View]│ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ 🟢 github-mcp    │  │ 🟢 fs-mcp        │  │ 🔴 weather-old │ │
│  │ ...              │  │ ...              │  │ (unreachable)  │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
│                                                                 │
│  Page 1 of 3    [← Prev]  [1] [2] [3]  [Next →]                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Server Detail Page (`/registry/[serverId]`)

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Registry                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🟢 web-search-mcp                                              │
│  by @punkpeye  •  Added Mar 1, 2026  •  Updated Mar 4, 2026    │
│                                                                 │
│  Search the web using multiple search engines with              │
│  configurable result limits, language filtering, and            │
│  safe search options.                                           │
│                                                                 │
│  [Search] [Web] [API]                                           │
│                                                                 │
│  [Test in Playground →]  [Copy URL]  [↗ GitHub]                 │
│                                                                 │
│  ┌─ Health ─────────────────────────────────────────────────┐   │
│  │  Uptime: 99.8%   Avg Latency: 215ms   Error Rate: 1.3% │   │
│  │                                                         │   │
│  │  [Health chart — last 7 days]                           │   │
│  │  ████████████████████████████████████████ ██████████████ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [ Tools (5) ]  [ Resources (2) ]  [ Prompts (0) ]             │
│  ───────────────────────────────────────────────────────────    │
│                                                                 │
│  ┌─ search_web ─────────────────────────────────────────────┐  │
│  │  Search the web with customizable parameters             │  │
│  │  Parameters: query (string), max_results (number),       │  │
│  │              language (string), safe_search (boolean)     │  │
│  │  [ Test this tool → ]                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ search_images ──────────────────────────────────────────┐  │
│  │  ...                                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key UI Components

| Component | File | Purpose |
|-----------|------|---------|
| `ServerCard` | `components/registry/server-card.tsx` | Server listing card in grid/list view |
| `ServerGrid` | `components/registry/server-grid.tsx` | Grid layout of server cards with pagination |
| `SearchBar` | `components/registry/search-bar.tsx` | Search input with debounced query |
| `CategoryFilter` | `components/registry/category-filter.tsx` | Category selection pills/dropdown |
| `SubmitForm` | `components/registry/submit-form.tsx` | New server submission form with validation |
| `ServerDetail` | `components/registry/server-detail.tsx` | Full server detail page content |
| `HealthBadge` | `components/registry/health-badge.tsx` | Green/yellow/red status dot |
| `HealthHistory` | `components/registry/health-history.tsx` | 7-day health chart on detail page |

---

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|---------|
| **Submitted server goes offline** | Automated health checks mark it as "degraded" after 2 failures, "unreachable" after 5. Red badge on listing. Don't delete — show with clear "unreachable" status and last-seen timestamp. |
| **Duplicate URL submission** | Return `409 Conflict`: "A server with this URL is already registered." Link to the existing listing. |
| **Spam/malicious submissions** | MVP: connection must succeed for auto-approval. Rate limit submissions (5 per hour per IP). Block known bad URLs. Future: CAPTCHA, moderation queue. |
| **Server URL changes** | For MVP: author submits a new listing. Future: allow author to update URL (requires verification). |
| **Server requires authentication** | Flag as "Requires Auth" in listing. Health checks skip auth-required servers (or use stored credentials if provided by author). Show notice on detail page: "This server requires authentication to connect." |
| **Server with no tools** | Allow listing (it might only have resources or prompts). Show "0 tools" clearly. |
| **Search returns no results** | Show: "No servers found for '[query]'. Try different keywords or [browse all servers]." |
| **Empty registry** (pre-seed) | Show: "The registry is being populated. Check back soon!" with a "Submit the first server" CTA. |
| **Server capabilities change** | Cron job detects tool count changes, triggers capability refresh. Updated capabilities replace old ones. Show "Last capability update: [date]" on detail page. |
| **Very long descriptions** | Truncate on card (2 lines + "..."). Full description on detail page. Sanitize markdown (prevent XSS). |
| **Category with no servers** | Show category in filter but with "(0)" count. Don't link to empty category page — or show "No servers in this category yet. [Submit one?]" |
| **Slow full-text search** | PostgreSQL `tsvector` with GIN index performs well up to 100K rows. For MVP scale (hundreds of servers), this is more than sufficient. |
| **Cron job timeout** (too many servers to check in one invocation) | Batch health checks: check 50 servers per cron invocation. Stagger checks so all servers are checked within the 30-minute window. |

---

## Verification Criteria

- [ ] Registry page loads with server cards in a grid layout
- [ ] Full-text search returns relevant results by name, description, and tags
- [ ] Category filter correctly narrows results
- [ ] Sort options (newest, most tools, best health) work correctly
- [ ] Server detail page displays all metadata, capabilities, and health data
- [ ] "Test in Playground" button navigates to playground with server pre-connected
- [ ] Submission form validates all required fields
- [ ] Successful submission auto-connects and populates capabilities
- [ ] Failed submission (unreachable server) shows "pending" status with error message
- [ ] Duplicate URL submission returns a meaningful error
- [ ] Health badges (green/yellow/red) reflect actual health check data
- [ ] Automated health checks run on schedule and update server status
- [ ] Servers unreachable for 5+ consecutive checks are marked "unreachable"
- [ ] Pagination works correctly for large result sets
- [ ] JSON API returns proper structured data for programmatic access
- [ ] Registry is seeded with 20-30 servers from awesome-mcp-servers
