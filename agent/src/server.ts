import { WebSocketServer, WebSocket } from 'ws';
import { MCPBridge } from './bridge.js';
import type { AgentRequest } from './types.js';

export interface ServerOptions {
  port: number;
}

export function startServer(options: ServerOptions): void {
  const { port } = options;
  const wss = new WebSocketServer({ port });
  const bridge = new MCPBridge();

  console.log(`🚀 MCPHub Agent listening on ws://localhost:${port}`);
  console.log('Waiting for connections from MCPHub web app...\n');

  wss.on('connection', (ws: WebSocket) => {
    console.log('✅ MCPHub web app connected');

    ws.on('message', async (data) => {
      try {
        const request: AgentRequest = JSON.parse(data.toString());
        console.log(`📥 Request: ${request.type} (id: ${request.id})`);

        const response = await bridge.handle(request);

        if (response.type === 'error') {
          console.log(`❌ Error: ${response.error}`);
        } else {
          console.log(`✅ Response: ${request.type} completed`);
        }

        ws.send(JSON.stringify(response));
      } catch (error) {
        console.error('❌ Failed to process message:', error);
        ws.send(
          JSON.stringify({
            id: 'unknown',
            type: 'error',
            payload: null,
            error: error instanceof Error ? error.message : String(error),
          })
        );
      }
    });

    ws.on('close', () => {
      console.log('🔌 MCPHub web app disconnected');
      bridge.cleanupAll();
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  });

  wss.on('error', (error) => {
    console.error('❌ Server error:', error);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down MCPHub Agent...');
    wss.close(() => {
      console.log('👋 Goodbye!');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down MCPHub Agent...');
    wss.close(() => {
      console.log('👋 Goodbye!');
      process.exit(0);
    });
  });
}
