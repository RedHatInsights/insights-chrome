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

  test('should display org ID in overflow actions dropdown', async ({ page }) => {
    const topbar = new ChromeTopbar(page);

    // Open the overflow actions dropdown (user menu)
    await topbar.openOverflowActions();

    // Verify the org ID element is visible
    await expect(topbar.orgIdElement).toBeVisible();

    // Get the full org ID text (includes "Org ID:" label)
    const fullText = await topbar.orgIdElement.textContent();

    // Verify org ID text is present and not empty
    expect(fullText).toBeTruthy();
    expect(fullText?.trim()).not.toBe('');

    // Verify it contains the "Org ID:" label and an actual ID
    expect(fullText).toContain('Org ID:');

    // Extract just the ID portion and verify format
    const idMatch = fullText?.match(/Org ID:\s*(\S+)/i);
    expect(idMatch).toBeTruthy();

    const orgId = idMatch?.[1];
    expect(orgId).toMatch(/^[\w-]+$/);
  });

  test('should display org ID matching authenticated user (if configured)', async ({ page }) => {
    const topbar = new ChromeTopbar(page);

    // Optional: If ORG_ID environment variable is set, verify it matches
    const expectedOrgId = process.env.ORG_ID;

    // Skip this test variant if ORG_ID is not configured
    test.skip(!expectedOrgId, 'ORG_ID environment variable not set - skipping validation test');

    // Get org ID from UI
    const orgIdText = await topbar.getOrgId();

    // Verify it matches the authenticated user's org ID
    expect(orgIdText).toContain(expectedOrgId);
  });

  test('should get org ID using page object helper method', async ({ page }) => {
    const topbar = new ChromeTopbar(page);

    // Test the getOrgId() helper method
    const orgId = await topbar.getOrgId();

    // Verify we got an org ID back
    expect(orgId).toBeTruthy();
    expect(orgId?.trim()).not.toBe('');

    // Verify it's in the expected format
    expect(orgId?.trim()).toMatch(/^[\w-]+$/);
  });

  test('should confirm org ID visibility using helper method', async ({ page }) => {
    const topbar = new ChromeTopbar(page);

    // Test the isOrgIdVisible() helper method
    const isVisible = await topbar.isOrgIdVisible();

    // Verify the org ID is visible
    expect(isVisible).toBe(true);
  });
});
