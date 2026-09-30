import type { Page } from '@playwright/test';

interface FeatureToggle {
  name: string;
  enabled: boolean;
  impressionData: boolean;
  variant: { name: string; enabled: boolean };
}

/** Start flag-mocked E2E tests without toggles persisted in the authenticated storage state. */
export async function clearCachedFeatureFlags(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('unleash:')) {
          localStorage.removeItem(key);
        }
      }
      localStorage.setItem('chrome:feature-flags:error', 'false');
    } catch {
      // Some cross-origin frames do not expose localStorage.
    }
  });
}

export async function mockFeatureFlags(page: Page, flags: string[]): Promise<void> {
  await clearCachedFeatureFlags(page);
  await page.route('**/api/featureflags/v0**', async (route) => {
    let toggles: FeatureToggle[] = [];
    try {
      const response = await route.fetch();
      toggles = ((await response.json()) as { toggles?: FeatureToggle[] }).toggles ?? [];
    } catch {
      // noop
    }
    const filtered = toggles.filter((t) => !flags.includes(t.name));
    for (const name of flags) {
      filtered.push({ name, enabled: true, impressionData: false, variant: { name: 'disabled', enabled: false } });
    }
    await route.fulfill({ json: { toggles: filtered } });
  });
}
