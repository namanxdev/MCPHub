// lib/security/report.test.ts
import { describe, it, expect } from "vitest";
import { renderReport, renderLeaderboard } from "./report.js";
import type { ScanResult } from "./types.js";

const result: ScanResult = {
  target: "https://example.com/mcp",
  serverId: null,
  scannedAt: "2026-07-11T00:00:00.000Z",
  score: 40,
  grade: "D",
  tools: [{ name: "a", hash: "h" }],
  findings: [
    { id: "MCP-TLS", title: "Transport encrypted (TLS)", category: "Transport", severity: "critical", status: "pass", detail: "ok" },
  ],
};

describe("renderReport", () => {
  it("includes target, grade, and a findings row", () => {
    const md = renderReport(result);
    expect(md).toContain("https://example.com/mcp");
    expect(md).toContain("Grade D");
    expect(md).toContain("Transport encrypted (TLS)");
  });
});

describe("renderLeaderboard", () => {
  it("orders worst grade first and is deterministic", () => {
    const rows = [
      { target: "a", grade: "A", score: 95 },
      { target: "b", grade: "F", score: 10 },
      { target: "c", grade: "C", score: 65 },
    ];
    const md = renderLeaderboard(rows);
    const iF = md.indexOf("| b |");
    const iC = md.indexOf("| c |");
    const iA = md.indexOf("| a |");
    expect(iF).toBeLessThan(iC);
    expect(iC).toBeLessThan(iA);
  });
});
