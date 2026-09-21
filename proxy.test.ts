import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getDevelopmentSession } from "./lib/auth/development";

const { auth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth }));
import proxy from "./proxy";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

describe("API authentication", () => {
  const paths = ["/api/connect", "/api/disconnect", "/api/tools/call", "/api/registry"];

  it.each(paths)("allows development requests to %s without a cookie", async (path) => {
    vi.stubEnv("NODE_ENV", "development");
    auth.mockResolvedValue(getDevelopmentSession());
    const response = await proxy(new NextRequest(`http://localhost:3000${path}`, { method: "POST" }));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it.each(paths)("rejects unauthenticated production requests to %s", async (path) => {
    vi.stubEnv("NODE_ENV", "production");
    auth.mockResolvedValue(getDevelopmentSession());
    const response = await proxy(new NextRequest(`http://localhost:3000${path}`, { method: "POST" }));
    expect(response.status).toBe(401);
  });

  it("allows real authenticated production requests", async () => {
    vi.stubEnv("NODE_ENV", "production");
    auth.mockResolvedValue({ user: { id: "real-user" } });
    const response = await proxy(new NextRequest("http://localhost:3000/api/connect", { method: "POST" }));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("handles CORS preflight without initializing auth", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    const response = await proxy(new NextRequest("http://localhost:3000/api/connect", {
      method: "OPTIONS", headers: { origin: "http://localhost:3000" },
    }));
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
    expect(auth).not.toHaveBeenCalled();
  });
});
