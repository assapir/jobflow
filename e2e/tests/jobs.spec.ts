import { test, expect } from "../fixtures/auth";
import { uniqueJobData } from "../fixtures/test-data";

test.describe("Job Management", () => {
  // Authentication is handled by the auth fixture

  test.describe("Add Job", () => {
    test("should add a new job with all fields", async ({ page }) => {
      const jobData = uniqueJobData();

      // Click the Add Job button
      await page.getByRole("button", { name: /add job/i }).click();

      // Wait for modal to open
      await expect(page.getByRole("dialog")).toBeVisible();

      // Fill in the form
      await page
        .getByPlaceholder("Google, Microsoft, etc.")
        .fill(jobData.company);
      await page.getByPlaceholder("Software Engineer").fill(jobData.position);
      await page.getByPlaceholder("San Francisco, CA").fill(jobData.location!);
      await page.getByPlaceholder("$150,000 - $200,000").fill(jobData.salary!);
      await page
        .getByPlaceholder("https://linkedin.com/jobs/...")
        .fill(jobData.linkedinUrl!);

      // Submit the form
      await page.getByRole("button", { name: /save/i }).click();

      // Wait for modal to close
      await expect(page.getByRole("dialog")).not.toBeVisible();

      // Verify the job card appears
      await expect(page.getByText(jobData.company)).toBeVisible();
      await expect(page.getByText(jobData.position)).toBeVisible();
    });

    test("should add a job with only required fields", async ({ page }) => {
      const jobData = uniqueJobData();

      await page.getByRole("button", { name: /add job/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page
        .getByPlaceholder("Google, Microsoft, etc.")
        .fill(jobData.company);
      await page.getByPlaceholder("Software Engineer").fill(jobData.position);

      await page.getByRole("button", { name: /save/i }).click();

      await expect(page.getByRole("dialog")).not.toBeVisible();
      await expect(page.getByText(jobData.company)).toBeVisible();
    });

    test("should prevent submission with empty required fields", async ({
      page,
    }) => {
      await page.getByRole("button", { name: /add job/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      // Only fill position, leave company empty
      await page.getByPlaceholder("Software Engineer").fill("Developer");

      // Try to submit - browser validation should prevent it
      await page.getByRole("button", { name: /save/i }).click();

      // Modal should still be open (form wasn't submitted due to validation)
      await expect(page.getByRole("dialog")).toBeVisible();
    });

    test("should show validation error for invalid LinkedIn URL", async ({
      page,
    }) => {
      await page.getByRole("button", { name: /add job/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.getByPlaceholder("Google, Microsoft, etc.").fill("Test Corp");
      await page.getByPlaceholder("Software Engineer").fill("Developer");
      await page
        .getByPlaceholder("https://linkedin.com/jobs/...")
        .fill("invalid-url");

      await page.getByRole("button", { name: /save/i }).click();

      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText("Invalid URL")).toBeVisible();
    });

    test("should close modal when cancel is clicked", async ({ page }) => {
      await page.getByRole("button", { name: /add job/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.getByRole("button", { name: /cancel/i }).click();

      await expect(page.getByRole("dialog")).not.toBeVisible();
    });
  });

  test.describe("Edit Job", () => {
    test("should edit an existing job", async ({ page }) => {
      // First, create a job with unique position
      const originalData = uniqueJobData();

      await page.getByRole("button", { name: /add job/i }).click();
      await page
        .getByPlaceholder("Google, Microsoft, etc.")
        .fill(originalData.company);
      await page
        .getByPlaceholder("Software Engineer")
        .fill(originalData.position);
      await page.getByRole("button", { name: /save/i }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible();

      // Wait for job to appear and click on it to edit
      await page.getByText(originalData.position).click();

      // Wait for edit modal
      await expect(page.getByRole("dialog")).toBeVisible();

      // Update the company name
      const updatedCompany = `Updated Corp ${Date.now()}`;
      await page
        .getByPlaceholder("Google, Microsoft, etc.")
        .fill(updatedCompany);

      await page.getByRole("button", { name: /save/i }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible();

      // Verify the update
      await expect(page.getByText(updatedCompany)).toBeVisible();
    });

    test("should populate form with existing job data", async ({ page }) => {
      // Create a job with specific data
      const jobData = uniqueJobData({
        location: "Test City",
        salary: "$123,456",
      });

      await page.getByRole("button", { name: /add job/i }).click();
      await page
        .getByPlaceholder("Google, Microsoft, etc.")
        .fill(jobData.company);
      await page.getByPlaceholder("Software Engineer").fill(jobData.position);
      await page.getByPlaceholder("San Francisco, CA").fill(jobData.location!);
      await page.getByPlaceholder("$150,000 - $200,000").fill(jobData.salary!);
      await page.getByRole("button", { name: /save/i }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible();

      // Click to edit
      await page.getByText(jobData.position).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      // Verify form is populated
      await expect(
        page.getByPlaceholder("Google, Microsoft, etc.")
      ).toHaveValue(jobData.company);
      await expect(page.getByPlaceholder("Software Engineer")).toHaveValue(
        jobData.position
      );
      await expect(page.getByPlaceholder("San Francisco, CA")).toHaveValue(
        jobData.location!
      );
      await expect(page.getByPlaceholder("$150,000 - $200,000")).toHaveValue(
        jobData.salary!
      );
    });
  });
});
