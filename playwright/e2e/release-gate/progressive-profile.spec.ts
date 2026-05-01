import { test, expect } from '../../setup/test-setup';

/**
 * Progressive Profile Tests
 *
 * Migrated from: iqe-platform-ui-plugin/iqe_platform_ui/tests/test_progressive_profile.py
 *
 * Tests the progressive profile functionality where users can have either:
 * - Thin profile: Minimal user information (basic registration)
 * - Thick profile: Complete user information (full profile form)
 *
 * Requirements:
 * - PLATFORM_UI-THIN
 * - PLATFORM_UI-THICK
 *
 * Note: These tests require a thin profile user account to be available.
 * Set THIN_USER and THIN_PASSWORD environment variables to enable these tests.
 */

test.describe('Progressive Profile', () => {
  // Skip all tests if thin user credentials are not provided
  const thinUser = process.env.THIN_USER;
  const thinPassword = process.env.THIN_PASSWORD;
  const skipThinUserTests = !thinUser || !thinPassword;

  test.skip(skipThinUserTests, 'Thin user credentials not provided');

  test('thin profile user can login', async ({ browser, baseURL }) => {
    // Create isolated context for thin user login
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      baseURL: baseURL,
      // Don't use shared auth state - we need fresh login with thin user
      storageState: undefined,
    });

    const page = await context.newPage();

    try {
      // Navigate to the application
      await page.goto('/');
      await page.waitForLoadState('load');

      // Wait for SSO redirect
      await page.waitForURL(/sso\..*\.redhat\.com/);

      // Fill in thin user credentials
      const usernameInput = page.getByLabel('Red Hat login').first();
      await usernameInput.waitFor({ state: 'visible', timeout: 30000 });
      await usernameInput.fill(thinUser!);

      const passwordInput = page.getByLabel('Password').first();
      await passwordInput.fill(thinPassword!);

      // Submit login form
      const loginButton = page.getByRole('button', { name: /log in|next/i });
      await loginButton.click();

      // Wait for redirect back to console
      await page.waitForURL(/console\..*\.redhat\.com/, { timeout: 30000 });

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      // Verify user is logged in by checking for user menu
      const userToggle = page.locator('#user-dropdown, [data-ouia-component-id="chrome-user-toggle"]');
      await expect(userToggle).toBeVisible({ timeout: 10000 });
    } finally {
      await context.close();
    }
  });

  test('thin profile user sees thick profile prompt from my profile', async ({ browser, baseURL }) => {
    // Create isolated context for thin user
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      baseURL: baseURL,
      storageState: undefined,
    });

    const page = await context.newPage();

    try {
      // Login as thin user
      await page.goto('/');
      await page.waitForLoadState('load');
      await page.waitForURL(/sso\..*\.redhat\.com/);

      const usernameInput = page.getByLabel('Red Hat login').first();
      await usernameInput.waitFor({ state: 'visible', timeout: 30000 });
      await usernameInput.fill(thinUser!);

      const passwordInput = page.getByLabel('Password').first();
      await passwordInput.fill(thinPassword!);

      const loginButton = page.getByRole('button', { name: /log in|next/i });
      await loginButton.click();

      await page.waitForURL(/console\..*\.redhat\.com/, { timeout: 30000 });
      await page.waitForLoadState('networkidle');

      // Navigate to My Profile
      // Click user menu to open dropdown
      const userToggle = page.locator('#user-dropdown, [data-ouia-component-id="chrome-user-toggle"]');
      await userToggle.click();

      // Click "My Profile" link
      const myProfileLink = page.getByRole('link', { name: /my profile/i });
      await myProfileLink.click();

      // Wait for navigation to My Profile page or thick profile form
      // Thin users should be prompted to complete their profile
      await page.waitForLoadState('networkidle');

      // The page should either show:
      // 1. A thick profile form (for users who haven't completed profile)
      // 2. My Profile page with a prompt to complete profile
      // We verify that navigation succeeded by checking the URL
      await expect(page).toHaveURL(/\/(iam|settings)\//, { timeout: 10000 });

      // Check for profile-related content
      // This could be a form or a link to complete the profile
      const hasProfileForm = await page.locator('form, [role="form"]').count() > 0;
      const hasProfileLink = await page.getByText(/complete.*profile|update.*profile/i).count() > 0;

      // At least one of these should be present
      expect(hasProfileForm || hasProfileLink).toBeTruthy();
    } finally {
      await context.close();
    }
  });
});

/**
 * Note: test_thin_profile_creation from IQE is marked as @pytest.mark.manual
 * and is not automated. This is a manual test for creating thin profile users
 * through the registration process, which cannot be fully automated.
 */
