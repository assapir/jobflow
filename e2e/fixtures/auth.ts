import { test as base, expect } from "@playwright/test";

/**
 * Extended test fixture that ensures authentication before each test
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
