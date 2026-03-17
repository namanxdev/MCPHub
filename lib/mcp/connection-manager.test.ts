import { describe, it, expect } from "vitest";
import { validateStdioCommand } from "./connection-manager";

describe("validateStdioCommand", () => {
  // --- allowed commands ---

  it("accepts a bare allowed command", () => {
    expect(() => validateStdioCommand("node server.js")).not.toThrow();
  });

  it("accepts every command in the allowlist", () => {
    const allowed = [
      "node",
      "npx",
      "python",
      "python3",
      "pip",
      "pipx",
      "uvx",
      "uv",
      "deno",
      "bun",
      "bunx",
      "tsx",
      "ts-node",
      "docker",
      "go",
      "cargo",
    ];
    for (const cmd of allowed) {
      expect(() => validateStdioCommand(`${cmd} --version`)).not.toThrow();
    }
  });

  it("accepts an allowed command given as an absolute Unix path", () => {
    expect(() => validateStdioCommand("/usr/bin/node index.js")).not.toThrow();
  });

  it("accepts an allowed command given as a Windows-style path without spaces", () => {
    expect(() =>
      validateStdioCommand("C:\\nodejs\\node.exe server.js")
    ).not.toThrow();
  });

  it("accepts an allowed command with multiple arguments", () => {
    expect(() =>
      validateStdioCommand("npx -y @modelcontextprotocol/server-filesystem /tmp")
    ).not.toThrow();
  });

  // --- disallowed commands ---

  it("rejects a command not in the allowlist", () => {
    expect(() => validateStdioCommand("bash -c ls")).toThrow(
      /not in the list of allowed commands/
    );
  });

  it("rejects an empty string", () => {
    expect(() => validateStdioCommand("")).toThrow(
      /not in the list of allowed commands/
    );
  });

  it("rejects a whitespace-only string", () => {
    expect(() => validateStdioCommand("   ")).toThrow(
      /not in the list of allowed commands/
    );
  });

  it("rejects a command whose path base is not in the allowlist", () => {
    expect(() => validateStdioCommand("/usr/bin/bash -i")).toThrow(
      /not in the list of allowed commands/
    );
  });

  // --- shell metacharacter rejection ---

  it("rejects a command containing semicolon", () => {
    expect(() => validateStdioCommand("node foo.js; rm -rf /")).toThrow(
      /shell metacharacters/
    );
  });

  it("rejects a command containing ampersand", () => {
    expect(() => validateStdioCommand("node foo.js & node bar.js")).toThrow(
      /shell metacharacters/
    );
  });

  it("rejects a command containing pipe", () => {
    expect(() => validateStdioCommand("node foo.js | cat")).toThrow(
      /shell metacharacters/
    );
  });

  it("rejects a command containing backtick", () => {
    expect(() => validateStdioCommand("node `whoami`")).toThrow(
      /shell metacharacters/
    );
  });

  it("rejects a command containing dollar sign", () => {
    expect(() => validateStdioCommand("node $HOME/server.js")).toThrow(
      /shell metacharacters/
    );
  });

  it("rejects a command containing opening parenthesis", () => {
    expect(() => validateStdioCommand("node (server.js)")).toThrow(
      /shell metacharacters/
    );
  });

  it("rejects a command containing closing parenthesis", () => {
    expect(() => validateStdioCommand("node server.js)")).toThrow(
      /shell metacharacters/
    );
  });

  it("rejects a command containing opening brace", () => {
    expect(() => validateStdioCommand("node {server.js}")).toThrow(
      /shell metacharacters/
    );
  });

  it("rejects a command containing closing brace", () => {
    expect(() => validateStdioCommand("node server.js}")).toThrow(
      /shell metacharacters/
    );
  });

  it("rejects a command containing less-than", () => {
    expect(() => validateStdioCommand("node server.js < /etc/passwd")).toThrow(
      /shell metacharacters/
    );
  });

  it("rejects a command containing greater-than", () => {
    expect(() => validateStdioCommand("node server.js > /tmp/out")).toThrow(
      /shell metacharacters/
    );
  });

  it("rejects a command containing a newline character", () => {
    expect(() => validateStdioCommand("node server.js\nrm -rf /")).toThrow(
      /shell metacharacters/
    );
  });
});
