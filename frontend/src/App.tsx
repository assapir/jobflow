import { useState } from 'react';
import { Box, LoadingOverlay, Center, Text, Stack, Button, useMantineColorScheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useJobs } from './hooks/useJobs';
import { Header, KanbanBoard, JobFormModal, DeleteConfirmModal } from './components';
import type { JobApplication, CreateJobInput } from './types/job';

export default function App() {
  const { colorScheme } = useMantineColorScheme();
  const {
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
  } = useJobs();

  const [formModalOpened, { open: openFormModal, close: closeFormModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);

  const handleAddJob = () => {
    setSelectedJob(null);
    openFormModal();
  };

  const handleEditJob = (job: JobApplication) => {
    setSelectedJob(job);
    openFormModal();
  };

  const handleDeleteJob = (job: JobApplication) => {
    setSelectedJob(job);
    openDeleteModal();
  };

  const handleFormSubmit = async (data: CreateJobInput) => {
    if (selectedJob) {
      await editJob(selectedJob.id, data);
    } else {
      await addJob(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedJob) {
      await removeJob(selectedJob.id);
      closeDeleteModal();
      setSelectedJob(null);
    }
  };

  const bgColor = colorScheme === 'dark' ? '#0a0a0f' : '#f8f9fa';
  const bgGradient = colorScheme === 'dark'
    ? 'linear-gradient(180deg, #0a0a0f 0%, #0f0f18 50%, #0a0a0f 100%)'
    : 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%)';

  if (error && jobs.length === 0) {
    return (
      <Box style={{ minHeight: '100vh', background: bgColor }}>
        <Header onAddJob={handleAddJob} />
        <Center style={{ height: 'calc(100vh - 80px)' }}>
          <Stack align="center" gap="md">
            <Text c="red" size="lg">Failed to load jobs</Text>
            <Text c="dimmed" size="sm">{error}</Text>
            <Button onClick={refresh} variant="light">
              Try Again
            </Button>
          </Stack>
        </Center>
      </Box>
    );
  }

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: bgGradient,
      }}
    >
      <LoadingOverlay
        visible={loading}
        zIndex={1000}
        overlayProps={{ blur: 2, bg: 'rgba(0, 0, 0, 0.8)' }}
        loaderProps={{ color: 'cyan', type: 'bars' }}
      />

      <Header onAddJob={handleAddJob} />

      <Box p="md">
        <KanbanBoard
          jobs={jobs}
          getJobsByStage={getJobsByStage}
          onMoveJob={moveJob}
          onReorderJobs={reorderJobs}
          onEditJob={handleEditJob}
          onDeleteJob={handleDeleteJob}
        />
      </Box>

      <JobFormModal
        opened={formModalOpened}
        onClose={closeFormModal}
        onSubmit={handleFormSubmit}
        job={selectedJob}
      />

      <DeleteConfirmModal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        job={selectedJob}
      />
    </Box>
  );
}
