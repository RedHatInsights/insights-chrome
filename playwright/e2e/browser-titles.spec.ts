import { expect, test } from '../setup/test-setup';

/**
 * Browser Title Validation Tests
 *
 * Migrated from IQE: iqe_platform_ui/tests/test_browser_titles.py
 *
 * These tests verify that browser page titles are correctly set when navigating
 * to different pages in the console. Proper titles are important for:
 * - SEO and search engine indexing
 * - Browser tab identification
 * - User experience and navigation
 * - Accessibility (screen readers announce page titles)
 *
 * Requirements: PLATFORM_UI-BROWSER_TITLES
 */

test.describe('Browser Titles - Settings Navigation', () => {
  const settingsTestCases = [
    {
      url: '/settings/integrations',
      label: 'Integrations',
      expectedTitle: 'Integrations | Settings',
    },
    {
      url: '/settings/notifications',
      label: 'Notifications → Overview',
      expectedTitle: 'Notifications | Settings',
    },
    {
      url: '/settings/notifications/configure-events',
      label: 'Notifications → Configure Events',
      expectedTitle: 'Notifications | Settings',
    },
    {
      url: '/settings/notifications/eventlog',
      label: 'Notifications → Event Log',
      expectedTitle: 'Notifications | Settings',
    },
    {
      url: '/settings/notifications/user-preferences',
      label: 'Notifications → Notification Preferences',
      expectedTitle: 'Notification Preferences',
    },
    {
      url: '/settings/learning-resources',
      label: 'Learning Resources',
      expectedTitle: 'Learning Resources | Settings',
    },
  ];

  for (const { url, label, expectedTitle } of settingsTestCases) {
    test(`should display "${expectedTitle}" for ${label}`, async ({ page }) => {
      // Navigate directly to the Settings page URL
      await page.goto(url);
      await page.waitForLoadState('domcontentloaded');

      // Verify the browser title contains the expected text (full title includes a platform suffix)
      await expect(page).toHaveTitle(new RegExp(expectedTitle.replaceAll('|', '\\|')));
    });
  }
});
