export type TransportType = 'sse' | 'streamable-http' | 'stdio';

export interface AgentRequest {
  id: string;
  type: 'connect' | 'disconnect' | 'call_tool' | 'list_tools' |
        'list_resources' | 'read_resource' | 'list_prompts' | 'get_prompt' |
        'list_resource_templates' | 'complete';
  payload: {
    // For connect
    transport?: TransportType;
    url?: string;
    command?: string;
    args?: string[];
    headers?: Record<string, string>;
    env?: Record<string, string>;
    // For operations on connected sessions
    sessionId?: string;
    // For tool calls
    name?: string;
    arguments?: Record<string, unknown>;
    // For resource operations
    uri?: string;
    // For prompt operations
    promptName?: string;
    promptArguments?: Record<string, string>;
    // For completion
    ref?: {
      type: 'ref/resource' | 'ref/prompt';
      uri?: string;
      name?: string;
    };
    argument?: {
      name: string;
      value: string;
    };
  };
}

export interface AgentResponse {
  id: string;
  type: 'result' | 'error';
  payload: unknown;
  error?: string;
}

export interface SessionInfo {
  sessionId: string;
  capabilities: {
    tools?: unknown;
    resources?: unknown;
    prompts?: unknown;
    logging?: unknown;
  };
  serverInfo: {
    name: string;
    version: string;
    protocolVersion?: string;
  };
}
