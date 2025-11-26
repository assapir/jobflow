import { Group, Title, Button, ActionIcon, useMantineColorScheme, Menu, Text, Box, Tooltip } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  onAddJob: () => void;
}

export function Header({ onAddJob }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const headerBg = colorScheme === 'dark'
    ? 'linear-gradient(180deg, rgba(20, 20, 30, 0.98) 0%, rgba(15, 15, 25, 0.95) 100%)'
    : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 249, 250, 0.95) 100%)';

  const borderColor = colorScheme === 'dark'
    ? 'rgba(255, 255, 255, 0.06)'
    : 'rgba(0, 0, 0, 0.08)';

  return (
    <Box
      component="header"
      style={{
        padding: '16px 24px',
        background: headerBg,
        borderBottom: `1px solid ${borderColor}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
      }}
    >
      <Group justify="space-between">
        <Group gap="md">
          <Title
            order={1}
            size="h3"
            style={{
              background: 'linear-gradient(135deg, #00d4ec 0%, #00a8bc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
            }}
          >
            {t('app.title')}
          </Title>
          <Text size="sm" c="dimmed" visibleFrom="sm">
            {t('app.subtitle')}
          </Text>
        </Group>

        <Group gap="sm">
          {isMobile ? (
            <Tooltip label={t('actions.add')}>
              <ActionIcon
                onClick={onAddJob}
                variant="gradient"
                gradient={{ from: 'cyan', to: 'teal', deg: 135 }}
                size="lg"
                aria-label={t('actions.add')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </ActionIcon>
            </Tooltip>
          ) : (
            <Button
              onClick={onAddJob}
              variant="gradient"
              gradient={{ from: 'cyan', to: 'teal', deg: 135 }}
              leftSection={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              }
            >
              {t('actions.add')}
            </Button>
          )}

          <Menu shadow="md" width={140} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg" color="gray" aria-label={t('language.toggle')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => changeLanguage('en')}>
                🇺🇸 {t('language.en')}
              </Menu.Item>
              <Menu.Item onClick={() => changeLanguage('he')}>
                🇮🇱 {t('language.he')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <ActionIcon
            variant="subtle"
            size="lg"
            color="gray"
            onClick={() => toggleColorScheme()}
            aria-label={t('theme.toggle')}
          >
            {colorScheme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </ActionIcon>
        </Group>
      </Group>
    </Box>
  );
}
