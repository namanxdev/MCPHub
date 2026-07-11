// lib/security/fingerprint.ts
import { createHash } from "node:crypto";
import type { Finding, ProbedTool, ToolFingerprint } from "./types.js";

export function fingerprint(tools: ProbedTool[]): ToolFingerprint[] {
  return tools.map((t) => ({
    name: t.name ?? "(unnamed)",
    hash: createHash("sha256")
      .update(JSON.stringify({ n: t.name, d: t.description ?? "", s: t.inputSchema ?? {} }))
      .digest("hex"),
  }));
}

/** Pure diff: flag any tool whose hash changed vs the baseline map (name -> hash). */
export function diffBaseline(current: ToolFingerprint[], previous: Map<string, string>): Finding[] {
  const findings: Finding[] = [];
  for (const t of current) {
    const old = previous.get(t.name);
    if (old && old !== t.hash) {
      findings.push({
        id: "MCP-RUGPULL-DRIFT",
        title: `Tool "${t.name}" changed after approval`,
        category: "Tool integrity",
        severity: "high",
        status: "fail",
        detail:
          "Description or schema mutated since baseline — classic rug-pull / silent-redefinition signature. Re-review before continued use.",
      });
    }
  }
  return findings;
}
