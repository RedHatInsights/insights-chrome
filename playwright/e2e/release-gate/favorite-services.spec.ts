import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth';

test.describe('Favorite Services (E2E User Flow)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should favorite on the page and unfavorite from the header dropdown', async ({ page }) => {
    const serviceToTest = 'ACS Instances';
    const quickstartIdSelector = '[data-quickstart-id="openshift_acs_instances"]';

    await page.goto('/allservices');
    // accept all cookies to prevent test errors
    // await page.getByRole('button', { name: 'Accept All' }).click();
    await expect(page.getByText(serviceToTest)).toBeVisible();

    // 3. Favorite a specific service on the page
    await page.getByLabel(`Favorite ${serviceToTest}`).click();
    // stage can be slow in konflux pipelines
    await page.waitForTimeout(3000);

    // 4. Open the All Services drop-down menu
    await page.getByRole('button', { name: 'Red Hat Hybrid Cloud Console' }).click();

    // 5. Confirm that the favorite service appears in the dropdown
    const sidebar = page.locator('.pf-v6-c-sidebar__content');
    await expect(sidebar).toBeVisible();

    const favoriteItem = sidebar.locator(quickstartIdSelector);
    await expect(favoriteItem).toBeVisible();
    await expect(favoriteItem.locator('.chr-c-icon-star')).toBeVisible();

    // 6. Un-favorite the service from the All Services drop-down
    await favoriteItem.locator('button').click();

    // Assert that the service is no longer in the favorites dropdown
    await expect(sidebar.locator(quickstartIdSelector)).not.toBeVisible();

    // 7. Close the drop-down menu
    await page.getByRole('button', { name: 'Red Hat Hybrid Cloud Console' }).click();

    // 8. On the all-services page, confirm the service is no longer favorite
    await expect(page.getByLabel(`Favorite ${serviceToTest}`)).not.toHaveClass(/chr-c-icon-favorited/);
  });
});
