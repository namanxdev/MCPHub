// lib/security/registry-import.test.ts
import { describe, it, expect } from "vitest";
import { mapRegistryEntry, type RawEntry } from "./registry-import.js";
import fixtureJson from "./fixtures/registry-page.json";

const fixture = fixtureJson as { servers: RawEntry[] };

describe("mapRegistryEntry", () => {
  it("maps a streamable-http remote to a normalized RegistryEntry", () => {
    const entry = mapRegistryEntry(fixture.servers[0]);
    expect(entry).toEqual({
      name: "io.github.acme/docs",
      title: "docs",
      description: "Docs search server",
      version: "1.2.0",
      url: "https://docs.acme.example/mcp",
    });
  });
  it("returns null when there is no streamable-http remote", () => {
    expect(mapRegistryEntry(fixture.servers[1])).toBeNull(); // sse only
    expect(mapRegistryEntry(fixture.servers[2])).toBeNull(); // packages only
  });
});
