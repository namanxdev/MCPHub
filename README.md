# MCPHub

**The developer platform for Model Context Protocol.**
Discover, test, debug, and monitor any MCP server — from a single browser tab.

**[mcp-hub-pi.vercel.app](https://mcp-hub-pi.vercel.app)** · [Playground](https://mcp-hub-pi.vercel.app/playground) · [Registry](https://mcp-hub-pi.vercel.app/registry) · [Docs](https://mcp-hub-pi.vercel.app/docs)

---

## What is MCPHub?

[MCP (Model Context Protocol)](https://modelcontextprotocol.io) is the open standard for connecting AI models to external tools and data — think of it as USB-C for AI agents. There are now 1,000+ MCP servers in the wild, built by teams at Anthropic, Microsoft, Stripe, and the broader open-source community.

The problem: **the developer tooling hasn't kept up.**

Testing an MCP server today means running a local CLI inspector, manually constructing JSON-RPC messages, and getting zero visibility into performance, errors, or reliability. There's no shared registry, no debugging tools, no CI/CD integration.

**MCPHub is Postman for MCP.** A hosted, web-based platform where you can:

- **Connect** to any MCP server in seconds
- **Test** every tool through auto-generated forms — no code required
- **Debug** protocol-level JSON-RPC exchanges in real time
- **Monitor** latency, error rates, and uptime over time
- **Discover** community servers in a live, searchable registry
- **Automate** health checks in CI/CD with a single CLI command

---

## Features

### Playground
Connect to any MCP server (SSE, Streamable HTTP, or stdio via the Desktop Agent) and instantly get an interactive UI for every tool it exposes. MCPHub reads each tool's JSON Schema and renders the right input — text fields, dropdowns, toggles, nested object editors — so you can test without writing a line of code.

- Auto-generated forms from tool `inputSchema`
- Live response viewer with syntax-highlighted JSON
- Execution history with timestamps and durations
- Save parameter presets for repeated test cases
- Works with any MCP server — no configuration needed

### Protocol Inspector
A real-time view of every JSON-RPC message flowing between MCPHub and your server. See the exact bytes on the wire, correlate requests to responses, measure round-trip latency per message.

This is what Chrome DevTools does for HTTP — but for MCP.

- Bidirectional message stream (→ requests, ← responses)
- Syntax-highlighted JSON with collapsible trees
- Latency timing per message
- Filter by method, direction, or keyword
- Pause, resume, and clear the stream

### Health Dashboard
Per-tool performance metrics collected automatically during every session and from scheduled health checks. Know at a glance whether a server is fast, reliable, and still online.

- P50 / P95 / P99 latency per tool
- Error rate and error type breakdown
- Response size distribution
- Uptime history
- Embeddable status badges for README files

### Registry
A searchable, community-driven directory of MCP servers — with live health data attached to every entry. Not a static markdown file. Every server in the registry is periodically health-checked and gets a status badge reflecting its current state.

- Full-text search by name, description, or capability
- Filter by transport type, category, and health status
- "Test in Playground" — click to connect directly
- Community submissions via GitHub OAuth
- Status badges you can embed in your own docs
- Security grade (A–F) from the latest scan, shown on every server's detail page

### CLI Tool

Run a full MCP health check from the terminal or CI/CD pipeline:

```bash
npx mcphub test https://your-server.example.com/sse
```

```
  MCPHub Test — https://your-server.example.com/sse
  Transport: sse | 2026-06-22T10:30:00Z

  ✓ Connection                (142ms)   Connected to my-server v1.2.0
  ✓ Initialize Handshake      (130ms)   Protocol: 2024-11-05
  ✓ Protocol Version          (0ms)     Supported
  ✓ Tools List                (85ms)    5 tools found
  ✓ Tool Schemas              (2ms)     All 5 schemas valid
  ✓ Resources List            (62ms)    2 resources found
  ✓ Prompts List              (58ms)    1 prompt found

  ─────────────────────────────────────────
  7/7 checks passed — 479ms total
  Capabilities: 5 tools · 2 resources · 1 prompt
```

Exit code `0` on pass, `1` on any failure. Plug it straight into GitHub Actions:

```yaml
- name: Test MCP server
  run: npx mcphub test http://localhost:3001/sse --junit results.xml
```

**Flags:**

| Flag | What it does |
|------|-------------|
| `--json` | Machine-readable JSON output |
| `--smoke-test` | Invoke each tool and verify it doesn't crash the server |
| `--verbose` | Print raw JSON-RPC messages |
| `--timeout <ms>` | Per-check timeout (default: 30 000) |
| `-H "Key: Value"` | Custom request headers (repeatable) |
| `--junit <path>` | JUnit XML output for CI test reporters |
| `--watch` | Re-run on interval during development |

### Security Scan

A **passive, read-only** auditor for remote MCP servers. Point it at any Streamable-HTTP server — an ad-hoc URL or one already in the registry — and it inspects the common auth, transport, and tool-integrity holes, then emits a scored JSON + Markdown report. The same engine can scan the whole registry and rank servers into a "State of MCP Security" leaderboard.

```bash
# Scan any server by URL (no database required)
npm run scan -- scan https://your-server.example.com/mcp --no-persist

# Seed the registry from the official MCP registry, then scan a registered server
npm run registry:seed
npm run scan -- scan --registry <server-id>

# Scan every registered streamable-http server and write a ranked leaderboard
npm run scan -- scan --batch --md SCAN-RESULTS.md
```

**What it checks**

| # | Check | Detects |
|---|-------|---------|
| 1 | **Transport encryption** | Plaintext `http://` vs TLS |
| 2 | **Unauthenticated tool exposure** | Tri-state: `exposed` (serves ≥1 tool with no credentials — critical) / `enforced` (handshake rejected — pass) / `inconclusive` (handshake accepted but 0 tools — advisory, never critical) |
| 3 | **OAuth 2.1 metadata** | `/.well-known/oauth-protected-resource` and `/.well-known/oauth-authorization-server` discovery |
| 4 | **RFC 8707 audience binding** | Resource indicators in the OAuth metadata (mitigates confused-deputy token replay) |
| 5 | **Tool-description poisoning** | Hidden model-directed instructions, prerequisite-action injection, instruction overrides, sensitive-file/cred references, exfiltration directives, and invisible/bidi/tag Unicode — tuned for low false positives |
| 6 | **Rug-pull / silent redefinition** | SHA-256 fingerprint of each tool's `name + description + inputSchema`, baselined per target and diffed on re-scan; any post-baseline mutation is flagged |
| 7 | **Advisory checklist** | Scope minimization, short-lived tokens, no token passthrough, server-side audit logging — surfaced as `advisory` (cannot be verified externally) |

**Scoring:** start at 100, subtract per `fail` by severity (critical 40 / high 20 / medium 10 / low 4), floored at 0 → **A** ≥90 · **B** ≥75 · **C** ≥60 · **D** ≥40 · **F** <40.

**Passive / ethics guarantee.** The scanner only sends `initialize`, `notifications/initialized`, `tools/list`, and GETs the `.well-known` documents. It **never executes a tool, never sends credentials, and never scans private/internal hosts** — an outbound-URL guard rejects localhost and private IP ranges before any request. Only scan servers you are authorized to test. `stdio` transport is a documented stub for a later pass; this release audits Streamable HTTP.

> The `SCAN-RESULTS.md` leaderboard is generated by running `registry:seed` then `scan --batch` against a configured `DATABASE_URL`.

**In the registry UI.** Every persisted scan is surfaced on the server's registry detail page: a **Security** card sits alongside the health metrics, showing the latest grade, score, and a one-line auth summary (e.g. _"13 tools exposed, no auth"_ or _"auth enforced"_). Servers that haven't been scanned yet simply show `—`.

### Desktop Agent
The deployed MCPHub app runs in the cloud, but your local MCP servers don't. The Desktop Agent is a lightweight bridge — install it once, and the web app can reach `localhost` just like Postman's desktop agent.

```bash
npm install -g @naman_411/mcphub-agent
mcphub-agent start
```

When the agent is running, the Playground shows a **⚡ DESKTOP AGENT DETECTED** banner. Enable it and connect to any local server — via URL or stdio command — directly from the browser.

---

## Why MCPHub?

Existing tools each solve one piece of the problem:

| | MCP Inspector | Smithery.ai | awesome-mcp-servers | Postman | **MCPHub** |
|---|:---:|:---:|:---:|:---:|:---:|
| Server discovery / registry | — | ✓ | ✓ | — | **✓** |
| Connect to arbitrary servers | ✓ | — | — | — | **✓** |
| Auto-generated tool forms | ✓ | — | — | — | **✓** |
| Protocol message inspection | — | — | — | — | **✓** |
| Health & latency monitoring | — | — | — | — | **✓** |
| Web-based (shareable) | — | ✓ | ✓ | ✓ | **✓** |
| CI/CD automation | — | — | — | ✓ | **✓** |
| Open source / self-hostable | ✓ | — | ✓ | — | **✓** |

MCPHub is the only tool that does all of these together.

---

## Getting Started

### Use the hosted version

Open **[mcp-hub-pi.vercel.app](https://mcp-hub-pi.vercel.app)** — no account required for the Playground or Registry.

### Run locally

**1. Clone and install**

```bash
git clone https://github.com/yourusername/mcphub
cd mcphub
npm install
```

**2. Configure environment**

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

**3. Set up the database**

```bash
npm run db:setup   # Create tables
npm run db:seed    # Seed the registry
```

**4. Start**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## OAuth Setup

### GitHub

1. [github.com/settings/developers](https://github.com/settings/developers) → **OAuth Apps** → **New OAuth App**
2. Callback URL: `http://localhost:3000/api/auth/callback/github` (or your Vercel domain)
3. Copy **Client ID** → `AUTH_GITHUB_ID`, **Client Secret** → `AUTH_GITHUB_SECRET`

### Google

1. [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services** → **Credentials** → **Create OAuth Client ID**
2. Application type: **Web application**
3. Redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy **Client ID** → `AUTH_GOOGLE_ID`, **Client Secret** → `AUTH_GOOGLE_SECRET`

---

## Scripts

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Vitest
npm run db:setup   # Create database tables
npm run db:push    # Push Drizzle schema changes
npm run db:seed    # Seed registry data
npm run scan       # Security Scan CLI (scan <url> | --registry <id> | --batch)
npm run registry:seed  # Import servers from the official MCP registry
```

---

## Deploy to Vercel

1. Push to GitHub and import the repo at [vercel.com](https://vercel.com)
2. Add all `.env` variables in **Settings → Environment Variables**
3. Redeploy

The included `vercel.json` registers a cron job that runs `/api/cron/health-check` daily at midnight UTC to refresh registry health data.

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| State | Zustand 5 |
| Database | Neon PostgreSQL + Drizzle ORM |
| Auth | NextAuth.js v5 |
| MCP | @modelcontextprotocol/sdk |
| Animations | Framer Motion |
| Charts | Recharts |
| Syntax highlighting | Shiki |
| Deploy | Vercel |

---

## Project Structure

```
app/                        # Next.js App Router
├── page.tsx                # Landing page
├── playground/             # Tool playground
├── inspector/              # Protocol inspector
├── dashboard/              # Health dashboard
├── registry/               # Server registry
├── docs/                   # Documentation
└── api/                    # API routes (MCP proxy, registry, auth, cron)

components/                 # React components (playground, inspector, registry, etc.)
lib/                        # Server logic (ConnectionManager, ProtocolLogger, Drizzle)
├── security/               # Security Scan engine (probe, checks, poisoning, scoring)
stores/                     # Zustand state (connection, playground, inspector)
hooks/                      # Custom React hooks
cli/                        # CLI package — `npx mcphub test`
agent/                      # Desktop Agent — `mcphub-agent`
scripts/                    # DB setup, seeding, and the Security Scan CLI
```

---

## Desktop Agent — Full Docs

See **[DESKTOP_AGENT_QUICKSTART.md](DESKTOP_AGENT_QUICKSTART.md)** for installation, usage, and troubleshooting.

---

## License

MIT
