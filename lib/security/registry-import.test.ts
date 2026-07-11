// lib/security/registry-import.test.ts
import { describe, it, expect } from "vitest";
import { mapRegistryEntry } from "./registry-import.js";
import fixture from "./fixtures/registry-page.json";

describe("mapRegistryEntry", () => {
  it("maps a streamable-http remote to a normalized RegistryEntry", () => {
    const entry = mapRegistryEntry((fixture as any).servers[0]);
    expect(entry).toEqual({
      name: "io.github.acme/docs",
      title: "docs",
      description: "Docs search server",
      version: "1.2.0",
      url: "https://docs.acme.example/mcp",
    });
  });
  it("returns null when there is no streamable-http remote", () => {
    expect(mapRegistryEntry((fixture as any).servers[1])).toBeNull(); // sse only
    expect(mapRegistryEntry((fixture as any).servers[2])).toBeNull(); // packages only
  });
});
