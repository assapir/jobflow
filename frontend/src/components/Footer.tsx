import { Box, Text, Group } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../design-system";

export function Footer() {
  const { t } = useTranslation();
  const { footerBg, borderColor, brandTextGradient } = useThemeColors();
  const currentYear = new Date().getFullYear();

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
            background: brandTextGradient,
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
