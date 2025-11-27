import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithDnd } from "../test/test-utils";
import { JobCard } from "./JobCard";
import type { JobApplication } from "../types/job";

const mockJob: JobApplication = {
  id: "test-job-1",
  company: "Test Company",
  position: "Software Engineer",
  location: "Remote",
  salary: "$150,000",
  linkedinUrl: "https://linkedin.com/jobs/123",
  description: "Test description",
  stage: "applied",
  order: 0,
  notes: "Some notes",
  appliedAt: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

// Mock Droppable context for Draggable
vi.mock("@hello-pangea/dnd", async () => {
  const actual = await vi.importActual("@hello-pangea/dnd");
  return {
    ...actual,
    Draggable: ({
      children,
    }: {
      children: (
        provided: {
          innerRef: React.Ref<HTMLElement>;
          draggableProps: Record<string, unknown>;
          dragHandleProps: Record<string, unknown>;
        },
        snapshot: { isDragging: boolean }
      ) => React.ReactNode;
    }) =>
      children(
        {
          innerRef: () => {},
          draggableProps: { style: {} },
          dragHandleProps: {},
        },
        { isDragging: false }
      ),
    DragDropContext: ({ children }: { children: React.ReactNode }) => children,
    Droppable: ({
      children,
    }: {
      children: (provided: {
        innerRef: React.Ref<HTMLElement>;
        droppableProps: Record<string, unknown>;
        placeholder: React.ReactNode;
      }) => React.ReactNode;
    }) =>
      children({
        innerRef: () => {},
        droppableProps: {},
        placeholder: null,
      }),
  };
});

describe("JobCard", () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render job position and company", () => {
    renderWithDnd(
      <JobCard
        job={mockJob}
        index={0}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("Test Company")).toBeInTheDocument();
  });

  it("should render location badge when location is provided", () => {
    renderWithDnd(
      <JobCard
        job={mockJob}
        index={0}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/Remote/)).toBeInTheDocument();
  });

  it("should render salary badge when salary is provided", () => {
    renderWithDnd(
      <JobCard
        job={mockJob}
        index={0}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/\$150,000/)).toBeInTheDocument();
  });

  it("should render LinkedIn link when URL is provided", () => {
    renderWithDnd(
      <JobCard
        job={mockJob}
        index={0}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const linkedInLink = screen.getByText("LinkedIn →");
    expect(linkedInLink).toBeInTheDocument();
    expect(linkedInLink).toHaveAttribute(
      "href",
      "https://linkedin.com/jobs/123"
    );
    expect(linkedInLink).toHaveAttribute("target", "_blank");
  });

  it("should not render location badge when location is null", () => {
    const jobWithoutLocation = { ...mockJob, location: null };

    renderWithDnd(
      <JobCard
        job={jobWithoutLocation}
        index={0}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText(/📍/)).not.toBeInTheDocument();
  });

  it("should not render salary badge when salary is null", () => {
    const jobWithoutSalary = { ...mockJob, salary: null };

    renderWithDnd(
      <JobCard
        job={jobWithoutSalary}
        index={0}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText(/💰/)).not.toBeInTheDocument();
  });

  it("should not render LinkedIn link when URL is null", () => {
    const jobWithoutLinkedIn = { ...mockJob, linkedinUrl: null };

    renderWithDnd(
      <JobCard
        job={jobWithoutLinkedIn}
        index={0}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText("LinkedIn →")).not.toBeInTheDocument();
  });

  it("should call onEdit when card is clicked", () => {
    renderWithDnd(
      <JobCard
        job={mockJob}
        index={0}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const card = screen.getByText("Software Engineer").closest("div");
    fireEvent.click(card!);

    expect(mockOnEdit).toHaveBeenCalledWith(mockJob);
  });

  it("should render menu button", () => {
    renderWithDnd(
      <JobCard
        job={mockJob}
        index={0}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Menu button should be present (it's an ActionIcon with SVG)
    const menuButton = screen.getByRole("button");
    expect(menuButton).toBeInTheDocument();
  });
});
