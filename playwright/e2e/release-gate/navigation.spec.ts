import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
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
});
