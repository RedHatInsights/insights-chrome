import { expect, test } from '../setup/test-setup';
import { ChromeTopbar } from './pages/chrome-topbar';

const HIGH_CONTRAST_CLASS = 'pf-v6-theme-high-contrast';
const GLASS_THEME_CLASS = 'pf-v6-theme-glass';
const HIGH_CONTRAST_STORAGE_KEY = 'chrome:high-contrast';
const GLASS_STORAGE_KEY = 'chrome:glass-theme';

test.describe('Contrast Mode — System / Default / High Contrast / Glass', () => {
  const REQUIRED_FLAGS = ['platform.chrome.high-contrast', 'platform.chrome.glass-theme'];

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/featureflags/v0**', async (route) => {
      let toggles: object[] = [];
      try {
        const response = await route.fetch();
        toggles = ((await response.json()) as { toggles?: object[] }).toggles ?? [];
      } catch {
        // noop
      }
      const filtered = toggles.filter((t: { name?: string }) => !REQUIRED_FLAGS.includes(t.name ?? ''));
      for (const name of REQUIRED_FLAGS) {
        filtered.push({ name, enabled: true, impressionData: false, variant: { name: 'disabled', enabled: false } });
      }
      await route.fulfill({ json: { toggles: filtered } });
    });
    await page.goto('/');
    await page.evaluate(
      ([hcKey, glassKey]) => {
        localStorage.removeItem(hcKey);
        localStorage.removeItem(glassKey);
      },
      [HIGH_CONTRAST_STORAGE_KEY, GLASS_STORAGE_KEY] as [string, string]
    );
    await page.reload();
  });

  test('should show Contrast mode section with all options', async ({ page }) => {
    const topbar = new ChromeTopbar(page);
    await topbar.openSettings();

    await expect(page.locator('#contrast-system')).toBeVisible();
    await expect(page.locator('#contrast-default')).toBeVisible();
    await expect(page.locator('#contrast-high')).toBeVisible();
    await expect(page.locator('#contrast-glass')).toBeVisible();
  });

  test('should switch to Default contrast', async ({ page }) => {
    const topbar = new ChromeTopbar(page);
    await topbar.openSettings();
    await page.locator('#contrast-default').click();

    await expect(page.locator('#contrast-default')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).not.toHaveClass(new RegExp(HIGH_CONTRAST_CLASS));
    await expect(page.locator('html')).not.toHaveClass(new RegExp(GLASS_THEME_CLASS));

    const stored = await page.evaluate((key) => localStorage.getItem(key), HIGH_CONTRAST_STORAGE_KEY);
    expect(stored).toBe('default');
  });

  test('should switch to High contrast mode', async ({ page }) => {
    const topbar = new ChromeTopbar(page);
    await topbar.openSettings();
    await page.locator('#contrast-high').click();

    await expect(page.locator('#contrast-high')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveClass(new RegExp(HIGH_CONTRAST_CLASS));

    const stored = await page.evaluate((key) => localStorage.getItem(key), HIGH_CONTRAST_STORAGE_KEY);
    expect(stored).toBe('high');
  });

  test('should switch to Glass mode', async ({ page }) => {
    const topbar = new ChromeTopbar(page);
    await topbar.openSettings();
    await page.locator('#contrast-glass').click();

    await expect(page.locator('#contrast-glass')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveClass(new RegExp(GLASS_THEME_CLASS));
    await expect(page.locator('html')).not.toHaveClass(new RegExp(HIGH_CONTRAST_CLASS));

    const stored = await page.evaluate((key) => localStorage.getItem(key), GLASS_STORAGE_KEY);
    expect(stored).toBe('true');
  });

  test('should switch to System contrast', async ({ page }) => {
    const topbar = new ChromeTopbar(page);
    await topbar.openSettings();
    await page.locator('#contrast-system').click();

    await expect(page.locator('#contrast-system')).toHaveAttribute('aria-pressed', 'true');

    const stored = await page.evaluate((key) => localStorage.getItem(key), HIGH_CONTRAST_STORAGE_KEY);
    expect(stored).toBe('system');
  });

  test('Glass and High contrast should be mutually exclusive', async ({ page }) => {
    const topbar = new ChromeTopbar(page);
    const html = page.locator('html');
    await topbar.openSettings();

    await page.locator('#contrast-high').click();
    await expect(html).toHaveClass(new RegExp(HIGH_CONTRAST_CLASS));
    await expect(html).not.toHaveClass(new RegExp(GLASS_THEME_CLASS));

    await page.locator('#contrast-glass').click();
    await expect(html).toHaveClass(new RegExp(GLASS_THEME_CLASS));
    await expect(html).not.toHaveClass(new RegExp(HIGH_CONTRAST_CLASS));

    await page.locator('#contrast-high').click();
    await expect(html).toHaveClass(new RegExp(HIGH_CONTRAST_CLASS));
    await expect(html).not.toHaveClass(new RegExp(GLASS_THEME_CLASS));
  });

  test('should persist High contrast after page reload', async ({ page }) => {
    const topbar = new ChromeTopbar(page);
    await topbar.openSettings();
    await page.locator('#contrast-high').click();
    await expect(page.locator('html')).toHaveClass(new RegExp(HIGH_CONTRAST_CLASS));

    await page.reload();
    await topbar.openSettings();

    await expect(page.locator('html')).toHaveClass(new RegExp(HIGH_CONTRAST_CLASS));
  });

  test('should persist Glass mode after page reload', async ({ page }) => {
    const topbar = new ChromeTopbar(page);
    await topbar.openSettings();
    await page.locator('#contrast-glass').click();
    await expect(page.locator('html')).toHaveClass(new RegExp(GLASS_THEME_CLASS));

    await page.reload();
    await topbar.openSettings();

    await expect(page.locator('html')).toHaveClass(new RegExp(GLASS_THEME_CLASS));
  });

  test('switching from Glass to Default should remove glass class', async ({ page }) => {
    const topbar = new ChromeTopbar(page);
    await topbar.openSettings();
    await page.locator('#contrast-glass').click();
    await expect(page.locator('html')).toHaveClass(new RegExp(GLASS_THEME_CLASS));

    await page.locator('#contrast-default').click();
    await expect(page.locator('html')).not.toHaveClass(new RegExp(GLASS_THEME_CLASS));
    await expect(page.locator('html')).not.toHaveClass(new RegExp(HIGH_CONTRAST_CLASS));
  });
});
