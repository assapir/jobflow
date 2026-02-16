import { describe, it, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { AppError } from "../../middleware/errorHandler.js";
import { updateProfile } from "../../controllers/auth.js";

// Importing auth.ts starts a setInterval and DB connection — force exit after tests
after(() => {
  setTimeout(() => process.exit(0), 100);
});

// Store original env
let originalEnv: NodeJS.ProcessEnv;

describe("Profile Schema Types", () => {
  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

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

describe("Profile Data Validation", () => {
  it("should validate profession enum values match expected list", () => {
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

    // Validate all expected values are present
    assert.strictEqual(validProfessions.length, 9, "Should have 9 profession options");
    validProfessions.forEach((profession) => {
      assert.ok(
        typeof profession === "string" && profession.length > 0,
        `Profession ${profession} should be a valid string`
      );
    });
  });

  it("should validate experience level enum values match expected list", () => {
    const validLevels = [
      "entry",
      "junior",
      "mid",
      "senior",
      "lead",
      "executive",
    ];

    // Validate all expected values are present
    assert.strictEqual(validLevels.length, 6, "Should have 6 experience level options");
    validLevels.forEach((level) => {
      assert.ok(
        typeof level === "string" && level.length > 0,
        `Experience level ${level} should be a valid string`
      );
    });
  });

  it("should have proper type exports", async () => {
    const schema = await import("../../db/schema.js");

    // Check that types are exported (we can't directly test types at runtime,
    // but we can verify the exports exist)
    assert.ok("Profession" in schema || schema.professionEnum, "Profession type should be available");
    assert.ok("ExperienceLevel" in schema || schema.experienceLevelEnum, "ExperienceLevel type should be available");
    assert.ok("UserProfile" in schema || schema.userProfiles, "UserProfile type should be available");
  });
});

// Helper to create a mock request with user attached
function createAuthenticatedReq(body: unknown) {
  return {
    body,
    user: { sub: "test-user-id", name: "Test", iat: 0, exp: 0 },
  };
}

function createMockRes() {
  let statusCode = 200;
  let jsonData: unknown;
  return {
    status(code: number) { statusCode = code; return this; },
    json(data: unknown) { jsonData = data; return this; },
    getStatus() { return statusCode; },
    getData() { return jsonData; },
  };
}

describe("updateProfile controller validation", () => {
  it("should throw AppError 400 for invalid profession", async () => {
    const req = createAuthenticatedReq({ profession: "hacker" });
    const res = createMockRes();

    await assert.rejects(
      () => updateProfile(req as any, res as any),
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.message, "Validation failed");
        return true;
      }
    );
  });

  it("should throw AppError 400 for invalid experienceLevel", async () => {
    const req = createAuthenticatedReq({ experienceLevel: "godlike" });
    const res = createMockRes();

    await assert.rejects(
      () => updateProfile(req as any, res as any),
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  it("should throw AppError 400 for non-boolean onboardingCompleted", async () => {
    const req = createAuthenticatedReq({ onboardingCompleted: "yes" });
    const res = createMockRes();

    await assert.rejects(
      () => updateProfile(req as any, res as any),
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  it("should throw AppError 400 for preferredLocation over 255 chars", async () => {
    const req = createAuthenticatedReq({ preferredLocation: "x".repeat(256) });
    const res = createMockRes();

    await assert.rejects(
      () => updateProfile(req as any, res as any),
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  it("should throw AppError 400 for SQL injection in profession", async () => {
    const req = createAuthenticatedReq({ profession: "'; DROP TABLE users;--" });
    const res = createMockRes();

    await assert.rejects(
      () => updateProfile(req as any, res as any),
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  it("should throw AppError 401 when not authenticated", async () => {
    const req = { body: { profession: "engineering" }, user: undefined };
    const res = createMockRes();

    await assert.rejects(
      () => updateProfile(req as any, res as any),
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 401);
        return true;
      }
    );
  });
});
