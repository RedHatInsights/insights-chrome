import { expect, test } from '../setup/test-setup';
import { ChromeNavigation } from './pages/chrome-navigation';

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
  test.beforeEach(async ({ page }) => {
    // Navigate to Settings page before each test
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  const settingsTestCases = [
    {
      navItems: ['Integrations'],
      expectedTitle: 'Integrations | Settings',
    },
    {
      navItems: ['Notifications', 'Overview'],
      expectedTitle: 'Notifications | Settings',
    },
    {
      navItems: ['Notifications', 'Configure Events'],
      expectedTitle: 'Red Hat Enterprise Linux - Notifications | Settings',
    },
    {
      navItems: ['Notifications', 'Event Log'],
      expectedTitle: 'Notifications | Settings',
    },
    {
      navItems: ['Notifications', 'Notification Preferences'],
      expectedTitle: 'Notification Preferences | Hybrid Cloud Console',
    },
    {
      navItems: ['Learning Resources'],
      expectedTitle: 'Learning Resources | Settings',
    },
  ];

  for (const { navItems, expectedTitle } of settingsTestCases) {
    test(`should display "${expectedTitle}" for ${navItems.join(' → ')}`, async ({ page }) => {
      const navigation = new ChromeNavigation(page);

      // Navigate through the menu items
      await navigation.navigateToPage(navItems);

      // Wait for the page to fully load
      await page.waitForLoadState('networkidle');

      // Verify the browser title
      await expect(page).toHaveTitle(expectedTitle);
    });
  }
});
