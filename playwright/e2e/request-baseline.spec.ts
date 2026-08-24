/**
 * Akamai Request Baseline — Landing Page Request Counts
 *
 * Measures HTTP requests during initial page load for each major HCC bundle
 * landing page, with special focus on Kessel API calls.
 *
 * Context: Akamai DDoS protection triggered on console.redhat.com due to
 * excessive Kessel API traffic (/api/kessel/v1beta2/checkself and
 * /checkselfbulk). The kessel path was excluded from rate limiting as a fix.
 * This test prevents regression by asserting request counts stay within
 * safe thresholds.
 *
 * Run:
 *   E2E_USER=you@redhat.com E2E_PASSWORD=... npx playwright test request-baseline
 */

import { expect, test } from "../setup/test-setup";
import { PAGE_RENDER_TIMEOUT } from "./constants";

/**
 * Thresholds — baselined 2026-08-23 against console.stage.redhat.com.
 *
 * Set to observed maximum + 20% headroom so the test catches regressions
 * without failing on the current state. Tighten as dedup work lands.
 *
 * Observed maximums (2026-08-23):
 *   Kessel: 8 (Settings, IAM — 7 duplicate checkself + 1 checkselfbulk)
 *   API:    45 (IAM My Access — includes double bootstrap from redirect)
 *
 * KESSEL_THRESHOLD: max kessel HTTP calls (checkself + checkselfbulk) per
 * landing page. The outage was caused by kessel traffic that was
 * "outrageously over the threshold."
 *
 * API_THRESHOLD: max total /api/* requests per landing page (all APIs
 * combined: chrome-service, rbac, entitlements, kessel, featureflags, etc.)
 */
const KESSEL_THRESHOLD = 10;
const API_THRESHOLD = 55;

interface CapturedRequest {
  url: string;
  method: string;
  resourceType: string;
}

