import type { Page } from '@playwright/test';

interface FeatureToggle {
  name: string;
  enabled: boolean;
  impressionData: boolean;
  variant: { name: string; enabled: boolean };
}

const CHROME_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE || 'https://stage.foo.redhat.com:1337';

/** Start flag-mocked E2E tests without toggles persisted in the authenticated storage state. */
export async function clearCachedFeatureFlags(page: Page, chromeBaseUrl?: string): Promise<void> {
  const chromeOrigin = new URL(chromeBaseUrl ?? CHROME_BASE_URL).origin;
  await page.addInitScript((expectedOrigin: string) => {
    if (window.location.origin !== expectedOrigin) {
      return;
    }

    try {
      for (let index = localStorage.length - 1; index >= 0; index -= 1) {
        const key = localStorage.key(index);
        if (key?.startsWith('unleash:')) {
          localStorage.removeItem(key);
        }
      }
      localStorage.setItem('chrome:feature-flags:error', 'false');
    } catch {
      // Browser storage may be unavailable.
    }
  }, chromeOrigin);
}

export async function mockFeatureFlags(page: Page, enabledFlags: string[], disabledFlags: string[] = [], chromeBaseUrl?: string): Promise<void> {
  await clearCachedFeatureFlags(page, chromeBaseUrl);
  await page.route('**/api/featureflags/v0**', async (route) => {
    let toggles: FeatureToggle[] = [];
    try {
      const response = await route.fetch();
      toggles = ((await response.json()) as { toggles?: FeatureToggle[] }).toggles ?? [];
    } catch {
      // noop
    }
    const overridden = [...enabledFlags, ...disabledFlags];
    const filtered = toggles.filter((t) => !overridden.includes(t.name));
    for (const name of enabledFlags) {
      filtered.push({ name, enabled: true, impressionData: false, variant: { name: 'disabled', enabled: false } });
    }
    for (const name of disabledFlags) {
      filtered.push({ name, enabled: false, impressionData: false, variant: { name: 'disabled', enabled: false } });
    }
    await route.fulfill({ json: { toggles: filtered } });
  });
}
