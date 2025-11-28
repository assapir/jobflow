import { test as base, expect } from "@playwright/test";

/**
 * Extended test fixture that ensures authentication before each test
 * Also handles dismissing the onboarding modal if it appears
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Navigate to the app
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check if we see the login page (Dev Login button)
    const devLoginButton = page.getByRole("button", { name: /dev login/i });
    const isLoginPage = await devLoginButton.isVisible().catch(() => false);

    if (isLoginPage) {
      await devLoginButton.click();

      // Wait for navigation and network to settle
      await page.waitForLoadState("networkidle");

      // Give time for the profile to load and modal to render
      await page.waitForTimeout(500);

      // Check if onboarding modal appeared - wait a bit for it to show up
      const onboardingModal = page.getByRole("dialog");

      try {
        // Wait for up to 3 seconds for the modal to appear
        await onboardingModal.waitFor({ state: "visible", timeout: 3000 });

        // Modal appeared - find and click the skip button
        const skipButton = page.getByRole("button", { name: /skip for now/i });
        await skipButton.waitFor({ state: "visible", timeout: 2000 });
        await skipButton.click();

        // Wait for modal to close
        await expect(onboardingModal).not.toBeVisible({ timeout: 5000 });
      } catch {
        // Modal didn't appear or couldn't find skip button - that's fine
        // User might already have completed onboarding
      }

      // Dismiss the banner if it appears (after modal is closed)
      await page.waitForTimeout(300);
      const bannerCloseButton = page
        .locator('[aria-label="Close"]')
        .or(page.locator(".mantine-CloseButton-root"))
        .first();
      const bannerVisible = await bannerCloseButton.isVisible().catch(() => false);
      if (bannerVisible) {
        await bannerCloseButton.click();
        await page.waitForTimeout(200);
      }

      // Wait for the Add button to appear (authenticated state)
      const addButton = page.getByRole("button", { name: /add/i });
      await expect(addButton).toBeVisible({ timeout: 10000 });
    }

    await use(page);

    // Cleanup: Close any open modals by pressing Escape
    // This ensures modals left open by tests don't affect subsequent tests
    await page.keyboard.press("Escape");
    // Small delay to let modal close animation complete
    await page.waitForTimeout(100);
  },
});

export { expect };
