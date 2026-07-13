import { expect, test } from '../setup/test-setup';
import { ChromeTopbar } from './pages/chrome-topbar';
import { mockFeatureFlags } from '../helpers/feature-flags';

const DARK_THEME_CLASS = 'pf-v6-theme-dark';
const THEME_STORAGE_KEY = 'chrome:theme';

test.describe('Color Scheme — Light / Dark / System', () => {
  test.beforeEach(async ({ page }) => {
    await mockFeatureFlags(page, ['platform.chrome.dark-mode', 'platform.chrome.dark-mode_system']);
    await page.goto('/');
    await page.evaluate((key) => localStorage.removeItem(key), THEME_STORAGE_KEY);
    await page.reload();
  });

  test('should show Color scheme section with System, Light, and Dark options', async ({ page }) => {
    const topbar = new ChromeTopbar(page);
    await topbar.openSettings();

    await expect(page.locator('#color-scheme-system')).toBeVisible();
    await expect(page.locator('#color-scheme-light')).toBeVisible();
    await expect(page.locator('#color-scheme-dark')).toBeVisible();
  });

  test('should switch to Light mode', async ({ page }) => {
    const topbar = new ChromeTopbar(page);
    await topbar.openSettings();
    await page.locator('#color-scheme-light').click();

    await expect(page.locator('#color-scheme-light')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).not.toHaveClass(new RegExp(DARK_THEME_CLASS));

    const stored = await page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY);
    expect(stored).toBe('light');
  });

  test('should switch to Dark mode', async ({ page }) => {
    const topbar = new ChromeTopbar(page);
    await topbar.openSettings();
    await page.locator('#color-scheme-dark').click();

    await expect(page.locator('#color-scheme-dark')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveClass(new RegExp(DARK_THEME_CLASS));

    const stored = await page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY);
    expect(stored).toBe('dark');
  });

  test('should switch to System mode', async ({ page }) => {
    const topbar = new ChromeTopbar(page);
    await topbar.openSettings();
    await page.locator('#color-scheme-system').click();

    await expect(page.locator('#color-scheme-system')).toHaveAttribute('aria-pressed', 'true');

    const stored = await page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY);
    expect(stored).toBe('system');
  });

  test('should toggle from Dark to Light', async ({ page }) => {
    await page.evaluate((key) => localStorage.setItem(key, 'dark'), THEME_STORAGE_KEY);
    await page.reload();

    const topbar = new ChromeTopbar(page);
    await topbar.openSettings();
    await expect(page.locator('html')).toHaveClass(new RegExp(DARK_THEME_CLASS));
    await page.locator('#color-scheme-light').click();

    await expect(page.locator('html')).not.toHaveClass(new RegExp(DARK_THEME_CLASS));
  });

  test('should persist Dark mode after page reload', async ({ page }) => {
    const topbar = new ChromeTopbar(page);
    await topbar.openSettings();
    await page.locator('#color-scheme-dark').click();
    await expect(page.locator('html')).toHaveClass(new RegExp(DARK_THEME_CLASS));

    await page.reload();
    await topbar.openSettings();

    await expect(page.locator('html')).toHaveClass(new RegExp(DARK_THEME_CLASS));
  });
});
