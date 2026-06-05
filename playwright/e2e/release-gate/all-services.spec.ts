import { expect, test } from '../../setup/test-setup';
import { AllServicesPage } from '../pages/all-services-page';

/**
 * All Services Page E2E Tests
 *
 * Tests the core functionality of the /allservices page including:
 * - Page rendering and service display
 * - Search/filter functionality
 * - Empty states
 * - Service visibility
 *
 * This is a chrome-owned page (not a federated module) that displays
 * all available services in the Hybrid Cloud Console.
 */

const SCROLL_THRESHOLD = 50; // Minimum scroll position to verify page didn't jump to top
const MIN_SCROLLABLE_HEIGHT = 200; // Minimum scrollable height required for scroll position test

test.describe('All Services Page', () => {
  let allServicesPage: AllServicesPage;

  test.beforeEach(async ({ page }) => {
    allServicesPage = new AllServicesPage(page);
    await allServicesPage.goto();
    await allServicesPage.waitForReady();
    // Wait for services to load from APIs (RBAC, entitlements, navigation data)
    await allServicesPage.waitForServices();
  });

  test('should display the all services page with title and description', async ({ page }) => {
    // Verify page title (already verified in beforeEach via waitForReady)
    await expect(allServicesPage.pageHeading).toBeVisible();

    // Verify page description
    await expect(page.getByText(/Every service available on Hybrid Cloud Console appears below/i)).toBeVisible();

    // Verify star icon instruction text
    await expect(page.getByText(/Hover over a service and click the star/i)).toBeVisible();
  });

  test('should display the search/filter input', async () => {
    // Verify filter input exists with correct OUIA ID
    await expect(allServicesPage.filterInput).toBeVisible();

    // Verify placeholder text
    await expect(allServicesPage.filterInput).toHaveAttribute('placeholder', /find/i);
  });

  test('should render service sections', async () => {
    // Verify at least one service link renders
    await expect(allServicesPage.serviceLinks.first()).toBeVisible();

    // Verify we have multiple services
    const serviceCount = await allServicesPage.getServiceCount();
    expect(serviceCount).toBeGreaterThan(0);
  });

  test('should filter services when searching', async ({ page }) => {
    // Get initial count of services before filtering
    const initialCount = await allServicesPage.getServiceCount();
    expect(initialCount).toBeGreaterThan(0);

    // Type a search term (searching for a common service)
    await allServicesPage.searchFor('Ansible');

    // Verify results are filtered (fewer sections/services should be visible)
    const filteredCount = await allServicesPage.getServiceCount();

    // Filtered count should be less than initial count
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0); // Should have at least one match

    // Verify the search term appears in the visible content (scope to main, use .first())
    await expect(page.locator('main').getByText('Ansible').first()).toBeVisible();
  });

  test('should clear search filter when clicking clear button', async () => {
    // Get initial count
    const initialCount = await allServicesPage.getServiceCount();

    // Type a search term
    await allServicesPage.searchFor('ThisShouldNotMatchAnything12345');

    // Find and click the clear button (X icon in search input)
    await allServicesPage.clearFilterUsingButton();

    // Verify filter input is cleared
    await expect(allServicesPage.filterInput).toHaveValue('');

    // Verify original service count is restored
    const restoredCount = await allServicesPage.getServiceCount();
    expect(restoredCount).toBe(initialCount);
  });

  test('should display empty state when no services match filter', async ({ page }) => {
    // Type a search term that won't match anything
    await allServicesPage.searchFor('ZzZzNonExistentServiceXxXx12345');

    // Verify empty state appears
    await expect(page.getByText('No results found')).toBeVisible();
    await expect(page.getByText(/No results match the filter criteria/i)).toBeVisible();

    // Verify "Clear all filters" button exists
    const clearAllButton = page.getByRole('button', { name: /Clear all filters/i });
    await expect(clearAllButton).toBeVisible();
  });

  test('should clear filter when clicking "Clear all filters" in empty state', async ({ page }) => {
    // Type a search term that won't match anything
    await allServicesPage.searchFor('ZzZzNonExistentServiceXxXx12345');

    // Verify empty state appears
    await expect(page.getByText('No results found')).toBeVisible();

    // Click "Clear all filters" button
    await allServicesPage.clickClearAllFilters();

    // Verify filter is cleared
    await expect(allServicesPage.filterInput).toHaveValue('');

    // Verify services are visible again
    await expect(page.getByText('No results found')).not.toBeVisible();
    const count = await allServicesPage.getServiceCount();
    expect(count).toBeGreaterThan(0);
  });

  test('should perform case-insensitive search', async () => {
    // Search with lowercase
    await allServicesPage.searchFor('groups');

    // Verify results appear (case-insensitive match)
    const lowercaseCount = await allServicesPage.getServiceCount();
    expect(lowercaseCount).toBeGreaterThan(0);

    // Clear and search with uppercase
    await allServicesPage.clearFilterUsingInput();
    await allServicesPage.searchFor('GROUPS');

    // Verify same results appear
    const uppercaseCount = await allServicesPage.getServiceCount();
    expect(uppercaseCount).toBe(lowercaseCount);
  });

  test('should navigate to a service when clicking a service link', async ({ page }) => {
    // Find a service link (Groups is a commonly available service)
    const serviceLink = allServicesPage.getServiceLink(/Groups/i).first();
    await serviceLink.scrollIntoViewIfNeeded();

    // Verify link has href attribute
    await expect(serviceLink).toHaveAttribute('href');

    // Click the service link
    await serviceLink.click();

    // Verify navigation occurred (URL should change away from /allservices)
    await page.waitForLoadState('load');
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/allservices');
  });

  test('should display favorite buttons for services', async () => {
    // Scroll to a known service
    await allServicesPage.scrollToService('Groups');

    // Verify favorite button exists for a service
    const favoriteButton = allServicesPage.getFavoriteButton('Groups');
    await expect(favoriteButton).toBeVisible();
  });

  test('should remove whitespace in search matching', async () => {
    // Search with whitespace in the term
    await allServicesPage.searchFor('User   Access');

    // Get count with whitespace
    const countWithSpaces = await allServicesPage.getServiceCount();

    // Clear and search without whitespace
    await allServicesPage.clearFilterUsingInput();
    await allServicesPage.searchFor('UserAccess');

    // Get count without whitespace
    const countWithoutSpaces = await allServicesPage.getServiceCount();

    // Both should return same results (whitespace is ignored)
    expect(countWithSpaces).toBe(countWithoutSpaces);
  });

  test('should maintain scroll position when filtering', async ({ page }) => {
    // Get the actual scrollable height of the page
    const maxScrollHeight = await page.evaluate(() => {
      return document.documentElement.scrollHeight - document.documentElement.clientHeight;
    });

    // Skip test if page is not scrollable enough
    test.skip(
      maxScrollHeight < MIN_SCROLLABLE_HEIGHT,
      `Page is not scrollable enough (${maxScrollHeight}px < ${MIN_SCROLLABLE_HEIGHT}px minimum)`
    );

    // Scroll to 50% of the scrollable height
    const scrollTargetPosition = Math.floor(maxScrollHeight * 0.5);
    await allServicesPage.scrollTo(scrollTargetPosition);
    const scrollBefore = await allServicesPage.getScrollPosition();

    // Verify we actually scrolled (allow small tolerance for rounding)
    expect(scrollBefore).toBeGreaterThanOrEqual(scrollTargetPosition - 5);
    expect(scrollBefore).toBeLessThanOrEqual(scrollTargetPosition + 5);

    // Apply a filter
    await allServicesPage.searchFor('Insights');

    // Verify page hasn't jumped to top
    // Some scroll change is expected due to content filtering, but page shouldn't reset to top
    const scrollAfter = await allServicesPage.getScrollPosition();
    expect(scrollAfter).toBeGreaterThan(SCROLL_THRESHOLD);
  });
});
