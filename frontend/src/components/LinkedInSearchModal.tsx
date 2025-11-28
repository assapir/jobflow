import { useState, useEffect } from "react";
import {
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
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { searchLinkedInJobs, LinkedInSearchError } from "../api/linkedin";
import type { LinkedInJob, CreateJobInput } from "../types/job";
import type { UserProfile, Profession } from "../types/user";
import { AppModal, GradientButton, useThemeColors } from "../design-system";

// Mapping from profession to search keywords
const PROFESSION_KEYWORDS: Record<Profession, string> = {
  engineering: "Software Engineer",
  product: "Product Manager",
  design: "UX Designer",
  marketing: "Marketing Manager",
  sales: "Sales Representative",
  operations: "Operations Manager",
  hr: "HR Manager",
  finance: "Financial Analyst",
  other: "",
};

interface LinkedInSearchModalProps {
  opened: boolean;
  onClose: () => void;
  onImport: (jobs: CreateJobInput[]) => Promise<void>;
  profile?: UserProfile | null;
}

export function LinkedInSearchModal({
  opened,
  onClose,
  onImport,
  profile,
}: LinkedInSearchModalProps) {
  const { t } = useTranslation();
  const { selectableCardBg, borderColor } = useThemeColors();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Get initial values from profile
  const getInitialQuery = () => {
    if (profile?.profession) {
      return PROFESSION_KEYWORDS[profile.profession] || "";
    }
    return "";
  };

  const getInitialLocation = () => {
    return profile?.preferredLocation || "";
  };

  const [query, setQuery] = useState(getInitialQuery);
  const [location, setLocation] = useState(getInitialLocation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LinkedInJob[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Update defaults when modal opens and profile changes
  useEffect(() => {
    if (opened && !hasSearched) {
      if (profile?.profession && !query) {
        setQuery(PROFESSION_KEYWORDS[profile.profession] || "");
      }
      if (profile?.preferredLocation && !location) {
        setLocation(profile.preferredLocation);
      }
    }
  }, [opened, profile, hasSearched, query, location]);

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

  return (
    <AppModal
      opened={opened}
      onClose={handleClose}
      title={t("linkedin.searchTitle")}
      size="xl"
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
          <GradientButton
            onClick={handleSearch}
            loading={loading}
            disabled={!query.trim()}
          >
            {t("linkedin.search")}
          </GradientButton>
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
                      background: selectableCardBg,
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
              <GradientButton
                onClick={handleImport}
                loading={importing}
                disabled={selectedJobs.size === 0}
              >
                {t("linkedin.importSelected", { count: selectedJobs.size })}
              </GradientButton>
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
    </AppModal>
  );
}
