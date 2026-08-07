import { expect, test } from '../../setup/test-setup';

// Timeout constants for CI environment stability
const SERVICES_LOAD_TIMEOUT = 45000; // Bundle visibility can be slow in CI
const BUTTON_STABILITY_TIMEOUT = 5000; // Wait for button to stabilize before click
const BUTTON_CLICK_TIMEOUT = 10000; // Allow extra time for click in slow CI

test.describe('Favorite Services (E2E User Flow)', () => {
  test.beforeEach(async ({ page }) => {
    page.on('load', async () => {
      await page.evaluate(() => document.getElementById('webpack-dev-server-client-overlay')?.remove()).catch(() => {});
    });
  });

  test('should favorite on the page and unfavorite from the header dropdown', async ({ page }) => {
    test.slow();
    const serviceToTest = 'Groups';
    const quickstartIdSelector = '[data-quickstart-id="iam_user-access_groups"]';

    await page.goto('/allservices');
    await page.waitForLoadState('load');
    // Wait for all services to render
    await expect(page.getByRole('heading', { name: 'All Services', level: 2 })).toBeVisible({ timeout: SERVICES_LOAD_TIMEOUT });
    await page.getByText(serviceToTest).scrollIntoViewIfNeeded();

    // 3. Favorite a specific service on the page (if not already favorited)
    const favoriteButton = page.getByLabel(`Favorite ${serviceToTest}`);
    const isFavorited = await favoriteButton.evaluate((el) => el.classList.contains('chr-c-icon-favorited'));

    if (!isFavorited) {
      await favoriteButton.click();
      // stage can be slow in konflux pipelines
      await page.waitForLoadState('load');
    }

    // 4. Open the All Services drop-down menu
    await page.getByRole('button', { name: 'Red Hat Hybrid Cloud Console' }).click();

    // 5. Confirm that the favorite service appears in the dropdown
    const sidebar = page.locator('.pf-v6-c-sidebar__content');
    await expect(sidebar).toBeVisible();

    // Occasionally the test finds two instances because the ID isn't unique; choose the first as a work-around
    const favoriteItems = await page.locator(`${quickstartIdSelector}:visible`).all();
    for (const item of favoriteItems) {
      // unfavorite the item
      // ugly logic because quickstart id is duplicated; can't track down unique element that has a button sub-element
      const button = item.getByRole('button');
      // Use count() instead of isVisible() to avoid race condition between check and click
      if ((await button.count()) > 0) {
        await button.waitFor({ state: 'visible', timeout: BUTTON_STABILITY_TIMEOUT });
        await button.click({ timeout: BUTTON_CLICK_TIMEOUT });
      }
    }

    // Assert that the service is no longer in the favorites dropdown
    await page.waitForLoadState('load');
    await expect(sidebar.locator(quickstartIdSelector)).not.toBeVisible();

    // 7. Close the drop-down menu
    await page.getByRole('button', { name: 'Red Hat Hybrid Cloud Console' }).click();

    // 8. On the all-services page, confirm the service is no longer favorite
    await expect(page.getByLabel(`Favorite ${serviceToTest}`)).not.toHaveClass(/chr-c-icon-favorited/);
  });
});
