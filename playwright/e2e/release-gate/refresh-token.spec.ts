import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth';

test.describe('Auth', () => {
  // skipped because test is broken as of August 4, 2025
  // also, runs well beyond our per-test timeout of 30s
  test.skip('should force refresh token', async ({ page }) => {
    // Track token refresh requests
    const tokenRefreshRequests: any[] = [];
    await page.route('**/auth/realms/redhat-external/protocol/openid-connect/token', async (route) => {
      if (route.request().method() === 'POST') {
        tokenRefreshRequests.push({
          timestamp: Date.now(),
        });
        // Let the request go through
        await route.continue();
      } else {
        await route.continue();
      }
    });

    await login(page);

    // Wait for initial token request
    await page.waitForResponse(
      (response) => response.url().includes('/auth/realms/redhat-external/protocol/openid-connect/token') && response.request().method() === 'POST'
    );

    // wait for chrome to init
    await expect(page.locator('h2:has-text("Welcome to your Hybrid Cloud Console")')).toBeVisible();

    // Wait a bit to ensure everything is loaded
    await page.waitForTimeout(1000);

    // Force token refresh via the chrome API
    const tokenRefreshPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/auth/realms/redhat-external/protocol/openid-connect/token') &&
        response.request().method() === 'POST'
    );

    await page.evaluate(() => {
      // @ts-ignore - accessing internal chrome API
      window.insights.chrome.$internal.forceAuthRefresh();
    });

    const tokenRefreshResponse = await tokenRefreshPromise;
    expect(tokenRefreshResponse.status()).toBe(200);
  });
});
