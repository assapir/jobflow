import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../test/test-utils";
import { JobFormModal } from "./JobFormModal";
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

describe("JobFormModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  it("should render modal when opened", () => {
    render(
      <JobFormModal
        opened={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        job={null}
      />
    );

    expect(screen.getByText("actions.add")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Google, Microsoft, etc.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Software Engineer")).toBeInTheDocument();
  });

  it("should not render modal when closed", () => {
    render(
      <JobFormModal
        opened={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        job={null}
      />
    );

    expect(screen.queryByPlaceholderText("Google, Microsoft, etc.")).not.toBeInTheDocument();
  });

  it("should show edit title when job is provided", () => {
    render(
      <JobFormModal
        opened={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        job={mockJob}
      />
    );

    expect(screen.getByText("actions.edit")).toBeInTheDocument();
  });

  it("should populate form fields when editing a job", () => {
    render(
      <JobFormModal
        opened={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        job={mockJob}
      />
    );

    expect(screen.getByDisplayValue("Test Company")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Software Engineer")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Remote")).toBeInTheDocument();
    expect(screen.getByDisplayValue("$150,000")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://linkedin.com/jobs/123")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test description")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Some notes")).toBeInTheDocument();
  });

  it("should show validation error for empty company", async () => {
    const user = userEvent.setup();

    render(
      <JobFormModal
        opened={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        job={null}
      />
    );

    // Fill position but leave company empty
    const positionInput = screen.getByPlaceholderText("Software Engineer");
    await user.type(positionInput, "Developer");

    // Submit form
    const submitButton = screen.getByText("actions.save");
    await user.click(submitButton);

    // Form should not submit when company is empty
    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    // Modal should still be open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should show validation error for empty position", async () => {
    const user = userEvent.setup();

    render(
      <JobFormModal
        opened={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        job={null}
      />
    );

    // Fill company but leave position empty
    const companyInput = screen.getByPlaceholderText("Google, Microsoft, etc.");
    await user.type(companyInput, "Test Corp");

    // Submit form
    const submitButton = screen.getByText("actions.save");
    await user.click(submitButton);

    // Form should not submit when position is empty
    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    // Modal should still be open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should show validation error for invalid LinkedIn URL", async () => {
    const user = userEvent.setup();

    render(
      <JobFormModal
        opened={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        job={null}
      />
    );

    // Fill required fields
    const companyInput = screen.getByPlaceholderText("Google, Microsoft, etc.");
    const positionInput = screen.getByPlaceholderText("Software Engineer");
    const linkedinInput = screen.getByPlaceholderText("https://linkedin.com/jobs/...");

    await user.type(companyInput, "Test Corp");
    await user.type(positionInput, "Developer");
    await user.type(linkedinInput, "not-a-valid-url");

    // Submit form
    const submitButton = screen.getByText("actions.save");
    await user.click(submitButton);

    // Check validation error appears
    await waitFor(() => {
      expect(screen.getByText("Invalid URL")).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("should call onSubmit with form data when valid", async () => {
    const user = userEvent.setup();

    render(
      <JobFormModal
        opened={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        job={null}
      />
    );

    const companyInput = screen.getByPlaceholderText("Google, Microsoft, etc.");
    const positionInput = screen.getByPlaceholderText("Software Engineer");

    await user.type(companyInput, "New Company");
    await user.type(positionInput, "New Position");

    const submitButton = screen.getByText("actions.save");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          company: "New Company",
          position: "New Position",
          stage: "wishlist",
        })
      );
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should call onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <JobFormModal
        opened={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        job={null}
      />
    );

    const cancelButton = screen.getByText("actions.cancel");
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("should accept valid LinkedIn URL", async () => {
    const user = userEvent.setup();

    render(
      <JobFormModal
        opened={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        job={null}
      />
    );

    const companyInput = screen.getByPlaceholderText("Google, Microsoft, etc.");
    const positionInput = screen.getByPlaceholderText("Software Engineer");
    const linkedinInput = screen.getByPlaceholderText("https://linkedin.com/jobs/...");

    await user.type(companyInput, "Test Corp");
    await user.type(positionInput, "Developer");
    await user.type(linkedinInput, "https://linkedin.com/jobs/12345");

    const submitButton = screen.getByText("actions.save");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          linkedinUrl: "https://linkedin.com/jobs/12345",
        })
      );
    });
  });
});
