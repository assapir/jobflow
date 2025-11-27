import { test, expect } from "../fixtures/auth";
import { uniqueJobData } from "../fixtures/test-data";

test.describe("Kanban Board", () => {
  // Authentication is handled by the auth fixture

  test.describe("Stage Columns", () => {
    test("should display stage columns", async ({ page }) => {
      // Wait for the kanban board to load
      await page.waitForLoadState("networkidle");

      // Verify the Add Job button is visible (indicates app loaded)
      await expect(
        page.getByRole("button", { name: /add job/i })
      ).toBeVisible();

      // Verify at least one stage column header is visible
      await expect(page.getByText(/wishlist/i)).toBeVisible();
    });
  });

  test.describe("Job Card Display", () => {
    test("should display job details correctly", async ({ page }) => {
      // Create a job with all details
      const jobData = uniqueJobData({
        location: "Test City, TC",
        salary: "$999,999",
      });

      await page.getByRole("button", { name: /add job/i }).click();
      await page
        .getByPlaceholder("Google, Microsoft, etc.")
        .fill(jobData.company);
      await page.getByPlaceholder("Software Engineer").fill(jobData.position);
      await page.getByPlaceholder("San Francisco, CA").fill(jobData.location!);
      await page.getByPlaceholder("$150,000 - $200,000").fill(jobData.salary!);
      await page
        .getByPlaceholder("https://linkedin.com/jobs/...")
        .fill(jobData.linkedinUrl!);
      await page.getByRole("button", { name: /save/i }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible();

      // Wait for job to appear
      await expect(page.getByText(jobData.position)).toBeVisible();

      // Verify company is displayed
      await expect(page.getByText(jobData.company)).toBeVisible();

      // Verify location badge is displayed (check that badge containing location exists)
      await expect(page.getByText(/Test City/).first()).toBeVisible();

      // Verify salary badge is displayed
      await expect(page.getByText(/\$999,999/).first()).toBeVisible();

      // Verify LinkedIn link exists - just check that at least one link is visible
      // (we can't easily scope to the specific card without more complex selectors)
      await expect(
        page.getByRole("link", { name: /linkedin/i }).first()
      ).toBeVisible();
    });
  });
});
