import { test, expect } from '../../setup/test-setup';
import { UI_VISIBILITY_TIMEOUT } from '../../setup/constants';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    page.on('load', async () => {
      await page.evaluate(() => document.getElementById('webpack-dev-server-client-overlay')?.remove()).catch(() => {});
    });
  });

  test('visit landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Help')).toBeVisible({ timeout: 45000 });
  });

  test('tooltip is shown when hovering over the gear/question icon', async ({ page }) => {
    await page.goto('/');

    // Wait for the settings button to be present before interacting
    const settingsButton = page.getByRole('button', { name: 'Settings menu' });
    await expect(settingsButton).toBeVisible();

    // Hover over settings button and verify tooltip appears
    await settingsButton.hover();
    const settingsTooltip = page.getByRole('tooltip', { name: 'Settings' });
    await expect(settingsTooltip).toBeVisible({ timeout: UI_VISIBILITY_TIMEOUT });

    // Hover over help button (can be "Toggle help panel" or "Help menu" depending on preview mode)
    const helpButton = page.locator('.tooltip-button-help-cy');
    await expect(helpButton).toBeVisible();
    await helpButton.hover();

    // Verify help tooltip is visible and contains help-related content
    // Tooltip text varies by mode: "Help" (non-preview) or "Learning resources, ..." (preview)
    const helpTooltip = page.getByRole('tooltip', { name: /Learning resources|^Help$/ });
    await expect(helpTooltip).toBeVisible({ timeout: UI_VISIBILITY_TIMEOUT });
  });
});
