import { expect, test } from '../../setup/test-setup';

/**
 * URL Navigation Tests
 *
 * Migrated from: iqe-platform-ui-plugin/iqe_platform_ui/tests/test_url_nav_targets.py
 *
 * Tests that chrome-owned URLs are accessible and load correctly.
 * These tests ensure URL routing works and pages are reachable.
 *
 * Note: Tenant application URLs (/insights/*, /openshift/*, /ansible/*) are
 * excluded as they have their own test suites.
 */

const APP_INIT_TIMEOUT = 30000;

// Chrome-owned URLs to test for navigation
const CHROME_URLS = [
  { path: '/allservices', description: 'All Services page' },
  { path: '/settings/integrations', description: 'Integrations settings' },
  { path: '/settings/notifications', description: 'Notifications settings' },
  { path: '/iam/my-user-access', description: 'My User Access' },
  { path: '/iam/user-access/users', description: 'User Access management' },
];

test.describe('URL Navigation', () => {
  CHROME_URLS.forEach(({ path, description }) => {
    test(`should navigate to ${path} (${description})`, async ({ page }) => {
      // Navigate to the URL
      await page.goto(path);

      // Verify URL contains the expected path (auto-retrying assertion)
      await expect(page).toHaveURL(new RegExp(path));

      // Wait for chrome masthead to ensure page loaded
      await page.getByRole('button', { name: /User Avatar/i }).waitFor({
        state: 'visible',
        timeout: APP_INIT_TIMEOUT,
      });

      // Verify we're on the correct page by checking URL again after load
      await expect(page).toHaveURL(new RegExp(path));
    });
  });
});
