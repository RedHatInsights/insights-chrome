import { Browser, Page } from '@playwright/test';
import { disableCookiePrompt, login } from '@redhat-cloud-services/playwright-test-auth';

/**
 * Creates an authenticated page in an isolated browser context.
 * Useful for tests that need to logout or otherwise invalidate auth state.
 *
 * This performs the same login flow as global-setup.ts but in an isolated
 * context that doesn't affect the shared auth state.
 */
export async function createAuthenticatedPage(browser: Browser, baseURL?: string): Promise<Page> {
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    baseURL: baseURL,
  });

  const page = await context.newPage();

  // Disable cookie prompts
  await disableCookiePrompt(page);

  // Navigate to the application
  await page.goto(baseURL || '/', { waitUntil: 'load', timeout: 60000 });

  // Perform login
  const user = process.env.E2E_USER;
  const password = process.env.E2E_PASSWORD;

  if (!user || !password) {
    throw new Error('E2E_USER and E2E_PASSWORD environment variables must be set');
  }

  await login(page, user, password);

  // Disable analytics (same as global setup)
  await page.evaluate(() => {
    localStorage.setItem('chrome:analytics:disable', 'true');
    localStorage.setItem('chrome:segment:disable', 'true');
  });

  return page;
}
