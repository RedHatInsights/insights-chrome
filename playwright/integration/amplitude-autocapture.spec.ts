import { expect, test } from '../setup/test-setup';
import { clearCachedFeatureFlags } from '../helpers/feature-flags';
import { getAppIdentifyEvent } from '../helpers/amplitude-identify';
import { gunzipSync } from 'zlib';
import type { Page } from '@playwright/test';

/**
 * Amplitude Autocapture Integration Tests
 *
 * These tests verify that Amplitude autocapture is properly initialized
 * with enriched user properties and context information. The autocapture
 * functionality is gated by the 'platform.chrome.analytics.amplitude.autocapture'
 * feature flag.
 *
 * Requirements: Validate that user properties including organization context,
 * user context, application context, and entitlements are correctly sent to
 * Amplitude with autocapture events.
 */

// Test configuration constants
const IDENTIFY_TIMEOUT = 30_000; // Allow the dashboard route to mount and the SDK to flush a follow-up batch.
const AMPLITUDE_API_HOSTS = ['api.amplitude.com', 'api2.amplitude.com', 'api.eu.amplitude.com'];
// NEGATIVE_TEST_WAIT: Proving a negative (no request made) requires waiting long enough to account
// for slow CI. networkidle won't work due to background WebSocket/polling activity.
const NEGATIVE_TEST_WAIT = 3000; // 3 seconds to ensure no requests in slow CI

type FeatureFlagToggle = { name?: string; enabled?: boolean; impressionData?: boolean; variant?: { name: string; enabled: boolean } };

async function stubAmplitudeEnvironment(page: Page) {
  await clearCachedFeatureFlags(page);

  // Global setup disables analytics; re-enable it for this test.
  await page.addInitScript(() => {
    localStorage.removeItem('chrome:analytics:disable');
    localStorage.removeItem('chrome:segment:disable');
  });

  let chromeAnalyticsConfigIntercepted = false;
  await page.route('**/apps/chrome/operator-generated/fed-modules.json**', async (route) => {
    // The generated endpoint can return an edge 403 to route.fetch() in stage, so provide
    // the Chrome analytics override directly instead of relying on the live response.
    chromeAnalyticsConfigIntercepted = true;
    await route.fulfill({
      json: {
        chrome: {
          // loadFedModules replaces the entire chrome entry; keep its federated manifest usable.
          manifestLocation: '/apps/chrome/js/fed-mods.json',
          analytics: {
            APIKey: 'test-amplitude-engagement-key-prod',
            APIKeyDev: 'test-amplitude-engagement-key-dev',
            autocaptureAPIKey: 'test-amplitude-autocapture-key-prod',
            autocaptureAPIKeyDev: 'test-amplitude-autocapture-key-dev',
          },
        },
      },
    });
  });

  await page.route('**/api/featureflags/v0**', async (route) => {
    let toggles: FeatureFlagToggle[] = [];
    try {
      const response = await route.fetch();
      const body = await response.json();
      toggles = body.toggles || [];
    } catch {
      // Feature flags endpoint may not return valid JSON in some environments.
      toggles = [];
    }

    const filtered = toggles.filter(
      (toggle) => toggle.name !== 'platform.chrome.analytics.amplitude' && toggle.name !== 'platform.chrome.analytics.amplitude.autocapture'
    );
    filtered.push(
      {
        name: 'platform.chrome.analytics.amplitude',
        enabled: true,
        impressionData: false,
        variant: { name: 'disabled', enabled: false },
      },
      {
        name: 'platform.chrome.analytics.amplitude.autocapture',
        enabled: true,
        impressionData: false,
        variant: { name: 'disabled', enabled: false },
      }
    );

    await route.fulfill({ json: { toggles: filtered } });
  });

  const requestBodies: unknown[] = [];
  for (const host of AMPLITUDE_API_HOSTS) {
    await page.route(`**/${host}/**`, async (route) => {
      const request = route.request();
      let body: unknown;
      if (request.method() === 'POST') {
        const postDataBuffer = request.postDataBuffer();
        if (postDataBuffer) {
          try {
            body = JSON.parse(postDataBuffer.toString('utf-8'));
          } catch {
            try {
              body = JSON.parse(gunzipSync(postDataBuffer).toString('utf-8'));
            } catch {
              body = postDataBuffer.toString('utf-8', 0, 100);
            }
          }
          requestBodies.push(body);
        }
      }

      await route.continue();
    });
  }

  return { requestBodies, chromeAnalyticsConfigWasIntercepted: () => chromeAnalyticsConfigIntercepted };
}

