import { Page, expect } from '@playwright/test';

/**
 * Performs login flow for E2E tests
 * @param page - Playwright page instance
 */
export async function login(page: Page) {
  // Block TrustArc consent requests to prevent cookie modal from appearing
  // This is the same approach used in Cypress (blockHosts in cypress.config.ts)
  await page.route('**/*', async (route, request) => {
    if (request.url().includes('consent.trustarc.com') && request.resourceType() !== 'document') {
      await route.abort();
    } else {
      await route.continue();
    }
  });

  // Navigate to the login page
  await page.goto('/');

  // Wait for login form
  await page.waitForSelector('#username-verification', { timeout: 10000 });

  // Fill in username
  await page.fill('#username-verification', process.env.E2E_USER!);
  await page.click('#login-show-step2');

  // Wait for password field and fill it
  await page.waitForSelector('#password', { timeout: 10000 });
  await page.fill('#password', process.env.E2E_PASSWORD!);
  await page.click('#rh-password-verification-submit-button');

  // Wait for successful navigation after login
  await page.waitForURL('/', { timeout: 60000 });

  // Disable analytics integrations (must be after navigation to app domain)
  await page.evaluate(() => {
    localStorage.setItem('chrome:analytics:disable', 'true');
    localStorage.setItem('chrome:segment:disable', 'true');
  });

  // Verify we're logged in by checking for user menu toggle
  await expect(page.getByRole('button', { name: /User Avatar/ })).toBeVisible({ timeout: 60000 });
}
