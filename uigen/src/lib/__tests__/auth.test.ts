// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock next/headers
const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      set: mockCookieSet,
    })
  ),
}));

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

describe("createSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets a cookie with the correct name and options", async () => {
    const { createSession } = await import("@/lib/auth");
    await createSession("user-1", "test@example.com");

    expect(mockCookieSet).toHaveBeenCalledOnce();
    const [name, , options] = mockCookieSet.mock.calls[0];
    expect(name).toBe("auth-token");
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  it("sets a cookie with a token that encodes userId and email", async () => {
    const { createSession } = await import("@/lib/auth");
    await createSession("user-42", "hello@world.com");

    const [, token] = mockCookieSet.mock.calls[0];
    const { payload } = await jwtVerify(token, JWT_SECRET);
    expect(payload.userId).toBe("user-42");
    expect(payload.email).toBe("hello@world.com");
  });

  it("sets a cookie that expires approximately 7 days from now", async () => {
    const { createSession } = await import("@/lib/auth");
    const before = Date.now();
    await createSession("user-1", "test@example.com");
    const after = Date.now();

    const [, , options] = mockCookieSet.mock.calls[0];
    const expiresMs = options.expires.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDaysMs);
    expect(expiresMs).toBeLessThanOrEqual(after + sevenDaysMs);
  });

  it("sets secure: false in non-production environments", async () => {
    const { createSession } = await import("@/lib/auth");
    await createSession("user-1", "test@example.com");

    const [, , options] = mockCookieSet.mock.calls[0];
    expect(options.secure).toBe(false);
  });

  it("sets secure: true in production", async () => {
    const original = process.env.NODE_ENV;
    // @ts-expect-error overriding read-only NODE_ENV for test
    process.env.NODE_ENV = "production";

    vi.resetModules();
    const { createSession } = await import("@/lib/auth");
    await createSession("user-1", "test@example.com");

    const [, , options] = mockCookieSet.mock.calls[0];
    expect(options.secure).toBe(true);

    // @ts-expect-error restoring NODE_ENV
    process.env.NODE_ENV = original;
  });

  it("produces a valid JWT string (three dot-separated parts)", async () => {
    const { createSession } = await import("@/lib/auth");
    await createSession("user-1", "test@example.com");

    const [, token] = mockCookieSet.mock.calls[0];
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("signs the JWT with HS256", async () => {
    const { createSession } = await import("@/lib/auth");
    await createSession("user-1", "test@example.com");

    const [, token] = mockCookieSet.mock.calls[0];
    const header = JSON.parse(
      Buffer.from(token.split(".")[0], "base64url").toString()
    );
    expect(header.alg).toBe("HS256");
  });

  it("JWT exp claim is approximately 7 days from now", async () => {
    const { createSession } = await import("@/lib/auth");
    const before = Math.floor(Date.now() / 1000);
    await createSession("user-1", "test@example.com");
    const after = Math.floor(Date.now() / 1000);

    const [, token] = mockCookieSet.mock.calls[0];
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const sevenDays = 7 * 24 * 60 * 60;

    expect(payload.exp).toBeGreaterThanOrEqual(before + sevenDays);
    expect(payload.exp).toBeLessThanOrEqual(after + sevenDays + 1);
  });

  it("uses a custom JWT_SECRET from the environment", async () => {
    process.env.JWT_SECRET = "my-custom-secret";
    vi.resetModules();
    const { createSession } = await import("@/lib/auth");
    await createSession("user-1", "test@example.com");

    const [, token] = mockCookieSet.mock.calls[0];
    const customSecret = new TextEncoder().encode("my-custom-secret");
    await expect(jwtVerify(token, customSecret)).resolves.toBeDefined();

    delete process.env.JWT_SECRET;
  });

  it("rejects the token when verified with the wrong secret", async () => {
    const { createSession } = await import("@/lib/auth");
    await createSession("user-1", "test@example.com");

    const [, token] = mockCookieSet.mock.calls[0];
    const wrongSecret = new TextEncoder().encode("wrong-secret");
    await expect(jwtVerify(token, wrongSecret)).rejects.toThrow();
  });
});
