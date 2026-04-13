import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface StdioTransportOptions {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export function createStdioTransport(options: StdioTransportOptions): StdioClientTransport {
  return new StdioClientTransport({
    command: options.command,
    args: options.args || [],
    env: options.env
      ? ({ ...process.env, ...options.env } as Record<string, string>)
      : (process.env as Record<string, string>),
  });
}
