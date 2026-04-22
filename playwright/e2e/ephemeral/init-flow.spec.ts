import { test } from '../../setup/test-setup';

test.describe('Should login and initialize the app', () => {
  test('initializes user session', async ({ page }) => {
    await page.goto('/');
  });
});
