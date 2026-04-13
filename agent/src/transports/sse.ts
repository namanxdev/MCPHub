import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

export interface SSETransportOptions {
  url: string;
  headers?: Record<string, string>;
}

export function createSSETransport(options: SSETransportOptions): SSEClientTransport {
  const url = new URL(options.url);
  const requestInit: RequestInit = options.headers ? { headers: options.headers } : {};
  return new SSEClientTransport(url, { requestInit });
}
