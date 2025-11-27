import { Box, Text, Group, useMantineColorScheme } from "@mantine/core";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  const { colorScheme } = useMantineColorScheme();
  const currentYear = new Date().getFullYear();

  const footerBg =
    colorScheme === "dark"
      ? "linear-gradient(180deg, rgba(15, 15, 25, 0.95) 0%, rgba(20, 20, 30, 0.98) 100%)"
      : "linear-gradient(180deg, rgba(248, 249, 250, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)";

  const borderColor =
    colorScheme === "dark"
      ? "rgba(255, 255, 255, 0.06)"
      : "rgba(0, 0, 0, 0.08)";

  return (
    <Box
      component="footer"
      style={{
        padding: "20px 24px",
        background: footerBg,
        borderTop: `1px solid ${borderColor}`,
        backdropFilter: "blur(20px)",
        marginTop: "auto",
      }}
    >
      <Group justify="center" gap="xs">
        <Text
          size="sm"
          style={{
            background: "linear-gradient(135deg, #00d4ec 0%, #00a8bc 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 600,
          }}
        >
          {t("app.title")}
        </Text>
        <Text size="sm" c="dimmed">
          — {t("app.tagline")}
        </Text>
      </Group>
      <Text size="xs" c="dimmed" ta="center" mt={4}>
        © {currentYear} {t("app.title")}. All rights reserved.
      </Text>
    </Box>
  );
}
