import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";

// Store original env
let originalEnv: NodeJS.ProcessEnv;

describe("Auth Middleware", () => {
  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.JWT_SECRET = "test-jwt-secret-key-for-testing";
    process.env.JWT_REFRESH_SECRET = "test-jwt-refresh-secret-for-testing";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // Mock Request and Response
  function createMockRequest(headers: Record<string, string> = {}) {
    return {
      headers,
      user: undefined as unknown,
    };
  }

  function createMockResponse() {
    let statusCode = 200;
    let jsonData: unknown;

    return {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: unknown) {
        jsonData = data;
        return this;
      },
      getStatus() {
        return statusCode;
      },
      getData() {
        return jsonData;
      },
    };
  }

  describe("requireAuth", () => {
    it("should return 401 when no authorization header", async () => {
      const { requireAuth } = await import("../../middleware/auth.js");

      const req = createMockRequest();
      const res = createMockResponse();
      let nextCalled = false;

      requireAuth(req as any, res as any, () => {
        nextCalled = true;
      });

      assert.strictEqual(res.getStatus(), 401);
      assert.deepStrictEqual(res.getData(), {
        error: "Authentication required",
      });
      assert.strictEqual(nextCalled, false);
    });

    it("should return 401 when authorization header is not Bearer", async () => {
      const { requireAuth } = await import("../../middleware/auth.js");

      const req = createMockRequest({ authorization: "Basic abc123" });
      const res = createMockResponse();
      let nextCalled = false;

      requireAuth(req as any, res as any, () => {
        nextCalled = true;
      });

      assert.strictEqual(res.getStatus(), 401);
      assert.deepStrictEqual(res.getData(), {
        error: "Authentication required",
      });
      assert.strictEqual(nextCalled, false);
    });

    it("should return 401 for invalid token", async () => {
      const { requireAuth } = await import("../../middleware/auth.js");

      const req = createMockRequest({ authorization: "Bearer invalid-token" });
      const res = createMockResponse();
      let nextCalled = false;

      requireAuth(req as any, res as any, () => {
        nextCalled = true;
      });

      assert.strictEqual(res.getStatus(), 401);
      assert.deepStrictEqual(res.getData(), {
        error: "Invalid or expired token",
      });
      assert.strictEqual(nextCalled, false);
    });

    it("should call next and attach user for valid token", async () => {
      const { requireAuth } = await import("../../middleware/auth.js");
      const { generateAccessToken } = await import("../../auth/jwt.js");

      const userId = "550e8400-e29b-41d4-a716-446655440001";
      const email = "test@example.com";
      const name = "Test User";
      const token = generateAccessToken(userId, email, name);

      const req = createMockRequest({ authorization: `Bearer ${token}` });
      const res = createMockResponse();
      let nextCalled = false;

      requireAuth(req as any, res as any, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true);
      assert.ok(req.user);
      assert.strictEqual((req.user as any).sub, userId);
      assert.strictEqual((req.user as any).email, email);
      assert.strictEqual((req.user as any).name, name);
    });
  });

  describe("optionalAuth", () => {
    it("should call next without user when no authorization header", async () => {
      const { optionalAuth } = await import("../../middleware/auth.js");

      const req = createMockRequest();
      const res = createMockResponse();
      let nextCalled = false;

      optionalAuth(req as any, res as any, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true);
      assert.strictEqual(req.user, undefined);
    });

    it("should call next without user for invalid token", async () => {
      const { optionalAuth } = await import("../../middleware/auth.js");

      const req = createMockRequest({ authorization: "Bearer invalid-token" });
      const res = createMockResponse();
      let nextCalled = false;

      optionalAuth(req as any, res as any, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true);
      assert.strictEqual(req.user, undefined);
    });

    it("should attach user for valid token", async () => {
      const { optionalAuth } = await import("../../middleware/auth.js");
      const { generateAccessToken } = await import("../../auth/jwt.js");

      const userId = "550e8400-e29b-41d4-a716-446655440001";
      const email = "test@example.com";
      const name = "Test User";
      const token = generateAccessToken(userId, email, name);

      const req = createMockRequest({ authorization: `Bearer ${token}` });
      const res = createMockResponse();
      let nextCalled = false;

      optionalAuth(req as any, res as any, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true);
      assert.ok(req.user);
      assert.strictEqual((req.user as any).sub, userId);
    });
  });
});
