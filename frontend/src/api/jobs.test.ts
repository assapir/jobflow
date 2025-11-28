import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockFetch, createMockResponse } from "../test/setup";
import {
  fetchJobs,
  fetchJob,
  createJob,
  updateJob,
  deleteJob,
  updateJobStage,
  reorderJobs,
} from "./jobs";
import type { JobApplication, CreateJobInput } from "../types/job";

const mockJob: JobApplication = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  company: "Test Company",
  position: "Software Engineer",
  location: "Remote",
  salary: "$100,000",
  linkedinUrl: "https://linkedin.com/jobs/123",
  description: "Test description",
  stage: "applied",
  order: 0,
  notes: "Test notes",
  appliedAt: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

// Helper to create expected fetch call args with auth headers
const withAuthHeaders = (options: RequestInit = {}) => ({
  ...options,
  headers: {
    "Content-Type": "application/json",
    ...options.headers,
  },
  credentials: "include",
});

describe("jobs API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchJobs", () => {
    it("should fetch all jobs successfully", async () => {
      const jobs = [mockJob];
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ ok: true, json: jobs })
      );

      const result = await fetchJobs();

      expect(mockFetch).toHaveBeenCalledWith("/api/jobs", withAuthHeaders());
      expect(result).toEqual(jobs);
    });

    it("should throw error when fetch fails", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ ok: false, json: { error: "Server error" } })
      );

      await expect(fetchJobs()).rejects.toThrow("Server error");
    });

    it("should handle unknown error format", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        headers: { get: () => null },
        json: () => Promise.reject(new Error("Parse error")),
      });

      await expect(fetchJobs()).rejects.toThrow("Unknown error");
    });
  });

  describe("fetchJob", () => {
    it("should fetch a single job by id", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ ok: true, json: mockJob })
      );

      const result = await fetchJob("123e4567-e89b-12d3-a456-426614174000");

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/jobs/123e4567-e89b-12d3-a456-426614174000",
        withAuthHeaders()
      );
      expect(result).toEqual(mockJob);
    });

    it("should throw error when job not found", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ ok: false, json: { error: "Job not found" } })
      );

      await expect(fetchJob("nonexistent")).rejects.toThrow("Job not found");
    });
  });

  describe("createJob", () => {
    it("should create a new job", async () => {
      const newJobInput: CreateJobInput = {
        company: "New Company",
        position: "Developer",
        stage: "wishlist",
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse({ ok: true, json: { ...mockJob, ...newJobInput } })
      );

      const result = await createJob(newJobInput);

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/jobs",
        withAuthHeaders({
          method: "POST",
          body: JSON.stringify(newJobInput),
        })
      );
      expect(result.company).toBe("New Company");
    });

    it("should throw error on validation failure", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ ok: false, json: { error: "Validation failed" } })
      );

      await expect(createJob({ company: "", position: "" })).rejects.toThrow(
        "Validation failed"
      );
    });
  });

  describe("updateJob", () => {
    it("should update an existing job", async () => {
      const updateData = { company: "Updated Company" };

      mockFetch.mockResolvedValueOnce(
        createMockResponse({ ok: true, json: { ...mockJob, ...updateData } })
      );

      const result = await updateJob(mockJob.id, updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/jobs/${mockJob.id}`,
        withAuthHeaders({
          method: "PUT",
          body: JSON.stringify(updateData),
        })
      );
      expect(result.company).toBe("Updated Company");
    });

    it("should throw error when job not found", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ ok: false, json: { error: "Job not found" } })
      );

      await expect(
        updateJob("nonexistent", { company: "Test" })
      ).rejects.toThrow("Job not found");
    });
  });

  describe("deleteJob", () => {
    it("should delete a job", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ ok: true, json: { message: "Job deleted" } })
      );

      await expect(deleteJob(mockJob.id)).resolves.toBeUndefined();

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/jobs/${mockJob.id}`,
        withAuthHeaders({
          method: "DELETE",
        })
      );
    });

    it("should throw error when job not found", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ ok: false, json: { error: "Job not found" } })
      );

      await expect(deleteJob("nonexistent")).rejects.toThrow("Job not found");
    });
  });

  describe("updateJobStage", () => {
    it("should update job stage and order", async () => {
      const updatedJob = { ...mockJob, stage: "interview" as const, order: 1 };

      mockFetch.mockResolvedValueOnce(
        createMockResponse({ ok: true, json: updatedJob })
      );

      const result = await updateJobStage(mockJob.id, "interview", 1);

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/jobs/${mockJob.id}/stage`,
        withAuthHeaders({
          method: "PATCH",
          body: JSON.stringify({ stage: "interview", order: 1 }),
        })
      );
      expect(result.stage).toBe("interview");
      expect(result.order).toBe(1);
    });

    it("should throw error on invalid stage", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ ok: false, json: { error: "Invalid stage" } })
      );

      await expect(
        updateJobStage(mockJob.id, "invalid_stage", 0)
      ).rejects.toThrow("Invalid stage");
    });
  });

  describe("reorderJobs", () => {
    it("should reorder multiple jobs", async () => {
      const reorderData = {
        jobs: [
          { id: mockJob.id, stage: "applied" as const, order: 0 },
          { id: "other-id", stage: "applied" as const, order: 1 },
        ],
      };

      const updatedJobs = [mockJob, { ...mockJob, id: "other-id", order: 1 }];

      mockFetch.mockResolvedValueOnce(
        createMockResponse({ ok: true, json: updatedJobs })
      );

      const result = await reorderJobs(reorderData);

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/jobs/reorder",
        withAuthHeaders({
          method: "PATCH",
          body: JSON.stringify(reorderData),
        })
      );
      expect(result).toHaveLength(2);
    });

    it("should throw error on validation failure", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ ok: false, json: { error: "Validation failed" } })
      );

      await expect(reorderJobs({ jobs: [] })).rejects.toThrow(
        "Validation failed"
      );
    });
  });
});
