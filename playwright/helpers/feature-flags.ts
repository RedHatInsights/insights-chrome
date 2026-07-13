import { Page } from '@playwright/test';

interface FeatureToggle {
  name: string;
  enabled: boolean;
  impressionData: boolean;
  variant: { name: string; enabled: boolean };
}

export async function mockFeatureFlags(page: Page, flags: string[]): Promise<void> {
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
