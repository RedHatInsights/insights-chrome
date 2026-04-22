import { test } from '@playwright/test';

test.describe('Should login and initialize the app', () => {
  test('initializes user session', async ({ page }) => {
    await page.goto('/');
  });
});
