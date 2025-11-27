import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useJobs } from "./useJobs";
import * as api from "../api/jobs";
import type { JobApplication } from "../types/job";

// Mock the API module
vi.mock("../api/jobs");

const mockJobs: JobApplication[] = [
  {
    id: "job-1",
    company: "Company A",
    position: "Developer",
    location: "Remote",
    salary: "$100k",
    linkedinUrl: null,
    description: null,
    stage: "wishlist",
    order: 0,
    notes: null,
    appliedAt: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "job-2",
    company: "Company B",
    position: "Engineer",
    location: "NYC",
    salary: "$120k",
    linkedinUrl: null,
    description: null,
    stage: "applied",
    order: 0,
    notes: null,
    appliedAt: null,
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
  },
  {
    id: "job-3",
    company: "Company C",
    position: "Architect",
    location: "SF",
    salary: "$150k",
    linkedinUrl: null,
    description: null,
    stage: "wishlist",
    order: 1,
    notes: null,
    appliedAt: null,
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-03T00:00:00Z",
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useJobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.fetchJobs).mockResolvedValue(mockJobs);
  });

  describe("fetching jobs", () => {
    it("should fetch jobs on mount", async () => {
      const { result } = renderHook(() => useJobs(), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.jobs).toEqual(mockJobs);
      expect(api.fetchJobs).toHaveBeenCalledTimes(1);
    });

    it("should set error when fetch fails", async () => {
      vi.mocked(api.fetchJobs).mockRejectedValueOnce(
        new Error("Network error")
      );

      const { result } = renderHook(() => useJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Network error");
    });
  });

  describe("getJobsByStage", () => {
    it("should filter and sort jobs by stage", async () => {
      const { result } = renderHook(() => useJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const wishlistJobs = result.current.getJobsByStage("wishlist");

      expect(wishlistJobs).toHaveLength(2);
      expect(wishlistJobs[0]!.id).toBe("job-1"); // order 0
      expect(wishlistJobs[1]!.id).toBe("job-3"); // order 1
    });

    it("should return empty array for stage with no jobs", async () => {
      const { result } = renderHook(() => useJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const offerJobs = result.current.getJobsByStage("offer");
      expect(offerJobs).toHaveLength(0);
    });
  });

  describe("addJob", () => {
    it("should create a new job", async () => {
      const newJob: JobApplication = {
        ...mockJobs[0]!,
        id: "new-job",
        company: "New Company",
      };

      vi.mocked(api.createJob).mockResolvedValueOnce(newJob);

      const { result } = renderHook(() => useJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.addJob({
        company: "New Company",
        position: "Developer",
      });

      expect(api.createJob).toHaveBeenCalledWith(
        expect.objectContaining({
          company: "New Company",
          position: "Developer",
        }),
        expect.anything() // React Query passes extra context
      );
    });
  });

  describe("editJob", () => {
    it("should update an existing job", async () => {
      const updatedJob = { ...mockJobs[0]!, company: "Updated Company" };
      vi.mocked(api.updateJob).mockResolvedValueOnce(updatedJob);

      const { result } = renderHook(() => useJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.editJob("job-1", { company: "Updated Company" });

      expect(api.updateJob).toHaveBeenCalledWith("job-1", {
        company: "Updated Company",
      });
    });
  });

  describe("removeJob", () => {
    it("should delete a job", async () => {
      vi.mocked(api.deleteJob).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.removeJob("job-1");

      expect(api.deleteJob).toHaveBeenCalledWith(
        "job-1",
        expect.anything() // React Query passes extra context
      );
    });
  });

  describe("moveJob", () => {
    it("should update job stage and order", async () => {
      const movedJob = { ...mockJobs[0]!, stage: "applied" as const, order: 1 };
      vi.mocked(api.updateJobStage).mockResolvedValueOnce(movedJob);

      const { result } = renderHook(() => useJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.moveJob("job-1", "applied", 1);

      await waitFor(() => {
        expect(api.updateJobStage).toHaveBeenCalledWith("job-1", "applied", 1);
      });
    });
  });

  describe("reorderJobs", () => {
    it("should reorder multiple jobs", async () => {
      vi.mocked(api.reorderJobs).mockResolvedValueOnce(mockJobs);

      const { result } = renderHook(() => useJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updates = [
        { id: "job-1", stage: "wishlist" as const, order: 1 },
        { id: "job-3", stage: "wishlist" as const, order: 0 },
      ];

      result.current.reorderJobs(updates);

      await waitFor(() => {
        expect(api.reorderJobs).toHaveBeenCalledWith({ jobs: updates });
      });
    });
  });

  describe("refresh", () => {
    it("should refetch jobs", async () => {
      const { result } = renderHook(() => useJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear the call count
      vi.mocked(api.fetchJobs).mockClear();

      result.current.refresh();

      await waitFor(() => {
        expect(api.fetchJobs).toHaveBeenCalled();
      });
    });
  });
});
