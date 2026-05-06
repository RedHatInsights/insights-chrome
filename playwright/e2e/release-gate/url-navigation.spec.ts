import { test, expect } from '../../setup/test-setup';

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

      // Verify URL contains the expected path
      expect(page.url()).toContain(path);

      // Wait for chrome masthead to ensure page loaded
      await page.getByRole('button', { name: /User Avatar/ }).waitFor({
        state: 'visible',
        timeout: APP_INIT_TIMEOUT,
      });

      // Verify we're on the correct page by checking URL again after load
      expect(page.url()).toContain(path);
    });
  });

  test('should handle all chrome URL navigations', async ({ page }) => {
    // Summary test that validates all URLs in sequence
    const results: { path: string; success: boolean; url: string }[] = [];

    for (const { path } of CHROME_URLS) {
      try {
        await page.goto(path, { timeout: APP_INIT_TIMEOUT });

        // Wait for chrome to be ready
        await page.getByRole('button', { name: /User Avatar/ }).waitFor({
          state: 'visible',
          timeout: APP_INIT_TIMEOUT,
        });

        const currentUrl = page.url();
        const success = currentUrl.includes(path);

        results.push({
          path,
          success,
          url: currentUrl,
        });
      } catch (error) {
        results.push({
          path,
          success: false,
          url: `Error: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    // Log results summary
    console.log('\nURL Navigation Summary:');
    console.log(`Total URLs tested: ${results.length}`);
    console.log(`Successful: ${results.filter((r) => r.success).length}`);
    console.log(`Failed: ${results.filter((r) => !r.success).length}`);

    results.forEach((result) => {
      const status = result.success ? '✓' : '✗';
      console.log(`  ${status} ${result.path}`);
      if (!result.success) {
        console.log(`    URL: ${result.url}`);
      }
    });

    // Assert all navigations succeeded
    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      console.error('\nFailed URLs:');
      failures.forEach((f) => {
        console.error(`  - ${f.path}: ${f.url}`);
      });
    }

    expect(failures).toHaveLength(0);
  });
});
