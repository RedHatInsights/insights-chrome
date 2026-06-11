import { expect, test } from '../../setup/test-setup';

test.describe('RBAC v2 feature flag gating', () => {
  test('should not make v1 RBAC access calls after feature flags are initialized', async ({ page }) => {
    // Intercept Unleash feature flags and inject platform.rbac.workspaces as enabled
    await page.route('**/api/featureflags/v0**', async (route) => {
      let toggles: object[] = [];
      try {
        const response = await route.fetch();
        const body = await response.json();
        toggles = body.toggles || [];
      } catch {
        // Feature flags endpoint may not return valid JSON in some environments
      }

      const filtered = toggles.filter((t: { name?: string }) => t.name !== 'platform.rbac.workspaces');
      filtered.push({
        name: 'platform.rbac.workspaces',
        enabled: true,
        impressionData: false,
        variant: { name: 'disabled', enabled: false },
      });

      await route.fulfill({
        json: { toggles: filtered },
      });
    });

    // Initial load — v1 calls during bootstrap are expected (flags not ready yet)
    await page.goto('/insights/dashboard');
    await page.waitForLoadState('networkidle');

    // After full initialization, track new v1 RBAC calls
    const v1RbacCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/rbac/v1/access')) {
        v1RbacCalls.push(request.url());
      }
    });

    // Trigger a fresh permission check via Chrome API (bypassCache=true)
    // This exercises fetchPermissions after the Unleash client is initialized
    await page.evaluate(async () => {
      await (window as any).insights.chrome.getUserPermissions('rbac-v2-gating-test', true);
    });

    expect(v1RbacCalls).toHaveLength(0);
  });
});
