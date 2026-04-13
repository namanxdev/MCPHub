# Feature 01: Server Connection Manager

> Connect to any MCP server, perform the protocol handshake, and display all available tools, resources, and prompts in an organized UI.

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

The Server Connection Manager is the **entry point** to MCPHub. Everything else — the playground, the inspector, the dashboard — depends on a live connection to an MCP server.

### What It Does

1. User provides a server URL (or selects one from the registry)
2. MCPHub's backend establishes an SSE/HTTP connection to the MCP server
3. Backend performs the MCP handshake:
   - Sends `initialize` with client capabilities
   - Receives server capabilities and protocol version
   - Sends `initialized` notification
4. Backend enumerates all server capabilities:
   - `tools/list` → all available tools with names, descriptions, input schemas
   - `resources/list` → all available resources with URIs, names, MIME types
   - `prompts/list` → all available prompts with names, descriptions, arguments
5. Results are sent to the frontend and displayed in an organized, navigable UI

### Why the Backend is the Proxy

The frontend (browser) **cannot** connect directly to arbitrary MCP servers because:
- **CORS** — Most MCP servers don't set CORS headers for browser origins
- **Security** — Allowing arbitrary outbound connections from the browser is a security risk
- **SSE transport** — MCP's SSE transport requires maintaining a persistent server-to-client stream that's difficult to manage purely client-side when the server doesn't expect browser clients
- **SSRF protection** — The backend can validate URLs and block private IP ranges before connecting

Architecture: `Browser ↔ Next.js API Routes ↔ MCP Server`

---

## User Stories

### US-1.1: Server Developer Validates Implementation
> *As an MCP server developer, I want to connect to my server and see all tools/resources/prompts listed correctly, so I can verify my MCP implementation before publishing.*

**Acceptance:** I enter my server's URL, click Connect, and within seconds I see my tools with their correct names, descriptions, and input schemas.

### US-1.2: App Developer Evaluates a Server
> *As an AI application developer, I want to connect to an MCP server I found to browse its capabilities, so I can decide whether to integrate it into my agent.*

**Acceptance:** I can see all tools with their parameter schemas, understand what each one does from its description, and decide if the server meets my needs — without writing any code.

### US-1.3: Team Lead Shares a Connection
> *As a team lead, I want to share a link to a connected server with my team, so everyone can inspect the same server without repeating setup.*

**Acceptance:** After connecting, I can copy a shareable URL that, when opened by a teammate, connects to the same server automatically.

### US-1.4: Developer Connects from Registry
> *As a developer browsing the registry, I want to click "Test" on a server listing and immediately enter the playground with that server connected.*

**Acceptance:** Clicking "Test in Playground" on a registry page navigates to `/playground/[serverId]` with the connection pre-established.

---

## Sub-features

### SF-1.1: Connection Form
- URL input field with placeholder (`https://my-server.example.com/sse`)
- Transport type selector (SSE / Streamable HTTP) — auto-detected when possible
- Optional auth headers section (expandable):
  - Key-value pairs for custom headers
  - Preset for `Authorization: Bearer <token>`
- "Connect" button with loading state

### SF-1.2: Connection Status Indicator
- Visual states: **Disconnected** (gray), **Connecting** (yellow/pulsing), **Connected** (green), **Error** (red)
- Displayed persistently in the header/sidebar
- On hover/click: shows connection details (URL, transport, connected duration, server name/version)

### SF-1.3: Capabilities Display
Three-panel or three-tab layout:

**Tools Tab:**
| Field | Display |
|-------|---------|
| Name | Bold, monospace |
| Description | Regular text below name |
| Input Schema | Collapsible JSON Schema viewer — shows parameters, types, required fields |
| Annotations | If present: `readOnlyHint`, `destructiveHint`, `idempotentHint` as badges |

**Resources Tab:**
| Field | Display |
|-------|---------|
| URI | Monospace, linked |
| Name | Bold text |
| Description | Regular text |
| MIME Type | Badge (e.g., `application/json`, `text/plain`) |

**Prompts Tab:**
| Field | Display |
|-------|---------|
| Name | Bold, monospace |
| Description | Regular text |
| Arguments | List with name, description, required flag |

### SF-1.4: Connection History
- Persisted in `localStorage` (MVP) or user-linked DB storage (future)
- Shows recent connections: URL, server name, last connected timestamp, tool count
- Click to reconnect with saved settings (including auth headers)
- Clear history button

