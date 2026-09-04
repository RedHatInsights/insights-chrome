/**
 * Authentication utilities for Playwright tests.
 *
 * This file re-exports functions from the shared @redhat-cloud-services/playwright-test-auth
 * package and provides insights-chrome specific utilities.
 *
 * NOTE: Most tests should rely on global setup (playwright/setup/global-setup.ts) for
 * authentication. These functions are for special cases that need manual login.
 */
import type { Page } from '@playwright/test';
import { disableCookiePrompt, login as sharedLogin } from '@redhat-cloud-services/playwright-test-auth';

/**
 * Performs Red Hat SSO login with analytics disabled.
 *
 * IMPORTANT: Most tests should NOT call this directly. Global setup handles authentication
 * automatically via storage state. Use this only for tests that specifically test login flows.
 */
export async function login(page: Page) {
  const user = process.env.E2E_USER;
  const password = process.env.E2E_PASSWORD;

  if (!user || !password) {
    throw new Error('E2E_USER and E2E_PASSWORD environment variables must be set');
  }

  // Block TrustArc consent requests
  await disableCookiePrompt(page);

  // Navigate to the login page
  await page.goto('/');

  // Perform login using shared package
  await sharedLogin(page, user, password);

  // Disable analytics integrations (insights-chrome specific)
  await page.evaluate(() => {
    localStorage.setItem('chrome:analytics:disable', 'true');
    localStorage.setItem('chrome:segment:disable', 'true');
  });

  // Verify we're logged in by checking for user menu toggle
  await page.getByRole('button', { name: /User Avatar/ }).waitFor({
    state: 'visible',
    timeout: 60000,
  });
}

/**
 * Extracts the logged-in user's full name from the Chrome runtime API.
 *
 * Uses window.insights.chrome.getUser() which works regardless of whether
 * OIDC tokens are stored in localStorage or in-memory (InMemoryWebStorage).
 *
 * @param page - Playwright Page object
 * @returns Promise resolving to the user's full name (first + last)
 * @throws Error if Chrome API unavailable or user profile incomplete
 */
export async function getUserFullName(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const chrome = (window as any).insights?.chrome;
    if (!chrome?.getUser) {
      throw new Error('Chrome API (window.insights.chrome.getUser) is not available — page may not be fully loaded');
    }
    const user = await chrome.getUser();
    const firstName = user?.identity?.user?.first_name;
    const lastName = user?.identity?.user?.last_name;
    if (!firstName || !lastName) {
      throw new Error('Chrome user profile is missing first_name and/or last_name');
    }
    return `${firstName} ${lastName}`;
  });
}
