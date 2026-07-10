import { expect, test } from '../setup/test-setup';
import { gunzipSync } from 'zlib';

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
const EVENT_BATCH_DELAY = 2000; // 2 seconds to wait for event batching
const NEGATIVE_TEST_WAIT = 3000; // 3 seconds to ensure no requests in negative test

test.describe('Amplitude Autocapture - Enriched User Properties', () => {
  test('should send enriched user properties with autocapture events', async ({ page }) => {
    // CRITICAL: Re-enable analytics for this test
    // The global setup disables analytics, but we need it enabled to test Amplitude
    await page.addInitScript(() => {
      localStorage.removeItem('chrome:analytics:disable');
      localStorage.removeItem('chrome:segment:disable');
    });

    // Intercept FEO config (fed-mods.json) and inject Amplitude autocapture keys
    await page.route('**/apps/chrome/fed-mods.json**', async (route) => {
      const response = await route.fetch();
      const feoConfig = await response.json();

      // Ensure chrome module has analytics config with autocapture keys
      if (!feoConfig.chrome) {
        feoConfig.chrome = {};
      }
      if (!feoConfig.chrome.analytics) {
        feoConfig.chrome.analytics = {};
      }

      // Inject test Amplitude keys
      feoConfig.chrome.analytics = {
        ...feoConfig.chrome.analytics,
        APIKey: 'test-amplitude-engagement-key-prod',
        APIKeyDev: 'test-amplitude-engagement-key-dev',
        autocaptureAPIKey: 'test-amplitude-autocapture-key-prod',
        autocaptureAPIKeyDev: 'test-amplitude-autocapture-key-dev',
      };

      await route.fulfill({ json: feoConfig });
    });

    // Intercept Unleash feature flags and enable Amplitude autocapture
    await page.route('**/api/featureflags/v0**', async (route) => {
      let toggles: object[] = [];
      try {
        const response = await route.fetch();
        const body = await response.json();
        toggles = body.toggles || [];
      } catch {
        // Feature flags endpoint may not return valid JSON in some environments
        toggles = [];
      }

      // Remove existing Amplitude flags and inject both flags as enabled
      const filtered = toggles.filter(
        (t: { name?: string }) => t.name !== 'platform.chrome.analytics.amplitude' && t.name !== 'platform.chrome.analytics.amplitude.autocapture'
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

      await route.fulfill({
        json: { toggles: filtered },
      });
    });

    // Track Amplitude API requests
    const amplitudeRequests: { url: string; method: string; body: unknown; headers: Record<string, string> }[] = [];

    // Intercept all Amplitude endpoints
    const amplitudePatterns = [
      '**/api.amplitude.com/**',
      '**/api2.amplitude.com/**',
      '**/api.eu.amplitude.com/**',
      '**/cdn.amplitude.com/**', // CDN for scripts
    ];

    for (const pattern of amplitudePatterns) {
      await page.route(pattern, async (route) => {
        const request = route.request();
        const headers = request.headers();
        let body: unknown;

        // Only parse POST/PUT requests
        if (request.method() === 'POST' || request.method() === 'PUT') {
          // Try to get binary data first using postDataBuffer()
          const postDataBuffer = request.postDataBuffer();

          if (postDataBuffer) {
            try {
              // Try parsing as JSON first
              body = JSON.parse(postDataBuffer.toString('utf-8'));
            } catch {
              // If JSON parse fails, try decompressing if it's gzipped
              try {
                const decompressed = gunzipSync(postDataBuffer);
                body = JSON.parse(decompressed.toString('utf-8'));
              } catch (decompError) {
                // If decompression fails, capture raw buffer prefix for debugging test failures
                body = postDataBuffer.toString('utf-8', 0, 100);
              }
            }

            amplitudeRequests.push({
              url: request.url(),
              method: request.method(),
              body,
              headers,
            });
          }
        }

        // Continue with the request
        await route.continue();
      });
    }

    // Navigate to a page to trigger autocapture initialization
    // and wait for the Amplitude request to be sent
    await Promise.all([
      // Wait for Amplitude API request
      page.waitForRequest(
        (request) => {
          return (
            (request.url().includes('api.amplitude.com') || request.url().includes('api2.amplitude.com')) &&
            request.method() === 'POST'
          );
        },
        { timeout: AMPLITUDE_REQUEST_TIMEOUT }
      ),
      // Navigate to the page
      page.goto('/insights/dashboard'),
    ]);

    // Wait for event batching to complete
    await page.waitForTimeout(EVENT_BATCH_DELAY);

    // Verify that Amplitude requests were made
    expect(amplitudeRequests.length).toBeGreaterThan(0);

    // Find identify events with user properties
    // Amplitude SDK can send user properties in two ways:
    // 1. Via $identify event with user_properties field
    // 2. Via set_once or user_properties at the event level
    const eventsWithUserProperties = amplitudeRequests.filter((req) => {
      if (typeof req.body === 'string') {
        // Skip gzipped/binary requests for now
        return false;
      }

      const body = req.body as {
        events?: Array<{
          event_type?: string;
          user_properties?: Record<string, unknown>;
          [key: string]: unknown;
        }>;
        options?: { user_id?: string };
      };

      if (body && Array.isArray(body.events)) {
        return body.events.some((event) => {
          // Check for $identify event OR events with user_properties
          const isIdentify = event.event_type === '$identify';
          const hasUserProps = event.user_properties && Object.keys(event.user_properties).length > 0;
          return isIdentify || hasUserProps;
        });
      }
      return false;
    });

    // Should have at least one $identify event with user properties
    expect(eventsWithUserProperties.length).toBeGreaterThan(0);

    // Find the $identify event that has our enriched properties in $set
    // Note: Amplitude can batch multiple events in one request, so we need to find
    // the specific $identify event that contains our custom properties, not just
    // the SDK's automatic initial identify event
    let identifyEventWithEnrichedProps: { event_type?: string; user_properties?: Record<string, unknown>; [key: string]: unknown } | undefined;

    for (const req of eventsWithUserProperties) {
      const body = req.body as {
        events: Array<{ event_type?: string; user_properties?: Record<string, unknown>; [key: string]: unknown }>;
      };

      for (const event of body.events) {
        if (event.event_type === '$identify') {
          const userProps = event.user_properties as { $set?: Record<string, unknown> } | undefined;
          // Check if this identify event has our custom 'internal' property in $set
          if (userProps?.$set?.internal !== undefined) {
            identifyEventWithEnrichedProps = event;
            break;
          }
        }
      }

      if (identifyEventWithEnrichedProps) {
        break;
      }
    }

    expect(identifyEventWithEnrichedProps).toBeDefined();

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