### SF-1.5: Multi-Server Tabs
- Tabbed interface allowing simultaneous connections to multiple servers
- Each tab has its own connection state, capabilities view, and playground context
- Tab label: server name (from `initialize` response) or truncated URL

### SF-1.6: Auto-Reconnect
- Toggle (off by default): if the SSE connection drops, automatically attempt reconnection
- Exponential backoff: 1s → 2s → 4s → 8s → max 30s
- UI shows "Reconnecting..." state with attempt count
- Stops after 10 failed attempts, shows manual reconnect option

---

## Technical Implementation

### API Routes

#### `POST /api/connect`

**Request:**
```json
{
  "url": "https://my-server.example.com/sse",
  "transport": "sse",
  "headers": {
    "Authorization": "Bearer sk-..."
  }
}
```

**Flow:**
1. **Validate URL** — Zod schema: must be valid HTTPS URL (allow HTTP for localhost)
2. **SSRF check** — Block private IP ranges (10.x, 172.16-31.x, 192.168.x, 127.x, ::1)
3. **Create MCP client** — Using `@modelcontextprotocol/sdk`:
   ```typescript
   import { Client } from "@modelcontextprotocol/sdk/client/index.js";
   import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

   const transport = new SSEClientTransport(new URL(url), { headers });
   const client = new Client({ name: "mcphub", version: "1.0.0" });
   await client.connect(transport);
   ```
4. **Store connection** — Save client instance in `ConnectionManager` (in-memory Map keyed by session ID)
5. **Enumerate capabilities:**
   ```typescript
   const tools = await client.listTools();
   const resources = await client.listResources();
   const prompts = await client.listPrompts();
   ```
6. **Return response**

**Response:**
```json
{
  "sessionId": "uuid-v4",
  "serverInfo": {
    "name": "my-mcp-server",
    "version": "1.2.0",
    "protocolVersion": "2024-11-05"
  },
  "capabilities": {
    "tools": [
      {
        "name": "search_web",
        "description": "Search the web for information",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": { "type": "string", "description": "Search query" }
          },
          "required": ["query"]
        }
      }
    ],
    "resources": [...],
    "prompts": [...]
  }
}
```

**Error responses:**
- `400` — Invalid URL or transport type
- `403` — URL blocked (private IP range)
- `504` — Connection timeout (default: 15 seconds)
- `502` — Server unreachable or refused connection
- `500` — Unexpected error during handshake

#### `POST /api/disconnect`

**Request:**
```json
{
  "sessionId": "uuid-v4"
}
```

**Flow:**
1. Look up session in `ConnectionManager`
2. Call `client.close()` to gracefully terminate the MCP connection
3. Remove from `ConnectionManager`
4. Return `{ success: true }`

### Connection Manager (`lib/mcp/connection-manager.ts`)

```typescript
// Singleton that manages active MCP client connections
class ConnectionManager {
  private connections: Map<string, {
    client: Client;
    transport: SSEClientTransport;
    serverInfo: ServerInfo;
    connectedAt: Date;
    lastActivity: Date;
  }>;

  connect(url: string, headers?: Record<string, string>): Promise<Session>;
  disconnect(sessionId: string): Promise<void>;
  getClient(sessionId: string): Client | undefined;
  
  // Cleanup: connections idle > 30 minutes are auto-closed
  private startCleanupTimer(): void;
}
```

**Serverless considerations:**
- Vercel functions are stateless — the in-memory Map only persists within a single function invocation/warm instance
- For MVP: this works because playground sessions are short-lived (user connects, tests, disconnects)
- For production: consider using Vercel's Edge Runtime with `waitUntil` for longer-lived connections, or deploy a persistent process on Railway/Fly.io for the connection proxy layer

### Session Management

- Each connection generates a UUID v4 session ID
- Session ID is stored in a browser cookie (`httpOnly`, `sameSite: strict`) or returned as a header
- All subsequent API calls (`/api/tools/call`, `/api/messages/stream`, etc.) include the session ID
- Sessions expire after 30 minutes of inactivity

---

