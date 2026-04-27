import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './playwright/e2e',

  /* Global setup for authentication */
  globalSetup: require.resolve('./playwright/setup/global-setup'),

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* No retries - fail fast */
  retries: 0,

  /* Use single worker on CI to avoid flakiness, allow parallelism locally */
  workers: process.env.CI ? 1 : undefined,

  /* Stop after 2 test failures */
  maxFailures: 2,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || process.env.BASE || 'https://stage.foo.redhat.com:1337',

    /* Ignore HTTPS certificate errors in stage environment */
    ignoreHTTPSErrors: true,

    /* Reuse authentication state from global setup */
    storageState: 'playwright/.auth/user.json',

    /* Collect trace on failure for debugging */
    trace: 'retain-on-failure',

    /* Screenshot only on failure */
    screenshot: 'only-on-failure',

    /* Video only on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:1337',
  //   reuseExistingServer: !process.env.CI,
  // },
});
