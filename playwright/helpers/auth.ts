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
import { disableCookiePrompt } from '@redhat-cloud-services/playwright-test-auth';
import { AUTH_TIMEOUT } from '../setup/constants';

/**
 * Performs the Red Hat SSO two-step login flow with explicit waits.
 *
 * The SSO login page shows the username field first, then reveals the password
 * field after clicking "Next". This function adds an explicit visibility wait
 * for the password field between steps to avoid race conditions where the
 * password field element exists in the DOM but is not yet visible.
 */
async function ssoLogin(page: Page, user: string, password: string) {
  // Fail if the proxy config is not set up correctly
  const lockdownCount = await page.locator('text=Lockdown').count();
  if (lockdownCount > 0) {
    throw new Error('Proxy config incorrect - Lockdown page detected');
  }

  // Step 1: Fill username and advance to the password step
  await page.getByLabel('Red Hat login').first().fill(user);
  await page.getByRole('button', { name: 'Next' }).click();

  // Step 2: Explicitly wait for the password field to become visible.
  // The SSO page hides the password input until the username step completes.
  const passwordField = page.getByLabel('Password').first();
  await passwordField.waitFor({ state: 'visible', timeout: AUTH_TIMEOUT });
  await passwordField.fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();

  // Verify login was valid
  const invalidLoginVisible = await page
    .getByText('Invalid login')
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  if (invalidLoginVisible) {
    throw new Error('Invalid login credentials');
  }

  // Navigate to the landing page and wait for it to load
  await page.goto('/', { waitUntil: 'load', timeout: 60000 });
  await page.getByText('Hi,').waitFor({ state: 'visible', timeout: 60000 });
}

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

  // SSO may return directly to Console Home. The shared package expects a login form.
  const userMenu = page.getByRole('button', { name: /User Avatar/ });
  const username = page.getByLabel('Red Hat login').filter({ visible: true });
  const lockdown = page.getByText('Lockdown', { exact: false }).filter({ visible: true });
  await userMenu.or(username).or(lockdown).first().waitFor({ state: 'visible', timeout: AUTH_TIMEOUT });
  if (!(await userMenu.isVisible())) {
    // Use our own SSO login with explicit waits between the two-step flow
    // to avoid the shared package's race condition on password field visibility.
    await ssoLogin(page, user, password);
  }

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
 * Uses window.insights.chrome.auth.getUser() which works regardless of whether
 * OIDC tokens are stored in localStorage or in-memory (InMemoryWebStorage).
 *
 * @param page - Playwright Page object
 * @returns Promise resolving to the user's full name (first + last)
 * @throws Error if Chrome API unavailable or user profile incomplete
 */
export async function getUserFullName(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const chrome = (window as any).insights?.chrome;
    if (!chrome?.auth?.getUser) {
      throw new Error('Chrome API (window.insights.chrome.auth.getUser) is not available — page may not be fully loaded');
    }
    const user = await chrome.auth.getUser();
    const firstName = user?.identity?.user?.first_name;
    const lastName = user?.identity?.user?.last_name;
    if (!firstName || !lastName) {
      throw new Error('Chrome user profile is missing first_name and/or last_name');
    }
    return `${firstName} ${lastName}`;
  });
}
