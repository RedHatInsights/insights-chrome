import { test, expect } from '../../setup/test-setup';
import { ChromeTopbar } from '../pages/chrome-topbar';

/**
 * Test: Org ID visibility in overflow actions
 *
 * Migrated from: iqe-platform-ui-plugin/iqe_platform_ui/tests/test_login.py::test_org_id_visible
 * Original JIRA: RHCLOUD-44382 (test was skipped in IQE)
 *
 * Verifies that the organization ID is displayed in the user overflow
 * actions dropdown in the chrome topbar.
 *
 * Tags from IQE:
 * - @pytest.mark.core
 * - @pytest.mark.smoke
 */

test.describe('Organization ID Display', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page (already authenticated via global setup)
    await page.goto('/');
  });

  test('should display numeric org ID in overflow actions dropdown', async ({ page }) => {
    const topbar = new ChromeTopbar(page);

    // Open the overflow actions dropdown (user menu)
    await topbar.openOverflowActions();

    // Verify the org ID element is visible
    await expect(topbar.orgIdElement).toBeVisible();

    // Extract the org ID value (page object handles the extraction logic)
    const orgId = await topbar.getOrgId();

    // Verify org ID is present, not empty, and numeric
    expect(orgId).toBeTruthy();
    expect(orgId?.trim()).not.toBe('');
    expect(orgId).toMatch(/^\d+$/);
  });

  test('should get numeric org ID using page object helper method', async ({ page }) => {
    const topbar = new ChromeTopbar(page);

    // Test the getOrgId() helper method
    const orgId = await topbar.getOrgId();

    // Verify we got an org ID back
    expect(orgId).toBeTruthy();
    expect(orgId?.trim()).not.toBe('');

    // Verify it's numeric
    expect(orgId?.trim()).toMatch(/^\d+$/);
  });
});
