import { Text, Stack, Group, Badge, Box, useMantineColorScheme } from '@mantine/core';
import { Droppable } from '@hello-pangea/dnd';
import { useTranslation } from 'react-i18next';
import type { JobApplication, Stage } from '../types/job';
import { JobCard } from './JobCard';

interface KanbanColumnProps {
  stage: Stage;
  jobs: JobApplication[];
  onEditJob: (job: JobApplication) => void;
  onDeleteJob: (job: JobApplication) => void;
}

const stageColors: Record<Stage, string> = {
  wishlist: 'gray',
  applied: 'blue',
  phone_screen: 'violet',
  interview: 'orange',
  offer: 'green',
  rejected: 'red',
};

export function KanbanColumn({ stage, jobs, onEditJob, onDeleteJob }: KanbanColumnProps) {
  const { t } = useTranslation();
  const { colorScheme } = useMantineColorScheme();

  const columnBg = colorScheme === 'dark'
    ? 'linear-gradient(180deg, rgba(25, 25, 35, 0.95) 0%, rgba(15, 15, 25, 0.98) 100%)'
    : 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.98) 100%)';

  const borderColor = colorScheme === 'dark'
    ? 'rgba(255, 255, 255, 0.06)'
    : 'rgba(0, 0, 0, 0.08)';

  const emptyBorderColor = colorScheme === 'dark'
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.1)';

  return (
    <Box
      style={{
        width: 300,
        minWidth: 300,
        maxHeight: 'calc(100vh - 160px)',
        display: 'flex',
        flexDirection: 'column',
        background: columnBg,
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        padding: 16,
      }}
    >
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <Text fw={600} size="sm">
            {t(`stages.${stage}`)}
          </Text>
          <Badge size="sm" variant="light" color={stageColors[stage]}>
            {jobs.length}
          </Badge>
        </Group>
      </Group>

      <Droppable droppableId={stage} type="JOB">
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: 4,
              borderRadius: 8,
              transition: 'background-color 0.2s ease',
              backgroundColor: snapshot.isDraggingOver
                ? 'rgba(0, 212, 236, 0.08)'
                : 'transparent',
            }}
          >
            {jobs.length === 0 ? (
              <Stack
                align="center"
                justify="center"
                style={{
                  height: 120,
                  border: `2px dashed ${emptyBorderColor}`,
                  borderRadius: 8,
                  opacity: snapshot.isDraggingOver ? 1 : 0.5,
                }}
              >
                <Text size="xs" c="dimmed">
                  {snapshot.isDraggingOver ? t('empty.dropHere') : t('empty.noJobs')}
                </Text>
              </Stack>
            ) : (
              jobs.map((job, index) => (
                <JobCard
                  key={job.id}
                  job={job}
                  index={index}
                  onEdit={onEditJob}
                  onDelete={onDeleteJob}
                />
              ))
            )}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </Box>
  );
}
