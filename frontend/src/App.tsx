import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, LoadingOverlay, Center, Text, Stack, Button, useMantineColorScheme, useDirection } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useJobs } from './hooks/useJobs';
import { Header, Footer, KanbanBoard, JobFormModal, DeleteConfirmModal, LinkedInSearchModal } from './components';
import type { JobApplication, CreateJobInput } from './types/job';

export default function App() {
  const { i18n } = useTranslation();
  const { colorScheme } = useMantineColorScheme();
  const { setDirection } = useDirection();

  // Sync RTL direction with language
  useEffect(() => {
    const isRTL = i18n.language === 'he';
    setDirection(isRTL ? 'rtl' : 'ltr');
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [i18n.language, setDirection]);

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
  const [linkedInModalOpened, { open: openLinkedInModal, close: closeLinkedInModal }] = useDisclosure(false);
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

  const handleLinkedInImport = async (jobs: CreateJobInput[]) => {
    for (const job of jobs) {
      await addJob(job);
    }
  };

  const bgColor = colorScheme === 'dark' ? '#0a0a0f' : '#f8f9fa';
  const bgGradient = colorScheme === 'dark'
    ? 'linear-gradient(180deg, #0a0a0f 0%, #0f0f18 50%, #0a0a0f 100%)'
    : 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%)';

  if (error && jobs.length === 0) {
    return (
      <Box style={{ minHeight: '100vh', background: bgColor }}>
        <Header onAddJob={handleAddJob} onSearchLinkedIn={openLinkedInModal} />
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
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <LoadingOverlay
        visible={loading}
        zIndex={1000}
        overlayProps={{ blur: 2, bg: 'rgba(0, 0, 0, 0.8)' }}
        loaderProps={{ color: 'cyan', type: 'bars' }}
      />

      <Header onAddJob={handleAddJob} onSearchLinkedIn={openLinkedInModal} />

      <Box p="md" style={{ flex: 1 }}>
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

      <LinkedInSearchModal
        opened={linkedInModalOpened}
        onClose={closeLinkedInModal}
        onImport={handleLinkedInImport}
      />

      <Footer />
    </Box>
  );
}
