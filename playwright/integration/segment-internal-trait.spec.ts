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
// Extra time for additional batched events to arrive.
const EVENT_BATCH_DELAY = 2000;

interface SegmentIdentifyPayload {
  type?: string;
  traits?: Record<string, unknown>;
  [key: string]: unknown;
}

interface SegmentBatchPayload {
  batch?: SegmentIdentifyPayload[];
  [key: string]: unknown;
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

    // Allow event batching to complete
    await page.waitForTimeout(EVENT_BATCH_DELAY);

    expect(segmentRequests.length).toBeGreaterThan(0);

    if (parseErrors.length > 0) {
      const details = parseErrors.map((e) => `  ${e.url}: ${e.error} (${e.rawLength} bytes)`).join('\n');
      throw new Error(`Unexpected non-JSON POST(s) to /connections API:\n${details}`);
    }

    // Collect ALL identify calls across every captured request.
    // Segment SDK may send identify data via:
    //   - POST /connections/api/v1/i  (direct identify call)
    //   - POST /connections/api/v1/b  (batch containing type:"identify")
    const allIdentifyTraits: Record<string, unknown>[] = [];

    for (const req of segmentRequests) {
      const payload = req.body as SegmentIdentifyPayload & SegmentBatchPayload;

      // Direct identify endpoint (/i)
      if (payload.type === 'identify' && payload.traits) {
        allIdentifyTraits.push(payload.traits);
      }

      // Batch endpoint (/b) — look inside the batch array
      if (Array.isArray(payload.batch)) {
        for (const item of payload.batch) {
          if (item.type === 'identify' && item.traits) {
            allIdentifyTraits.push(item.traits);
          }
        }
      }
    }

    // At least one identify call must have been made
    expect(allIdentifyTraits.length).toBeGreaterThan(0);

    // Verify the internal trait is a boolean on EVERY identify call
    for (const [index, identifyTraits] of allIdentifyTraits.entries()) {
      // internal MUST be present and be a boolean
      expect(identifyTraits).toHaveProperty('internal');
      expect(typeof identifyTraits.internal).toBe('boolean');

      // Verify other expected identify traits are present
      expect(identifyTraits).toHaveProperty('email_domain');
      expect(identifyTraits).toHaveProperty('cloud_user_id');

      if (allIdentifyTraits.length > 1) {
        // eslint-disable-next-line no-console
        console.log(`Identify call ${index + 1}/${allIdentifyTraits.length} — internal: ${identifyTraits.internal}`);
      }
    }
  });
});
