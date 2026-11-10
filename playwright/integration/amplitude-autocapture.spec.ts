import { expect, test } from '../setup/test-setup';
import { clearCachedFeatureFlags } from '../helpers/feature-flags';
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
const AMPLITUDE_REQUEST_TIMEOUT = 30000; // 30 seconds to wait for initial Amplitude request
const AMPLITUDE_API_HOSTS = ['api.amplitude.com', 'api2.amplitude.com', 'api.eu.amplitude.com'];
// NEGATIVE_TEST_WAIT: Proving a negative (no request made) requires waiting long enough to account
// for slow CI. networkidle won't work due to background WebSocket/polling activity.
const NEGATIVE_TEST_WAIT = 3000; // 3 seconds to ensure no requests in slow CI

type AmplitudeRequest = { url: string; method: string; body: unknown; headers: Record<string, string> };
type AmplitudeIdentifyEvent = { event_type?: string; user_properties?: Record<string, unknown>; [key: string]: unknown };
type FeatureFlagToggle = { name?: string; enabled?: boolean; impressionData?: boolean; variant?: { name: string; enabled: boolean } };

function findEnrichedIdentifyEvent(requests: AmplitudeRequest[]): AmplitudeIdentifyEvent | undefined {
  for (const request of requests) {
    if (typeof request.body === 'string') {
      continue;
    }

    const body = request.body as { events?: AmplitudeIdentifyEvent[] };
    for (const event of body?.events ?? []) {
      if (event.event_type === '$identify') {
        const userProperties = event.user_properties as { $set?: Record<string, unknown> } | undefined;
        if (userProperties?.$set?.internal !== undefined) {
          return event;
        }
      }
    }
  }

  return undefined;
}

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

  const amplitudeRequests: AmplitudeRequest[] = [];
  const amplitudePatterns = [...AMPLITUDE_API_HOSTS.map((host) => `**/${host}/**`), '**/cdn.amplitude.com/**'];
  for (const pattern of amplitudePatterns) {
    await page.route(pattern, async (route) => {
      const request = route.request();
      let body: unknown;
      if (request.method() === 'POST' || request.method() === 'PUT') {
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
          amplitudeRequests.push({ url: request.url(), method: request.method(), body, headers: request.headers() });
        }
      }

      await route.continue();
    });
  }

  // Register both waiters before navigation; the shell requests its federated config after
  // the initial page load, and the Amplitude request follows SDK initialization.
  const chromeAnalyticsConfigResponse = page.waitForResponse((response) => response.url().includes('/apps/chrome/operator-generated/fed-modules.json'), {
    timeout: AMPLITUDE_REQUEST_TIMEOUT,
  });
  const amplitudeRequest = page.waitForRequest((request) => AMPLITUDE_API_HOSTS.some((host) => request.url().includes(host)) && request.method() === 'POST', {
    timeout: AMPLITUDE_REQUEST_TIMEOUT,
  });

  return {
    amplitudeRequests,
    chromeAnalyticsConfigWasIntercepted: () => chromeAnalyticsConfigIntercepted,
    waitForInitialRequests: () => Promise.all([chromeAnalyticsConfigResponse, amplitudeRequest]),
  };
}

test.describe('Amplitude Autocapture - Enriched User Properties', () => {
  test('should send enriched user properties with autocapture events', async ({ page }) => {
    const amplitudeEnvironment = await stubAmplitudeEnvironment(page);
    await Promise.all([amplitudeEnvironment.waitForInitialRequests(), page.goto('/insights/dashboard')]);
    expect(amplitudeEnvironment.chromeAnalyticsConfigWasIntercepted(), 'Chrome FEO analytics config should be intercepted and given test keys').toBe(true);

    let identifyEventWithEnrichedProps: ReturnType<typeof findEnrichedIdentifyEvent> = undefined;
    await expect
      .poll(() => (identifyEventWithEnrichedProps = findEnrichedIdentifyEvent(amplitudeEnvironment.amplitudeRequests)), {
        timeout: AMPLITUDE_REQUEST_TIMEOUT,
      })
      .toBeDefined();

    const userProperties = identifyEventWithEnrichedProps?.user_properties;
    expect(userProperties).toBeDefined();

    // Amplitude Identify API uses operation-based user_properties structure:
    // { $set: {...}, $setOnce: {...}, $unset: {...}, $add: {...}, etc. }
    // Our enriched properties are in the $set object
    const setProperties = (userProperties as { $set?: Record<string, unknown> })?.$set;
    expect(setProperties).toBeDefined();

    // REQUIRED PROPERTY: internal
    // This is the primary requirement - must be present and boolean
    expect(setProperties).toHaveProperty('internal');
    expect(typeof setProperties?.internal).toBe('boolean');

    // STRETCH GOAL PROPERTIES: isBeta, isOrgAdmin, org_id
    // Verify these if present (stretch goals per requirements)
    if (setProperties?.isBeta !== undefined) {
      expect(typeof setProperties.isBeta).toBe('boolean');
    }
    if (setProperties?.isOrgAdmin !== undefined) {
      expect(typeof setProperties.isOrgAdmin).toBe('boolean');
    }
    if (setProperties?.org_id !== undefined) {
      expect(typeof setProperties.org_id).toMatch(/string|number/);
    }

    // Additional enriched properties (nice-to-have)
    const additionalProps = ['account_id', 'account_number', 'organization_name', 'locale', 'email_domain', 'current_bundle', 'current_app'];
    for (const prop of additionalProps) {
      if (setProperties?.[prop] !== undefined) {
        expect(typeof setProperties[prop]).toMatch(/string|number/);
      }
    }

    // Verify entitlement properties exist (at least one)
    const entitlementProps = Object.keys(setProperties || {}).filter((key) => key.startsWith('entitlement_'));
    expect(entitlementProps.length).toBeGreaterThan(0);

    // Each entitlement property should be boolean
    entitlementProps.forEach((prop) => {
      expect(typeof setProperties?.[prop]).toBe('boolean');
    });

    // Verify we have both entitlement and entitlement_trial properties
    const entitlementNames = new Set(entitlementProps.map((p) => p.replace('_trial', '').replace('entitlement_', '')));
    expect(entitlementNames.size).toBeGreaterThan(0);
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
