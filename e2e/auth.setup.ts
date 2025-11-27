import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  // Navigate to the app
  await page.goto("http://localhost:5173");

  // Wait for the login page to load and click the Dev Login button
  const devLoginButton = page.getByRole("button", { name: /dev login/i });
  await expect(devLoginButton).toBeVisible({ timeout: 10000 });
  await devLoginButton.click();

  // Wait for the authenticated state - the Add button should be visible
  await expect(page.getByRole("button", { name: /add/i })).toBeVisible({
    timeout: 15000,
  });

  // Save the authenticated state
  await page.context().storageState({ path: authFile });
});
