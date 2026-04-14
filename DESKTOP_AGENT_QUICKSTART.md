# MCPHub Desktop Agent - Quick Start Guide

Get up and running with the MCPHub Desktop Agent in 5 minutes.

## What is the Desktop Agent?

The Desktop Agent is a lightweight CLI tool that allows the deployed MCPHub web app (on Vercel) to connect to MCP servers running on your local machine, just like Postman's Desktop Agent.

## Prerequisites

- Node.js 18 or higher
- npm or pnpm
- A local MCP server to test with

## Installation

Install globally from npm (Node.js 18+ required):

```bash
npm install -g @naman_411/mcphub-agent

# verify
mcphub-agent --version
```

> On Windows, run the terminal as Administrator if you get a permissions error.

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

### Connect from MCPHub Web

1. **Open MCPHub** in your browser (`mcp-hub-pi.vercel.app/playground`)
2. **Look for the green ⚡ DESKTOP AGENT DETECTED banner** — appears automatically when the agent is running
3. **Enable the toggle**
4. Choose your transport:
   - **SSE/HTTP** — enter your local server URL (e.g. `http://localhost:8080/sse`)
   - **Command (Stdio)** — type the command directly, add env vars in the form
5. **Click INITIALIZE**

**Example — GitHub MCP server via stdio (no mcp-proxy needed):**

In the connect form, set:
- Transport: `Command (Stdio)`
- Command: `npx -y @modelcontextprotocol/server-github`
- Env var: `GITHUB_PERSONAL_ACCESS_TOKEN` = your token

The agent spawns the process on your machine directly.

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
