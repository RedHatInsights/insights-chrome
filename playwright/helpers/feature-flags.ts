import { Page } from '@playwright/test';

interface FeatureToggle {
  name: string;
  enabled: boolean;
  impressionData: boolean;
  variant: { name: string; enabled: boolean };
}

export async function mockFeatureFlags(page: Page, enabledFlags: string[], disabledFlags: string[] = []): Promise<void> {
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
