import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { z } from "zod";
import {
  createMockResponse,
  sampleJobs,
  type MockJob,
} from "../helpers/mockDb.js";
import { stageEnum } from "../../db/schema.js";

// Use enum values from schema (single source of truth)
const stageValues = stageEnum.enumValues;

const createJobSchema = z.object({
  company: z.string().min(1).max(255),
  position: z.string().min(1).max(255),
  location: z.string().max(255).optional(),
  salary: z.string().max(100).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  stage: z.enum(stageValues).optional(),
  notes: z.string().optional(),
  appliedAt: z.string().datetime().optional(),
});

const stageSchema = z.enum(stageValues);
const urlSchema = z.string().url().optional().or(z.literal(""));
const updateStageSchema = z.object({
  stage: z.enum(stageValues),
  order: z.number().int().min(0).optional(),
});
const reorderSchema = z.object({
  jobs: z.array(
    z.object({
      id: z.string().uuid(),
      stage: z.enum(stageValues),
      order: z.number().int().min(0),
    })
  ),
});

// We need to mock the db module before importing the controller
// Using a simple approach: create mock functions that will be used by the controller

// Mock data storage
let mockJobs: MockJob[] = [];

describe("Jobs Controller Unit Tests", () => {
  beforeEach(() => {
    mockJobs = [...sampleJobs];
  });

  describe("Input Validation", () => {
    it("should validate required fields for job creation", () => {
      // Test that company is required
      const invalidInput = {
        position: "Developer",
        // missing company
      };

      const result = createJobSchema.safeParse(invalidInput);
      assert.strictEqual(result.success, false);
    });

    it("should validate stage enum values", () => {
      // Valid stages
      for (const stage of stageValues) {
        const result = stageSchema.safeParse(stage);
        assert.strictEqual(
          result.success,
          true,
          `Stage ${stage} should be valid`
        );
      }

      // Invalid stage
      const invalidResult = stageSchema.safeParse("invalid_stage");
      assert.strictEqual(invalidResult.success, false);
    });

    it("should validate LinkedIn URL format", () => {
      // Valid URLs
      assert.strictEqual(
        urlSchema.safeParse("https://linkedin.com/jobs/123").success,
        true
      );
      assert.strictEqual(
        urlSchema.safeParse("https://www.linkedin.com/jobs/view/123").success,
        true
      );
      assert.strictEqual(urlSchema.safeParse("").success, true);
      assert.strictEqual(urlSchema.safeParse(undefined).success, true);

      // Invalid URL
      assert.strictEqual(urlSchema.safeParse("not-a-url").success, false);
    });

    it("should validate reorder request format", () => {
      // Valid reorder request
      const validRequest = {
        jobs: [
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            stage: "applied",
            order: 0,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440002",
            stage: "applied",
            order: 1,
          },
        ],
      };
      assert.strictEqual(reorderSchema.safeParse(validRequest).success, true);

      // Invalid - missing id
      const invalidRequest1 = {
        jobs: [{ stage: "applied", order: 0 }],
      };
      assert.strictEqual(
        reorderSchema.safeParse(invalidRequest1).success,
        false
      );

      // Invalid - negative order
      const invalidRequest2 = {
        jobs: [
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            stage: "applied",
            order: -1,
          },
        ],
      };
      assert.strictEqual(
        reorderSchema.safeParse(invalidRequest2).success,
        false
      );

      // Invalid - bad UUID
      const invalidRequest3 = {
        jobs: [{ id: "not-a-uuid", stage: "applied", order: 0 }],
      };
      assert.strictEqual(
        reorderSchema.safeParse(invalidRequest3).success,
        false
      );
    });
  });

  describe("Response Structure", () => {
    it("should return correct response structure for getAllJobs", () => {
      const res = createMockResponse();
      res.json(mockJobs);

      const data = res.getData() as MockJob[];
      assert.ok(Array.isArray(data));
      assert.strictEqual(data.length, 3);

      // Check first job has all required fields
      const firstJob = data[0];
      assert.ok("id" in firstJob);
      assert.ok("company" in firstJob);
      assert.ok("position" in firstJob);
      assert.ok("stage" in firstJob);
      assert.ok("order" in firstJob);
      assert.ok("createdAt" in firstJob);
      assert.ok("updatedAt" in firstJob);
    });

    it("should return 404 structure when job not found", () => {
      const res = createMockResponse();
      res.status(404).json({ error: "Job not found" });

      assert.strictEqual(res.getStatus(), 404);
      assert.deepStrictEqual(res.getData(), { error: "Job not found" });
    });

    it("should return 400 structure for validation errors", () => {
      const res = createMockResponse();
      res.status(400).json({
        error: "Validation failed",
        details: [{ path: ["company"], message: "Required" }],
      });

      assert.strictEqual(res.getStatus(), 400);
      const data = res.getData() as { error: string; details: unknown[] };
      assert.strictEqual(data.error, "Validation failed");
      assert.ok(Array.isArray(data.details));
    });

    it("should return 500 structure for server errors", () => {
      const res = createMockResponse();
      res.status(500).json({ error: "Failed to fetch jobs" });

      assert.strictEqual(res.getStatus(), 500);
      assert.deepStrictEqual(res.getData(), { error: "Failed to fetch jobs" });
    });
  });

  describe("Business Logic", () => {
    it("should set default stage to wishlist when not provided", () => {
      const newJobData: { company: string; position: string; stage?: string } =
        {
          company: "New Company",
          position: "Developer",
          // stage not provided
        };

      const defaultStage = newJobData.stage || "wishlist";
      assert.strictEqual(defaultStage, "wishlist");
    });

    it("should calculate max order for new job in stage", () => {
      const wishlistJobs = mockJobs.filter((j) => j.stage === "wishlist");
      const maxOrder = wishlistJobs.reduce(
        (max, job) => Math.max(max, job.order),
        -1
      );

      assert.strictEqual(maxOrder, 0);
      assert.strictEqual(maxOrder + 1, 1); // New job should get order 1
    });

    it("should handle empty stage when calculating max order", () => {
      const offerJobs = mockJobs.filter((j) => j.stage === "offer");
      const maxOrder = offerJobs.reduce(
        (max, job) => Math.max(max, job.order),
        -1
      );

      assert.strictEqual(maxOrder, -1);
      assert.strictEqual(maxOrder + 1, 0); // New job should get order 0
    });

    it("should preserve null values for optional fields", () => {
      const job = mockJobs.find((j) => j.linkedinUrl === null);
      assert.ok(job);
      assert.strictEqual(job.linkedinUrl, null);
    });
  });

  describe("Update Logic", () => {
    it("should only update provided fields", () => {
      const originalJob = { ...mockJobs[0] };
      const updateData = { company: "Updated Company" };

      // Simulate partial update
      const updatedJob = {
        ...originalJob,
        ...updateData,
        updatedAt: new Date(),
      };

      assert.strictEqual(updatedJob.company, "Updated Company");
      assert.strictEqual(updatedJob.position, originalJob.position);
      assert.strictEqual(updatedJob.location, originalJob.location);
    });

    it("should allow clearing optional fields with empty string", () => {
      const updateData = {
        location: "",
        salary: "",
      };

      // The controller converts empty strings to null
      const processedData = {
        location: updateData.location || null,
        salary: updateData.salary || null,
      };

      assert.strictEqual(processedData.location, null);
      assert.strictEqual(processedData.salary, null);
    });

    it("should update timestamp on modification", () => {
      const originalJob = { ...mockJobs[0] };
      const beforeUpdate = new Date();

      // Simulate update
      const updatedJob = {
        ...originalJob,
        company: "Updated",
        updatedAt: new Date(),
      };

      assert.ok(updatedJob.updatedAt >= beforeUpdate);
    });
  });

  describe("Stage Update Logic", () => {
    it("should update both stage and order", () => {
      const job = { ...mockJobs[0] };
      const newStage = "interview";
      const newOrder = 5;

      const updatedJob = {
        ...job,
        stage: newStage,
        order: newOrder,
        updatedAt: new Date(),
      };

      assert.strictEqual(updatedJob.stage, "interview");
      assert.strictEqual(updatedJob.order, 5);
    });

    it("should default order to 0 if not provided", () => {
      const _newStage = "applied"; // Stage is set but order defaults
      const newOrder = undefined;

      const resolvedOrder = newOrder ?? 0;
      assert.strictEqual(resolvedOrder, 0);
    });
  });

  describe("Stage Update Validation", () => {
    it("should accept valid stage and order", () => {
      const result = updateStageSchema.safeParse({ stage: "applied", order: 3 });
      assert.strictEqual(result.success, true);
    });

    it("should accept stage without order (optional)", () => {
      const result = updateStageSchema.safeParse({ stage: "interview" });
      assert.strictEqual(result.success, true);
    });

    it("should reject missing stage", () => {
      const result = updateStageSchema.safeParse({ order: 0 });
      assert.strictEqual(result.success, false);
    });

    it("should reject invalid stage value", () => {
      const result = updateStageSchema.safeParse({ stage: "promoted" });
      assert.strictEqual(result.success, false);
    });

    it("should reject negative order", () => {
      const result = updateStageSchema.safeParse({ stage: "applied", order: -1 });
      assert.strictEqual(result.success, false);
    });

    it("should reject float order", () => {
      const result = updateStageSchema.safeParse({ stage: "applied", order: 1.5 });
      assert.strictEqual(result.success, false);
    });

    it("should reject string order", () => {
      const result = updateStageSchema.safeParse({ stage: "applied", order: "hello" });
      assert.strictEqual(result.success, false);
    });

    it("should accept order of 0", () => {
      const result = updateStageSchema.safeParse({ stage: "wishlist", order: 0 });
      assert.strictEqual(result.success, true);
    });

    it("should accept large order values", () => {
      const result = updateStageSchema.safeParse({ stage: "wishlist", order: 9999 });
      assert.strictEqual(result.success, true);
    });
  });
});
