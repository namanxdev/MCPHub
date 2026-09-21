import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  getDb: vi.fn(),
  nextAuth: vi.fn(),
}));

vi.mock("next-auth", () => ({ default: mocks.nextAuth }));
vi.mock("../db", () => ({ getDb: mocks.getDb }));
vi.mock("@/lib/db/schema", () => ({
  users: {}, accounts: {}, sessions: {}, verificationTokens: {},
}));
vi.mock("@auth/drizzle-adapter", () => ({ DrizzleAdapter: vi.fn() }));

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  mocks.nextAuth.mockReturnValue({
    auth: mocks.auth,
    handlers: { GET: mocks.get, POST: mocks.post },
  });
});

afterEach(() => vi.unstubAllEnvs());

describe("development authentication", () => {
  it("uses a stable local identity without initializing auth or the database", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("AUTH_SECRET", "");
    const { auth } = await import("./index");
    const first = await auth();
    const second = await auth();

    expect(first?.user?.name).toBe("Local Developer");
    expect(first?.user?.id).toBeTruthy();
    expect(first?.user?.id).toBe(second?.user?.id);
    expect(Date.parse(first!.expires)).toBeGreaterThan(Date.now());
    expect(mocks.getDb).not.toHaveBeenCalled();
    expect(mocks.nextAuth).not.toHaveBeenCalled();
  });

  it("returns the same session to browser clients without auth cookies", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { auth, handlers } = await import("./index");
    const response = await handlers.GET(new NextRequest("http://localhost:3000/api/auth/session"));

    expect(response.status).toBe(200);
    expect((await response.json()).user).toEqual((await auth())?.user);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.nextAuth).not.toHaveBeenCalled();
  });

  it.each(["production", "test"])("requires real authentication in %s", async (environment) => {
    vi.stubEnv("NODE_ENV", environment);
    mocks.auth.mockResolvedValue(null);
    const { auth } = await import("./index");

    expect(await auth()).toBeNull();
    expect(mocks.auth).toHaveBeenCalledOnce();
    expect(mocks.getDb).toHaveBeenCalledOnce();
  });

  it("preserves authenticated production sessions and auth handlers", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const session = { user: { id: "real-user" }, expires: "2099-01-01" };
    mocks.auth.mockResolvedValue(session);
    mocks.get.mockResolvedValue(Response.json(session));
    mocks.post.mockResolvedValue(Response.json({ url: "/" }));
    const { auth, handlers } = await import("./index");
    const request = new NextRequest("http://localhost:3000/api/auth/session");

    expect(await auth()).toBe(session);
    expect(await (await handlers.GET(request)).json()).toEqual(session);
    await handlers.POST(request);
    expect(mocks.get).toHaveBeenCalledWith(request);
    expect(mocks.post).toHaveBeenCalledWith(request);
  });
});
