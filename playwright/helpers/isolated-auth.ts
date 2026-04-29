import { Browser, Page } from '@playwright/test';
import { login } from './auth';
import { AUTH_TIMEOUT } from '../setup/constants';

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

  // Set higher timeout for CI environments where network/SSO may be slower
  page.setDefaultTimeout(AUTH_TIMEOUT);

  try {
    // Use the existing login helper which handles all the auth details
    await login(page);
    return page;
  } catch (error) {
    // Clean up context on login failure to avoid leaking resources
    // Safely close context - it may already be closed if test timed out
    try {
      await context.close();
    } catch (closeError) {
      // Context already closed - this is fine, suppress the error
    }
    throw error;
  }
}
