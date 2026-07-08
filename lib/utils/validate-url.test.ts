import { describe, it, expect } from "vitest";
import { validateOutboundUrl } from "./validate-url";

// These cases all reject on the synchronous protocol/private-IP checks, before
// any DNS lookup, so they run hermetically without network access.
describe("validateOutboundUrl", () => {
  it("rejects a malformed URL", async () => {
    const r = await validateOutboundUrl("not a url");
    expect(r).toEqual({ ok: false, status: 400, error: "Invalid URL" });
  });

  it("rejects plain http for a non-localhost host", async () => {
    const r = await validateOutboundUrl("http://example.com/sse");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(403);
  });

  it("rejects a private IPv4 literal (10.x) over https", async () => {
    const r = await validateOutboundUrl("https://10.0.0.1/sse");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(403);
  });

  it("rejects a private IPv4 literal (192.168.x)", async () => {
    const r = await validateOutboundUrl("https://192.168.1.1/sse");
    expect(r.ok).toBe(false);
  });

  it("rejects the 172.16-31 private range", async () => {
    const r = await validateOutboundUrl("https://172.20.5.5/sse");
    expect(r.ok).toBe(false);
  });

  it("rejects the cloud metadata address (link-local 169.254) over https", async () => {
    // 169.254.169.254 is the AWS/GCP metadata endpoint — a classic SSRF target.
    // It must be blocked on the literal-IP check, even over https.
    const r = await validateOutboundUrl("https://169.254.169.254/latest/meta-data/");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(403);
  });

  it("rejects loopback (127.x)", async () => {
    const r = await validateOutboundUrl("https://127.0.0.1/sse");
    expect(r.ok).toBe(false);
  });

  it("rejects IPv6 loopback ::1", async () => {
    const r = await validateOutboundUrl("https://[::1]/sse");
    expect(r.ok).toBe(false);
  });

  it("rejects localhost when allowLocalhost is false (registry path)", async () => {
    const r = await validateOutboundUrl("http://localhost:8080/sse", {
      allowLocalhost: false,
    });
    expect(r.ok).toBe(false);
  });

  it("allows a localhost URL when allowLocalhost is true (connect path)", async () => {
    const r = await validateOutboundUrl("http://localhost:8080/sse", {
      allowLocalhost: true,
    });
    expect(r).toEqual({ ok: true });
  });

  it("allows 127.0.0.1 when allowLocalhost is true", async () => {
    const r = await validateOutboundUrl("http://127.0.0.1:8080/sse", {
      allowLocalhost: true,
    });
    expect(r).toEqual({ ok: true });
  });
});
