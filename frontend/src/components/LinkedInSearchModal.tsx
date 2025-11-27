import { useState } from "react";
import {
  Modal,
  TextInput,
  Button,
  Group,
  Stack,
  Text,
  Checkbox,
  Card,
  Badge,
  ScrollArea,
  Loader,
  Alert,
  Box,
  Anchor,
  useMantineColorScheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { searchLinkedInJobs, LinkedInSearchError } from "../api/linkedin";
import type { LinkedInJob, CreateJobInput } from "../types/job";

interface LinkedInSearchModalProps {
  opened: boolean;
  onClose: () => void;
  onImport: (jobs: CreateJobInput[]) => Promise<void>;
}

export function LinkedInSearchModal({
  opened,
  onClose,
  onImport,
}: LinkedInSearchModalProps) {
  const { t } = useTranslation();
  const { colorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LinkedInJob[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSelectedJobs(new Set());

    try {
      const response = await searchLinkedInJobs(
        query.trim(),
        location.trim() || undefined
      );
      setResults(response.jobs);
      setHasSearched(true);
    } catch (err) {
      if (err instanceof LinkedInSearchError) {
        if (err.retryAfter) {
          setError(t("linkedin.rateLimited", { seconds: err.retryAfter }));
        } else {
          setError(err.message);
        }
      } else {
        setError(t("linkedin.searchError"));
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleJobSelection = (jobUrl: string) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(jobUrl)) {
      newSelected.delete(jobUrl);
    } else {
      newSelected.add(jobUrl);
    }
    setSelectedJobs(newSelected);
  };

  const selectAll = () => {
    if (selectedJobs.size === results.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(results.map((job) => job.url)));
    }
  };

  const handleImport = async () => {
    const jobsToImport = results.filter((job) => selectedJobs.has(job.url));
    if (jobsToImport.length === 0) return;

    setImporting(true);
    try {
      const createInputs: CreateJobInput[] = jobsToImport.map((job) => ({
        company: job.company,
        position: job.title,
        location: job.location || undefined,
        linkedinUrl: job.url,
        stage: "wishlist",
      }));

      await onImport(createInputs);
      handleClose();
    } catch {
      setError(t("linkedin.importError"));
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setQuery("");
    setLocation("");
    setResults([]);
    setSelectedJobs(new Set());
    setError(null);
    setHasSearched(false);
    onClose();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return null;
    }
  };

  const modalHeaderBg =
    colorScheme === "dark"
      ? "linear-gradient(135deg, rgba(30, 30, 40, 0.98) 0%, rgba(20, 20, 30, 0.99) 100%)"
      : "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 249, 250, 0.99) 100%)";

  const modalContentBg =
    colorScheme === "dark"
      ? "linear-gradient(180deg, rgba(25, 25, 35, 0.98) 0%, rgba(15, 15, 25, 0.99) 100%)"
      : "linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 249, 250, 0.99) 100%)";

  const borderColor =
    colorScheme === "dark"
      ? "rgba(255, 255, 255, 0.06)"
      : "rgba(0, 0, 0, 0.08)";

  const cardBg =
    colorScheme === "dark"
      ? "rgba(255, 255, 255, 0.03)"
      : "rgba(0, 0, 0, 0.02)";

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={t("linkedin.searchTitle")}
      size="xl"
      fullScreen={isMobile}
      styles={{
        header: {
          background: modalHeaderBg,
          borderBottom: `1px solid ${borderColor}`,
        },
        content: {
          background: modalContentBg,
        },
      }}
    >
      <Stack gap="md">
        {/* Search Form */}
        <Group grow={!isMobile} align="flex-end">
          <TextInput
            label={t("linkedin.keywords")}
            placeholder={t("linkedin.keywordsPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            disabled={loading}
          />
          <TextInput
            label={t("linkedin.location")}
            placeholder={t("linkedin.locationPlaceholder")}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            disabled={loading}
          />
          <Button
            onClick={handleSearch}
            loading={loading}
            disabled={!query.trim()}
            variant="gradient"
            gradient={{ from: "cyan", to: "teal", deg: 135 }}
          >
            {t("linkedin.search")}
          </Button>
        </Group>

        {/* Error Alert */}
        {error && (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box py="xl" style={{ textAlign: "center" }}>
            <Loader color="cyan" size="lg" />
            <Text c="dimmed" size="sm" mt="md">
              {t("linkedin.searching")}
            </Text>
          </Box>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <>
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                {t("linkedin.resultsCount", { count: results.length })}
              </Text>
              <Group gap="sm">
                <Button variant="subtle" size="xs" onClick={selectAll}>
                  {selectedJobs.size === results.length
                    ? t("linkedin.deselectAll")
                    : t("linkedin.selectAll")}
                </Button>
              </Group>
            </Group>

            <ScrollArea h={isMobile ? "calc(100vh - 350px)" : 400}>
              <Stack gap="sm">
                {results.map((job) => (
                  <Card
                    key={job.url}
                    padding="sm"
                    withBorder
                    style={{
                      background: cardBg,
                      borderColor: selectedJobs.has(job.url)
                        ? "var(--mantine-color-cyan-6)"
                        : borderColor,
                      cursor: "pointer",
                    }}
                    onClick={() => toggleJobSelection(job.url)}
                  >
                    <Group wrap="nowrap" align="flex-start">
                      <Checkbox
                        checked={selectedJobs.has(job.url)}
                        onChange={() => toggleJobSelection(job.url)}
                        onClick={(e) => e.stopPropagation()}
                        color="cyan"
                      />
                      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                        <Group justify="space-between" wrap="nowrap">
                          <Text fw={600} size="sm" truncate>
                            {job.title}
                          </Text>
                          {job.postedDate && (
                            <Badge size="xs" variant="light" color="gray">
                              {formatDate(job.postedDate)}
                            </Badge>
                          )}
                        </Group>
                        <Text size="sm" c="dimmed" truncate>
                          {job.company}
                        </Text>
                        {job.location && (
                          <Text size="xs" c="dimmed">
                            {job.location}
                          </Text>
                        )}
                        <Anchor
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t("linkedin.viewOnLinkedIn")}
                        </Anchor>
                      </Stack>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </ScrollArea>

            {/* Import Button */}
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={handleClose}>
                {t("actions.cancel")}
              </Button>
              <Button
                onClick={handleImport}
                loading={importing}
                disabled={selectedJobs.size === 0}
                variant="gradient"
                gradient={{ from: "cyan", to: "teal", deg: 135 }}
              >
                {t("linkedin.importSelected", { count: selectedJobs.size })}
              </Button>
            </Group>
          </>
        )}

        {/* Empty State */}
        {!loading && hasSearched && results.length === 0 && (
          <Box py="xl" style={{ textAlign: "center" }}>
            <Text c="dimmed">{t("linkedin.noResults")}</Text>
          </Box>
        )}
      </Stack>
    </Modal>
  );
}
