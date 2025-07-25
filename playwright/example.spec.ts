import { expect, test } from '@playwright/test';
import { execSync } from 'child_process';

test('logs in', async ({ page, request }) => {
  execSync(`cat /proc/net/tcp | grep 539`, {
    encoding: 'utf-8',
    stdio: 'inherit',
  });
  execSync(`curl -vvvvv -k https://stage.foo.redhat.com:1337`, {
    encoding: 'utf-8',
    stdio: 'inherit',
  });

  const response = await request.get('/');
  expect(response.ok()).toBeTruthy();

  await page.goto('/');

  await page.locator('id=username-verification').fill(process.env.CHROME_USER!);
  await page.locator('id=login-show-step2').click();
  await page.locator('id=password').fill(process.env.CHROME_PASSWORD!);
  await page.locator('id=rh-password-verification-submit-button').click();

  await expect(page.getByText('Hi, Insights QA')).toBeVisible();
});
