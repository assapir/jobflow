import { Group, Box, Accordion, useMantineColorScheme } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import type { JobApplication, Stage } from "../types/job";
import { STAGES } from "../types/job";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanAccordionItem } from "./KanbanAccordionItem";

interface KanbanBoardProps {
  jobs: JobApplication[];
  getJobsByStage: (stage: Stage) => JobApplication[];
  onMoveJob: (jobId: string, newStage: Stage, newOrder: number) => void;
  onReorderJobs: (
    updates: Array<{ id: string; stage: Stage; order: number }>
  ) => void;
  onEditJob: (job: JobApplication) => void;
  onDeleteJob: (job: JobApplication) => void;
}

export function KanbanBoard({
  getJobsByStage,
  onMoveJob,
  onReorderJobs,
  onEditJob,
  onDeleteJob,
}: KanbanBoardProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { colorScheme } = useMantineColorScheme();

  const handleDragStart = () => {
    document.body.classList.add("is-dragging");
  };

  const handleDragEnd = (result: DropResult) => {
    document.body.classList.remove("is-dragging");
    const { destination, source, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStage = source.droppableId as Stage;
    const destStage = destination.droppableId as Stage;

    if (sourceStage === destStage) {
      // Reordering within the same column
      const columnJobs = getJobsByStage(sourceStage);
      const newJobs = Array.from(columnJobs);
      const [movedJob] = newJobs.splice(source.index, 1);
      if (!movedJob) return;
      newJobs.splice(destination.index, 0, movedJob);

      const updates = newJobs.map((job, index) => ({
        id: job.id,
        stage: sourceStage,
        order: index,
      }));

      onReorderJobs(updates);
    } else {
      // Moving to a different column
      const sourceJobs = getJobsByStage(sourceStage);
      const destJobs = getJobsByStage(destStage);

      const newSourceJobs = Array.from(sourceJobs);
      const [movedJob] = newSourceJobs.splice(source.index, 1);
      if (!movedJob) return;

      const newDestJobs = Array.from(destJobs);
      newDestJobs.splice(destination.index, 0, {
        ...movedJob,
        stage: destStage,
      });

      const updates = [
        ...newSourceJobs.map((job, index) => ({
          id: job.id,
          stage: sourceStage,
          order: index,
        })),
        ...newDestJobs.map((job, index) => ({
          id: job.id,
          stage: destStage,
          order: index,
        })),
      ];

      // Optimistic update for the moved job
      onMoveJob(draggableId, destStage, destination.index);
      onReorderJobs(updates);
    }
  };

  const accordionBg =
    colorScheme === "dark"
      ? "linear-gradient(180deg, rgba(25, 25, 35, 0.95) 0%, rgba(15, 15, 25, 0.98) 100%)"
      : "linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.98) 100%)";

  const borderColor =
    colorScheme === "dark"
      ? "rgba(255, 255, 255, 0.06)"
      : "rgba(0, 0, 0, 0.08)";

  if (isMobile) {
    return (
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Accordion
          multiple
          defaultValue={["wishlist", "applied"]}
          styles={{
            root: {
              background: accordionBg,
              borderRadius: 12,
              border: `1px solid ${borderColor}`,
            },
            item: {
              borderColor: borderColor,
            },
            control: {
              padding: "12px 16px",
            },
            panel: {
              padding: "0 8px 8px",
            },
          }}
        >
          {STAGES.map((stage) => (
            <KanbanAccordionItem
              key={stage}
              stage={stage}
              jobs={getJobsByStage(stage)}
              onEditJob={onEditJob}
              onDeleteJob={onDeleteJob}
            />
          ))}
        </Accordion>
      </DragDropContext>
    );
  }

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Box
        style={{
          overflowX: "auto",
          paddingBottom: 16,
        }}
      >
        <Group gap="md" align="flex-start" wrap="nowrap">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              jobs={getJobsByStage(stage)}
              onEditJob={onEditJob}
              onDeleteJob={onDeleteJob}
            />
          ))}
        </Group>
      </Box>
    </DragDropContext>
  );
}
