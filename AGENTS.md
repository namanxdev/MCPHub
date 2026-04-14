# AGENTS.md — MCPHub

Guidance for AI agents (Claude, Copilot, Codex, Gemini, etc.) working in this repo.

---

## What This Project Is

**MCPHub** is a full-stack developer tool — "Postman for MCP". It lets developers discover, connect to, test, and debug [Model Context Protocol](https://modelcontextprotocol.io) servers from a web UI.

Live: `https://mcp-hub-pi.vercel.app`

---

## Stack at a Glance
```
| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| State | Zustand 5 (persisted via localStorage) |
| Database | Neon PostgreSQL via Drizzle ORM |
| Auth | NextAuth.js v5 (GitHub + Google OAuth) |
| MCP client | `@modelcontextprotocol/sdk` |
| Deploy | Vercel |

---

## Project Layout

```
app/                        # Next.js App Router
  (pages)/                  # UI routes (landing, playground, inspector, dashboard, registry, docs, login)
  api/
    auth/[...nextauth]/     # NextAuth handler
    connect/route.ts        # POST — create MCP connection (SSE / streamable-http / stdio)
    disconnect/route.ts     # POST — close connection
    tools/call/route.ts     # POST — invoke a tool on a connected server
    messages/stream/        # GET  — SSE stream of protocol messages
    registry/               # GET/POST/PATCH/DELETE — server registry CRUD
    badge/[serverId]/       # GET  — SVG status badge
    health/                 # GET  — health stats for a server
    cron/health-check/      # POST — daily automated health sweep (Vercel cron)

components/
  auth/                     # SessionProvider, UserMenu, LoginCard
  connection/               # Connect form (URL or stdio command)
  playground/               # Tool selector, auto-generated JSON form, result viewer
  inspector/                # Message list, filters, detail panel
  dashboard/                # Metrics cards (P50/P95/P99), charts, error log
  registry/                 # Server grid, search, submit form
  navigation/               # Animated navbar + footer
  ui/                       # shadcn/ui primitives

lib/
  mcp/
    connection-manager.ts   # In-memory connection pool (max 100), per-session MCP clients
    protocol-logger.ts      # Captures raw JSON-RPC messages per connection
    health-collector.ts     # Records latency/error metrics per tool invocation
  db/
    index.ts                # Lazy Drizzle client (safe to import at build time)
    schema.ts               # All table definitions (see below)
  auth/                     # NextAuth config (GitHub + Google providers, Drizzle adapter)
  rate-limit.ts             # Per-route in-memory rate limiters
  validators/               # Zod schemas for API request bodies

stores/
  connection-store.ts       # Active session ID, connection history (persisted)
  playground-store.ts       # Selected tool, param values, execution history
  inspector-store.ts        # Raw message log, filters, selected message

agent/                      # Desktop Agent — bridges cloud MCPHub → local MCP servers via WebSocket
cli/                        # `npx mcphub` CLI for automated health checks

drizzle/                    # Drizzle migration files
scripts/
  setup-db.ts               # One-time DB table creation
  seed-registry.ts          # Seeds 20-30 community servers into the registry
```

---

## Database Schema

All tables are in `lib/db/schema.ts`.

**Auth tables** (NextAuth v5 Drizzle adapter):
- `users`, `accounts`, `sessions`, `verification_tokens`

**Registry:**
- `servers` — name, slug, url, transport_type, categories, tags, status, isFeatured, tool/resource/prompt counts
- `server_tools` — tools discovered per server (name, description, inputSchema JSON)
- `server_resources` — resources per server (uri, name, mimeType)
- `server_prompts` — prompts per server (name, description, arguments JSON)

**Health & Metrics:**
- `server_metrics` — per-invocation latency, response size, error info
- `server_health_checks` — daily reachability + tool count snapshots

---

## Key Behaviors

### MCP Connection Manager (`lib/mcp/connection-manager.ts`)
- Holds up to 100 in-memory `Client` instances keyed by `sessionId`
- Supports three transports: `sse`, `streamable-http`, `stdio`
- stdio commands are validated against an allowlist (`node`, `npx`, `python`, `python3`, `uvx`, `uv`, `deno`, `bun`, `bunx`, `tsx`, `ts-node`, `docker`, `go`, `cargo`) and blocked if they contain shell metacharacters
- Sessions are per-user (userId stored on the connection)

### Desktop Agent (`agent/`)
- Local CLI (`mcphub-agent start`) that listens on `ws://localhost:54319`
- Bridges the deployed Vercel app → local MCP servers via WebSocket
- Needed because Vercel serverless functions can't reach `localhost` on the user's machine

### CLI (`cli/`)
- `npx mcphub test <server>` runs automated health checks against an MCP server
- Separate package with its own `tsconfig.json` and `package.json`

### Cron Health Check (`app/api/cron/health-check/route.ts`)
- Runs daily at 00:00 UTC via Vercel cron (`vercel.json`)
- Protected by `CRON_SECRET` bearer token
- Connects to every active registry server, pings tools, writes results to `server_health_checks`

### Rate Limiting (`lib/rate-limit.ts`)
- In-memory sliding-window limiters per route
- Applied on connect, tool call, and registry submission endpoints

---

## Environment Variables

All required in `.env.local` for local dev:

```env
DATABASE_URL=           # Neon PostgreSQL connection string
AUTH_SECRET=            # Random secret: openssl rand -base64 32
AUTH_GITHUB_ID=         # GitHub OAuth app client ID
AUTH_GITHUB_SECRET=     # GitHub OAuth app client secret
AUTH_GOOGLE_ID=         # Google OAuth client ID (optional)
AUTH_GOOGLE_SECRET=     # Google OAuth client secret (optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=            # Protects the /api/cron/health-check endpoint
```

---

## Scripts

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # ESLint
npm run db:push      # Push Drizzle schema to Neon (uses drizzle-kit)
npm run db:seed      # Seed registry with community servers
```

---

## Conventions

- **API routes** live in `app/api/` and follow Next.js App Router conventions (`route.ts`, named exports `GET`/`POST`/etc.)
- **Client state** is Zustand. Stores in `stores/` are the source of truth for UI state, not React state.
- **DB access** always goes through `lib/db/index.ts` (`db` proxy or `getDb()`). Never instantiate Drizzle directly.
- **Auth** uses the `auth()` helper from `lib/auth/`. Route handlers that require auth call `await auth()` and check for a session.
- **Validation** uses Zod. Schemas are in `lib/validators/`. Parse at the API boundary, not deep in logic.
- **shadcn/ui** components live in `components/ui/`. Do not edit them directly — use the `shadcn` CLI to add/update.
- The `agent/` and `cli/` directories are **independent packages** with their own `tsconfig.json`. They are excluded from the root Next.js build.

---

## What NOT to Do

- Do not import from `agent/` or `cli/` in Next.js app code — they are separate packages.
- Do not call `neon()` or `drizzle()` directly — use `lib/db/index.ts`.
- Do not add shell metacharacters to stdio commands — the connection manager blocks them.
- Do not commit `.env*` files — they are gitignored.
- Do not delete or modify `components/ui/` files manually — use the shadcn CLI.
