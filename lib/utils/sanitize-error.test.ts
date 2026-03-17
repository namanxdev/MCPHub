import { describe, it, expect } from "vitest";
import { sanitizeErrorMessage } from "./sanitize-error";

describe("sanitizeErrorMessage", () => {
  // --- non-Error inputs ---

  it("returns generic message for a non-Error value (string)", () => {
    expect(sanitizeErrorMessage("something went wrong")).toBe(
      "An unexpected error occurred"
    );
  });

  it("returns generic message for a non-Error value (null)", () => {
    expect(sanitizeErrorMessage(null)).toBe("An unexpected error occurred");
  });

  it("returns generic message for a non-Error value (number)", () => {
    expect(sanitizeErrorMessage(42)).toBe("An unexpected error occurred");
  });

  it("returns generic message for undefined", () => {
    expect(sanitizeErrorMessage(undefined)).toBe("An unexpected error occurred");
  });

  // --- safe patterns let through ---

  it("passes through timed out messages", () => {
    const err = new Error("Connection timed out after 15 seconds.");
    expect(sanitizeErrorMessage(err)).toBe(
      "Connection timed out after 15 seconds."
    );
  });

  it("passes through timed out messages (case insensitive)", () => {
    const err = new Error("Tool execution Timed Out after 60 seconds");
    expect(sanitizeErrorMessage(err)).toBe(
      "Tool execution Timed Out after 60 seconds"
    );
  });

  it("passes through ECONNREFUSED messages", () => {
    const err = new Error("connect ECONNREFUSED 127.0.0.1:3000");
    expect(sanitizeErrorMessage(err)).toBe(
      "connect ECONNREFUSED 127.0.0.1:3000"
    );
  });

  it("passes through fetch failed messages", () => {
    const err = new Error("fetch failed");
    expect(sanitizeErrorMessage(err)).toBe("fetch failed");
  });

  it("passes through ENOENT messages", () => {
    const err = new Error("ENOENT: no such file or directory");
    expect(sanitizeErrorMessage(err)).toBe(
      "ENOENT: no such file or directory"
    );
  });

  it("passes through Command not found messages", () => {
    const err = new Error("Command not found in allowlist");
    expect(sanitizeErrorMessage(err)).toBe("Command not found in allowlist");
  });

  it("passes through Session not found messages", () => {
    const err = new Error("Session not found or expired");
    expect(sanitizeErrorMessage(err)).toBe("Session not found or expired");
  });

  it("passes through 'not allowed' messages (case insensitive)", () => {
    const err = new Error("Operation not allowed");
    expect(sanitizeErrorMessage(err)).toBe("Operation not allowed");
  });

  it("passes through Invalid messages (case insensitive)", () => {
    const err = new Error("Invalid request body");
    expect(sanitizeErrorMessage(err)).toBe("Invalid request body");
  });

  it("passes through Maximum number of concurrent connections messages", () => {
    const err = new Error("Maximum number of concurrent connections reached");
    expect(sanitizeErrorMessage(err)).toBe(
      "Maximum number of concurrent connections reached"
    );
  });

  it("passes through 'not permitted' messages (case insensitive)", () => {
    const err = new Error("Operation not permitted");
    expect(sanitizeErrorMessage(err)).toBe("Operation not permitted");
  });

  it("passes through spawn messages", () => {
    const err = new Error("spawn node ENOENT");
    expect(sanitizeErrorMessage(err)).toBe("spawn node ENOENT");
  });

  it("passes through Server unreachable messages (case insensitive)", () => {
    const err = new Error("Server unreachable: connection refused");
    expect(sanitizeErrorMessage(err)).toBe(
      "Server unreachable: connection refused"
    );
  });

  // --- file path stripping from safe messages ---

  it("strips Unix file paths from safe messages", () => {
    const err = new Error("ENOENT: no such file or directory, open '/home/user/secrets.txt'");
    expect(sanitizeErrorMessage(err)).toBe(
      "ENOENT: no such file or directory, open '[path]'"
    );
  });

  it("strips nested Unix file paths from safe messages", () => {
    const err = new Error("spawn /usr/local/bin/node ENOENT");
    expect(sanitizeErrorMessage(err)).toBe("spawn [path] ENOENT");
  });

  it("strips Windows-style drive paths from safe messages", () => {
    const err = new Error("ENOENT: C:/Users/admin/app/server.js not found");
    expect(sanitizeErrorMessage(err)).toBe(
      "ENOENT: [path] not found"
    );
  });

  // --- unrecognized errors are redacted ---

  it("returns generic internal error for an unrecognized Error", () => {
    const err = new Error("Something totally internal exploded");
    expect(sanitizeErrorMessage(err)).toBe("An internal error occurred");
  });

  it("returns generic internal error when message contains a DB connection string", () => {
    const err = new Error(
      "password authentication failed for user 'postgres' at postgresql://db.internal/prod"
    );
    expect(sanitizeErrorMessage(err)).toBe("An internal error occurred");
  });

  it("returns generic internal error for an empty message", () => {
    const err = new Error("");
    expect(sanitizeErrorMessage(err)).toBe("An internal error occurred");
  });
});
