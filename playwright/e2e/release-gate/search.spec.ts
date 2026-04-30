import { test, expect } from '../../setup/test-setup';
import { ChromeSearch } from '../pages/chrome-search';

/**
 * Test: Platform Search Functionality
 *
 * Migrated from: iqe-platform-ui-plugin/iqe_platform_ui/tests/test_search.py
 *
 * Verifies that the platform search feature:
 * - Returns relevant results for common search keywords
 * - Displays correct page names in search results
 * - Shows empty state when no results are found
 *
 * Tags from IQE:
 * - metadata.requirements: PLATFORM_UI-SEARCH-RESULTS
 * - metadata.importance: high
 */

test.describe('Platform Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
  });

  /**
   * Test search results for Identity & Access Management keywords
   * Migrated from: test_search_by_keyword (Identity & Access Management variant)
   */
  test.describe('Identity & Access Management searches', () => {
    const expectedPage = 'Identity & Access Management';
    const keywords = [
      'Authentication Factors',
      'Identity',
      'IAM',
      'User Access',
      'User Management',
      'access management',
      'rbac',
      'RBAC',
    ];

    for (const keyword of keywords) {
      test(`should find "${expectedPage}" when searching for "${keyword}"`, async ({ page }) => {
        const search = new ChromeSearch(page);

        // Search for the keyword (search() handles opening and waiting for results)
        await search.search(keyword);

        // Verify results are returned
        const resultCount = await search.getResultCount();
        expect(resultCount, `No search results found for keyword: ${keyword}`).toBeGreaterThan(0);

        // Verify the expected page appears in results
        const containsExpectedPage = await search.resultsContain(expectedPage);
        expect(containsExpectedPage, `"${expectedPage}" not found in search results for keyword: ${keyword}`).toBe(true);
      });
    }
  });

  /**
   * Test search results for Tasks/CentOS conversion keywords
   * Migrated from: test_search_by_keyword (Tasks variant)
   */
  test.describe('Tasks searches', () => {
    const expectedPage = 'Tasks';
    const keywords = ['CentOS conversion', 'C2R', 'CentOS', 'centos conversion', 'Pre-Conversion analysis', 'Convert to RHEL'];

    for (const keyword of keywords) {
      test(`should find "${expectedPage}" when searching for "${keyword}"`, async ({ page }) => {
        const search = new ChromeSearch(page);

        // Search for the keyword (search() handles opening and waiting for results)
        await search.search(keyword);

        // Verify results are returned
        const resultCount = await search.getResultCount();
        expect(resultCount, `No search results found for keyword: ${keyword}`).toBeGreaterThan(0);

        // Verify the expected page appears in results
        const containsExpectedPage = await search.resultsContain(expectedPage);
        expect(containsExpectedPage, `"${expectedPage}" not found in search results for keyword: ${keyword}`).toBe(true);
      });
    }
  });

  /**
   * Test empty search state
   * Migrated from: test_search_no_results
   *
   * Verifies that searching for whitespace/nothing shows the empty state
   */
  test('should show empty state when searching for whitespace', async ({ page }) => {
    const search = new ChromeSearch(page);

    // Search for whitespace (search() handles opening and waiting for UI state)
    await search.search(' ');

    // Verify empty state is displayed
    const isEmpty = await search.isEmpty();
    expect(isEmpty, 'Empty state should be displayed when searching for whitespace').toBe(true);

    // Verify no results are shown
    const resultCount = await search.getResultCount();
    expect(resultCount, 'No results should be displayed for whitespace search').toBe(0);
  });
});
