import { test as base, expect } from "@playwright/test";

/**
 * Extended test fixture that ensures authentication before each test
 * Also handles dismissing the onboarding modal if it appears
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Navigate to the app
    await page.goto("/");

    // Wait for either the Add button (authenticated) or login page to load
    await page.waitForLoadState("networkidle");

    // Check if we see the login page (Dev Login button)
    const devLoginButton = page.getByRole("button", { name: /dev login/i });
    const isLoginPage = await devLoginButton.isVisible().catch(() => false);

    if (isLoginPage) {
      await devLoginButton.click();

      // Wait for either the Add button (no onboarding) or the onboarding modal
      await page.waitForLoadState("networkidle");

      // Check if onboarding modal appeared
      const onboardingModal = page.getByRole("dialog");
      const isOnboardingVisible = await onboardingModal.isVisible().catch(() => false);

      if (isOnboardingVisible) {
        // Skip onboarding for regular tests
        const skipButton = page.getByRole("button", { name: /skip for now/i });
        if (await skipButton.isVisible().catch(() => false)) {
          await skipButton.click();
          // Wait for modal to close
          await expect(onboardingModal).not.toBeVisible({ timeout: 5000 });
        }

        // Dismiss the banner if it appears
        const bannerCloseButton = page.locator(".mantine-CloseButton-root").first();
        if (await bannerCloseButton.isVisible().catch(() => false)) {
          await bannerCloseButton.click();
        }
      }

      // Wait for the Add button to appear (authenticated state)
      const addButton = page.getByRole("button", { name: /add/i });
      await expect(addButton).toBeVisible({ timeout: 10000 });
    }

    await use(page);
  },
});

export { expect };
