import { test, expect } from '../../setup/test-setup';
import { ChromeNavigation } from '../pages/chrome-navigation';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('visit services', async ({ page }) => {
    // click on services button
    await page.locator('.chr-c-link-service-toggle').click();

    // Verify the services dropdown is visible
    await expect(page.locator('.pf-v6-c-sidebar__content')).toBeVisible();
  });

  test('Navigate to users', async ({ page }) => {
    // click on services button
    await page.locator('.chr-c-link-service-toggle').click();

    // click on all services
    await page.locator('[data-ouia-component-id="View all link"]').first().click();

    // check that we are on all services page
    await expect(page).toHaveURL(/.*\/allservices/);
  });

  test('navigation toggle hide and show', async ({ page }) => {
    // Migrated from test_navigation.py::test_nav_toggle
    const navigation = new ChromeNavigation(page);

    // Navigate to a page with navigation (User Access)
    await page.goto('/settings/my-user-access');
    await page.waitForLoadState('load');

    // Verify navigation is initially visible
    await expect(navigation.sidebar).toBeVisible();

    // Click toggle to hide navigation
    await navigation.clickToggle();
    await expect(navigation.sidebar).not.toBeVisible();

    // Click toggle to show navigation again
    await navigation.clickToggle();
    await expect(navigation.sidebar).toBeVisible();
  });

  test('navigation selection persists after refresh', async ({ page }) => {
    // Migrated from test_navigation.py::test_refresh_navigation
    const navigation = new ChromeNavigation(page);

    // Navigate to Insights and select Dashboard
    await page.goto('/insights/dashboard');
    await page.waitForLoadState('load');

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('load');

    // Verify we're still on the dashboard page
    await expect(page).toHaveURL(/.*\/insights\/dashboard/);

    // Verify navigation item is still selected
    const selected = await navigation.getCurrentlySelected();
    expect(selected.some((item) => item.includes('Dashboard'))).toBeTruthy();
  });

  test('generic 404 page content', async ({ page }) => {
    // Migrated from test_navigation.py::test_generic_404
    await page.goto('/404');
    await page.waitForLoadState('load');

    // Verify 404 page content is displayed
    await expect(page.getByText(/We lost that page/i)).toBeVisible();
  });
});
