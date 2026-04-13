### Project 2: MCPHub (Developer Tool, ~45hrs)
**MCP Server Testing Playground + Registry — "Postman for MCP"**

A web-based tool where developers discover, test, and debug MCP servers. Connect to any server, see all tools/resources, invoke them interactively, inspect raw protocol messages.

**Tech Stack:**
- Next.js full-stack (API routes for MCP client connections)
- Neon (registry data)
- Vercel deployment

**MVP Scope:**
1. Server connection manager: connect to MCP servers (SSE transport), display tools/resources/prompts
2. Interactive tool playground: select tool, fill params via auto-generated form, execute, see response
3. Protocol inspector: raw JSON-RPC message viewer with syntax highlighting and timing
4. Server health dashboard: latency per tool, error rates, response sizes
5. Public registry: community-submitted list seeded with 20-30 servers from awesome-mcp-servers
6. CLI tool: `npx mcphub test <server>` for automated health checks

**Cut from MVP:** No server hosting, no auth for browsing, no rating system.

---

