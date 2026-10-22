import { expect, test } from '../setup/test-setup';
import { clearCachedFeatureFlags } from '../helpers/feature-flags';

/**
 * Segment Identify Traits Integration Tests
 *
 * Verifies that the Segment analytics identify() call uses the Hydra
 * is_internal value for the "internal" trait, NOT the email domain.
 * This aligns Segment behavior with Pendo and Amplitude, which both
 * source the internal flag from the OIDC profile (Hydra).
 *
 * RHCLOUD-52517: The Segment internal trait previously derived from the
 * email domain (matching @redhat.com / @ibm.com), which could disagree
 * with Hydra's is_internal flag. The fix sources internal directly from
 * the ChromeUser identity profile.
 */

// How long to wait for the first Segment request after navigation.
const SEGMENT_REQUEST_TIMEOUT = 30000;
// Maximum time to poll for an identify payload in captured requests.
const IDENTIFY_POLL_TIMEOUT = 10000;

interface SegmentIdentifyPayload {
  type?: string;
  traits?: Record<string, unknown>;
  [key: string]: unknown;
}

interface SegmentBatchPayload {
  batch?: SegmentIdentifyPayload[];
  [key: string]: unknown;
}

/**
 * Extract all identify traits from captured Segment requests.
 */
function extractIdentifyTraits(segmentRequests: { url: string; body: unknown }[]): Record<string, unknown>[] {
  const traits: Record<string, unknown>[] = [];

  for (const req of segmentRequests) {
    const payload = req.body as SegmentIdentifyPayload & SegmentBatchPayload;

    // Direct identify endpoint (/i)
    if (payload.type === 'identify' && payload.traits) {
      traits.push(payload.traits);
    }

    // Batch endpoint (/b) — look inside the batch array
    if (Array.isArray(payload.batch)) {
      for (const item of payload.batch) {
        if (item.type === 'identify' && item.traits) {
          traits.push(item.traits);
        }
      }
    }
  }

  return traits;
}

test.describe('Segment Identify Traits - internal flag', () => {
  test('should include internal trait from Hydra in identify traits sent to the connections endpoint', async ({ page }) => {
    await clearCachedFeatureFlags(page);

    // Re-enable analytics — global setup disables them for other tests
    await page.addInitScript(() => {
      localStorage.removeItem('chrome:analytics:disable');
      localStorage.removeItem('chrome:segment:disable');
    });

    // Collect all Segment API requests hitting the connections endpoint.
    const segmentRequests: { url: string; body: unknown }[] = [];
    const parseErrors: { url: string; error: string; rawLength: number }[] = [];

    await page.route('**/connections/api/v1/**', async (route) => {
      const request = route.request();

      if (request.method() === 'POST') {
        const postData = request.postData();
        if (postData) {
          try {
            const body = JSON.parse(postData);
            segmentRequests.push({ url: request.url(), body });
          } catch (e) {
            parseErrors.push({
              url: request.url(),
              error: e instanceof Error ? e.message : String(e),
              rawLength: postData.length,
            });
          }
        }
      }

      await route.continue();
    });

    // Navigate and wait for the first Segment request
    await Promise.all([
      page.waitForRequest((request) => request.url().includes('/connections/api/v1/') && request.method() === 'POST', {
        timeout: SEGMENT_REQUEST_TIMEOUT,
      }),
      page.goto('/insights/dashboard'),
    ]);

    // Poll for an identify payload instead of a fixed delay. This avoids
    // flaky failures when the identify request arrives after other Segment
    // requests (e.g. a connections POST that completes first).
    await expect
      .poll(() => extractIdentifyTraits(segmentRequests).length, {
        message: 'Expected at least one identify payload in captured Segment requests',
        timeout: IDENTIFY_POLL_TIMEOUT,
        intervals: [250, 500, 1000],
      })
      .toBeGreaterThan(0);

    expect(segmentRequests.length).toBeGreaterThan(0);

    if (parseErrors.length > 0) {
      const details = parseErrors.map((e) => `  ${e.url}: ${e.error} (${e.rawLength} bytes)`).join('\n');
      throw new Error(`Unexpected non-JSON POST(s) to /connections API:\n${details}`);
    }

    const allIdentifyTraits = extractIdentifyTraits(segmentRequests);
    expect(allIdentifyTraits.length).toBeGreaterThan(0);

    // Capture the authenticated user's is_internal value from the Hydra
    // profile via Chrome API. This is the source of truth that
    // SegmentProvider should use for the "internal" trait.
    const hydraIsInternal = await page.evaluate(async () => {
      try {
        const user = await (window as any).insights?.chrome?.auth?.getUser();
        return user?.identity?.user?.is_internal;
      } catch {
        return undefined;
      }
    });

    // Normalize the Hydra value exactly as SegmentProvider does:
    // `user.identity.user?.is_internal ?? false`
    // If the profile omits is_internal, the provider transmits false.
    const expectedInternal = hydraIsInternal ?? false;

    // Verify the internal trait on EVERY identify call
    for (const [index, identifyTraits] of allIdentifyTraits.entries()) {
      // internal MUST be present and be a boolean
      expect(identifyTraits).toHaveProperty('internal');
      expect(typeof identifyTraits.internal).toBe('boolean');

      // Assert the transmitted trait matches the normalized Hydra value,
      // proving Segment uses Hydra's is_internal — not the email domain.
      expect(identifyTraits.internal).toBe(expectedInternal);

      // Verify other expected identify traits are present
      expect(identifyTraits).toHaveProperty('email_domain');
      expect(identifyTraits).toHaveProperty('cloud_user_id');

      if (allIdentifyTraits.length > 1) {
        console.log(`Identify call ${index + 1}/${allIdentifyTraits.length} — internal: ${identifyTraits.internal}`);
      }
    }
  });
});
