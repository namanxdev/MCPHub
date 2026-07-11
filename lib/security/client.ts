// lib/security/client.ts
import type { Exposure, ProbedTool, WellKnownDocs } from "./types.js";
import { validateOutboundUrl } from "../utils/validate-url.js";

const CLIENT_INFO = { name: "mcphub-security-scan", version: "1.0.0" };
const RPC_TIMEOUT_MS = 15000;

/** Minimal shape of a JSON-RPC response we read from (fields are optional/unknown). */
interface RpcResponse {
  error?: unknown;
  result?: { tools?: unknown };
}

async function rpc(
  url: string,
  body: unknown,
  sessionId?: string
): Promise<{ json: RpcResponse | null; sessionId?: string; ok: boolean }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
  });
  const returnedSession = res.headers.get("mcp-session-id") ?? sessionId;
  const raw = await res.text();
  const contentType = res.headers.get("content-type") ?? "";

  let json: RpcResponse | null = null;
  try {
    if (contentType.includes("text/event-stream")) {
      for (const line of raw.split(/\r?\n/)) {
        const t = line.trim();
        if (t.startsWith("data:")) {
          const payload = t.slice(5).trim();
          if (payload && payload !== "[DONE]") json = JSON.parse(payload);
        }
      }
    } else if (raw.trim()) {
      json = JSON.parse(raw);
    }
  } catch {
    /* leave json null */
  }
  return { json, sessionId: returnedSession, ok: res.ok };
}

/** Pure decision function — the tri-state auth logic (unit tested). */
export function classifyExposure(input: {
  initOk: boolean;
  initError: boolean;
  listOk: boolean;
  toolCount: number;
}): { exposure: Exposure; note: string } {
  if (!input.initOk || input.initError) {
    return { exposure: "enforced", note: "initialize rejected without credentials (auth required)" };
  }
  if (input.listOk && input.toolCount > 0) {
    return { exposure: "exposed", note: `Server returned ${input.toolCount} tool(s) with no credentials presented` };
  }
  if (input.listOk) {
    return {
      exposure: "inconclusive",
      note: "Unauthenticated handshake accepted but no tools listed (tool list may itself require auth)",
    };
  }
  return { exposure: "enforced", note: "tools/list not served without auth" };
}

export interface ProbeResult {
  reachable: boolean;
  exposure: Exposure;
  tools: ProbedTool[];
  note: string;
}

/** Passive probe: initialize + initialized + tools/list, with NO credentials. Never calls a tool. */
export async function probeNoAuth(url: string): Promise<ProbeResult> {
  // Host guard: refuse private/internal targets (SSRF + passive-scope rule).
  const guard = await validateOutboundUrl(url, { allowLocalhost: false });
  if (!guard.ok) {
    return { reachable: false, exposure: "unreachable", tools: [], note: `blocked: ${guard.error}` };
  }
  try {
    const init = await rpc(url, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: CLIENT_INFO },
    });
    const initError = !!init.json?.error;
    if (!init.ok || initError) {
      const { exposure, note } = classifyExposure({ initOk: init.ok, initError, listOk: false, toolCount: 0 });
      return { reachable: true, exposure, tools: [], note };
    }
    const session = init.sessionId;
    await rpc(url, { jsonrpc: "2.0", method: "notifications/initialized" }, session);
    const list = await rpc(url, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, session);
    const tools: ProbedTool[] = Array.isArray(list.json?.result?.tools) ? list.json.result.tools : [];
    const listOk = list.ok && Array.isArray(list.json?.result?.tools);
    const { exposure, note } = classifyExposure({ initOk: true, initError: false, listOk, toolCount: tools.length });
    return { reachable: true, exposure, tools, note };
  } catch (e) {
    return { reachable: false, exposure: "unreachable", tools: [], note: `unreachable: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function fetchWellKnown(baseUrl: string): Promise<WellKnownDocs> {
  const origin = new URL(baseUrl).origin;
  const grab = async (path: string): Promise<Record<string, unknown> | null> => {
    try {
      const r = await fetch(origin + path, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
      });
      return r.ok ? ((await r.json()) as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  };
  return {
    prm: await grab("/.well-known/oauth-protected-resource"),
    asm: await grab("/.well-known/oauth-authorization-server"),
  };
}
