import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth';

test.describe('Authentication', () => {
  test('should successfully login and verify authenticated state', async ({ page }) => {
    await login(page);

    // Verify we're on the home page
    await expect(page).toHaveURL('/');

    // Verify analytics is disabled (as set in login helper)
    const analyticsDisabled = await page.evaluate(() => {
      return localStorage.getItem('chrome:analytics:disable');
    });
    expect(analyticsDisabled).toBe('true');

    const segmentDisabled = await page.evaluate(() => {
      return localStorage.getItem('chrome:segment:disable');
    });
    expect(segmentDisabled).toBe('true');
  });

  test('should display user menu with expected items when clicked', async ({ page }) => {
    await login(page);

    const userMenu = page.getByRole('button', { name: /User Avatar/ });
    await expect(userMenu).toBeVisible();

    // Click to open the user menu
    await userMenu.click();

    // Verify key menu items are present
    await expect(page.getByText('Username')).toBeVisible();
    await expect(page.getByText('My user access')).toBeVisible();
    await expect(page.getByText('User preferences')).toBeVisible();
    await expect(page.getByText('Log out')).toBeVisible();
  });

  test('should maintain authenticated state across page navigation', async ({ page }) => {
    await login(page);

    // Navigate to a different page
    await page.goto('/settings/learning-resources');
    await expect(page).toHaveURL('/settings/learning-resources');

    // Verify still authenticated
    const userMenu = page.getByRole('button', { name: /User Avatar/ });
    await expect(userMenu).toBeVisible();
  });
});
