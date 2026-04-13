# Troubleshooting Local MCP Servers with Deployed MCPHub

This document explains the common pitfalls and architectural constraints when trying to connect a **locally running MCP Server** to a **cloud-deployed MCPHub** (e.g., on Vercel).

## The Scenario

You are developing or testing an MCP server locally (like the official `@modelcontextprotocol/server-github`).
You use `mcp-proxy` to wrap your standard I/O (stdio) server and expose it over HTTP via Server-Sent Events (SSE):

```bash
GITHUB_PERSONAL_ACCESS_TOKEN="your_token" npx -y mcp-proxy@latest --shell -- npx -y @modelcontextprotocol/server-github
```

The terminal correctly says:
```text
GitHub MCP Server running on stdio
starting server on port 8080
```

You then navigate to your deployed MCPHub (e.g., `mcp-hub-pi.vercel.app`), go to the Playground, and enter `http://localhost:8080/sse` in the connection form.

---

## Issue 1: The `ECONNREFUSED` Error

When you hit "Connect", you encounter an error like:
> `Server unreachable: SSE error: TypeError: fetch failed: connect ECONNREFUSED 127.0.0.1:8080`

### Why This Happens
The connection from your web browser to the MCP server does **not** happen directly from your browser. Because of CORS (Cross-Origin Resource Sharing) restrictions and security constraints in modern browsers, the browser talks to the **MCPHub Backend API** (`/api/connect`), and the backend attempts to establish the persistent SSE connection to the MCP server.

When the backend (living on a server farm at Vercel) tries to connect to `http://localhost:8080`, it is looking for port 8080 on *its own* cloud server, not your personal laptop. Since there is no MCP server running inside Vercel's data center, the connection is refused.

---

## Issue 2: The `500 Internal Server Error` with Tunnels

To fix the localhost issue, you might try adding a public tunnel to your local proxy using the `--tunnel` flag:

```bash
npx -y mcp-proxy@latest --tunnel --shell -- npx -y @modelcontextprotocol/server-github
```

This successfully gives you a public URL (e.g., `https://some-random-id.tunnel.gla.ma/sse`). You paste this into the deployed MCPHub, but now you get a **500 Internal Server Error**.

### Why This Happens
1. **Free Tunnel Interstitials:** Free tunneling services like `tunnel.gla.ma` or `localtunnel` often inject a security warning page the very first time you visit them (e.g., *"You are about to visit a tunnel website. Click to continue"*). When the Vercel backend expects to receive a JSON/SSE stream but instead receives raw warning HTML, its parser breaks and throws a 500 error.
2. **Serverless Limitations (The Vercel Problem):** Vercel backend APIs run on "Serverless Functions." These functions are designed to wake up, answer a single HTTP request, and immediately go to sleep to save money. However, an MCP connection over SSE requires a **persistent, long-lived stream**. The serverless function will forcefully terminate your connection stream after a few seconds anyway.

---

## The "Postman" Comparison

You might wonder: *"But Postman Web works with localhost APIs just fine!"*

That is because Postman requires you to install the **Postman Desktop Agent**—a small, hidden background app running on your computer. When you use the Postman Web UI, it secretly talks to this local Desktop Agent, which acts as a bridge from the web to your local network.

For MCPHub, running your own "Desktop Agent" simply means running the MCPHub codebase locally.

---

## The Solution: MCPHub Desktop Agent (Recommended)

**Like Postman's Desktop Agent**, MCPHub now provides a lightweight local agent that bridges the deployed web app to your local MCP servers.

### Quick Start

**Step 1. Install the Desktop Agent**
```bash
cd agent
npm install
npm run build
npm link
```

**Step 2. Start the Agent**
```bash
mcphub-agent start
```

You should see:
```
🚀 MCPHub Agent listening on ws://localhost:54319
Waiting for connections from MCPHub web app...
```

**Step 3. Start your local MCP Server**
In another terminal:
```bash
GITHUB_PERSONAL_ACCESS_TOKEN="your_token" npx -y mcp-proxy@latest --shell -- npx -y @modelcontextprotocol/server-github
```

**Step 4. Connect from Deployed MCPHub**
1. Open the deployed MCPHub (e.g., `mcp-hub-pi.vercel.app`)
2. Go to the Playground
3. You'll see a **Desktop Agent** toggle with a green lightning icon ⚡
4. Enable the toggle
5. Enter `http://localhost:8080/sse` for the Server URL
6. Click **INITIALIZE**

The agent bridges your browser to the local server via WebSocket!

### How It Works

```
Browser (MCPHub on Vercel)
    ↓ WebSocket (ws://localhost:54319)
mcphub-agent (local CLI)
    ↓ MCP SDK
Local MCP Server (localhost:8080)
```

See [agent/SETUP.md](agent/SETUP.md) for detailed setup instructions.

---

## Alternative Solution: Run MCPHub Locally

If you prefer not to use the Desktop Agent, you can run both the MCP server *and* the MCPHub frontend locally so they share the same local network footprint.

**Step 1. Start your local MCP Server (with Proxy)**
Open a terminal and run your server on port 8080:
```bash
GITHUB_PERSONAL_ACCESS_TOKEN="your_token" npx -y mcp-proxy@latest --shell -- npx -y @modelcontextprotocol/server-github
```

**Step 2. Start MCPHub Locally**
Open a *second terminal* in the `frontend` folder of your MCPHub project and start the development server:
```bash
cd frontend
npm run dev
```

**Step 3. Connect via Localhost**
1. Open your browser and go to `http://localhost:3000`.
2. Go to the Playground.
3. Select the **SSE** transport tab.
4. Enter `http://localhost:8080/sse` for the Server URL.
5. Click **Connect**.

The MCPHub application running on your laptop will natively communicate with the `mcp-proxy` running on your laptop, avoiding all CORS issues, tunnel blockers, and serverless timeouts!