import { expect, test } from '@playwright/test';
import { getUserFullName, login } from '../../helpers/auth';

test.describe('App initialization', () => {
  test('should login and display the logged-in user', async ({ page }) => {
    await login(page);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Welcome to your Hybrid Cloud Console', level: 2 })).toBeVisible();

    const fullName = await getUserFullName(page);
    await expect(page.getByRole('button', { name: new RegExp(fullName) })).toBeVisible();
  });
});
