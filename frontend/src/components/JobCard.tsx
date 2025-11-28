import {
  Text,
  Group,
  Badge,
  ActionIcon,
  Menu,
  Stack,
  Tooltip,
  Box,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IconDotsVertical } from "@tabler/icons-react";
import type { JobApplication } from "../types/job";
import { Draggable } from "@hello-pangea/dnd";
import { useThemeColors } from "../design-system";
import type { CSSProperties } from "react";

interface JobCardProps {
  job: JobApplication;
  index: number;
  onEdit: (job: JobApplication) => void;
  onDelete: (job: JobApplication) => void;
}

export function JobCard({ job, index, onEdit, onDelete }: JobCardProps) {
  const { t } = useTranslation();
  const {
    cardBg,
    borderColor,
    cardShadow,
    dragHighlightBg,
    dragBorder,
    dragShadow,
  } = useThemeColors();

  const getStyle = (
    isDragging: boolean,
    draggableStyle: CSSProperties | undefined
  ): CSSProperties => {
    return {
      userSelect: "none",
      marginBottom: 12,
      padding: 12,
      borderRadius: 8,
      cursor: isDragging ? "grabbing" : "pointer",
      background: isDragging ? dragHighlightBg : cardBg,
      border: isDragging ? dragBorder : `1px solid ${borderColor}`,
      boxShadow: isDragging ? dragShadow : cardShadow,
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
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    color="gray"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconDotsVertical size={16} stroke={2} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item onClick={() => onEdit(job)}>
                    {t("actions.edit")}
                  </Menu.Item>
                  <Menu.Item
                    color="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(job);
                    }}
                  >
                    {t("actions.delete")}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>

            <Text c="dimmed" size="xs" fw={500}>
              {job.company}
            </Text>

            <Group gap="xs">
              {job.location && (
                <Tooltip label={t("job.location")}>
                  <Badge size="xs" variant="light" color="gray">
                    📍 {job.location}
                  </Badge>
                </Tooltip>
              )}
              {job.salary && (
                <Tooltip label={t("job.salary")}>
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
