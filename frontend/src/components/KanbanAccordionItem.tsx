import { Text, Stack, Group, Badge, Box, useMantineColorScheme, Accordion } from '@mantine/core';
import { Droppable } from '@hello-pangea/dnd';
import { useTranslation } from 'react-i18next';
import type { JobApplication, Stage } from '../types/job';
import { JobCard } from './JobCard';

interface KanbanAccordionItemProps {
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

export function KanbanAccordionItem({ stage, jobs, onEditJob, onDeleteJob }: KanbanAccordionItemProps) {
  const { t } = useTranslation();
  const { colorScheme } = useMantineColorScheme();

  const emptyBorderColor = colorScheme === 'dark'
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.1)';

  return (
    <Accordion.Item value={stage}>
      <Accordion.Control>
        <Group gap="xs">
          <Text fw={600} size="sm">
            {t(`stages.${stage}`)}
          </Text>
          <Badge size="sm" variant="light" color={stageColors[stage]}>
            {jobs.length}
          </Badge>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        <Droppable droppableId={stage} type="JOB">
          {(provided, snapshot) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                minHeight: 80,
                padding: 8,
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
                    height: 80,
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
      </Accordion.Panel>
    </Accordion.Item>
  );
}
