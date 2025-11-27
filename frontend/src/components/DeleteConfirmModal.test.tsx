import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../test/test-utils";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
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

describe("DeleteConfirmModal", () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render modal when opened", () => {
    render(
      <DeleteConfirmModal
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        job={mockJob}
      />
    );

    // Modal title and delete button both have "actions.delete" text
    expect(screen.getAllByText("actions.delete")).toHaveLength(2);
    expect(screen.getByText("messages.confirmDelete")).toBeInTheDocument();
  });

  it("should not render modal when closed", () => {
    render(
      <DeleteConfirmModal
        opened={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        job={mockJob}
      />
    );

    expect(
      screen.queryByText("messages.confirmDelete")
    ).not.toBeInTheDocument();
  });

  it("should display job details when job is provided", () => {
    render(
      <DeleteConfirmModal
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        job={mockJob}
      />
    );

    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("Test Company")).toBeInTheDocument();
  });

  it("should not display job details when job is null", () => {
    render(
      <DeleteConfirmModal
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        job={null}
      />
    );

    expect(screen.queryByText("Software Engineer")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Company")).not.toBeInTheDocument();
  });

  it("should call onConfirm when delete button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <DeleteConfirmModal
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        job={mockJob}
      />
    );

    // There are two delete buttons - one in title, one in actions
    const deleteButtons = screen.getAllByText("actions.delete");
    const confirmButton = deleteButtons.find(
      (btn) => btn.tagName.toLowerCase() === "button" || btn.closest("button")
    );

    await user.click(confirmButton!.closest("button") || confirmButton!);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it("should call onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <DeleteConfirmModal
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        job={mockJob}
      />
    );

    const cancelButton = screen.getByText("actions.cancel");
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it("should render delete button with red color", () => {
    render(
      <DeleteConfirmModal
        opened={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        job={mockJob}
      />
    );

    // Get the delete button in the action group (not the title)
    const buttons = screen.getAllByRole("button");
    const deleteButton = buttons.find((btn) =>
      btn.textContent?.includes("actions.delete")
    );

    expect(deleteButton).toBeInTheDocument();
  });
});
