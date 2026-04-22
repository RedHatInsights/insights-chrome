import { test, expect } from '../../setup/test-setup';

test.describe('Should login and initialize the app', () => {
  test('initializes user session', async ({ page }) => {
    await page.goto('/');

    // Verify app initialized by checking for user avatar button
    await expect(page.getByRole('button', { name: /User Avatar/ })).toBeVisible({ timeout: 60000 });
  });
});
