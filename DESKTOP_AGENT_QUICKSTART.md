# MCPHub Desktop Agent - Quick Start Guide

Get up and running with the MCPHub Desktop Agent in 5 minutes.

## What is the Desktop Agent?

The Desktop Agent is a lightweight CLI tool that allows the deployed MCPHub web app (on Vercel) to connect to MCP servers running on your local machine, just like Postman's Desktop Agent.

## Prerequisites

- Node.js 18 or higher
- npm or pnpm
- A local MCP server to test with

## Installation (3 steps)

### Step 1: Navigate to agent directory

```bash
cd agent
```

### Step 2: Install and build

```bash
npm install
npm run build
```

### Step 3: Link globally (optional but recommended)

```bash
npm link
```

Or use the Windows installer:
```bash
install.bat
```

## Usage

### Start the Agent

```bash
mcphub-agent start
```

You should see:
```
🚀 MCPHub Agent listening on ws://localhost:54319
Waiting for connections from MCPHub web app...
```

**Leave this terminal running!**

### Start Your Local MCP Server

In a **new terminal**, start your local MCP server. For example:

```bash
# GitHub server
GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxx" npx -y mcp-proxy --shell -- npx -y @modelcontextprotocol/server-github

# Filesystem server
npx -y mcp-proxy -- npx -y @modelcontextprotocol/server-filesystem /path/to/folder

# Any stdio server
npx -y mcp-proxy --shell -- your-mcp-server-command
```

The server will typically start on `http://localhost:8080/sse`.

### Connect from MCPHub Web

1. **Open MCPHub** in your browser (e.g., `mcp-hub-pi.vercel.app`)
2. **Go to Playground**
3. **Look for the Desktop Agent indicator**:
   - You should see a box with a green ⚡ icon labeled "Desktop Agent"
   - If you see this, the agent is detected!
4. **Enable the toggle** - Click the switch to turn it on (green)
5. **Enter your server URL** - e.g., `http://localhost:8080/sse`
6. **Click INITIALIZE** - Connection should succeed!

## Verify It's Working

In the agent terminal, you should see:
```
✅ MCPHub web app connected
📥 Request: connect (id: xxx-xxx-xxx)
✅ Response: connect completed
📥 Request: list_tools (id: yyy-yyy-yyy)
✅ Response: list_tools completed
```

## Common Issues

### Agent not detected

**Symptom**: No "Desktop Agent" toggle appears in MCPHub

**Solutions**:
1. Make sure the agent is running: `mcphub-agent start`
2. Check the port is 54319 (default)
3. Refresh the MCPHub page
4. Check browser console for errors

### Connection fails

**Symptom**: "Failed to connect via Desktop Agent"

**Solutions**:
1. Is your MCP server running?
2. Is the URL correct? (usually `http://localhost:8080/sse`)
3. Check agent console for error messages
4. Try restarting the agent

### Port already in use

**Symptom**: `Error: listen EADDRINUSE: address already in use :::54319`

**Solution**: Another process is using port 54319
- Find and close it, OR
- Use a different port: `mcphub-agent start --port 54320`

## Commands

```bash
# Start the agent (default port 54319)
mcphub-agent start

# Start on custom port
mcphub-agent start --port 8888

# Show version
mcphub-agent --version

# Show help
mcphub-agent --help
```

## Stop the Agent

Press `Ctrl+C` in the terminal where the agent is running.

## Next Steps

- See [SETUP.md](agent/SETUP.md) for detailed setup instructions
- See [README.md](agent/README.md) for architecture details
- See [TROUBLESHOOTING_LOCAL_SERVERS.md](TROUBLESHOOTING_LOCAL_SERVERS.md) for background

## Architecture Overview

```
┌──────────────────┐
│  Browser         │  MCPHub Web App
│  (Vercel)        │
└────────┬─────────┘
         │
         │ WebSocket (ws://localhost:54319)
         │
┌────────▼─────────┐
│  Desktop Agent   │  mcphub-agent (this tool)
│  (Local)         │
└────────┬─────────┘
         │
         │ MCP SDK
         │
┌────────▼─────────┐
│  MCP Server      │  Your local server
│  (Local)         │
└──────────────────┘
```

## That's It!

You can now use the deployed MCPHub to test and debug your local MCP servers without any tunnel shenanigans.

Happy testing! 🚀
