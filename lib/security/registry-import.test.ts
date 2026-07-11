// lib/security/registry-import.test.ts
import { describe, it, expect } from "vitest";
import { mapRegistryEntry, type RawEntry } from "./registry-import.js";
import fixtureJson from "./fixtures/registry-page.json";

const fixture = fixtureJson as { servers: RawEntry[] };

describe("mapRegistryEntry", () => {
  it("unwraps the official `server` shape and maps a streamable-http remote", () => {
    const entry = mapRegistryEntry(fixture.servers[0]);
    expect(entry).toEqual({
      name: "io.github.acme/docs",
      title: "Acme Docs",
      description: "Docs search server",
      version: "1.2.0",
      url: "https://docs.acme.example/mcp",
    });
  });
  it("returns null when there is no streamable-http remote", () => {
    expect(mapRegistryEntry(fixture.servers[1])).toBeNull(); // sse only
    expect(mapRegistryEntry(fixture.servers[2])).toBeNull(); // packages only
  });
  it("derives the title from the name when the entry has no title", () => {
    const entry = mapRegistryEntry(fixture.servers[3]);
    expect(entry?.title).toBe("no-title");
    expect(entry?.url).toBe("https://notitle.acme.example/mcp");
  });
  it("also accepts a flat (unwrapped) entry for back-compat", () => {
    const entry = mapRegistryEntry({
      name: "flat/x",
      description: "d",
      version: "1",
      remotes: [{ type: "streamable-http", url: "https://flat.example/mcp" }],
    });
    expect(entry?.url).toBe("https://flat.example/mcp");
    expect(entry?.title).toBe("x");
  });
});
