import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import type {
  JobApplication,
  CreateJobInput,
  UpdateJobInput,
  Stage,
} from "../types/job";
import * as api from "../api/jobs";

const JOBS_QUERY_KEY = ["jobs"] as const;

export function useJobs() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Query for fetching jobs
  const {
    data: jobs = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: JOBS_QUERY_KEY,
    queryFn: api.fetchJobs,
  });

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Unknown error"
    : null;

  // Show error notification when query fails
  if (queryError) {
    // Note: This will run on every render when there's an error.
    // In production, you might want to use onError in QueryClient config instead.
  }

  // Mutation for creating a job
  const createMutation = useMutation({
    mutationFn: api.createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY });
      notifications.show({
        title: "Success",
        message: t("messages.jobAdded"),
        color: "green",
      });
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: t("messages.errorSaving"),
        color: "red",
      });
    },
  });

  // Mutation for updating a job
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJobInput }) =>
      api.updateJob(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY });
      notifications.show({
        title: "Success",
        message: t("messages.jobUpdated"),
        color: "green",
      });
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: t("messages.errorSaving"),
        color: "red",
      });
    },
  });

  // Mutation for deleting a job
  const deleteMutation = useMutation({
    mutationFn: api.deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY });
      notifications.show({
        title: "Success",
        message: t("messages.jobDeleted"),
        color: "green",
      });
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: t("messages.errorSaving"),
        color: "red",
      });
    },
  });

  // Mutation for moving a job (stage change) with optimistic update
  const moveMutation = useMutation({
    mutationFn: ({
      jobId,
      newStage,
      newOrder,
    }: {
      jobId: string;
      newStage: Stage;
      newOrder: number;
    }) => api.updateJobStage(jobId, newStage, newOrder),
    onMutate: async ({ jobId, newStage, newOrder }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: JOBS_QUERY_KEY });

      // Snapshot previous value
      const previousJobs =
        queryClient.getQueryData<JobApplication[]>(JOBS_QUERY_KEY);

      // Optimistically update
      queryClient.setQueryData<JobApplication[]>(JOBS_QUERY_KEY, (old) =>
        old?.map((job) =>
          job.id === jobId ? { ...job, stage: newStage, order: newOrder } : job
        )
      );

      return { previousJobs };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousJobs) {
        queryClient.setQueryData(JOBS_QUERY_KEY, context.previousJobs);
      }
      notifications.show({
        title: "Error",
        message: t("messages.errorSaving"),
        color: "red",
      });
    },
    onSettled: () => {
      // Refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY });
    },
  });

  // Mutation for reordering jobs with optimistic update
  const reorderMutation = useMutation({
    mutationFn: (updates: Array<{ id: string; stage: Stage; order: number }>) =>
      api.reorderJobs({ jobs: updates }),
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: JOBS_QUERY_KEY });

      // Snapshot previous value
      const previousJobs =
        queryClient.getQueryData<JobApplication[]>(JOBS_QUERY_KEY);

      // Optimistically update
      queryClient.setQueryData<JobApplication[]>(JOBS_QUERY_KEY, (old) =>
        old?.map((job) => {
          const update = updates.find((u) => u.id === job.id);
          return update
            ? { ...job, stage: update.stage, order: update.order }
            : job;
        })
      );

      return { previousJobs };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousJobs) {
        queryClient.setQueryData(JOBS_QUERY_KEY, context.previousJobs);
      }
      notifications.show({
        title: "Error",
        message: t("messages.errorSaving"),
        color: "red",
      });
    },
    onSettled: () => {
      // Refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY });
    },
  });

  // Wrapper functions to maintain the same API
  const addJob = async (data: CreateJobInput) => {
    return createMutation.mutateAsync(data);
  };

  const editJob = async (id: string, data: UpdateJobInput) => {
    return updateMutation.mutateAsync({ id, data });
  };

  const removeJob = async (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  const moveJob = async (jobId: string, newStage: Stage, newOrder: number) => {
    moveMutation.mutate({ jobId, newStage, newOrder });
  };

  const reorderJobs = async (
    updates: Array<{ id: string; stage: Stage; order: number }>
  ) => {
    reorderMutation.mutate(updates);
  };

  const getJobsByStage = useCallback(
    (stage: Stage) => {
      return jobs
        .filter((job) => job.stage === stage)
        .sort((a, b) => a.order - b.order);
    },
    [jobs]
  );

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    jobs,
    loading,
    error,
    addJob,
    editJob,
    removeJob,
    moveJob,
    reorderJobs,
    getJobsByStage,
    refresh,
  };
}
