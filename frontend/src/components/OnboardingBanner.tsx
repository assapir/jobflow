import {
  Paper,
  Group,
  Text,
  Button,
  CloseButton,
  useMantineColorScheme,
} from "@mantine/core";
import { useTranslation } from "react-i18next";

interface OnboardingBannerProps {
  onComplete: () => void;
  onDismiss: () => void;
}

export function OnboardingBanner({ onComplete, onDismiss }: OnboardingBannerProps) {
  const { t } = useTranslation();
  const { colorScheme } = useMantineColorScheme();

  const bannerBg =
    colorScheme === "dark"
      ? "linear-gradient(135deg, rgba(0, 180, 200, 0.15) 0%, rgba(0, 140, 160, 0.1) 100%)"
      : "linear-gradient(135deg, rgba(0, 212, 236, 0.1) 0%, rgba(0, 180, 200, 0.05) 100%)";

  const borderColor =
    colorScheme === "dark"
      ? "rgba(0, 212, 236, 0.3)"
      : "rgba(0, 180, 200, 0.3)";

  return (
    <Paper
      p="md"
      radius="md"
      mb="md"
      style={{
        background: bannerBg,
        border: `1px solid ${borderColor}`,
      }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="md" style={{ flex: 1 }}>
          <Text size="lg">👋</Text>
          <div>
            <Text size="sm" fw={500}>
              {t("onboarding.banner.title")}
            </Text>
            <Text size="xs" c="dimmed">
              {t("onboarding.banner.subtitle")}
            </Text>
          </div>
        </Group>
        <Group gap="xs" wrap="nowrap">
          <Button
            size="xs"
            variant="gradient"
            gradient={{ from: "cyan", to: "teal", deg: 135 }}
            onClick={onComplete}
          >
            {t("onboarding.banner.action")}
          </Button>
          <CloseButton size="sm" onClick={onDismiss} />
        </Group>
      </Group>
    </Paper>
  );
}

