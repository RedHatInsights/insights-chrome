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

    // Verify navigation item is still selected (using retryable locator assertion)
    await expect(navigation.sidebar.locator('[aria-current="page"]').filter({ hasText: /Dashboard/i })).toBeVisible();
  });

  test('generic 404 page content', async ({ page }) => {
    // Migrated from test_navigation.py::test_generic_404
    await page.goto('/404');
    await page.waitForLoadState('load');

    // Verify 404 page content is displayed
    await expect(page.getByText(/We lost that page/i)).toBeVisible();
  });

  test('platform link - Ansible has correct internal route', async ({ page }) => {
    // Migrated from test_navigation.py::test_services_menu_platform_links (Ansible variant)
    // Validates chrome navigation structure, not the destination routes themselves

    // Open services menu
    await page.locator('.chr-c-link-service-toggle').click();
    await expect(page.locator('.pf-v6-c-sidebar__content')).toBeVisible();

    // Find Ansible platform link within services menu using OUIA ID
    const ansibleLink = page.locator('[data-ouia-component-id="AllServices-Dropdown-Ansible"]');

    // Verify link exists and has correct internal href
    await expect(ansibleLink).toBeVisible();
    await expect(ansibleLink).toHaveAttribute('href', /\/ansible$/);
  });

  test('platform link - OpenShift has correct internal route', async ({ page }) => {
    // Migrated from test_navigation.py::test_services_menu_platform_links (OpenShift variant)
    // Validates chrome navigation structure, not the destination routes themselves

    // Open services menu
    await page.locator('.chr-c-link-service-toggle').click();
    await expect(page.locator('.pf-v6-c-sidebar__content')).toBeVisible();

    // Find OpenShift platform link within services menu using OUIA ID
    const openshiftLink = page.locator('[data-ouia-component-id="AllServices-Dropdown-Openshift"]');

    // Verify link exists and has correct internal href
    await expect(openshiftLink).toBeVisible();
    await expect(openshiftLink).toHaveAttribute('href', /\/openshift\/overview$/);
  });

  test('platform link - Insights has correct internal route', async ({ page }) => {
    // Migrated from test_navigation.py::test_services_menu_platform_links (Insights variant)
    // Validates chrome navigation structure, not the destination routes themselves

    // Open services menu
    await page.locator('.chr-c-link-service-toggle').click();
    await expect(page.locator('.pf-v6-c-sidebar__content')).toBeVisible();

    // Find RHEL/Insights platform link within services menu using OUIA ID
    const insightsLink = page.locator('[data-ouia-component-id="AllServices-Dropdown-RHEL"]');

    // Verify link exists and has correct internal href
    await expect(insightsLink).toBeVisible();
    await expect(insightsLink).toHaveAttribute('href', /\/insights$/);
  });

  test('fancy 404 page returns to homepage', async ({ page }) => {
    // Migrated from test_navigation.py::test_404s

    // Navigate to 404 page
    await page.goto('/404/404/404');
    await page.waitForLoadState('load');

    // Verify fancy 404 page is displayed
    await expect(page.locator('.land-c-page__404')).toBeVisible();

    // Click "Return to homepage" button
    await page.getByRole('link', { name: /Return to homepage/i }).click();

    // Verify navigation back to homepage
    await expect(page).toHaveURL(/^\/$|^\/$/);
  });
});
