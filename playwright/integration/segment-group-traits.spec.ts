import { expect, test } from '../setup/test-setup';
import { clearCachedFeatureFlags } from '../helpers/feature-flags';

/**
 * Segment Group Traits Integration Tests
 *
 * Verifies that the Segment analytics group() call includes the
 * organization_name trait in its payload when sent to the connections
 * API endpoint. The test authenticates via the shared storage state,
 * re-enables analytics (disabled by global setup), then intercepts the
 * Segment SDK's outgoing HTTP requests to /connections/api/v1.
 *
 * RHCLOUD-51915: organization_name was restored to group traits via
 * a getOrganization helper that falls back to the OIDC access token
 * when the profile does not provide the organization name.
 */

// How long to wait for the first Segment request after navigation.
const SEGMENT_REQUEST_TIMEOUT = 30000;
// Extra time for additional batched events to arrive.
const EVENT_BATCH_DELAY = 2000;

interface SegmentGroupPayload {
  type?: string;
  groupId?: string | null;
  traits?: Record<string, unknown>;
  [key: string]: unknown;
}

interface SegmentBatchPayload {
  batch?: SegmentGroupPayload[];
  [key: string]: unknown;
}

test.describe('Segment Group Traits - organization_name', () => {
  test('should include organization_name in group traits sent to the connections endpoint', async ({ page }) => {
    await clearCachedFeatureFlags(page);

    // Re-enable analytics — global setup disables them for other tests
    await page.addInitScript(() => {
      localStorage.removeItem('chrome:analytics:disable');
      localStorage.removeItem('chrome:segment:disable');
    });

    // Collect all Segment API requests hitting the connections endpoint.
    // Also track any POST bodies that fail to parse — binary fields are
    // not expected in a POST to /connections API and should be surfaced.
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
            // Surface parse failures — binary or non-JSON payloads are
            // unexpected for the connections API.
            parseErrors.push({
              url: request.url(),
              error: e instanceof Error ? e.message : String(e),
              rawLength: postData.length,
            });
          }
        }
      }

      // Let the request continue so the SDK doesn't stall
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

    // Fail early if any POST body was unparseable — binary fields are
    // not expected in connections API requests.
    if (parseErrors.length > 0) {
      const details = parseErrors.map((e) => `  ${e.url}: ${e.error} (${e.rawLength} bytes)`).join('\n');
      throw new Error(`Unexpected non-JSON POST(s) to /connections API:\n${details}`);
    }

    // Collect ALL group calls across every captured request.
    // Segment SDK may send group data via:
    //   - POST /connections/api/v1/g  (direct group call)
    //   - POST /connections/api/v1/b  (batch containing type:"group")
    const allGroupTraits: Record<string, unknown>[] = [];

    for (const req of segmentRequests) {
      const payload = req.body as SegmentGroupPayload & SegmentBatchPayload;

      // Direct group endpoint (/g)
      if (payload.type === 'group' && payload.traits) {
        allGroupTraits.push(payload.traits);
      }

      // Batch endpoint (/b) — look inside the batch array
      if (Array.isArray(payload.batch)) {
        for (const item of payload.batch) {
          if (item.type === 'group' && item.traits) {
            allGroupTraits.push(item.traits);
          }
        }
      }
    }

    // At least one group call must have been made
    expect(allGroupTraits.length).toBeGreaterThan(0);

    // Verify organization_name on EVERY group call, not just the first
    for (const [index, groupTraits] of allGroupTraits.entries()) {
      // organization_name MUST be present and be a string
      expect(groupTraits).toHaveProperty('organization_name');
      expect(typeof groupTraits.organization_name).toBe('string');
      expect((groupTraits.organization_name as string).length).toBeGreaterThan(0);

      // Verify other expected group traits are present alongside organization_name
      expect(groupTraits).toHaveProperty('name');
      expect(groupTraits).toHaveProperty('account_number');
      expect(groupTraits).toHaveProperty('cloud_org_id');
      expect(groupTraits).toHaveProperty('email_domain');

      if (allGroupTraits.length > 1) {
        // Log which group call we verified (useful for debugging)
        // eslint-disable-next-line no-console
        console.log(`Group call ${index + 1}/${allGroupTraits.length} — organization_name: "${groupTraits.organization_name}"`);
      }
    }
  });
});
