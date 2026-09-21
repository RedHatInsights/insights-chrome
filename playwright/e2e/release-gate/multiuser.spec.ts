import { expect, test } from '../../setup/test-setup';
import { loginAsNonAdmin } from '../../helpers/auth';

test.describe('Multi-user support', () => {
  // Override storage state to start unauthenticated for login flow tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should NOT show Org Admin option for non-admin users', async ({ page }) => {
    // Login as non-admin user
    await loginAsNonAdmin(page);

    // Verify we're on the dashboard
    await expect(page).toHaveURL('/');

    // Open the user menu in the upper-right corner
    const userMenu = page.getByRole('button', { name: /User Avatar/ });
    await expect(userMenu).toBeVisible();
    await userMenu.click();

    // Verify standard menu items are present
    await expect(page.getByText('Username')).toBeVisible();
    await expect(page.getByText(/My (user )?access/i)).toBeVisible();
    await expect(page.getByText('User preferences')).toBeVisible();
    await expect(page.getByText('Log out')).toBeVisible();

    // Verify 'Org Admin' is NOT shown for non-admin users
    await expect(page.getByText('Org Admin')).not.toBeVisible();
  });
});
