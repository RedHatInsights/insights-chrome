import { test, expect } from '../../setup/test-setup';
import { ChromeTopbar } from '../pages/chrome-topbar';

/**
 * Settings Gear Menu Tests
 *
 * Migrated from: iqe-platform-ui-plugin/iqe_platform_ui/tests/test_settings_nav_and_dropdown.py
 *
 * Tests the settings gear icon and menu functionality in the chrome topbar.
 */

test.describe('Settings Gear and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to Settings page', async ({ page }) => {
    // Navigate directly to settings
    await page.goto('/settings');

    // Wait for the page to load
    await page.waitForLoadState('load');

    // Verify we're on the settings page by checking URL
    await expect(page).toHaveURL(/\/settings/);
  });

  test('should open and close settings gear menu', async ({ page }) => {
    const topbar = new ChromeTopbar(page);

    // Verify settings menu is initially closed
    expect(await topbar.isSettingsOpen()).toBe(false);

    // Open the settings menu
    await topbar.openSettings();

    // Verify menu is now open
    expect(await topbar.isSettingsOpen()).toBe(true);

    // Close the settings menu
    await topbar.closeSettings();

    // Verify menu is now closed
    expect(await topbar.isSettingsOpen()).toBe(false);
  });

  test('should contain expected settings menu items', async ({ page }) => {
    const topbar = new ChromeTopbar(page);

    // Get the menu items
    const menuItems = await topbar.getSettingsMenuItems();

    // Verify expected items are present (updated to match current UI)
    const expectedItems = [
      'Integrations',
      'Notifications',
      'User Access',
      'Identity Provider Integration',
      'Authentication Factors',
      'Service Accounts',
    ];

    for (const expectedItem of expectedItems) {
      expect(menuItems).toContain(expectedItem);
    }
  });

  test('should select IAM menu item', async ({ page }) => {
    const topbar = new ChromeTopbar(page);

    // Get menu items to determine which IAM option is available
    const menuItems = await topbar.getSettingsMenuItems();

    // Determine which IAM item to select (matches IQE's choose_iam logic)
    let iamItem: string;
    if (menuItems.includes('User Access')) {
      iamItem = 'User Access';
    } else if (menuItems.includes('Identity & Access Management')) {
      iamItem = 'Identity & Access Management';
    } else {
      throw new Error('No IAM menu item found');
    }

    // Select the IAM item
    await topbar.selectSettingsItem(iamItem);

    // Verify navigation occurred (URL should change)
    // The exact URL depends on which option was selected
    await page.waitForURL(/\/(iam|settings\/rbac|access-management)/, { timeout: 10000 });
  });
});
