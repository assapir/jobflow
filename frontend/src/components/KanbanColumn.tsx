import { Text, Stack, Group, Badge, Box } from "@mantine/core";
import { Droppable } from "@hello-pangea/dnd";
import { useTranslation } from "react-i18next";
import type { JobApplication, Stage } from "../types/job";
import { JobCard } from "./JobCard";
import { useThemeColors, stageColors } from "../design-system";

interface KanbanColumnProps {
  stage: Stage;
  jobs: JobApplication[];
  onEditJob: (job: JobApplication) => void;
  onDeleteJob: (job: JobApplication) => void;
}

export function KanbanColumn({
  stage,
  jobs,
  onEditJob,
  onDeleteJob,
}: KanbanColumnProps) {
  const { t } = useTranslation();
  const { surfaceBg, borderColor, emptyBorderColor, dragOverBg } =
    useThemeColors();

  return (
    <Box
      style={{
        width: 300,
        minWidth: 300,
        maxHeight: "calc(100vh - 160px)",
        display: "flex",
        flexDirection: "column",
        background: surfaceBg,
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
              overflowY: "auto",
              overflowX: "hidden",
              padding: 4,
              borderRadius: 8,
              transition: "background-color 0.2s ease",
              backgroundColor: snapshot.isDraggingOver
                ? dragOverBg
                : "transparent",
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
                  {snapshot.isDraggingOver
                    ? t("empty.dropHere")
                    : t("empty.noJobs")}
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
