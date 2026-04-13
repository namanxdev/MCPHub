import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export interface HTTPTransportOptions {
  url: string;
  headers?: Record<string, string>;
}

export function createHTTPTransport(options: HTTPTransportOptions): StreamableHTTPClientTransport {
  const url = new URL(options.url);
  const requestInit: RequestInit = options.headers ? { headers: options.headers } : {};
  return new StreamableHTTPClientTransport(url, { requestInit });
}
