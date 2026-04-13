# MCPHub Desktop Agent Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or pnpm

## Installation Steps

### 1. Install Dependencies

```bash
cd agent
npm install
```

### 2. Build the Agent

```bash
npm run build
```

### 3. Link Globally (Optional)

To make `mcphub-agent` available globally:

```bash
npm link
```

Or install globally from the directory:

```bash
npm install -g .
```

### 4. Verify Installation

```bash
mcphub-agent --version
```

Should output: `1.0.0`

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

### Custom Port

```bash
mcphub-agent start --port 8888
```

### Stop the Agent

Press `Ctrl+C` in the terminal where the agent is running.

## Testing with MCPHub

1. **Start the agent**: `mcphub-agent start`
2. **Start a local MCP server** (in another terminal):
   ```bash
   npx -y @modelcontextprotocol/proxy --shell -- npx -y @modelcontextprotocol/server-github
   ```
3. **Open MCPHub** in your browser (deployed version or localhost)
4. **In the Playground**:
   - You should see a "Desktop Agent" toggle (green lightning icon)
   - Enable the toggle
   - Enter your local MCP server URL (e.g., `http://localhost:8080/sse`)
   - Click "INITIALIZE"

## Troubleshooting

### Agent won't start

**Error**: `EADDRINUSE`
- **Solution**: Another process is using port 54319. Either:
  - Find and close the process using that port
  - Start the agent on a different port: `mcphub-agent start --port 54320`

### MCPHub doesn't detect the agent

- **Check**: Is the agent running? Look for the "listening on ws://localhost:54319" message
- **Check**: Are you on the same machine? The agent only works for localhost connections
- **Check**: Browser console for connection errors
- **Try**: Refresh the MCPHub page

### Connection fails

- **Check**: Is your local MCP server running?
- **Check**: Is the URL correct? (should be `http://localhost:PORT/sse` or similar)
- **Check**: Agent console logs for error messages

## Logs

The agent outputs logs to the console:
- `✅` = Successful operation
- `❌` = Error
- `📥` = Incoming request
- `🔌` = Disconnection

## Windows-Specific Notes

If you get permission errors when running `npm link`, try:
1. Run PowerShell/Command Prompt as Administrator
2. Then run `npm link` from the agent directory

## Uninstall

```bash
# If installed globally
npm uninstall -g @mcphub/agent

# If linked
npm unlink @mcphub/agent
```
