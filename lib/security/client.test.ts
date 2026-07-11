// lib/security/client.test.ts
import { describe, it, expect } from "vitest";
import { classifyExposure } from "./client.js";

describe("classifyExposure — tri-state auth", () => {
  it("enforced when initialize is rejected without creds", () => {
    expect(classifyExposure({ initOk: false, initError: true, listOk: false, toolCount: 0 }).exposure).toBe("enforced");
  });
  it("exposed only when >=1 tool returned with no creds", () => {
    expect(classifyExposure({ initOk: true, initError: false, listOk: true, toolCount: 3 }).exposure).toBe("exposed");
  });
  it("inconclusive when handshake accepted but 0 tools (NOT critical)", () => {
    const r = classifyExposure({ initOk: true, initError: false, listOk: true, toolCount: 0 });
    expect(r.exposure).toBe("inconclusive");
  });
  it("enforced when tools/list itself is refused after handshake", () => {
    expect(classifyExposure({ initOk: true, initError: false, listOk: false, toolCount: 0 }).exposure).toBe("enforced");
  });
});
