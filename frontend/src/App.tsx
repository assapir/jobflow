import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  LoadingOverlay,
  Center,
  Text,
  Stack,
  Button,
  useMantineColorScheme,
  useDirection,
  Loader,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useJobs } from "./hooks/useJobs";
import {
  Header,
  Footer,
  KanbanBoard,
  JobFormModal,
  DeleteConfirmModal,
  LinkedInSearchModal,
  LoginPage,
  AuthCallback,
  OnboardingModal,
  OnboardingBanner,
} from "./components";
import { useAuth } from "./context/AuthContext";
import { setAccessTokenGetter } from "./api/client";
import type { JobApplication, CreateJobInput } from "./types/job";
import type { Profession, ExperienceLevel } from "./types/user";

export default function App() {
  const { i18n } = useTranslation();
  const { colorScheme } = useMantineColorScheme();
  const { setDirection } = useDirection();
  const {
    isAuthenticated,
    isLoading: authLoading,
    getAccessToken,
    user,
    profile,
    fetchProfile,
    updateProfile,
  } = useAuth();
  const [isCallback, setIsCallback] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Connect the access token getter to the API client
  useEffect(() => {
    setAccessTokenGetter(getAccessToken);
  }, [getAccessToken]);

  // Check if this is an OAuth callback
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    if (path === "/auth/callback" && params.has("token")) {
      setIsCallback(true);
    } else if (path === "/login" && params.has("error")) {
      setLoginError(params.get("error"));
      window.history.replaceState({}, document.title, "/login");
    }
  }, []);

  // Sync RTL direction with language
  useEffect(() => {
    const isRTL = i18n.language === "he";
    setDirection(isRTL ? "rtl" : "ltr");
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [i18n.language, setDirection]);

  // Fetch profile when authenticated
  useEffect(() => {
    if (isAuthenticated && !profile) {
      fetchProfile();
    }
  }, [isAuthenticated, profile, fetchProfile]);

  // Show onboarding modal if profile is not completed
  useEffect(() => {
    if (profile && !profile.onboardingCompleted && !bannerDismissed) {
      setShowOnboardingModal(true);
    }
  }, [profile, bannerDismissed]);

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

  const [formModalOpened, { open: openFormModal, close: closeFormModal }] =
    useDisclosure(false);
  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);
  const [
    linkedInModalOpened,
    { open: openLinkedInModal, close: closeLinkedInModal },
  ] = useDisclosure(false);
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

  const handleOnboardingComplete = async (data: {
    profession: Profession | null;
    experienceLevel: ExperienceLevel | null;
    preferredLocation: string | null;
  }) => {
    await updateProfile({
      ...data,
      onboardingCompleted: true,
    });
    setShowOnboardingModal(false);
  };

  const handleOnboardingSkip = () => {
    setShowOnboardingModal(false);
    setBannerDismissed(false); // Show banner after skipping
  };

  const handleBannerComplete = () => {
    setShowOnboardingModal(true);
  };

  const handleBannerDismiss = () => {
    setBannerDismissed(true);
  };

  const handleCallbackComplete = useCallback(() => {
    setIsCallback(false);
    refresh();
  }, [refresh]);

  const bgColor = colorScheme === "dark" ? "#0a0a0f" : "#f8f9fa";
  const bgGradient =
    colorScheme === "dark"
      ? "linear-gradient(180deg, #0a0a0f 0%, #0f0f18 50%, #0a0a0f 100%)"
      : "linear-gradient(180deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%)";

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <Box
        style={{
          minHeight: "100vh",
          background: bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Center>
          <Stack align="center" gap="md">
            <Loader size="lg" color="cyan" />
            <Text c="dimmed">Loading...</Text>
          </Stack>
        </Center>
      </Box>
    );
  }

  // Handle OAuth callback
  if (isCallback) {
    return <AuthCallback onComplete={handleCallbackComplete} />;
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage error={loginError} />;
  }

  if (error && jobs.length === 0) {
    return (
      <Box style={{ minHeight: "100vh", background: bgColor }}>
        <Header
          onAddJob={handleAddJob}
          onSearchLinkedIn={openLinkedInModal}
          user={user}
        />
        <Center style={{ height: "calc(100vh - 80px)" }}>
          <Stack align="center" gap="md">
            <Text c="red" size="lg">
              Failed to load jobs
            </Text>
            <Text c="dimmed" size="sm">
              {error}
            </Text>
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
        minHeight: "100vh",
        background: bgGradient,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <LoadingOverlay
        visible={loading}
        zIndex={1000}
        overlayProps={{ blur: 2, bg: "rgba(0, 0, 0, 0.8)" }}
        loaderProps={{ color: "cyan", type: "bars" }}
      />

      <Header
        onAddJob={handleAddJob}
        onSearchLinkedIn={openLinkedInModal}
        user={user}
      />

      <Box p="md" style={{ flex: 1 }}>
        {/* Onboarding banner - show if not completed and modal was dismissed */}
        {profile && !profile.onboardingCompleted && !showOnboardingModal && !bannerDismissed && (
          <OnboardingBanner
            onComplete={handleBannerComplete}
            onDismiss={handleBannerDismiss}
          />
        )}

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
        profile={profile}
      />

      <OnboardingModal
        opened={showOnboardingModal}
        onClose={handleOnboardingSkip}
        onComplete={handleOnboardingComplete}
        user={user}
        profile={profile}
      />

      <Footer />
    </Box>
  );
}
