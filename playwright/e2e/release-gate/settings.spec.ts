import { expect, test } from '../../setup/test-setup';
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

    const menuItems = await topbar.getSettingsMenuItems();

    // Notifications is always present regardless of environment or user role
    expect(
      menuItems.some((item) => item.includes('Notifications')),
      `Expected to find "Notifications" in menu items: ${JSON.stringify(menuItems)}`
    ).toBe(true);

    // Some form of User Access / IAM item should always be present
    const hasUserAccess = menuItems.some((item) => item.includes('User Access') || item.includes('Acess management') || item.includes('My User Access'));
    expect(hasUserAccess, `Expected to find a User Access item in menu items: ${JSON.stringify(menuItems)}`).toBe(true);

    // Menu should have at least 3 actionable items (Preview toggle + Notifications + IAM)
    expect(menuItems.length, `Expected at least 3 menu items, got: ${JSON.stringify(menuItems)}`).toBeGreaterThanOrEqual(3);
  });

  test('should select IAM menu item', async ({ page }) => {
    const topbar = new ChromeTopbar(page);

    // The label varies by role/flags: "User Access", "Acess management", or "My User Access"
    const menuItems = await topbar.getSettingsMenuItems();
    const iamItem = menuItems.find((item) => item.includes('User Access') || item.includes('Acess management') || item.includes('My User Access'));
    expect(iamItem, `Expected to find IAM menu item in: ${JSON.stringify(menuItems)}`).toBeTruthy();

    await topbar.selectSettingsItem(iamItem!);

    await page.waitForURL(/\/(iam|settings\/rbac|access-management)/, { timeout: 10000 });
  });
});
