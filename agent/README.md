# MCPHub Desktop Agent

Local agent for connecting the deployed MCPHub web app to localhost MCP servers.

## Problem

When MCPHub is deployed to Vercel (cloud), it cannot directly connect to MCP servers running on your local machine because:
- The backend's `localhost` refers to Vercel's server, not your machine
- Free tunnels inject HTML warning pages that break SSE/JSON parsing
- Serverless functions timeout, but MCP needs persistent connections

## Solution

This desktop agent acts as a bridge between the cloud-deployed MCPHub and your local MCP servers via WebSocket.

## Installation

```bash
cd agent
npm install
npm run build
npm link
```

## Usage

### Start the agent

```bash
mcphub-agent start
```

The agent will listen on `ws://localhost:54319` by default.

### Custom port

```bash
mcphub-agent start --port 8888
```

### Using with MCPHub

1. Start the agent: `mcphub-agent start`
2. Open MCPHub in your browser
3. In the Playground, toggle "Use Desktop Agent"
4. Connect to your local MCP server (e.g., `http://localhost:8080/sse`)

## Architecture

```
Browser (MCPHub on Vercel)
    ↓ WebSocket (ws://localhost:54319)
mcphub-agent (local CLI)
    ↓ MCP SDK transports
Local MCP Server (localhost:8080)
```

## Supported Transports

- SSE (Server-Sent Events)
- Streamable HTTP
- Stdio

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev
```

## License

MIT
