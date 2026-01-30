import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth';

test.describe('Favorite Services (E2E User Flow)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should favorite on the page and unfavorite from the header dropdown', async ({ page }) => {
    const serviceToTest = 'Groups';
    const quickstartIdSelector = '[data-quickstart-id="iam_user-access_groups"]';

    await page.goto('/allservices');
    await page.waitForLoadState('load');
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
    const favoriteItem = await page.locator(`${quickstartIdSelector}:visible`).all();
    for (const item of favoriteItem) {
      // unfavorite the item
      // ugly logic because quickstart id is duplicated; can't track down unique element that has a button sub-element
      const rightButton = await item.getByRole('button').isVisible();
      if (rightButton) {
        await item.getByRole('button').click();
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
