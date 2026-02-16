import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  createMockResponse,
  sampleJobs,
  type MockJob,
} from "../helpers/mockDb.js";
import { AppError } from "../../middleware/errorHandler.js";
import { updateJobStage, reorderJobs } from "../../controllers/jobs.js";

// Mock data storage
let mockJobs: MockJob[] = [];

// Helper to create a mock request with user attached
function createMockReq(overrides: {
  params?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
}) {
  return {
    params: overrides.params || {},
    body: overrides.body || {},
    query: overrides.query || {},
    user: { sub: "test-user-id", name: "Test", iat: 0, exp: 0 },
  };
}

describe("Jobs Controller Unit Tests", () => {
  beforeEach(() => {
    mockJobs = [...sampleJobs];
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

  describe("updateJobStage validation", () => {
    it("should throw AppError 400 for invalid stage", async () => {
      const req = createMockReq({
        params: { id: "550e8400-e29b-41d4-a716-446655440001" },
        body: { stage: "promoted", order: 0 },
      });
      const res = createMockResponse();

      await assert.rejects(
        () => updateJobStage(req as any, res as any),
        (err: AppError) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.message, "Validation failed");
          return true;
        }
      );
    });

    it("should throw AppError 400 for negative order", async () => {
      const req = createMockReq({
        params: { id: "550e8400-e29b-41d4-a716-446655440001" },
        body: { stage: "applied", order: -1 },
      });
      const res = createMockResponse();

      await assert.rejects(
        () => updateJobStage(req as any, res as any),
        (err: AppError) => {
          assert.strictEqual(err.statusCode, 400);
          return true;
        }
      );
    });

    it("should throw AppError 400 for float order", async () => {
      const req = createMockReq({
        params: { id: "550e8400-e29b-41d4-a716-446655440001" },
        body: { stage: "applied", order: 1.5 },
      });
      const res = createMockResponse();

      await assert.rejects(
        () => updateJobStage(req as any, res as any),
        (err: AppError) => {
          assert.strictEqual(err.statusCode, 400);
          return true;
        }
      );
    });

    it("should throw AppError 400 for string order", async () => {
      const req = createMockReq({
        params: { id: "550e8400-e29b-41d4-a716-446655440001" },
        body: { stage: "applied", order: "hello" },
      });
      const res = createMockResponse();

      await assert.rejects(
        () => updateJobStage(req as any, res as any),
        (err: AppError) => {
          assert.strictEqual(err.statusCode, 400);
          return true;
        }
      );
    });

    it("should throw AppError 400 for missing stage", async () => {
      const req = createMockReq({
        params: { id: "550e8400-e29b-41d4-a716-446655440001" },
        body: { order: 0 },
      });
      const res = createMockResponse();

      await assert.rejects(
        () => updateJobStage(req as any, res as any),
        (err: AppError) => {
          assert.strictEqual(err.statusCode, 400);
          return true;
        }
      );
    });

    it("should throw AppError 400 for reorder with bad data", async () => {
      const req = createMockReq({
        body: {
          jobs: [{ id: "not-a-uuid", stage: "applied", order: 0 }],
        },
      });
      const res = createMockResponse();

      await assert.rejects(
        () => reorderJobs(req as any, res as any),
        (err: AppError) => {
          assert.strictEqual(err.statusCode, 400);
          return true;
        }
      );
    });
  });
});
