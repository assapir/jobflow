import { describe, it } from "node:test";
import assert from "node:assert";
import { z } from "zod";
import {
  professionEnum,
  experienceLevelEnum,
  stageEnum,
} from "../../db/schema.js";

// Recreate the validation schemas as they are in the controllers
// to test them in isolation without needing DB/Express mocking

const updateProfileSchema = z.object({
  profession: z.enum(professionEnum.enumValues).nullable().optional(),
  experienceLevel: z
    .enum(experienceLevelEnum.enumValues)
    .nullable()
    .optional(),
  preferredLocation: z.string().max(255).nullable().optional(),
  onboardingCompleted: z.boolean().optional(),
});

const stageValues = stageEnum.enumValues;

const updateStageSchema = z.object({
  stage: z.enum(stageValues),
  order: z.number().int().min(0).optional(),
});

describe("updateProfile validation", () => {
  it("should accept valid profile with all fields", () => {
    const input = {
      profession: "engineering",
      experienceLevel: "senior",
      preferredLocation: "Tel Aviv",
      onboardingCompleted: true,
    };
    const result = updateProfileSchema.safeParse(input);
    assert.strictEqual(result.success, true);
  });

  it("should accept empty object (all optional)", () => {
    const result = updateProfileSchema.safeParse({});
    assert.strictEqual(result.success, true);
  });

  it("should accept null values for nullable fields", () => {
    const input = {
      profession: null,
      experienceLevel: null,
      preferredLocation: null,
    };
    const result = updateProfileSchema.safeParse(input);
    assert.strictEqual(result.success, true);
  });

  it("should reject invalid profession value", () => {
    const input = { profession: "hacker" };
    const result = updateProfileSchema.safeParse(input);
    assert.strictEqual(result.success, false);
  });

  it("should reject invalid experienceLevel value", () => {
    const input = { experienceLevel: "godlike" };
    const result = updateProfileSchema.safeParse(input);
    assert.strictEqual(result.success, false);
  });

  it("should reject non-boolean onboardingCompleted", () => {
    const input = { onboardingCompleted: "yes" };
    const result = updateProfileSchema.safeParse(input);
    assert.strictEqual(result.success, false);
  });

  it("should reject preferredLocation over 255 chars", () => {
    const input = { preferredLocation: "x".repeat(256) };
    const result = updateProfileSchema.safeParse(input);
    assert.strictEqual(result.success, false);
  });

  it("should accept all valid profession values", () => {
    for (const value of professionEnum.enumValues) {
      const result = updateProfileSchema.safeParse({ profession: value });
      assert.strictEqual(
        result.success,
        true,
        `profession '${value}' should be valid`
      );
    }
  });

  it("should accept all valid experienceLevel values", () => {
    for (const value of experienceLevelEnum.enumValues) {
      const result = updateProfileSchema.safeParse({
        experienceLevel: value,
      });
      assert.strictEqual(
        result.success,
        true,
        `experienceLevel '${value}' should be valid`
      );
    }
  });

  it("should reject SQL injection attempt in profession", () => {
    const input = { profession: "'; DROP TABLE users;--" };
    const result = updateProfileSchema.safeParse(input);
    assert.strictEqual(result.success, false);
  });

  it("should preserve undefined vs null distinction", () => {
    // undefined = field not sent (should be omitted from update)
    const withUndefined = updateProfileSchema.safeParse({});
    assert.strictEqual(withUndefined.success, true);
    if (withUndefined.success) {
      assert.strictEqual(withUndefined.data.profession, undefined);
    }

    // null = explicitly clear the field
    const withNull = updateProfileSchema.safeParse({ profession: null });
    assert.strictEqual(withNull.success, true);
    if (withNull.success) {
      assert.strictEqual(withNull.data.profession, null);
    }
  });
});

describe("updateJobStage validation", () => {
  it("should accept valid stage and order", () => {
    const input = { stage: "applied", order: 3 };
    const result = updateStageSchema.safeParse(input);
    assert.strictEqual(result.success, true);
  });

  it("should accept stage without order (optional)", () => {
    const input = { stage: "interview" };
    const result = updateStageSchema.safeParse(input);
    assert.strictEqual(result.success, true);
  });

  it("should reject missing stage", () => {
    const input = { order: 0 };
    const result = updateStageSchema.safeParse(input);
    assert.strictEqual(result.success, false);
  });

  it("should reject invalid stage value", () => {
    const input = { stage: "promoted" };
    const result = updateStageSchema.safeParse(input);
    assert.strictEqual(result.success, false);
  });

  it("should reject negative order", () => {
    const input = { stage: "applied", order: -1 };
    const result = updateStageSchema.safeParse(input);
    assert.strictEqual(result.success, false);
  });

  it("should reject float order", () => {
    const input = { stage: "applied", order: 1.5 };
    const result = updateStageSchema.safeParse(input);
    assert.strictEqual(result.success, false);
  });

  it("should reject string order", () => {
    const input = { stage: "applied", order: "hello" };
    const result = updateStageSchema.safeParse(input);
    assert.strictEqual(result.success, false);
  });

  it("should accept all valid stage values", () => {
    for (const stage of stageValues) {
      const result = updateStageSchema.safeParse({ stage });
      assert.strictEqual(
        result.success,
        true,
        `stage '${stage}' should be valid`
      );
    }
  });

  it("should accept order of 0", () => {
    const input = { stage: "wishlist", order: 0 };
    const result = updateStageSchema.safeParse(input);
    assert.strictEqual(result.success, true);
  });

  it("should accept large order values", () => {
    const input = { stage: "wishlist", order: 9999 };
    const result = updateStageSchema.safeParse(input);
    assert.strictEqual(result.success, true);
  });
});
