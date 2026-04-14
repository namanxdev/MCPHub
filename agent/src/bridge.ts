import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { createSSETransport } from './transports/sse.js';
import { createStdioTransport } from './transports/stdio.js';
import { createHTTPTransport } from './transports/http.js';
import type { AgentRequest, AgentResponse, SessionInfo } from './types.js';

export class MCPBridge {
  private sessions = new Map<string, Client>();

  async handle(request: AgentRequest): Promise<AgentResponse> {
    try {
      switch (request.type) {
        case 'connect':
          return await this.connect(request);
        case 'disconnect':
          return await this.disconnect(request);
        case 'list_tools':
          return await this.listTools(request);
        case 'call_tool':
          return await this.callTool(request);
        case 'list_resources':
          return await this.listResources(request);
        case 'read_resource':
          return await this.readResource(request);
        case 'list_resource_templates':
          return await this.listResourceTemplates(request);
        case 'list_prompts':
          return await this.listPrompts(request);
        case 'get_prompt':
          return await this.getPrompt(request);
        case 'complete':
          return await this.complete(request);
        default:
          throw new Error(`Unknown request type: ${(request as any).type}`);
      }
    } catch (error) {
      return {
        id: request.id,
        type: 'error',
        payload: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async connect(req: AgentRequest): Promise<AgentResponse> {
    const { transport, url, command, args, env, headers } = req.payload;

    if (!transport) {
      throw new Error('Transport type is required');
    }

    let mcpTransport: Transport;

    if (transport === 'sse') {
      if (!url) throw new Error('URL is required for SSE transport');
      mcpTransport = createSSETransport({ url, headers });
    } else if (transport === 'streamable-http') {
      if (!url) throw new Error('URL is required for HTTP transport');
      mcpTransport = createHTTPTransport({ url, headers });
    } else if (transport === 'stdio') {
      if (!command) throw new Error('Command is required for stdio transport');
      // Split full command string into executable + args when args not provided separately
      // e.g. "npx -y @modelcontextprotocol/server-github" → cmd="npx", args=["-y", "..."]
      let cmd = command;
      let cmdArgs = args;
      if (!cmdArgs || cmdArgs.length === 0) {
        const parts = command.trim().split(/\s+/);
        cmd = parts[0];
        cmdArgs = parts.slice(1);
      }
      mcpTransport = createStdioTransport({ command: cmd, args: cmdArgs, env });
    } else {
      throw new Error(`Unsupported transport type: ${transport}`);
    }

    const sessionId = crypto.randomUUID();
    const client = new Client(
      {
        name: 'mcphub-agent',
        version: '1.0.0',
      },
      {
        capabilities: {
          sampling: {},
        },
      }
    );

    await client.connect(mcpTransport);

    this.sessions.set(sessionId, client);

    // Fetch server info and capabilities
    const serverInfo = client.getServerVersion();
    const serverCapabilities = client.getServerCapabilities();

    const sessionInfo: SessionInfo = {
      sessionId,
      capabilities: serverCapabilities || {},
      serverInfo: serverInfo || { name: 'unknown', version: 'unknown' },
    };

    return {
      id: req.id,
      type: 'result',
      payload: sessionInfo,
    };
  }

  private async disconnect(req: AgentRequest): Promise<AgentResponse> {
    const { sessionId } = req.payload;
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const client = this.sessions.get(sessionId);
    if (!client) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    await client.close();
    this.sessions.delete(sessionId);

    return {
      id: req.id,
      type: 'result',
      payload: { success: true },
    };
  }

  private async listTools(req: AgentRequest): Promise<AgentResponse> {
    const { sessionId } = req.payload;
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const client = this.sessions.get(sessionId);
    if (!client) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const result = await client.listTools();

    return {
      id: req.id,
      type: 'result',
      payload: result,
    };
  }

  private async callTool(req: AgentRequest): Promise<AgentResponse> {
    const { sessionId, name, arguments: args } = req.payload;
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    if (!name) {
      throw new Error('Tool name is required');
    }

    const client = this.sessions.get(sessionId);
    if (!client) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const result = await client.callTool({
      name,
      arguments: args || {},
    });

    return {
      id: req.id,
      type: 'result',
      payload: result,
    };
  }

  private async listResources(req: AgentRequest): Promise<AgentResponse> {
    const { sessionId } = req.payload;
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const client = this.sessions.get(sessionId);
    if (!client) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const result = await client.listResources();

    return {
      id: req.id,
      type: 'result',
      payload: result,
    };
  }

  private async readResource(req: AgentRequest): Promise<AgentResponse> {
    const { sessionId, uri } = req.payload;
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    if (!uri) {
      throw new Error('Resource URI is required');
    }

    const client = this.sessions.get(sessionId);
    if (!client) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const result = await client.readResource({ uri });

    return {
      id: req.id,
      type: 'result',
      payload: result,
    };
  }

  private async listResourceTemplates(req: AgentRequest): Promise<AgentResponse> {
    const { sessionId } = req.payload;
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const client = this.sessions.get(sessionId);
    if (!client) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const result = await client.listResourceTemplates();

    return {
      id: req.id,
      type: 'result',
      payload: result,
    };
  }

  private async listPrompts(req: AgentRequest): Promise<AgentResponse> {
    const { sessionId } = req.payload;
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const client = this.sessions.get(sessionId);
    if (!client) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const result = await client.listPrompts();

    return {
      id: req.id,
      type: 'result',
      payload: result,
    };
  }

  private async getPrompt(req: AgentRequest): Promise<AgentResponse> {
    const { sessionId, promptName, promptArguments } = req.payload;
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    if (!promptName) {
      throw new Error('Prompt name is required');
    }

    const client = this.sessions.get(sessionId);
    if (!client) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const result = await client.getPrompt({
      name: promptName,
      arguments: promptArguments || {},
    });

    return {
      id: req.id,
      type: 'result',
      payload: result,
    };
  }

  private async complete(req: AgentRequest): Promise<AgentResponse> {
    const { sessionId, ref, argument } = req.payload;
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    if (!ref) {
      throw new Error('Ref is required for completion');
    }
    if (!argument) {
      throw new Error('Argument is required for completion');
    }

    const client = this.sessions.get(sessionId);
    if (!client) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Cast ref to the SDK's discriminated union type
    type CompleteRef =
      | { type: 'ref/prompt'; name: string }
      | { type: 'ref/resource'; uri: string };
    const result = await client.complete({
      ref: ref as CompleteRef,
      argument,
    });

    return {
      id: req.id,
      type: 'result',
      payload: result,
    };
  }

  cleanupAll(): void {
    for (const [sessionId, client] of this.sessions.entries()) {
      client.close().catch((err) => {
        console.error(`Error closing session ${sessionId}:`, err);
      });
    }
    this.sessions.clear();
  }
}
