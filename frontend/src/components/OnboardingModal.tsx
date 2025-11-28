import { useState } from "react";
import {
  Modal,
  Stack,
  Text,
  Title,
  Button,
  Group,
  TextInput,
  SimpleGrid,
  Paper,
  Avatar,
  Box,
  Progress,
  useMantineColorScheme,
  ThemeIcon,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import type {
  User,
  UserProfile,
  Profession,
  ExperienceLevel,
} from "../types/user";

interface OnboardingModalProps {
  opened: boolean;
  onClose: () => void;
  onComplete: (data: {
    profession: Profession | null;
    experienceLevel: ExperienceLevel | null;
    preferredLocation: string | null;
  }) => Promise<void>;
  user: User | null;
  profile: UserProfile | null;
}

const PROFESSIONS: { value: Profession; icon: string; labelKey: string }[] = [
  {
    value: "engineering",
    icon: "💻",
    labelKey: "onboarding.professions.engineering",
  },
  { value: "product", icon: "📋", labelKey: "onboarding.professions.product" },
  { value: "design", icon: "🎨", labelKey: "onboarding.professions.design" },
  {
    value: "marketing",
    icon: "📣",
    labelKey: "onboarding.professions.marketing",
  },
  { value: "sales", icon: "🤝", labelKey: "onboarding.professions.sales" },
  {
    value: "operations",
    icon: "⚙️",
    labelKey: "onboarding.professions.operations",
  },
  { value: "hr", icon: "👥", labelKey: "onboarding.professions.hr" },
  { value: "finance", icon: "💰", labelKey: "onboarding.professions.finance" },
  { value: "other", icon: "✨", labelKey: "onboarding.professions.other" },
];

const EXPERIENCE_LEVELS: {
  value: ExperienceLevel;
  labelKey: string;
  descKey: string;
}[] = [
  {
    value: "entry",
    labelKey: "onboarding.experience.entry",
    descKey: "onboarding.experience.entryDesc",
  },
  {
    value: "junior",
    labelKey: "onboarding.experience.junior",
    descKey: "onboarding.experience.juniorDesc",
  },
  {
    value: "mid",
    labelKey: "onboarding.experience.mid",
    descKey: "onboarding.experience.midDesc",
  },
  {
    value: "senior",
    labelKey: "onboarding.experience.senior",
    descKey: "onboarding.experience.seniorDesc",
  },
  {
    value: "lead",
    labelKey: "onboarding.experience.lead",
    descKey: "onboarding.experience.leadDesc",
  },
  {
    value: "executive",
    labelKey: "onboarding.experience.executive",
    descKey: "onboarding.experience.executiveDesc",
  },
];

export function OnboardingModal({
  opened,
  onClose,
  onComplete,
  user,
  profile,
}: OnboardingModalProps) {
  const { t } = useTranslation();
  const { colorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [step, setStep] = useState(0);
  const [profession, setProfession] = useState<Profession | null>(
    profile?.profession || null
  );
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel | null>(profile?.experienceLevel || null);
  const [preferredLocation, setPreferredLocation] = useState<string>(
    profile?.preferredLocation || user?.country || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 4;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await onComplete({
        profession,
        experienceLevel,
        preferredLocation: preferredLocation || null,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
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

  const selectedCardBg =
    colorScheme === "dark"
      ? "rgba(0, 212, 236, 0.15)"
      : "rgba(0, 212, 236, 0.1)";

  const renderStep = () => {
    switch (step) {
      case 0:
        // Welcome Step
        return (
          <Stack align="center" gap="lg" py="xl">
            <Avatar
              src={user?.profilePicture}
              alt={user?.name || "User"}
              size={100}
              radius="xl"
              color="cyan"
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Stack align="center" gap="xs">
              <Title order={2}>
                {t("onboarding.welcome.title", {
                  name: user?.name?.split(" ")[0] || "",
                })}
              </Title>
              <Text c="dimmed" ta="center" maw={400}>
                {t("onboarding.welcome.subtitle")}
              </Text>
            </Stack>
            <Paper
              p="md"
              radius="md"
              style={{ background: cardBg, width: "100%" }}
            >
              <Stack gap="xs">
                <Group>
                  <Text size="sm" c="dimmed" w={80}>
                    {t("onboarding.welcome.name")}:
                  </Text>
                  <Text size="sm" fw={500}>
                    {user?.name || "-"}
                  </Text>
                </Group>
                <Group>
                  <Text size="sm" c="dimmed" w={80}>
                    {t("onboarding.welcome.email")}:
                  </Text>
                  <Text size="sm" fw={500}>
                    {user?.email || "-"}
                  </Text>
                </Group>
                {user?.country && (
                  <Group>
                    <Text size="sm" c="dimmed" w={80}>
                      {t("onboarding.welcome.country")}:
                    </Text>
                    <Text size="sm" fw={500}>
                      {user.country}
                    </Text>
                  </Group>
                )}
              </Stack>
            </Paper>
          </Stack>
        );

      case 1:
        // Profession Step
        return (
          <Stack gap="lg">
            <Stack align="center" gap="xs">
              <Title order={3}>{t("onboarding.profession.title")}</Title>
              <Text c="dimmed" ta="center" size="sm">
                {t("onboarding.profession.subtitle")}
              </Text>
            </Stack>
            <SimpleGrid cols={isMobile ? 2 : 3} spacing="sm">
              {PROFESSIONS.map((p) => (
                <Paper
                  key={p.value}
                  p="md"
                  radius="md"
                  style={{
                    background:
                      profession === p.value ? selectedCardBg : cardBg,
                    border: `2px solid ${
                      profession === p.value
                        ? "var(--mantine-color-cyan-6)"
                        : borderColor
                    }`,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => setProfession(p.value)}
                >
                  <Stack align="center" gap="xs">
                    <Text size="xl">{p.icon}</Text>
                    <Text size="sm" fw={500} ta="center">
                      {t(p.labelKey)}
                    </Text>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          </Stack>
        );

      case 2:
        // Experience Level Step
        return (
          <Stack gap="lg">
            <Stack align="center" gap="xs">
              <Title order={3}>{t("onboarding.experience.title")}</Title>
              <Text c="dimmed" ta="center" size="sm">
                {t("onboarding.experience.subtitle")}
              </Text>
            </Stack>
            <SimpleGrid cols={isMobile ? 1 : 2} spacing="sm">
              {EXPERIENCE_LEVELS.map((level) => (
                <Paper
                  key={level.value}
                  p="md"
                  radius="md"
                  style={{
                    background:
                      experienceLevel === level.value ? selectedCardBg : cardBg,
                    border: `2px solid ${
                      experienceLevel === level.value
                        ? "var(--mantine-color-cyan-6)"
                        : borderColor
                    }`,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => setExperienceLevel(level.value)}
                >
                  <Stack gap={4}>
                    <Text size="sm" fw={600}>
                      {t(level.labelKey)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t(level.descKey)}
                    </Text>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          </Stack>
        );

      case 3:
        // Location Step
        return (
          <Stack gap="lg">
            <Stack align="center" gap="xs">
              <Title order={3}>{t("onboarding.location.title")}</Title>
              <Text c="dimmed" ta="center" size="sm">
                {t("onboarding.location.subtitle")}
              </Text>
            </Stack>
            <TextInput
              label={t("onboarding.location.label")}
              placeholder={t("onboarding.location.placeholder")}
              value={preferredLocation}
              onChange={(e) => setPreferredLocation(e.target.value)}
              size="md"
            />
            <Paper p="md" radius="md" style={{ background: cardBg }}>
              <Group gap="sm">
                <ThemeIcon color="cyan" variant="light" size="lg">
                  <Text size="sm">💡</Text>
                </ThemeIcon>
                <Text size="sm" c="dimmed" style={{ flex: 1 }}>
                  {t("onboarding.location.hint")}
                </Text>
              </Group>
            </Paper>

            {/* Summary */}
            <Paper p="md" radius="md" style={{ background: cardBg }}>
              <Stack gap="xs">
                <Text size="sm" fw={600}>
                  {t("onboarding.summary.title")}
                </Text>
                <Group>
                  <Text size="sm" c="dimmed" w={100}>
                    {t("onboarding.summary.profession")}:
                  </Text>
                  <Text size="sm" fw={500}>
                    {profession
                      ? t(`onboarding.professions.${profession}`)
                      : "-"}
                  </Text>
                </Group>
                <Group>
                  <Text size="sm" c="dimmed" w={100}>
                    {t("onboarding.summary.experience")}:
                  </Text>
                  <Text size="sm" fw={500}>
                    {experienceLevel
                      ? t(`onboarding.experience.${experienceLevel}`)
                      : "-"}
                  </Text>
                </Group>
                <Group>
                  <Text size="sm" c="dimmed" w={100}>
                    {t("onboarding.summary.location")}:
                  </Text>
                  <Text size="sm" fw={500}>
                    {preferredLocation || "-"}
                  </Text>
                </Group>
              </Stack>
            </Paper>
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleSkip}
      title={t("onboarding.title")}
      size="lg"
      fullScreen={isMobile}
      closeOnClickOutside={false}
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
      <Stack gap="lg">
        {/* Progress bar */}
        <Box>
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed">
              {t("onboarding.step", { current: step + 1, total: totalSteps })}
            </Text>
            <Text size="xs" c="dimmed">
              {Math.round(progress)}%
            </Text>
          </Group>
          <Progress value={progress} color="cyan" size="sm" radius="xl" />
        </Box>

        {/* Step content */}
        {renderStep()}

        {/* Navigation buttons */}
        <Group justify="space-between" mt="md">
          <Button variant="subtle" onClick={handleSkip} disabled={isSubmitting}>
            {t("onboarding.skip")}
          </Button>
          <Group gap="sm">
            {step > 0 && (
              <Button
                variant="light"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                {t("onboarding.back")}
              </Button>
            )}
            {step < totalSteps - 1 ? (
              <Button
                onClick={handleNext}
                variant="gradient"
                gradient={{ from: "cyan", to: "teal", deg: 135 }}
              >
                {t("onboarding.next")}
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                loading={isSubmitting}
                variant="gradient"
                gradient={{ from: "cyan", to: "teal", deg: 135 }}
              >
                {t("onboarding.complete")}
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
