import { expect, test } from '../setup/test-setup';
import { ChromeTopbar } from './pages/chrome-topbar';

const FELT_THEME_CLASS = 'pf-v6-theme-felt';
const FELT_STORAGE_KEY = 'chrome:felt-theme';

test.describe('Theme Toggle — Default / Project Felt', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((key) => localStorage.removeItem(key), FELT_STORAGE_KEY);
    await page.reload();
  });

  test('should show Theme section with Default and Project Felt options', async ({ page }) => {
    const topbar = new ChromeTopbar(page);
    await topbar.openSettings();

    await expect(page.locator('#theme-default')).toBeVisible();
    await expect(page.locator('#theme-felt')).toBeVisible();
  });

  test('should default to Default theme', async ({ page }) => {
    const topbar = new ChromeTopbar(page);
    await topbar.openSettings();

    await expect(page.locator('#theme-default')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).not.toHaveClass(new RegExp(FELT_THEME_CLASS));
  });

  test('should switch to Project Felt theme', async ({ page }) => {
    const topbar = new ChromeTopbar(page);
    await topbar.openSettings();
    await page.locator('#theme-felt').click();

    await expect(page.locator('#theme-felt')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveClass(new RegExp(FELT_THEME_CLASS));

    const stored = await page.evaluate((key) => localStorage.getItem(key), FELT_STORAGE_KEY);
    expect(stored).toBe('true');
  });

  test('should persist Felt theme after page reload', async ({ page }) => {
    const topbar = new ChromeTopbar(page);
    await topbar.openSettings();
    await page.locator('#theme-felt').click();
    await expect(page.locator('html')).toHaveClass(new RegExp(FELT_THEME_CLASS));

    await page.reload();

    await expect(page.locator('html')).toHaveClass(new RegExp(FELT_THEME_CLASS));
  });
});
