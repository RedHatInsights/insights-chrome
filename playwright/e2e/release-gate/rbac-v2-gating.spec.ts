import { expect, test } from '../../setup/test-setup';
import { mockFeatureFlags } from '../../helpers/feature-flags';

test.describe('RBAC v2 feature flag gating', () => {
  test('should not make v1 RBAC access calls after feature flags are initialized', async ({ page }) => {
    // Inject platform.rbac.workspaces as enabled via Unleash.
    await mockFeatureFlags(page, ['platform.rbac.workspaces']);

    // Initial load — v1 calls during bootstrap are expected (flags not ready yet)
    await page.goto('/insights/dashboard');

    let probeCounter = 0;

    await expect(page.locator('header')).toBeVisible({ timeout: 30000 });
    await page.waitForFunction(() => typeof (window as any).insights?.chrome?.getUserPermissions === 'function', undefined, { timeout: 30000 });

    // Feature flags initialize asynchronously after the Chrome API is available.
    // Until platform.rbac.workspaces is enabled in the Unleash client, fetchPermissions
    // still falls back to v1 RBAC. Probe with throwaway app names until getUserPermissions
    // stops making a v1 call — that proves the flag has taken effect.
    await expect
      .poll(
        async () => {
          const probeApp = `rbac-v2-readiness-probe-${probeCounter++}`;
          let madeV1Call = false;
          const listener = (request: import('@playwright/test').Request) => {
            if (request.url().includes(`/api/rbac/v1/access/?application=${probeApp}`)) {
              madeV1Call = true;
            }
          };
          page.on('request', listener);
          await page.evaluate((app) => (window as any).insights.chrome.getUserPermissions(app, true), probeApp);
          page.off('request', listener);
          return madeV1Call;
        },
        { timeout: 30000 }
      )
      .toBe(false);

    // Flags are ready — a fresh permission check must not hit v1 RBAC.
    const v1RbacCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/rbac/v1/access')) {
        v1RbacCalls.push(request.url());
      }
    });

    await page.evaluate(async () => {
      await (window as any).insights.chrome.getUserPermissions('rbac-v2-gating-test', true);
    });

    expect(v1RbacCalls).toHaveLength(0);
  });
});
