import { expect, test } from '../../setup/test-setup';
import { DOMAIN_REDIRECTS, PATH_REDIRECTS } from './redirect-rules';

/**
 * Akamai CDN Redirect Tests
 *
 * Migrated from: iqe-platform-ui-plugin/iqe_platform_ui/tests/test_redirects.py
 * Config source: iqe-platform-ui-plugin/iqe_platform_ui/conf/platform_ui.default.yaml
 *
 * These tests verify HTTP-level redirects configured in the Akamai CDN.
 * They use Playwright's APIRequestContext (HTTP client) rather than browser
 * navigation, matching the original IQE approach and running significantly
 * faster than browser-based tests.
 *
 * Requirements:
 * - PLATFORM_UI-REDIRECTS
 * - Must run against stage or prod (Akamai not configured in ephemeral/local)
 *
 * Environment detection:
 * - stage: console.stage.redhat.com (via BASE or PLAYWRIGHT_BASE_URL)
 * - prod:  console.redhat.com
 * - local/ephemeral: tests are skipped (no Akamai)
 */

/**
 * Resolve the target host for redirect testing.
 *
 * Path redirects test against the console host directly.
 * Domain redirects test cloud.* → console.* redirect.
 */
function getConsoleHost(): string {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE || '';

  if (baseUrl.includes('console.stage.redhat.com') || baseUrl.includes('stage.foo.redhat.com')) {
    return 'https://console.stage.redhat.com';
  }

  if (baseUrl.includes('console.redhat.com') || baseUrl.includes('prod.foo.redhat.com')) {
    return 'https://console.redhat.com';
  }

  // Local or ephemeral — Akamai not available
  return '';
}

function getCloudHost(): string {
  const consoleHost = getConsoleHost();
  return consoleHost.replace('console.', 'cloud.');
}

function isAkamaiEnvironment(): boolean {
  return getConsoleHost() !== '';
}

test.describe('Akamai CDN Path Redirects', () => {
  // Skip entire suite if not running against stage/prod
  test.skip(!isAkamaiEnvironment(), 'Path redirect tests require Akamai (stage/prod only)');

  const consoleHost = getConsoleHost();

  for (const rule of PATH_REDIRECTS) {
    test(`redirect: ${rule.from} → ${rule.to} (${rule.description})`, async ({ request }) => {
      const sourceUrl = `${consoleHost}${rule.from}`;

      // Make HTTP request without following redirects
      const response = await request.get(sourceUrl, {
        maxRedirects: 0,
        ignoreHTTPSErrors: true,
      });

      const status = response.status();
      const location = response.headers()['location'] || '';

      // Verify redirect status (301 or 302)
      const expectedStatus = rule.expectedStatus || 301;
      expect(status, `Expected redirect status ${expectedStatus} for ${rule.from}, got ${status}`).toBe(expectedStatus);

      // Verify redirect destination contains expected path
      // Location may be absolute (https://console.../path) or relative (/path)
      const locationPath = location.startsWith('http') ? new URL(location).pathname : location;
      expect(locationPath, `Expected redirect to ${rule.to}, got ${locationPath}`).toBe(rule.to);
    });
  }
});

test.describe('Domain Redirects (cloud → console)', () => {
  // Skip entire suite if not running against stage/prod
  test.skip(!isAkamaiEnvironment(), 'Domain redirect tests require Akamai (stage/prod only)');

  const cloudHost = getCloudHost();
  const consoleHost = getConsoleHost();

  for (const rule of DOMAIN_REDIRECTS) {
    test(`domain redirect: cloud${rule.from} → console${rule.to} (${rule.description})`, async ({ request }) => {
      const sourceUrl = `${cloudHost}${rule.from}`;

      // Make HTTP request without following redirects
      const response = await request.get(sourceUrl, {
        maxRedirects: 0,
        ignoreHTTPSErrors: true,
      });

      const status = response.status();
      const location = response.headers()['location'] || '';

      // Domain redirects should be 301 (permanent)
      const expectedStatus = rule.expectedStatus || 301;
      expect(status, `Expected redirect status ${expectedStatus} for cloud${rule.from}, got ${status}`).toBe(expectedStatus);

      // Verify redirect goes to console domain with correct path
      expect(location, `Expected redirect to ${consoleHost}${rule.to}`).toContain(consoleHost);

      const locationPath = new URL(location).pathname;
      expect(locationPath, `Expected path ${rule.to}, got ${locationPath}`).toBe(rule.to);
    });
  }
});
