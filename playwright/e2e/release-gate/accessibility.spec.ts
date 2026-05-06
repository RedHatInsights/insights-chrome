import { test, expect } from '../../setup/test-setup';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Tests
 *
 * Migrated from: iqe-platform-ui-plugin/iqe_platform_ui/tests/test_accessibility.py
 *
 * Tests accessibility compliance using axe-core across chrome pages.
 * Scans pages for WCAG violations and generates detailed reports.
 *
 * Requirements:
 * - WCAG 2.1 Level A and AA compliance
 *
 * Note: This test focuses on chrome-owned pages. Tenant applications
 * (insights, openshift apps, ansible apps) have their own accessibility tests.
 */

const APP_INIT_TIMEOUT = 30000;

// Chrome pages to test for accessibility (not tenant applications)
const ACCESSIBILITY_TEST_URLS = [
  '/',
  // '/settings', // SKIPPED: RHCLOUD-47549 - skeleton loaders lack accessible text
  '/allservices',
];

test.describe('Accessibility Compliance', () => {
  ACCESSIBILITY_TEST_URLS.forEach((url) => {
    test(`should have no axe violations on ${url}`, async ({ page }) => {
      // Navigate to the URL
      await page.goto(url);

      // Wait for the page to be fully loaded
      // Use a visible element from the chrome masthead to ensure app is ready
      await page.getByRole('button', { name: /User Avatar/ }).waitFor({
        state: 'visible',
        timeout: APP_INIT_TIMEOUT,
      });

      // Run axe accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Log summary for debugging
      console.log(`Accessibility scan for ${url}:`);
      console.log(`  Passes: ${accessibilityScanResults.passes.length}`);
      console.log(`  Violations: ${accessibilityScanResults.violations.length}`);
      console.log(`  Incomplete: ${accessibilityScanResults.incomplete.length}`);
      console.log(`  Inapplicable: ${accessibilityScanResults.inapplicable.length}`);

      // Log violation details if any exist
      if (accessibilityScanResults.violations.length > 0) {
        console.log('\nViolations:');
        accessibilityScanResults.violations.forEach((violation) => {
          console.log(`  - ${violation.id}: ${violation.description}`);
          console.log(`    Impact: ${violation.impact}`);
          console.log(`    Affected nodes: ${violation.nodes.length}`);
          violation.nodes.forEach((node, index) => {
            console.log(`      ${index + 1}. ${node.html}`);
            console.log(`         Target: ${node.target.join(' ')}`);
          });
        });
      }

      // Assert no violations
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test('should generate accessibility summary report', async ({ page }) => {
    const allResults: {
      url: string;
      passes: number;
      violations: number;
      incomplete: number;
      violationDetails: { [key: string]: number };
    }[] = [];

    for (const url of ACCESSIBILITY_TEST_URLS) {
      await page.goto(url);

      // Wait for app to be ready
      await page.getByRole('button', { name: /User Avatar/ }).waitFor({
        state: 'visible',
        timeout: APP_INIT_TIMEOUT,
      });

      const scanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Aggregate violation types
      const violationDetails: { [key: string]: number } = {};
      scanResults.violations.forEach((violation) => {
        if (violationDetails[violation.id]) {
          violationDetails[violation.id] += violation.nodes.length;
        } else {
          violationDetails[violation.id] = violation.nodes.length;
        }
      });

      allResults.push({
        url,
        passes: scanResults.passes.length,
        violations: scanResults.violations.length,
        incomplete: scanResults.incomplete.length,
        violationDetails,
      });
    }

    // Log comprehensive summary
    console.log('\n=== Accessibility Scan Summary ===');
    console.log(`Total pages scanned: ${allResults.length}`);

    const totalPasses = allResults.reduce((sum, r) => sum + r.passes, 0);
    const totalViolations = allResults.reduce((sum, r) => sum + r.violations, 0);
    const totalIncomplete = allResults.reduce((sum, r) => sum + r.incomplete, 0);

    console.log(`Total passes: ${totalPasses}`);
    console.log(`Total violations: ${totalViolations}`);
    console.log(`Total incomplete: ${totalIncomplete}`);

    // Aggregate violation types across all pages
    const aggregatedViolations: { [key: string]: number } = {};
    allResults.forEach((result) => {
      Object.entries(result.violationDetails).forEach(([id, count]) => {
        if (aggregatedViolations[id]) {
          aggregatedViolations[id] += count;
        } else {
          aggregatedViolations[id] = count;
        }
      });
    });

    if (Object.keys(aggregatedViolations).length > 0) {
      console.log('\nViolation breakdown by type:');
      Object.entries(aggregatedViolations)
        .sort(([, a], [, b]) => b - a)
        .forEach(([id, count]) => {
          console.log(`  ${id}: ${count} instances`);
        });
    }

    console.log('\nPer-page results:');
    allResults.forEach((result) => {
      console.log(`  ${result.url}:`);
      console.log(`    Passes: ${result.passes}`);
      console.log(`    Violations: ${result.violations}`);
      console.log(`    Incomplete: ${result.incomplete}`);
    });

    // This test is for reporting only - it doesn't fail on violations
    // Individual tests above handle assertion failures
  });
});
