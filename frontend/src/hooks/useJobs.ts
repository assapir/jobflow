import { useState, useEffect, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import type { JobApplication, CreateJobInput, UpdateJobInput, Stage } from '../types/job';
import * as api from '../api/jobs';

export function useJobs() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.fetchJobs();
      setJobs(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      notifications.show({
        title: 'Error',
        message: t('messages.errorLoading'),
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const addJob = async (data: CreateJobInput) => {
    try {
      const newJob = await api.createJob(data);
      setJobs((prev) => [...prev, newJob]);
      notifications.show({
        title: 'Success',
        message: t('messages.jobAdded'),
        color: 'green',
      });
      return newJob;
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: t('messages.errorSaving'),
        color: 'red',
      });
      throw err;
    }
  };

  const editJob = async (id: string, data: UpdateJobInput) => {
    try {
      const updatedJob = await api.updateJob(id, data);
      setJobs((prev) => prev.map((job) => (job.id === id ? updatedJob : job)));
      notifications.show({
        title: 'Success',
        message: t('messages.jobUpdated'),
        color: 'green',
      });
      return updatedJob;
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: t('messages.errorSaving'),
        color: 'red',
      });
      throw err;
    }
  };

  const removeJob = async (id: string) => {
    try {
      await api.deleteJob(id);
      setJobs((prev) => prev.filter((job) => job.id !== id));
      notifications.show({
        title: 'Success',
        message: t('messages.jobDeleted'),
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: t('messages.errorSaving'),
        color: 'red',
      });
      throw err;
    }
  };

  const moveJob = async (jobId: string, newStage: Stage, newOrder: number) => {
    // Optimistic update
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, stage: newStage, order: newOrder } : job
      )
    );

    try {
      await api.updateJobStage(jobId, newStage, newOrder);
    } catch (err) {
      // Revert on error
      loadJobs();
      notifications.show({
        title: 'Error',
        message: t('messages.errorSaving'),
        color: 'red',
      });
    }
  };

  const reorderJobs = async (updates: Array<{ id: string; stage: Stage; order: number }>) => {
    // Optimistic update
    setJobs((prev) =>
      prev.map((job) => {
        const update = updates.find((u) => u.id === job.id);
        return update ? { ...job, stage: update.stage, order: update.order } : job;
      })
    );

    try {
      await api.reorderJobs({ jobs: updates });
    } catch (err) {
      // Revert on error
      loadJobs();
      notifications.show({
        title: 'Error',
        message: t('messages.errorSaving'),
        color: 'red',
      });
    }
  };

  const getJobsByStage = useCallback(
    (stage: Stage) => {
      return jobs
        .filter((job) => job.stage === stage)
        .sort((a, b) => a.order - b.order);
    },
    [jobs]
  );

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
    refresh: loadJobs,
  };
}
