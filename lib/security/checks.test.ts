// lib/security/checks.test.ts
import { describe, it, expect } from "vitest";
import { buildFindings } from "./checks.js";

const base = {
  isHttps: true,
  probe: { reachable: true, exposure: "enforced" as const, tools: [], note: "" },
  wellKnown: { prm: null, asm: null },
  driftFindings: [],
};

describe("buildFindings", () => {
  it("TLS pass on https, fail on http", () => {
    const httpsF = buildFindings({ ...base }).find((f) => f.id === "MCP-TLS")!;
    expect(httpsF.status).toBe("pass");
    const httpF = buildFindings({ ...base, isHttps: false }).find((f) => f.id === "MCP-TLS")!;
    expect(httpF.status).toBe("fail");
    expect(httpF.severity).toBe("critical");
  });

  it("exposed tools => critical fail", () => {
    const f = buildFindings({
      ...base,
      probe: { reachable: true, exposure: "exposed", tools: [{ name: "t", description: "d" }], note: "n" },
    }).find((x) => x.id === "MCP-AUTH-UNAUTH")!;
    expect(f.status).toBe("fail");
    expect(f.severity).toBe("critical");
  });

  it("inconclusive exposure => advisory, NOT critical fail (abmeter case)", () => {
    const f = buildFindings({
      ...base,
      probe: { reachable: true, exposure: "inconclusive", tools: [], note: "n" },
    }).find((x) => x.id === "MCP-AUTH-UNAUTH")!;
    expect(f.status).toBe("advisory");
    expect(f.status).not.toBe("fail");
  });

  it("benign docs tools produce a clean poison pass, zero MCP-POISON-* fails (tandem case)", () => {
    const findings = buildFindings({
      ...base,
      probe: {
        reachable: true,
        exposure: "exposed",
        tools: [
          { name: "search_docs", description: "Search the documentation for a query." },
          { name: "get_doc", description: "Get a document by ID." },
        ],
        note: "n",
      },
    });
    expect(findings.some((f) => f.id.startsWith("MCP-POISON-") && f.status === "fail")).toBe(false);
    expect(findings.some((f) => f.id === "MCP-POISON-CLEAN" && f.status === "pass")).toBe(true);
  });

  it("no OAuth metadata => high fail; no RFC8707 finding emitted when metadata absent", () => {
    const findings = buildFindings({ ...base });
    const oauth = findings.find((f) => f.id === "MCP-OAUTH-META")!;
    expect(oauth.status).toBe("fail");
    expect(findings.find((f) => f.id === "MCP-RFC8707")).toBeUndefined();
  });

  it("appends drift findings and advisory checklist", () => {
    const drift = [{ id: "MCP-RUGPULL-DRIFT", title: "t", category: "Tool integrity", severity: "high" as const, status: "fail" as const, detail: "d" }];
    const findings = buildFindings({ ...base, driftFindings: drift });
    expect(findings.some((f) => f.id === "MCP-RUGPULL-DRIFT")).toBe(true);
    expect(findings.filter((f) => f.status === "advisory" && f.id.startsWith("MCP-ADV-")).length).toBe(4);
  });

  it("emits deterministic ordering (stable across runs)", () => {
    const a = buildFindings({ ...base }).map((f) => f.id);
    const b = buildFindings({ ...base }).map((f) => f.id);
    expect(a).toEqual(b);
  });
});
