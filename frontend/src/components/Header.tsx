import {
  Group,
  Title,
  Button,
  ActionIcon,
  Menu,
  Text,
  Box,
  Tooltip,
  Avatar,
  useMantineColorScheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import {
  IconPlus,
  IconSun,
  IconMoon,
  IconWorld,
  IconBrandLinkedin,
  IconLogout,
} from "@tabler/icons-react";
import { useAuth } from "../context/AuthContext";
import { useThemeColors, GradientButton } from "../design-system";
import type { User } from "../types/user";

interface HeaderProps {
  onAddJob: () => void;
  onSearchLinkedIn: () => void;
  user?: User | null;
}

export function Header({ onAddJob, onSearchLinkedIn, user }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { headerBg, borderColor, brandTextGradient, isDark } = useThemeColors();
  const { toggleColorScheme } = useMantineColorScheme();
  const { logout } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box
      component="header"
      style={{
        padding: "16px 24px",
        background: headerBg,
        borderBottom: `1px solid ${borderColor}`,
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(20px)",
      }}
    >
      <Group justify="space-between">
        <Group gap="md">
          <Title
            order={1}
            size="h3"
            style={{
              background: brandTextGradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.5px",
            }}
          >
            {t("app.title")}
          </Title>
          <Text size="sm" c="dimmed" visibleFrom="sm">
            {t("app.subtitle")}
          </Text>
        </Group>

        <Group gap="sm">
          {isMobile ? (
            <>
              <Tooltip label={t("actions.searchLinkedIn")}>
                <ActionIcon
                  onClick={onSearchLinkedIn}
                  variant="light"
                  color="blue"
                  size="lg"
                  aria-label={t("actions.searchLinkedIn")}
                >
                  <IconBrandLinkedin size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t("actions.add")}>
                <ActionIcon
                  onClick={onAddJob}
                  variant="gradient"
                  gradient={{ from: "cyan", to: "teal", deg: 135 }}
                  size="lg"
                  aria-label={t("actions.add")}
                >
                  <IconPlus size={18} stroke={2} />
                </ActionIcon>
              </Tooltip>
            </>
          ) : (
            <>
              <Button
                onClick={onSearchLinkedIn}
                variant="light"
                color="blue"
                leftSection={<IconBrandLinkedin size={16} />}
              >
                {t("actions.searchLinkedIn")}
              </Button>
              <GradientButton
                onClick={onAddJob}
                leftSection={<IconPlus size={16} stroke={2} />}
              >
                {t("actions.add")}
              </GradientButton>
            </>
          )}

          <Menu shadow="md" width={140} position="bottom-end">
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                size="lg"
                color="gray"
                aria-label={t("language.toggle")}
              >
                <IconWorld size={18} stroke={2} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => changeLanguage("en")}>
                🇺🇸 {t("language.en")}
              </Menu.Item>
              <Menu.Item onClick={() => changeLanguage("he")}>
                🇮🇱 {t("language.he")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <ActionIcon
            variant="subtle"
            size="lg"
            color="gray"
            onClick={() => toggleColorScheme()}
            aria-label={t("theme.toggle")}
          >
            {isDark ? (
              <IconSun size={18} stroke={2} />
            ) : (
              <IconMoon size={18} stroke={2} />
            )}
          </ActionIcon>

          {/* User Menu */}
          {user && (
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="subtle" size="lg" radius="xl">
                  <Avatar
                    src={user.profilePicture}
                    alt={user.name}
                    size="sm"
                    radius="xl"
                    color="cyan"
                  >
                    {getInitials(user.name)}
                  </Avatar>
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  <Text size="sm" fw={500}>
                    {user.name}
                  </Text>
                  {user.email && (
                    <Text size="xs" c="dimmed">
                      {user.email}
                    </Text>
                  )}
                </Menu.Label>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  onClick={logout}
                  leftSection={<IconLogout size={14} stroke={2} />}
                >
                  {t("auth.logout")}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Group>
    </Box>
  );
}
