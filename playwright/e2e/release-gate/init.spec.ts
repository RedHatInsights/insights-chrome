import { expect, test } from '../../setup/test-setup';
import { getUserFullName } from '../../helpers/auth';

test.describe('App initialization', () => {
  test('should login and display the logged-in user', async ({ page }) => {
    await page.goto('/');

    // Wait for page to be fully loaded before checking for elements
    await page.waitForLoadState('networkidle');

    // Wait for welcome message with extended timeout (page may take time to render)
    await expect(page.getByRole('heading', { name: 'Welcome to your Hybrid Cloud Console', level: 2 })).toBeVisible({ timeout: 30000 });

    const fullName = await getUserFullName(page);
    await expect(page.getByRole('button', { name: new RegExp(fullName) })).toBeVisible();
  });
});
