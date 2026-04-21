import { expect, test } from '@playwright/test';
import { login } from '../../helpers/auth';

test.describe('Auth', () => {
  test('should force refresh token', async ({ page }) => {
    await login(page);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Welcome to your Hybrid Cloud Console', level: 2 })).toBeVisible();

    const tokenResponsePromise = page.waitForResponse((response) => {
      return response.url().includes('/auth/realms/redhat-external/protocol/openid-connect/token') && response.request().method() === 'POST';
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.evaluate(() => (window as any).insights.chrome.$internal.forceAuthRefresh());

    const tokenResponse = await tokenResponsePromise;
    expect(tokenResponse.status()).toBe(200);
  });
});
