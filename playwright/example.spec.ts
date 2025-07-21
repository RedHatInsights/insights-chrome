import { expect, test } from '@playwright/test';

test('logs in', async ({ page }) => {
  await page.goto('/');

  await page.locator('id=username-verification').fill(process.env.CHROME_USER!);
  await page.locator('id=login-show-step2').click();
  await page.locator('id=password').fill(process.env.CHROME_PASSWORD!);
  await page.locator('id=rh-password-verification-submit-button').click();

  await expect(page.getByText('Hi, Insights QA')).toBeVisible();
});
