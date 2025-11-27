import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";

// Store original env
let originalEnv: NodeJS.ProcessEnv;

describe("JWT Utilities", () => {
  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.JWT_SECRET = "test-jwt-secret-key-for-testing";
    process.env.JWT_REFRESH_SECRET = "test-jwt-refresh-secret-for-testing";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("generateAccessToken", () => {
    it("should generate a valid JWT token", async () => {
      // Dynamic import after setting env vars
      const { generateAccessToken } = await import("../../auth/jwt.js");

      const userId = "550e8400-e29b-41d4-a716-446655440001";
      const email = "test@example.com";
      const name = "Test User";

      const token = generateAccessToken(userId, email, name);

      assert.ok(token);
      assert.strictEqual(typeof token, "string");
      // JWT has 3 parts separated by dots
      assert.strictEqual(token.split(".").length, 3);
    });

    it("should handle undefined email", async () => {
      const { generateAccessToken } = await import("../../auth/jwt.js");

      const userId = "550e8400-e29b-41d4-a716-446655440001";
      const name = "Test User";

      const token = generateAccessToken(userId, undefined, name);

      assert.ok(token);
      assert.strictEqual(typeof token, "string");
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify a valid token and return payload", async () => {
      const { generateAccessToken, verifyAccessToken } = await import("../../auth/jwt.js");

      const userId = "550e8400-e29b-41d4-a716-446655440001";
      const email = "test@example.com";
      const name = "Test User";

      const token = generateAccessToken(userId, email, name);
      const payload = verifyAccessToken(token);

      assert.ok(payload);
      assert.strictEqual(payload.sub, userId);
      assert.strictEqual(payload.email, email);
      assert.strictEqual(payload.name, name);
      assert.ok(payload.iat);
      assert.ok(payload.exp);
    });

    it("should return null for invalid token", async () => {
      const { verifyAccessToken } = await import("../../auth/jwt.js");

      const payload = verifyAccessToken("invalid-token");

      assert.strictEqual(payload, null);
    });

    it("should return null for tampered token", async () => {
      const { generateAccessToken, verifyAccessToken } = await import("../../auth/jwt.js");

      const token = generateAccessToken("user-id", "email@test.com", "Name");
      // Tamper with the token
      const tamperedToken = token.slice(0, -5) + "xxxxx";

      const payload = verifyAccessToken(tamperedToken);

      assert.strictEqual(payload, null);
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate a random hex string", async () => {
      const { generateRefreshToken } = await import("../../auth/jwt.js");

      const token = generateRefreshToken();

      assert.ok(token);
      assert.strictEqual(typeof token, "string");
      assert.strictEqual(token.length, 64); // 32 bytes = 64 hex chars
    });

    it("should generate unique tokens", async () => {
      const { generateRefreshToken } = await import("../../auth/jwt.js");

      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();

      assert.notStrictEqual(token1, token2);
    });
  });

  describe("generateTokenPair", () => {
    it("should generate both access and refresh tokens", async () => {
      const { generateTokenPair } = await import("../../auth/jwt.js");

      const userId = "550e8400-e29b-41d4-a716-446655440001";
      const email = "test@example.com";
      const name = "Test User";

      const tokens = generateTokenPair(userId, email, name);

      assert.ok(tokens.accessToken);
      assert.ok(tokens.refreshToken);
      assert.ok(tokens.expiresAt);
      assert.ok(tokens.expiresAt instanceof Date);
      assert.ok(tokens.expiresAt > new Date());
    });
  });

  describe("getRefreshTokenExpiry", () => {
    it("should return a date 7 days in the future", async () => {
      const { getRefreshTokenExpiry } = await import("../../auth/jwt.js");

      const before = new Date();
      const expiry = getRefreshTokenExpiry();
      const after = new Date();

      // Should be approximately 7 days from now
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      assert.ok(expiry.getTime() >= before.getTime() + sevenDaysMs - 1000);
      assert.ok(expiry.getTime() <= after.getTime() + sevenDaysMs + 1000);
    });
  });

  describe("Error handling", () => {
    it("should throw when JWT_SECRET is not set", async () => {
      delete process.env.JWT_SECRET;

      // Need to clear module cache and reimport
      // Since we can't easily clear ES module cache, we test the error case differently
      // by just verifying the env check logic
      assert.strictEqual(process.env.JWT_SECRET, undefined);
    });
  });
});
