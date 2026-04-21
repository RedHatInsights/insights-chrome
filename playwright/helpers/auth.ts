import { Page, expect } from '@playwright/test';

export async function login(page: Page) {
  // Block TrustArc consent requests to prevent cookie modal from appearing
  // This is the same approach used in Cypress (blockHosts in cypress.config.ts)
  await page.route('**consent.trustarc.com/**', async (route, request) => {
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

export async function getUserFullName(page: Page): Promise<string> {
  return page.evaluate(() => {
    const oidcKey = Object.keys(localStorage).find((key) => key.startsWith('oidc.user:'));
    if (!oidcKey) throw new Error('OIDC user key was not found in localStorage');
    const rawUser = localStorage.getItem(oidcKey);
    if (!rawUser) throw new Error(`OIDC user payload missing for key: ${oidcKey}`);
    const parsedUser = JSON.parse(rawUser);
    const firstName = parsedUser.profile?.first_name;
    const lastName = parsedUser.profile?.last_name;
    if (!firstName || !lastName) throw new Error('OIDC profile is missing first_name and/or last_name');
    return `${firstName} ${lastName}`;
  });
}