## UI Specification

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  MCPHub     [Playground]  [Registry]  [Inspector]  [Dashboard]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Connect to MCP Server ─────────────────────────────┐   │
│  │                                                     │   │
│  │  Server URL: [https://...........................] │   │
│  │  Transport:  (●) SSE  ( ) Streamable HTTP           │   │
│  │                                                     │   │
│  │  ▸ Authentication Headers (optional)                │   │
│  │                                                     │   │
│  │  [ Connect ]                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ Recent Connections ────────────────────────────────┐   │
│  │  ● my-mcp-server  (3 tools) — 2 hours ago          │   │
│  │  ● weather-server  (1 tool)  — yesterday            │   │
│  │  ● db-tools        (5 tools) — 3 days ago           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Connected State

```
┌─────────────────────────────────────────────────────────────┐
│  MCPHub     [Playground]  [Registry]  [Inspector]  [Dashboard]│
├─────────────────────────────────────────────────────────────┤
│  🟢 Connected: my-mcp-server v1.2.0          [Disconnect]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [ Tools (3) ]  [ Resources (2) ]  [ Prompts (1) ]         │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ┌─ search_web ─────────────────────────────────────────┐  │
│  │  Search the web for information                      │  │
│  │                                                      │  │
│  │  Parameters:                                         │  │
│  │    query (string, required) — Search query            │  │
│  │    max_results (number, optional) — Max results       │  │
│  │                                                      │  │
│  │  [ ▸ View Full Schema ]  [ Test in Playground → ]    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ get_weather ────────────────────────────────────────┐  │
│  │  Get current weather for a location                  │  │
│  │  ...                                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key UI Components

| Component | File | Purpose |
|-----------|------|---------|
| `ConnectForm` | `components/connection/connect-form.tsx` | URL input, transport selector, auth headers, connect button |
| `ConnectionStatus` | `components/connection/connection-status.tsx` | Green/yellow/red indicator with server info |
| `ServerCapabilities` | `components/connection/server-capabilities.tsx` | Tabbed view of tools, resources, prompts |
| `ToolCard` | `components/connection/tool-card.tsx` | Individual tool display with schema |
| `ResourceCard` | `components/connection/resource-card.tsx` | Individual resource display |
| `PromptCard` | `components/connection/prompt-card.tsx` | Individual prompt display |
| `ConnectionHistory` | `components/connection/connection-history.tsx` | Recent connections list |

---

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|---------|
| **Server unreachable** | Show error: "Could not connect to `<url>`. Check that the server is running and the URL is correct." + retry button |
| **Connection timeout** (>15s) | Show error: "Connection timed out after 15 seconds." + retry with longer timeout option |
| **Server requires auth** | If `401` or `403` returned, prompt user to add Authorization header. Show "This server requires authentication" message. |
| **Malformed server response** | If `initialize` response doesn't match expected schema, show warning: "Server returned an unexpected response. It may not fully implement the MCP protocol." Display whatever data was parseable. |
| **SSE connection drops mid-session** | Show "Connection lost" banner. If auto-reconnect is on, attempt reconnection. If off, show "Reconnect" button. |
| **Server with 0 tools, 0 resources, 0 prompts** | Show empty state: "This server didn't report any capabilities. It may still be initializing, or it may not expose any tools/resources/prompts." |
| **Rate limiting** | Max 10 connection attempts per minute per IP. Show: "Too many connection attempts. Please wait before trying again." |
| **Private IP / SSRF attempt** | Block with `403`: "Connections to private/internal IP addresses are not allowed." |
| **URL with non-HTTPS scheme** | Allow `http://localhost:*` and `http://127.0.0.1:*` for local development. Block other HTTP URLs with warning: "Use HTTPS for remote servers." |
| **Server returns pagination** | `tools/list` may return a `nextCursor` — follow pagination to enumerate all tools. Show progress: "Loading tools... (page 2)" |
| **Very large capability sets** (100+ tools) | Paginate/virtualize the tools list. Add search/filter within capabilities. |

---

## Verification Criteria

- [ ] User can enter an MCP server URL and click Connect
- [ ] Backend establishes SSE connection and performs MCP handshake
- [ ] Connected state shows server name, version, and protocol version
- [ ] Tools tab displays all tools with names, descriptions, and input schemas
- [ ] Resources tab displays all resources with URIs, names, and MIME types
- [ ] Prompts tab displays all prompts with names, descriptions, and arguments
- [ ] Connection history persists across page reloads (localStorage)
- [ ] Disconnect button cleanly terminates the MCP session
- [ ] Error states display meaningful messages for unreachable servers, timeouts, and auth failures
- [ ] Private IP addresses are blocked (SSRF protection)
- [ ] Multiple simultaneous connections work via tabbed interface
- [ ] "Test in Playground" button on each tool navigates to the Playground feature with that tool pre-selected
