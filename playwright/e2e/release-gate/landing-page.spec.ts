import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth';

test.describe('Landing page', () => {
  test('visit landing page', async ({ page }) => {
    await login(page);
    await expect(page.getByText('Help')).toBeVisible({ timeout: 45000 });
  });

  test('tooltip is shown when hovering over the gear/question icon', async ({ page }) => {
    await login(page);

    // Wait for the settings tooltip button to be present before interacting
    const settingsButton = page.locator('.tooltip-button-settings-cy');
    await expect(settingsButton).toBeVisible();
    await settingsButton.hover();

    // Verify settings tooltip is visible
    const settingsTooltip = page.locator('.tooltip-inner-settings-cy');
    await expect(settingsTooltip).toBeVisible();
    await expect(settingsTooltip).toContainText('Settings');

    // Hover over help button
    const helpButton = page.locator('.tooltip-button-help-cy');
    await expect(helpButton).toBeVisible();
    await helpButton.hover();

    // Verify help tooltip is visible
    const helpTooltip = page.locator('.tooltip-inner-help-cy');
    await expect(helpTooltip).toBeVisible();
    await expect(helpTooltip).toContainText('Learning resources, API documentation, Support Case Management, Ask Red Hat assistant, and more.');
  });
});
