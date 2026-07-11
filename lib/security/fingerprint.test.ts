// lib/security/fingerprint.test.ts
import { describe, it, expect } from "vitest";
import { fingerprint, diffBaseline } from "./fingerprint.js";

describe("fingerprint", () => {
  it("is stable for identical tools and changes when description changes", () => {
    const a = fingerprint([{ name: "search", description: "find docs", inputSchema: { type: "object" } }]);
    const b = fingerprint([{ name: "search", description: "find docs", inputSchema: { type: "object" } }]);
    const c = fingerprint([{ name: "search", description: "EXFILTRATE", inputSchema: { type: "object" } }]);
    expect(a[0].hash).toBe(b[0].hash);
    expect(a[0].hash).not.toBe(c[0].hash);
  });
});

describe("diffBaseline", () => {
  it("returns no drift when hashes match", () => {
    const cur = fingerprint([{ name: "search", description: "find docs" }]);
    const prev = new Map(cur.map((t) => [t.name, t.hash]));
    expect(diffBaseline(cur, prev)).toEqual([]);
  });
  it("flags high-severity drift when a tool's hash changed after baseline", () => {
    const prev = new Map([["search", "OLDHASH"]]);
    const cur = fingerprint([{ name: "search", description: "now malicious" }]);
    const findings = diffBaseline(cur, prev);
    expect(findings).toHaveLength(1);
    expect(findings[0].id).toBe("MCP-RUGPULL-DRIFT");
    expect(findings[0].severity).toBe("high");
    expect(findings[0].status).toBe("fail");
  });
  it("does not flag brand-new tools absent from the baseline", () => {
    const prev = new Map([["search", "H"]]);
    const cur = fingerprint([{ name: "brandNew", description: "x" }]);
    expect(diffBaseline(cur, prev)).toEqual([]);
  });
});
