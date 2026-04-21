import { test } from '@playwright/test';
import { login } from '../../helpers/auth';

test.describe('Should login and initialize the app', () => {
  test('initializes user session', async ({ page }) => {
    await login(page);
  });
});
