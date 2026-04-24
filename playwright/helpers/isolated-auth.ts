import { Browser, Page } from '@playwright/test';
import { login } from './auth';

/**
 * Creates an authenticated page in an isolated browser context.
 * Useful for tests that need to logout or otherwise invalidate auth state.
 *
 * This performs the same login flow as helpers/auth.ts but in an isolated
 * context that doesn't affect the shared auth state.
 */
export async function createAuthenticatedPage(browser: Browser, baseURL?: string): Promise<Page> {
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    baseURL: baseURL,
    // CRITICAL: Don't use shared auth state - we need a fresh login
    storageState: undefined,
  });

  const page = await context.newPage();

  // Use the existing login helper which handles all the auth details
  await login(page);

  return page;
}
