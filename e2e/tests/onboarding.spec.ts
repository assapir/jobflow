import { test as base, expect } from "@playwright/test";

/**
 * Custom test fixture for onboarding tests - uses fresh login without pre-authenticated state
 */
const test = base.extend({
  page: async ({ browser }, use) => {
    // Create a new context for each test to ensure clean browser state
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to the app
    await page.goto("/");

    await use(page);

    // Cleanup
    await context.close();
  },
});

test.describe("User Onboarding", () => {
  // Run tests serially since they share database state
  // Tests are ordered so that tests NOT completing onboarding run first
  test.describe.configure({ mode: "serial" });

  test("should show onboarding modal after first login", async ({ page }) => {
    // Wait for login page
    const devLoginButton = page.getByRole("button", { name: /dev login/i });
    await expect(devLoginButton).toBeVisible({ timeout: 10000 });

    // Click dev login
    await devLoginButton.click();

    // Wait for onboarding modal to appear
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Verify it's the onboarding modal with welcome step
    await expect(page.getByText(/welcome/i)).toBeVisible();
    await expect(page.getByText(/step 1 of 4/i)).toBeVisible();
  });

  test("should navigate back through onboarding steps", async ({ page }) => {
    // Login
    const devLoginButton = page.getByRole("button", { name: /dev login/i });
    await expect(devLoginButton).toBeVisible({ timeout: 10000 });
    await devLoginButton.click();

    // Wait for onboarding modal
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Go to step 2
    await page.getByRole("button", { name: /next/i }).click();
    await expect(page.getByText(/step 2 of 4/i)).toBeVisible();

    // Select Product profession
    await page.getByText("Product").click();

    // Go to step 3
    await page.getByRole("button", { name: /next/i }).click();
    await expect(page.getByText(/step 3 of 4/i)).toBeVisible();

    // Go back to step 2
    await page.getByRole("button", { name: /back/i }).click();
    await expect(page.getByText(/step 2 of 4/i)).toBeVisible();

    // Go back to step 1
    await page.getByRole("button", { name: /back/i }).click();
    await expect(page.getByText(/step 1 of 4/i)).toBeVisible();
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test("should allow skipping onboarding and show banner", async ({ page }) => {
    // Login
    const devLoginButton = page.getByRole("button", { name: /dev login/i });
    await expect(devLoginButton).toBeVisible({ timeout: 10000 });
    await devLoginButton.click();

    // Wait for onboarding modal
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Skip onboarding
    await page.getByRole("button", { name: /skip for now/i }).click();

    // Modal should close
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Banner should appear
    await expect(page.getByText(/complete your profile/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /complete now/i })
    ).toBeVisible();
  });

  test("should reopen onboarding from banner", async ({ page }) => {
    // Login
    const devLoginButton = page.getByRole("button", { name: /dev login/i });
    await expect(devLoginButton).toBeVisible({ timeout: 10000 });
    await devLoginButton.click();

    // Wait for onboarding modal and skip it
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /skip for now/i }).click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Click "Complete Now" on banner
    await page.getByRole("button", { name: /complete now/i }).click();

    // Onboarding modal should reopen
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test("should dismiss banner and hide it for the session", async ({
    page,
  }) => {
    // Login
    const devLoginButton = page.getByRole("button", { name: /dev login/i });
    await expect(devLoginButton).toBeVisible({ timeout: 10000 });
    await devLoginButton.click();

    // Wait for onboarding modal and skip it
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /skip for now/i }).click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Banner should be visible
    const banner = page.getByText(/complete your profile/i);
    await expect(banner).toBeVisible();

    // Click close button on banner
    await page
      .locator(
        '[data-testid="close-button"], button[aria-label*="close"], .mantine-CloseButton-root'
      )
      .first()
      .click();

    // Banner should be hidden
    await expect(banner).not.toBeVisible({ timeout: 2000 });

    // Add Job button should still be visible (app is usable)
    await expect(page.getByRole("button", { name: /add job/i })).toBeVisible();
  });

  // This test COMPLETES onboarding - run it last!
  test("should complete all onboarding steps", async ({ page }) => {
    // Login
    const devLoginButton = page.getByRole("button", { name: /dev login/i });
    await expect(devLoginButton).toBeVisible({ timeout: 10000 });
    await devLoginButton.click();

    // Wait for onboarding modal
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Step 1: Welcome - click Next
    await expect(page.getByText(/step 1 of 4/i)).toBeVisible();
    await page.getByRole("button", { name: /next/i }).click();

    // Step 2: Profession - select Engineering and click Next
    await expect(page.getByText(/step 2 of 4/i)).toBeVisible();
    await expect(page.getByText(/what's your profession/i)).toBeVisible();
    await page.getByText("Engineering").click();
    await page.getByRole("button", { name: /next/i }).click();

    // Step 3: Experience Level - select Senior and click Next
    await expect(page.getByText(/step 3 of 4/i)).toBeVisible();
    await expect(page.getByText(/experience level/i)).toBeVisible();
    await page.getByText("Senior").click();
    await page.getByRole("button", { name: /next/i }).click();

    // Step 4: Location - verify summary and complete
    await expect(page.getByText(/step 4 of 4/i)).toBeVisible();
    await expect(page.getByText(/where do you want to work/i)).toBeVisible();

    // Fill location
    await page.getByLabel(/preferred location/i).fill("San Francisco");

    // Verify summary shows our selections
    await expect(page.getByText(/engineering/i)).toBeVisible();
    await expect(page.getByText(/senior/i)).toBeVisible();

    // Complete onboarding
    await page.getByRole("button", { name: /complete setup/i }).click();

    // Modal should close
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Should see the main app (Add Job button)
    await expect(page.getByRole("button", { name: /add job/i })).toBeVisible();
  });
});
