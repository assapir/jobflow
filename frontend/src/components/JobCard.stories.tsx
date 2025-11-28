import type { Meta, StoryObj } from "@storybook/react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { JobCard } from "./JobCard";
import type { JobApplication } from "../types/job";

const meta = {
  title: "Components/JobCard",
  component: JobCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <DragDropContext onDragEnd={() => {}}>
        <Droppable droppableId="test">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ width: 280 }}
            >
              <Story />
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    ),
  ],
} satisfies Meta<typeof JobCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseJob: JobApplication = {
  id: "1",
  company: "Google",
  position: "Senior Software Engineer",
  stage: "applied",
  location: null,
  salary: null,
  linkedinUrl: null,
  description: null,
  order: 0,
  notes: null,
  appliedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const Default: Story = {
  args: {
    job: baseJob,
    index: 0,
    onEdit: () => console.log("Edit clicked"),
    onDelete: () => console.log("Delete clicked"),
  },
};

export const WithLocation: Story = {
  args: {
    job: {
      ...baseJob,
      location: "Mountain View, CA",
    },
    index: 0,
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const WithSalary: Story = {
  args: {
    job: {
      ...baseJob,
      salary: "$180,000 - $250,000",
    },
    index: 0,
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const WithAllDetails: Story = {
  args: {
    job: {
      ...baseJob,
      location: "San Francisco, CA",
      salary: "$200,000 - $300,000",
      linkedinUrl: "https://linkedin.com/jobs/12345",
      description: "Build amazing products",
      notes: "Great team culture",
    },
    index: 0,
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const LongTitle: Story = {
  args: {
    job: {
      ...baseJob,
      position: "Principal Staff Software Engineer - Platform Infrastructure",
      company: "Meta Platforms Inc.",
    },
    index: 0,
    onEdit: () => {},
    onDelete: () => {},
  },
};
