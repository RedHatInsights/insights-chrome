import { test, expect } from '../../setup/test-setup';
import { ChromeTopbar } from '../pages/chrome-topbar';

/**
 * Help Panel E2E Tests
 *
 * Tests the help panel functionality on the /allservices page:
 * - Opening the help panel via the Help button
 * - Verifying the panel becomes visible
 * - Verifying the panel is interactable
 *
 * The help panel is controlled by the feature flag: platform.chrome.help-panel
 * When enabled, it displays a drawer with learning resources.
 *
 * Note: These tests will skip if the help panel feature flag is not enabled
 * in the test environment.
 *
 * IMPORTANT: This test validates the fix for RHCLOUD-43510
 * (PR #3561: https://github.com/RedHatInsights/insights-chrome/pull/3561)
 * The help panel drawer was not functional on the AllServices page prior to that PR.
 * These tests will pass once PR #3561 is merged.
 */

const APP_INIT_TIMEOUT = 30000;
const DRAWER_OPEN_TIMEOUT = 20000; // Increased - drawer takes time to load federated module
const FOCUS_TIMEOUT = 5000;
const SERVICES_LOAD_WAIT = 5000; // Time to wait for all services to load from APIs (RBAC, entitlements, navigation)
// Wait for tooltip to disappear after click (tooltip overlays drawer in UI)
// Note: Using waitForTimeout here is intentional - tooltip animation has no reliable selector
const TOOLTIP_DISMISS_DELAY = 1000;

test.describe('Help Panel on All Services Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to all services page organically through the UI (not direct URL)
    // This matches real user behavior and ensures proper initialization
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const topbar = new ChromeTopbar(page);

    // Open services menu and click "View all link"
    await topbar.openServices();
    await page.locator('[data-ouia-component-id="View all link"]').first().click();

    // Wait for navigation to all services page
    await expect(page).toHaveURL(/.*\/allservices/, { timeout: APP_INIT_TIMEOUT });

    // Wait for page to be ready and fully hydrated
    await expect(page.getByRole('heading', { name: 'All Services' })).toBeVisible({ timeout: APP_INIT_TIMEOUT });

    // Wait for services to load from APIs (RBAC, entitlements, navigation data)
    // Without this, the page may not be fully interactive and services won't be visible
    await page.waitForTimeout(SERVICES_LOAD_WAIT);

    // Wait for React hydration by checking for service links to be rendered
    // This indicates the page is interactive and event handlers are attached
    // Use OUIA component IDs for version-agnostic selectors (stable across PatternFly upgrades)
    await expect(page.locator('[data-ouia-component-id$="-Link"]').first()).toBeVisible({ timeout: APP_INIT_TIMEOUT });
  });

  test('should display help panel and allow interaction', async ({ page }) => {
    // Find the Help button using OUIA ID
    const helpButton = page.locator('[data-ouia-component-id="chrome-help-panel"]');

    // Skip test if help button doesn't exist (feature flag not enabled)
    const helpButtonCount = await helpButton.count();
    test.skip(helpButtonCount === 0, 'Help panel feature flag is not enabled in this environment');

    // Verify help button is visible and actionable
    await expect(helpButton).toBeVisible();
    await expect(helpButton).toBeEnabled();

    // Verify button text and aria-label
    await expect(helpButton).toContainText('Help');
    await expect(helpButton).toHaveAttribute('aria-label', 'Toggle help panel');

    // Get initial button state (should be false/unclicked)
    const initialClickedState = await helpButton.evaluate((el) => {
      return el.getAttribute('aria-pressed') === 'true';
    });

    // Click the help button to open
    await helpButton.click();

    // Move mouse away from button to dismiss tooltip that overlays drawer
    await page.mouse.move(0, 0);

    // Wait briefly for tooltip to disappear
    await page.waitForTimeout(TOOLTIP_DISMISS_DELAY);

    // Wait for help drawer to open - use semantic selectors instead of CSS classes
    // Note: The drawer loads a federated module (ScalprumComponent) which takes time
    const helpDrawerHeading = page.getByRole('heading', { name: 'Help', level: 2 });
    await expect(helpDrawerHeading).toBeVisible({ timeout: DRAWER_OPEN_TIMEOUT });

    // Verify the close button is present (confirms drawer is interactive)
    const closeDrawerButton = page.getByRole('button', { name: 'Close drawer panel' });
    await expect(closeDrawerButton).toBeVisible({ timeout: DRAWER_OPEN_TIMEOUT });

    // Verify tabs are present (confirms content loaded)
    const searchTab = page.getByRole('tab', { name: 'Search' });
    await expect(searchTab).toBeVisible({ timeout: DRAWER_OPEN_TIMEOUT });

    // Verify element is focusable (can be interacted with)
    const interactiveElement = page.getByRole('textbox', { name: 'Search input' }).first();
    await interactiveElement.focus();
    await expect(interactiveElement).toBeFocused({ timeout: FOCUS_TIMEOUT });

    // Verify button state changed when drawer opened
    const clickedState = await helpButton.evaluate((el) => {
      return el.classList.contains('pf-m-clicked') || el.getAttribute('aria-pressed') === 'true';
    });
    expect(clickedState).not.toBe(initialClickedState);

    // Click the help button again to close
    await helpButton.click();

    // Move mouse away from button to dismiss tooltip
    await page.mouse.move(0, 0);

    // Wait briefly for tooltip to disappear
    await page.waitForTimeout(TOOLTIP_DISMISS_DELAY);

    // Verify drawer is closed - heading should not be visible
    await expect(helpDrawerHeading).not.toBeVisible();
  });
});
