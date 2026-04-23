/**
 * Global test setup that runs before each test.
 *
 * This file is automatically loaded by Playwright (configured in playwright.config.ts)
 * and applies to all test files.
 */
import { test as base } from '@playwright/test';
import { disableCookiePrompt } from '@redhat-cloud-services/playwright-test-auth';

/**
 * Extend Playwright's base test to automatically block TrustArc cookie prompts
 * on every page instance.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Block TrustArc cookie consent modal before each test
    await disableCookiePrompt(page);

    // Provide the page to the test
    await use(page);
  },
});

export { expect } from '@playwright/test';
