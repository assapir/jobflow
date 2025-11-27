import { defineConfig, devices } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");

/**
 * Playwright configuration for E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Use 2 workers on CI for faster execution */
  workers: process.env.CI ? 2 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [["list"], ["html"]] : "html",
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:5173",
    /* Collect trace when retrying the failed test. */
    trace: "on-first-retry",
    /* Take screenshot on failure */
    screenshot: "only-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project - authenticates before running tests
    {
      name: "setup",
      testDir: ".",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use authenticated state from setup
        storageState: authFile,
      },
      dependencies: ["setup"],
    },
    // Uncomment to test on more browsers
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"], storageState: authFile },
    //   dependencies: ["setup"],
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"], storageState: authFile },
    //   dependencies: ["setup"],
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: "npm run dev:backend",
      cwd: "..",
      url: "http://localhost:3002/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        DEV_AUTH_BYPASS: "true",
      },
    },
    {
      command: "npm run dev:frontend",
      cwd: "..",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