function classifyRequest(req: CapturedRequest): string {
  const url = req.url;
  if (/\/api\/kessel\/.*checkselfbulk/.test(url)) return "Kessel checkselfbulk";
  if (/\/api\/kessel\/.*checkself/.test(url)) return "Kessel checkself";
  if (/\/api\/kessel\//.test(url)) return "Kessel (other)";
  if (/\/api\/rbac\//.test(url)) return "RBAC API";
  if (/\/api\/chrome-service\//.test(url)) return "Chrome Service API";
  if (/\/api\/entitlements\//.test(url)) return "Entitlements API";
  if (/\/api\/featureflags\//.test(url)) return "Feature Flags";
  if (/\/api\//.test(url)) return "Other API";
  if (/sso\.|\/auth\/realms\//.test(url)) return "Auth (SSO)";
  if (/segment|amplitude|pendo|sentry/.test(url)) return "Analytics";
  if (/trustarc|teconsent|consent/.test(url)) return "Consent";
  if (/fed-mod|remoteEntry/.test(url)) return "Module Federation";
  if (/\/connections\//.test(url)) return "Analytics Proxy";
  if (["script", "stylesheet", "font", "image"].includes(req.resourceType)) return "Static Asset";
  return "Other";
}

/**
 * Bundle landing pages to audit.
 *
 * Each entry is the first page a user would hit when navigating to that
 * bundle. Add more bundles here as needed.
 */
const LANDING_PAGES = [
  { name: "RHEL Insights", url: "/insights/dashboard" },
  { name: "OpenShift", url: "/openshift" },
  { name: "Settings", url: "/settings/integrations" },
  { name: "IAM (User Access)", url: "/iam/user-access/overview" },
  { name: "IAM (My Access)", url: "/iam/my-user-access" },
];

test.describe("Akamai Request Baseline", () => {
  // Run all pages even if one fails — we want the full baseline, not early exit.
  test.describe.configure({ mode: "parallel" });

  for (const landing of LANDING_PAGES) {
    test(`${landing.name} — request count baseline`, async ({ page }) => {
      const requests: CapturedRequest[] = [];

      page.on("request", (req) => {
        requests.push({
          url: req.url(),
          method: req.method(),
          resourceType: req.resourceType(),
        });
      });

      await page.goto(landing.url, { waitUntil: "load" });
      const origin = new URL(page.url()).origin;
      // Wait for Chrome shell to render (header is present on all pages),
      // then allow late API calls (kessel, analytics) to settle.
      // Avoid networkidle — it's flaky with WebSocket, Unleash polling, and analytics.
      await page.locator("header").waitFor({ timeout: PAGE_RENDER_TIMEOUT });
      await page.waitForTimeout(3000);

      const isSameOriginApi = (url: string) => url.startsWith(`${origin}/api/`);

      // Classify all requests
      const buckets: Record<string, CapturedRequest[]> = {};
      for (const req of requests) {
        const cat = classifyRequest(req);
        (buckets[cat] ??= []).push(req);
      }

      const kesselRequests = requests.filter((r) => isSameOriginApi(r.url) && /\/kessel\//.test(r.url));
      const apiRequests = requests.filter((r) => isSameOriginApi(r.url));

      // Report
      console.log(`\n${"=".repeat(70)}`);
      console.log(`  ${landing.name} — ${landing.url}`);
      console.log(`${"=".repeat(70)}`);
      console.log(`  Total requests:   ${requests.length}`);
      console.log(`  API requests:     ${apiRequests.length} (threshold: ${API_THRESHOLD})`);
      console.log(`  Kessel requests:  ${kesselRequests.length} (threshold: ${KESSEL_THRESHOLD})`);
      console.log(`${"─".repeat(70)}`);

      for (const [cat, reqs] of Object.entries(buckets).sort((a, b) => b[1].length - a[1].length)) {
        console.log(`  ${cat.padEnd(25)} ${String(reqs.length).padStart(4)}`);
      }

      // Log kessel call detail
      if (kesselRequests.length > 0) {
        console.log(`${"─".repeat(70)}`);
        console.log(`  Kessel call detail:`);
        for (const r of kesselRequests) {
          const shortUrl = r.url.replace(/https?:\/\/[^/]+/, "");
          console.log(`    ${r.method.padEnd(5)} ${shortUrl}`);
        }
      }

      // Log all API endpoints
      if (apiRequests.length > 0) {
        console.log(`${"─".repeat(70)}`);
        console.log(`  All API calls:`);
        for (const r of apiRequests) {
          const shortUrl = r.url.replace(/https?:\/\/[^/]+/, "").slice(0, 90);
          console.log(`    ${r.method.padEnd(5)} ${shortUrl}`);
        }
      }

      // Flag duplicate kessel calls
      const kesselDupes = new Map<string, number>();
      for (const r of kesselRequests) {
        const key = `${r.method} ${r.url}`;
        kesselDupes.set(key, (kesselDupes.get(key) ?? 0) + 1);
      }
      const duplicates = [...kesselDupes.entries()].filter(([, count]) => count > 1);
      if (duplicates.length > 0) {
        console.log(`\n  !! DUPLICATE KESSEL CALLS DETECTED:`);
        for (const [key, count] of duplicates) {
          console.log(`    ${count}x ${key}`);
        }
      }
      console.log(`${"=".repeat(70)}\n`);

      // Attach machine-readable annotation for CI/reports
      test.info().annotations.push({
        type: "request-baseline",
        description: JSON.stringify({
          page: landing.name,
          url: landing.url,
          totalRequests: requests.length,
          apiRequests: apiRequests.length,
          kesselRequests: kesselRequests.length,
          breakdown: Object.fromEntries(Object.entries(buckets).map(([cat, reqs]) => [cat, reqs.length])),
          kesselEndpoints: kesselRequests.map((r) => `${r.method} ${r.url.replace(/https?:\/\/[^/]+/, "")}`),
          duplicateKesselCalls: duplicates.map(([key, count]) => ({ call: key, count })),
        }),
      });

      // Kessel calls — the endpoint class that triggered the Akamai outage
      expect(
        kesselRequests.length,
        `${landing.name}: ${kesselRequests.length} Kessel API calls exceeded threshold of ${KESSEL_THRESHOLD}. ` +
          `This endpoint triggered the Akamai DDoS false positive.`
      ).toBeLessThanOrEqual(KESSEL_THRESHOLD);

      // Total API calls
      expect(apiRequests.length, `${landing.name}: ${apiRequests.length} API calls exceeded threshold of ${API_THRESHOLD}.`).toBeLessThanOrEqual(API_THRESHOLD);
    });
  }
});
