# MCPHub — The MCP Development Platform

> Postman for Model Context Protocol. Connect, test, debug, and monitor any MCP server.

**Live:** [mcp-hub-pi.vercel.app](https://mcp-hub-pi.vercel.app)

---

## Features

- **Playground** — Auto-generated forms for every tool. Execute with live results.
- **Protocol Inspector** — Real-time JSON-RPC message viewer with latency timing.
- **Health Dashboard** — P50/P95/P99 latency, error rates, uptime per tool.
- **Public Registry** — Searchable directory of community MCP servers with status badges.
- **Multi-transport** — SSE, Streamable HTTP, and stdio (command) connections.
- **Auth** — GitHub and Google OAuth via NextAuth.js v5.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| State | Zustand 5 |
| Database | Neon PostgreSQL + Drizzle ORM |
| Auth | NextAuth.js v5 (GitHub + Google) |
| MCP | @modelcontextprotocol/sdk |
| Animations | Framer Motion |
| Charts | Recharts |
| Deploy | Vercel |

---

## Getting Started

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require

# Cron job protection
CRON_SECRET=your-secret-here

# GitHub PAT (for registry GitHub integration)
GITHUB_PERSONAL_ACCESS_TOKEN=github_pat_...

# NextAuth.js
AUTH_SECRET=generate-with-openssl-rand-base64-32
AUTH_GITHUB_ID=your-github-oauth-client-id
AUTH_GITHUB_SECRET=your-github-oauth-client-secret
AUTH_GOOGLE_ID=your-google-oauth-client-id
AUTH_GOOGLE_SECRET=your-google-oauth-client-secret
```

### 3. Set up the database

```bash
npm run db:push    # Push schema to Neon
npm run db:seed    # Seed registry with initial servers
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## OAuth Setup

### GitHub OAuth App

1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **OAuth Apps** → **New OAuth App**
2. Set **Authorization callback URL**:
   - Local: `http://localhost:3000/api/auth/callback/github`
   - Production: `https://YOUR-DOMAIN.vercel.app/api/auth/callback/github`
3. Copy **Client ID** → `AUTH_GITHUB_ID` and generate **Client Secret** → `AUTH_GITHUB_SECRET`

### Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services** → **Credentials** → **Create OAuth Client ID**
2. Application type: **Web application**
3. Add **Authorized redirect URIs**:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://YOUR-DOMAIN.vercel.app/api/auth/callback/google`
4. Copy **Client ID** → `AUTH_GOOGLE_ID` and **Client Secret** → `AUTH_GOOGLE_SECRET`

---

## Scripts

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Run Vitest tests
npm run db:push    # Push Drizzle schema to Neon
npm run db:seed    # Seed registry data
```

---

## Project Structure

```
app/
├── (pages)/
│   ├── page.tsx              # Landing page
│   ├── playground/           # Tool playground
│   ├── inspector/            # Protocol inspector
│   ├── dashboard/            # Health dashboard
│   ├── registry/             # MCP server registry
│   ├── docs/                 # Documentation
│   └── login/                # OAuth login
└── api/
    ├── auth/[...nextauth]/   # NextAuth handler
    ├── connect/              # MCP connection
    ├── disconnect/           # MCP disconnect
    ├── tools/call/           # Tool execution
    ├── messages/stream/      # SSE message stream
    ├── registry/             # Registry CRUD
    ├── badge/[serverId]/     # Status badge SVG
    └── cron/health-check/    # Daily health monitor

components/
├── auth/         # Session provider, user menu, login card
├── connection/   # Connect form (URL / stdio)
├── playground/   # Tool selector, form builder, results
├── inspector/    # Message list, filters, detail panel
├── dashboard/    # Metrics cards, charts, error log
├── registry/     # Server grid, search, filters
├── navigation/   # Animated navbar, footer
└── ui/           # shadcn/ui components

lib/
├── mcp/          # ConnectionManager, ProtocolLogger, HealthCollector
├── db/           # Drizzle client + schema
├── auth/         # NextAuth config
└── rate-limit.ts # Per-route rate limiters

stores/
├── connection-store.ts   # Active session + history (persisted)
├── playground-store.ts   # Tool state + execution history
└── inspector-store.ts    # Messages, filters, selection
```

---

## Deployment (Vercel)

1. Push to GitHub and import the repo in [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add all environment variables from `.env` in **Settings → Environment Variables**
4. Redeploy after adding variables

The `vercel.json` cron job runs `/api/cron/health-check` daily at midnight UTC.
