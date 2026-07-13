import { Locator, Page } from '@playwright/test';

/**
 * Page Object for All Services Page
 *
 * Provides methods to interact with the /allservices page including:
 * - Navigation and page ready checks
 * - Search/filter functionality
 * - Service interaction
 * - Scroll behavior
 */
export class AllServicesPage {
  private static readonly PAGE_READY_TIMEOUT = 30000;
  private static readonly INTERACTION_TIMEOUT = 5000;
  private static readonly FILTER_UPDATE_TIMEOUT = 2000;
  private static readonly UI_STABILIZATION_DELAY = 100;
  private static readonly SCROLL_RENDER_DELAY = 100;
  private static readonly SCROLL_POSITION_TOLERANCE = 5;

  readonly page: Page;
  readonly filterInput: Locator;
  readonly pageHeading: Locator;
  readonly serviceLinks: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main page elements
    this.pageHeading = page.getByRole('heading', { name: 'All Services' });
    this.filterInput = page.locator('[data-ouia-component-id="app-filter-search"] input');
    // Use OUIA component IDs: all service links end with '-Link' suffix
    // This is stable across PatternFly version changes and filters out navigation/footer links
    this.serviceLinks = page.locator('[data-ouia-component-id$="-Link"]');
  }

  /**
   * Navigates to the /allservices page
   */
  async goto(): Promise<void> {
    await this.page.goto('/allservices');
    await this.page.waitForLoadState('load');
  }

  /**
   * Waits for the All Services page to be fully ready
   * Checks for the page heading to be visible
   */
  async waitForReady(): Promise<void> {
    await this.pageHeading.waitFor({
      state: 'visible',
      timeout: AllServicesPage.PAGE_READY_TIMEOUT,
    });
  }

  /**
   * Waits for services to be rendered
   */
  async waitForServices(): Promise<void> {
    await this.serviceLinks.first().waitFor({
      state: 'visible',
      timeout: AllServicesPage.INTERACTION_TIMEOUT,
    });
  }

  /**
   * Searches for services using the filter input
   * @param term The search term to enter
   */
  async searchFor(term: string): Promise<void> {
    // Explicitly clear first to ensure clean state
    await this.filterInput.clear();
    // Use type() instead of fill() to trigger all keyboard events
    // This ensures client-side filtering logic responds properly
    await this.filterInput.pressSequentially(term);

    // Wait for DOM to stabilize - either results appear or empty state appears
    try {
      await Promise.race([
        // Wait for service links to appear (successful search)
        this.serviceLinks.first().waitFor({ state: 'visible', timeout: AllServicesPage.FILTER_UPDATE_TIMEOUT }),
        // Wait for empty state to appear (no results)
        this.page.getByText('No results found').waitFor({ state: 'visible', timeout: AllServicesPage.FILTER_UPDATE_TIMEOUT }),
      ]);
    } catch (error) {
      // Both conditions failed - filter may still be processing or page is in unexpected state
      // Allow test to continue and fail on subsequent assertions if truly broken
    }

    // Give React one more frame to finish rendering
    await this.page.waitForTimeout(AllServicesPage.UI_STABILIZATION_DELAY);
  }

  /**
   * Clears the search filter using the clear button (X icon)
   */
  async clearFilterUsingButton(): Promise<void> {
    // Find the clear button semantically (accessible via button role and label)
    // Scope to main content to avoid header/footer buttons
    const clearButton = this.page.locator('main').getByRole('button', { name: /reset|clear/i }).first();
    await clearButton.click();
  }

  /**
   * Clears the search filter by clearing the input field
   */
  async clearFilterUsingInput(): Promise<void> {
    await this.filterInput.clear();
  }

  /**
   * Gets the current value of the filter input
   */
  async getFilterValue(): Promise<string> {
    return (await this.filterInput.inputValue()) || '';
  }

  /**
   * Gets the count of services currently visible
   */
  async getServiceCount(): Promise<number> {
    return await this.serviceLinks.count();
  }

  /**
   * Clicks the "Clear all filters" button in the empty state
   */
  async clickClearAllFilters(): Promise<void> {
    const clearAllButton = this.page.getByRole('button', { name: /Clear all filters/i });
    await clearAllButton.click();
  }

  /**
   * Gets a service link by name (partial match)
   * @param serviceName The name of the service (can be partial match)
   * @returns Locator for the service link
   */
  getServiceLink(serviceName: string | RegExp): Locator {
    return this.page.getByRole('link', { name: serviceName });
  }

  /**
   * Gets the favorite button for a service
   * @param serviceName The name of the service (string or RegExp)
   * @returns Locator for the favorite button
   */
  getFavoriteButton(serviceName: string | RegExp): Locator {
    if (typeof serviceName === 'string') {
      // Escape special regex characters in the service name
      const escaped = serviceName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return this.page.getByLabel(new RegExp(`Favorite ${escaped}`, 'i'));
    } else {
      // Use the RegExp directly by extracting its source pattern
      return this.page.getByLabel(new RegExp(`Favorite ${serviceName.source}`, serviceName.flags));
    }
  }

  /**
   * Checks if the empty state is visible
   */
  async isEmptyStateVisible(): Promise<boolean> {
    try {
      await this.page.getByText('No results found').waitFor({
        state: 'visible',
        timeout: AllServicesPage.INTERACTION_TIMEOUT,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Scrolls the page to a specific vertical position
   * @param y The vertical scroll position in pixels
   */
  async scrollTo(y: number): Promise<void> {
    await this.page.evaluate((yPos) => window.scrollTo(0, yPos), y);
    // Give browser a moment to complete scroll (scrollTo is typically synchronous but rendering may be async)
    await this.page.waitForTimeout(AllServicesPage.SCROLL_RENDER_DELAY);
  }

  /**
   * Gets the current scroll position
   * @returns The current vertical scroll position in pixels
   */
  async getScrollPosition(): Promise<number> {
    return await this.page.evaluate(() => window.scrollY);
  }

  /**
   * Scrolls a service into view
   * @param serviceName The name of the service to scroll to
   */
  async scrollToService(serviceName: string): Promise<void> {
    const service = this.page.getByText(serviceName);
    await service.scrollIntoViewIfNeeded();
  }
}
