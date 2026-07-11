// lib/security/checks.ts
import type { Finding, ProbedTool, Severity, Status } from "./types.js";
import { scanDescription } from "./poison.js";
import type { ProbeResult } from "./client.js";

const ADVISORY: Finding[] = (
  [
    ["MCP-ADV-SCOPES", "Per-tool scope minimization", "Tokens should be scoped to each tool's minimum need, not broad PATs."],
    ["MCP-ADV-TTL", "Short-lived tokens", "Prefer session-scoped / short-TTL tokens over long-lived static credentials."],
    ["MCP-ADV-PASSTHROUGH", "No token passthrough", "Server must not forward a client token downstream to other services."],
    ["MCP-ADV-AUDIT", "Server-side audit logging", "Every tool invocation should be logged with caller identity + arguments."],
  ] as const
).map(([id, title, detail]) => ({
  id, title, detail,
  category: "Auth (manual review)",
  severity: "medium" as Severity,
  status: "advisory" as Status,
}));

export interface BuildFindingsInput {
  isHttps: boolean;
  probe: ProbeResult;
  wellKnown: { prm: any | null; asm: any | null };
  driftFindings: Finding[];
}

export function buildFindings(input: BuildFindingsInput): Finding[] {
  const { isHttps, probe, wellKnown, driftFindings } = input;
  const findings: Finding[] = [];

  // 1. Transport encryption
  findings.push({
    id: "MCP-TLS",
    title: isHttps ? "Transport encrypted (TLS)" : "Transport UNENCRYPTED (plaintext HTTP)",
    category: "Transport",
    severity: "critical",
    status: isHttps ? "pass" : "fail",
    detail: isHttps ? "Endpoint served over HTTPS." : "MCP traffic is in cleartext — tokens and tool data are interceptable.",
  });

  // 2. Unauthenticated access (tri-state)
  if (!probe.reachable) {
    findings.push({ id: "MCP-REACH", title: "Endpoint unreachable", category: "Transport", severity: "info", status: "error", detail: probe.note });
  } else if (probe.exposure === "exposed") {
    findings.push({ id: "MCP-AUTH-UNAUTH", title: "Server serves tools WITHOUT authentication", category: "Auth", severity: "critical", status: "fail", detail: probe.note });
  } else if (probe.exposure === "enforced") {
    findings.push({ id: "MCP-AUTH-UNAUTH", title: "Authentication enforced", category: "Auth", severity: "critical", status: "pass", detail: probe.note });
  } else {
    findings.push({ id: "MCP-AUTH-UNAUTH", title: "Unauthenticated exposure inconclusive", category: "Auth", severity: "medium", status: "advisory", detail: probe.note });
  }

  // 3. OAuth 2.1 metadata + 4. RFC 8707 audience binding
  const hasMeta = !!(wellKnown.prm || wellKnown.asm);
  findings.push({
    id: "MCP-OAUTH-META",
    title: hasMeta ? "OAuth 2.1 metadata published" : "No OAuth 2.1 metadata found",
    category: "Auth",
    severity: "high",
    status: hasMeta ? "pass" : "fail",
    detail: hasMeta
      ? "Server advertises .well-known OAuth metadata."
      : "No .well-known/oauth-protected-resource or authorization-server metadata — likely static-key or no auth.",
  });
  if (hasMeta) {
    const hasAudience = !!(wellKnown.prm?.resource || wellKnown.prm?.resource_indicators || wellKnown.asm?.resource);
    findings.push({
      id: "MCP-RFC8707",
      title: hasAudience ? "Audience/resource binding declared (RFC 8707)" : "No audience binding declared (RFC 8707)",
      category: "Auth",
      severity: "high",
      status: hasAudience ? "pass" : "fail",
      detail: hasAudience
        ? "Tokens are audience-bound, mitigating cross-server token reuse / confused-deputy."
        : "Without resource indicators, a token issued for another server may be replayable here.",
    });
  }

  // 5. Tool-description poisoning (sorted by tool name for determinism)
  const tools: ProbedTool[] = [...probe.tools].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  let poisonHit = false;
  for (const t of tools) {
    const hits = scanDescription(`${t.description ?? ""} ${JSON.stringify(t.inputSchema ?? {})}`);
    if (hits.length) {
      poisonHit = true;
      findings.push({
        id: `MCP-POISON-${t.name}`,
        title: `Suspicious content in tool "${t.name}"`,
        category: "Tool integrity",
        severity: "high",
        status: "fail",
        detail: `Possible tool-poisoning signatures: ${hits.join("; ")}.`,
      });
    }
  }
  if (tools.length && !poisonHit) {
    findings.push({ id: "MCP-POISON-CLEAN", title: "No poisoning signatures in tool descriptions", category: "Tool integrity", severity: "info", status: "pass", detail: `Scanned ${tools.length} tool description(s).` });
  }

  // 6. Rug-pull drift (from Task 4 / store)
  findings.push(...driftFindings);

  // 7. Advisory checklist
  findings.push(...ADVISORY);

  return findings;
}
