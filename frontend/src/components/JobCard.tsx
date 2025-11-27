import { Text, Group, Badge, ActionIcon, Menu, Stack, Tooltip, Box, useMantineColorScheme } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { JobApplication } from '../types/job';
import { Draggable } from '@hello-pangea/dnd';
import type { CSSProperties } from 'react';

interface JobCardProps {
  job: JobApplication;
  index: number;
  onEdit: (job: JobApplication) => void;
  onDelete: (job: JobApplication) => void;
}

export function JobCard({ job, index, onEdit, onDelete }: JobCardProps) {
  const { t } = useTranslation();
  const { colorScheme } = useMantineColorScheme();

  const getStyle = (isDragging: boolean, draggableStyle: CSSProperties | undefined): CSSProperties => {
    const cardBg = colorScheme === 'dark'
      ? 'linear-gradient(135deg, rgba(30, 30, 40, 0.9) 0%, rgba(20, 20, 30, 0.95) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.98) 100%)';

    const cardBorder = colorScheme === 'dark'
      ? '1px solid rgba(255, 255, 255, 0.08)'
      : '1px solid rgba(0, 0, 0, 0.08)';

    const cardShadow = colorScheme === 'dark'
      ? '0 4px 16px rgba(0, 0, 0, 0.2)'
      : '0 2px 8px rgba(0, 0, 0, 0.08)';

    return {
      userSelect: 'none',
      marginBottom: 12,
      padding: 12,
      borderRadius: 8,
      cursor: isDragging ? 'grabbing' : 'pointer',
      background: isDragging
        ? 'linear-gradient(135deg, rgba(0, 212, 236, 0.25) 0%, rgba(0, 168, 188, 0.25) 100%)'
        : cardBg,
      border: isDragging
        ? '2px solid rgba(0, 212, 236, 0.7)'
        : cardBorder,
      boxShadow: isDragging
        ? '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px rgba(0, 212, 236, 0.4)'
        : cardShadow,
      ...draggableStyle,
    };
  };

  return (
    <Draggable draggableId={job.id} index={index}>
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={getStyle(snapshot.isDragging, provided.draggableProps.style)}
          onClick={() => onEdit(job)}
        >
          <Stack gap="xs">
            <Group justify="space-between" align="flex-start">
              <Text fw={600} size="sm" lineClamp={1} style={{ flex: 1 }}>
                {job.position}
              </Text>
              <Menu shadow="md" width={120} position="bottom-end">
                <Menu.Target>
                  <ActionIcon variant="subtle" size="sm" color="gray" onClick={(e) => e.stopPropagation()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item onClick={() => onEdit(job)}>
                    {t('actions.edit')}
                  </Menu.Item>
                  <Menu.Item color="red" onClick={() => onDelete(job)}>
                    {t('actions.delete')}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>

            <Text c="dimmed" size="xs" fw={500}>
              {job.company}
            </Text>

            <Group gap="xs">
              {job.location && (
                <Tooltip label={t('job.location')}>
                  <Badge size="xs" variant="light" color="gray">
                    📍 {job.location}
                  </Badge>
                </Tooltip>
              )}
              {job.salary && (
                <Tooltip label={t('job.salary')}>
                  <Badge size="xs" variant="light" color="green">
                    💰 {job.salary}
                  </Badge>
                </Tooltip>
              )}
            </Group>

            {job.linkedinUrl && (
              <Text
                component="a"
                href={job.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="xs"
                c="cyan"
                td="underline"
                onClick={(e) => e.stopPropagation()}
              >
                LinkedIn →
              </Text>
            )}
          </Stack>
        </Box>
      )}
    </Draggable>
  );
}
