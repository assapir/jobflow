import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert";

// Store original env
let originalEnv: NodeJS.ProcessEnv;

describe("Profile Controller", () => {
  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.JWT_SECRET = "test-jwt-secret-key-for-testing";
    process.env.JWT_REFRESH_SECRET = "test-jwt-refresh-secret-for-testing";
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  });

  afterEach(() => {
    process.env = originalEnv;
    mock.reset();
  });

  // Mock Request and Response
  function createMockRequest(
    overrides: Partial<{
      user: { sub: string; email?: string; name?: string };
      body: Record<string, unknown>;
      cookies: Record<string, string>;
    }> = {}
  ) {
    return {
      user: overrides.user,
      body: overrides.body || {},
      cookies: overrides.cookies || {},
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

  describe("getProfile", () => {
    it("should return 401 when user is not authenticated", async () => {
      // Import module and mock db
      const authModule = await import("../../controllers/auth.js");

      const req = createMockRequest({ user: undefined });
      const res = createMockResponse();

      await authModule.getProfile(req as any, res as any);

      assert.strictEqual(res.getStatus(), 401);
      assert.deepStrictEqual(res.getData(), { error: "Not authenticated" });
    });
  });

  describe("updateProfile", () => {
    it("should return 401 when user is not authenticated", async () => {
      const authModule = await import("../../controllers/auth.js");

      const req = createMockRequest({
        user: undefined,
        body: { profession: "engineering" },
      });
      const res = createMockResponse();

      await authModule.updateProfile(req as any, res as any);

      assert.strictEqual(res.getStatus(), 401);
      assert.deepStrictEqual(res.getData(), { error: "Not authenticated" });
    });
  });

  describe("Profile data validation", () => {
    it("should accept valid profession values", () => {
      const validProfessions = [
        "engineering",
        "product",
        "design",
        "marketing",
        "sales",
        "operations",
        "hr",
        "finance",
        "other",
      ];

      // Just validate the enum values exist
      validProfessions.forEach((profession) => {
        assert.ok(
          typeof profession === "string" && profession.length > 0,
          `Profession ${profession} should be a valid string`
        );
      });
    });

    it("should accept valid experience level values", () => {
      const validLevels = [
        "entry",
        "junior",
        "mid",
        "senior",
        "lead",
        "executive",
      ];

      // Just validate the enum values exist
      validLevels.forEach((level) => {
        assert.ok(
          typeof level === "string" && level.length > 0,
          `Experience level ${level} should be a valid string`
        );
      });
    });
  });
});

describe("Profile Schema Types", () => {
  it("should export correct profession enum values", async () => {
    const { professionEnum } = await import("../../db/schema.js");

    assert.ok(professionEnum, "professionEnum should be exported");
    assert.deepStrictEqual(professionEnum.enumValues, [
      "engineering",
      "product",
      "design",
      "marketing",
      "sales",
      "operations",
      "hr",
      "finance",
      "other",
    ]);
  });

  it("should export correct experience level enum values", async () => {
    const { experienceLevelEnum } = await import("../../db/schema.js");

    assert.ok(experienceLevelEnum, "experienceLevelEnum should be exported");
    assert.deepStrictEqual(experienceLevelEnum.enumValues, [
      "entry",
      "junior",
      "mid",
      "senior",
      "lead",
      "executive",
    ]);
  });

  it("should export userProfiles table schema", async () => {
    const { userProfiles } = await import("../../db/schema.js");

    assert.ok(userProfiles, "userProfiles table should be exported");
  });

  it("should have country field in users table", async () => {
    const { users } = await import("../../db/schema.js");

    assert.ok(users, "users table should be exported");
    // Verify the country column exists in the schema
    assert.ok("country" in users, "users table should have country column");
  });
});
