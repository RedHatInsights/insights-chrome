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
import {
  login as sharedLogin,
  disableCookiePrompt
} from '@redhat-cloud-services/playwright-test-auth';

/**
 * Performs Red Hat SSO login with analytics disabled.
 *
 * IMPORTANT: Most tests should NOT call this directly. Global setup handles authentication
 * automatically via storage state. Use this only for tests that specifically test login flows.
 *
 * @param page - Playwright Page object
 * @param user - Optional username (defaults to E2E_USER env var)
 * @param password - Optional password (defaults to E2E_PASSWORD env var)
 */
export async function login(page: Page, user?: string, password?: string) {
  const username = user ?? process.env.E2E_USER;
  const userPassword = password ?? process.env.E2E_PASSWORD;

  if (!username || !userPassword) {
    throw new Error('E2E_USER and E2E_PASSWORD environment variables must be set or passed as parameters');
  }

  // Block TrustArc consent requests
  await disableCookiePrompt(page);

  // Navigate to the login page
  await page.goto('/');

  // Perform login using shared package
  await sharedLogin(page, username, userPassword);

  // Disable analytics integrations (insights-chrome specific)
  await page.evaluate(() => {
    localStorage.setItem('chrome:analytics:disable', 'true');
    localStorage.setItem('chrome:segment:disable', 'true');
  });

  // Verify we're logged in by checking for user menu toggle
  await page.getByRole('button', { name: /User Avatar/ }).waitFor({
    state: 'visible',
    timeout: 60000
  });
}

/**
 * Performs Red Hat SSO login as the non-admin test user.
 *
 * Convenience wrapper around login() that uses E2E_NON_ADMIN_USER credentials.
 */
export async function loginAsNonAdmin(page: Page) {
  const user = process.env.E2E_NON_ADMIN_USER;
  const password = process.env.E2E_NON_ADMIN_PASSWORD;

  if (!user || !password) {
    throw new Error('E2E_NON_ADMIN_USER and E2E_NON_ADMIN_PASSWORD environment variables must be set');
  }

  await login(page, user, password);
}

/**
 * Extracts the logged-in user's full name from OIDC localStorage data.
 *
 * @param page - Playwright Page object
 * @returns Promise resolving to the user's full name (first + last)
 * @throws Error if OIDC data not found or incomplete
 */
export async function getUserFullName(page: Page): Promise<string> {
  return page.evaluate(() => {
    const oidcKey = Object.keys(localStorage).find((key) => key.startsWith('oidc.user:'));
    if (!oidcKey) throw new Error('OIDC user key was not found in localStorage');
    const rawUser = localStorage.getItem(oidcKey);
    if (!rawUser) throw new Error(`OIDC user payload missing for key: ${oidcKey}`);
    const parsedUser = JSON.parse(rawUser);
    const firstName = parsedUser.profile?.first_name;
    const lastName = parsedUser.profile?.last_name;
    if (!firstName || !lastName) {
      throw new Error('OIDC profile is missing first_name and/or last_name');
    }
    return `${firstName} ${lastName}`;
  });
}
