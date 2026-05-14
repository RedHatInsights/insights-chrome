import { test as base, expect } from '@playwright/test';
import { ChromeTopbar } from '../pages/chrome-topbar';
import { createAuthenticatedPage } from '../../helpers/isolated-auth';
import { AUTH_TIMEOUT } from '../../setup/constants';

/**
 * Test: Logout functionality
 *
 * Migrated from: iqe-platform-ui-plugin/iqe_platform_ui/tests/test_login.py::test_logout
 *
 * Verifies that users can successfully log out using both:
 * - insights.chrome.auth.logout() JavaScript command
 * - "Log out" option in the user overflow actions dropdown
 *
 * IMPORTANT: These tests use isolated browser contexts that don't share
 * the global authentication state, since logging out would invalidate
 * the shared session used by other tests.
 *
 * Tags from IQE:
 * - @pytest.mark.core
 * - @pytest.mark.outage
 * - @pytest.mark.smoke
 */

// Create a custom test that doesn't use shared auth state
const test = base.extend<{ authenticatedPage: any }>({
  authenticatedPage: [
    async ({ browser, baseURL }, use) => {
      // Create an authenticated page in an isolated context
      const page = await createAuthenticatedPage(browser, baseURL);

      // Provide the authenticated page to the test
      await use(page);

      // Cleanup
      await page.context().close();
    },
    { timeout: AUTH_TIMEOUT },
  ],
});

test.describe('Logout Functionality', () => {
  test('should logout via Chrome auth command', async ({ authenticatedPage: page }) => {
    // Navigate to home page
    await page.goto('/');

    // Verify we're logged in by checking for user avatar
    const userAvatar = page.getByRole('button', { name: /User Avatar/ });
    await expect(userAvatar).toBeVisible();

    // Execute logout via Chrome JavaScript API
    await page.evaluate(() => {
      // @ts-ignore - insights.chrome is a global object
      return window.insights.chrome.auth.logout(true);
    });

    // Wait for logout to complete and redirect
    // After logout, we should be redirected to the landing/login page
    await page.waitForURL(/\/(login|security|$)/, { timeout: 30000 });

    // Verify user avatar is no longer visible (user is logged out)
    await expect(userAvatar).not.toBeVisible({ timeout: 10000 });

    // Verify we're on a logged-out page by checking for Red Hat login form
    // Look for the username input field on the SSO login page
    const usernameInput = page.getByRole('textbox', { name: 'Red Hat login' });
    await expect(usernameInput).toBeVisible({ timeout: 10000 });
  });

  test('should logout via dropdown menu', async ({ authenticatedPage: page }) => {
    // Navigate to home page
    await page.goto('/');

    const topbar = new ChromeTopbar(page);

    // Verify we're logged in
    const userAvatar = page.getByRole('button', { name: /User Avatar/ });
    await expect(userAvatar).toBeVisible();

    // Open the overflow actions menu
    await topbar.openOverflowActions();

    // Click the "Log out" option in the menu
    // Use exact match to avoid matching both button and text inside
    await page.getByRole('menuitem', { name: 'Log out' }).click();

    // Wait for logout to complete and redirect
    await page.waitForURL(/\/(login|security|$)/, { timeout: 30000 });

    // Verify user avatar is no longer visible
    await expect(userAvatar).not.toBeVisible({ timeout: 10000 });

    // Verify we're on a logged-out page by checking for Red Hat login form
    const usernameInput = page.getByRole('textbox', { name: 'Red Hat login' });
    await expect(usernameInput).toBeVisible({ timeout: 10000 });
  });
});