test.describe('Amplitude Autocapture - Enriched User Properties', () => {
  test('should send enriched user properties with autocapture events', async ({ page }) => {
    // Budget for page setup/navigation separately so the identify wait can report its own timeout.
    test.setTimeout(test.info().timeout + IDENTIFY_TIMEOUT);
    const { requestBodies, chromeAnalyticsConfigWasIntercepted } = await stubAmplitudeEnvironment(page);
    await page.goto('/insights/dashboard', { waitUntil: 'domcontentloaded' });

    let appIdentify!: ReturnType<typeof getAppIdentifyEvent>;
    await expect(() => {
      appIdentify = getAppIdentifyEvent(requestBodies);
    }).toPass({ timeout: IDENTIFY_TIMEOUT });
    expect(chromeAnalyticsConfigWasIntercepted(), 'Chrome FEO analytics config should be intercepted and given test keys').toBe(true);

    const userProperties = appIdentify.user_properties;
    expect(userProperties).toBeDefined();

    // Amplitude Identify API uses operation-based user_properties structure:
    // { $set: {...}, $setOnce: {...}, $unset: {...}, $add: {...}, etc. }
    // Our enriched properties are in the $set object
    const setProperties = userProperties?.$set;
    expect(setProperties).toBeDefined();

    expect(setProperties).toEqual(
      expect.objectContaining({
        internal: expect.any(Boolean),
        isBeta: expect.any(Boolean),
        org_id: expect.any(String),
        account_id: expect.any(String),
        account_number: expect.any(String),
        current_bundle: 'insights',
        current_app: expect.any(String),
      })
    );
    expect(setProperties?.org_id).not.toBe('');
    expect(setProperties?.account_id).not.toBe('');
    expect(setProperties?.account_number).not.toBe('');
    expect(setProperties?.current_app).not.toBe('');
    expect(appIdentify.user_id).toBe(setProperties?.account_id);

    const entitlementNames = Object.keys(setProperties || {})
      .filter((key) => key.startsWith('entitlement_') && !key.endsWith('_trial'))
      .map((key) => key.slice('entitlement_'.length));
    expect(entitlementNames.length).toBeGreaterThan(0);
    for (const entitlementName of entitlementNames) {
      const entitledKey = `entitlement_${entitlementName}`;
      const trialKey = `${entitledKey}_trial`;
      expect(setProperties).toHaveProperty(trialKey);
      expect(typeof setProperties?.[entitledKey]).toBe('boolean');
      expect(typeof setProperties?.[trialKey]).toBe('boolean');
    }
  });

  test('should not send Amplitude requests when feature flag is disabled', async ({ page }) => {
    await clearCachedFeatureFlags(page);

    // Intercept Unleash feature flags and DISABLE Amplitude autocapture
    await page.route('**/api/featureflags/v0**', async (route) => {
      let toggles: object[] = [];
      try {
        const response = await route.fetch();
        const body = await response.json();
        toggles = body.toggles || [];
      } catch {
        toggles = [];
      }

      // Remove existing Amplitude flags and inject them as DISABLED
      const filtered = toggles.filter(
        (t: { name?: string }) => t.name !== 'platform.chrome.analytics.amplitude' && t.name !== 'platform.chrome.analytics.amplitude.autocapture'
      );

      filtered.push(
        {
          name: 'platform.chrome.analytics.amplitude',
          enabled: false,
          impressionData: false,
          variant: { name: 'disabled', enabled: false },
        },
        {
          name: 'platform.chrome.analytics.amplitude.autocapture',
          enabled: false,
          impressionData: false,
          variant: { name: 'disabled', enabled: false },
        }
      );

      await route.fulfill({
        json: { toggles: filtered },
      });
    });

    // Track Amplitude API requests
    const amplitudeRequests: string[] = [];
    await page.route('**/api.amplitude.com/**', async (route) => {
      amplitudeRequests.push(route.request().url());
      await route.continue();
    });

    await page.route('**/api2.amplitude.com/**', async (route) => {
      amplitudeRequests.push(route.request().url());
      await route.continue();
    });

    // Navigate to a page
    await page.goto('/insights/dashboard');

    // Wait to ensure no Amplitude requests are made
    await page.waitForTimeout(NEGATIVE_TEST_WAIT);

    // Verify that NO Amplitude requests were made
    expect(amplitudeRequests.length).toBe(0);
  });
});
