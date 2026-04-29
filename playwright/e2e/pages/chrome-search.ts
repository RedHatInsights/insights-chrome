import { Page, Locator } from '@playwright/test';
import { SEARCH_TIMEOUT } from '../../setup/constants';

/**
 * Page Object for Chrome Search functionality
 *
 * Provides methods to interact with the platform search feature
 * in the Chrome header.
 */
export class ChromeSearch {
  readonly page: Page;
  readonly searchToggle: Locator;
  readonly searchInput: Locator;
  readonly searchMenu: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    // Expandable search toggle button
    this.searchToggle = page.getByRole('button', { name: 'Expandable search input toggle' });
    // Search input with placeholder "Search for services"
    this.searchInput = page.getByPlaceholder('Search for services');
    // Search results menu
    this.searchMenu = page.locator('.chr-c-search__menu');
    // Empty state message - "No results found" heading
    this.emptyState = page.getByRole('heading', { name: /No results found/i });
  }

  /**
   * Opens the search input (expands if collapsed)
   */
  async open() {
    // Check if search input is already visible
    const isInputVisible = await this.searchInput.isVisible();
    if (!isInputVisible) {
      // Click toggle to expand
      await this.searchToggle.click();
      // Wait for input to appear
      await this.searchInput.waitFor({ state: 'visible' });
    }
  }

  /**
   * Enters search text and waits for results to load
   * @param query - Search query string
   */
  async search(query: string) {
    // Ensure search is open first
    await this.open();

    // Wait for search to be truly ready - check if input is enabled/editable
    await this.searchInput.waitFor({ state: 'attached' });
    await this.page.waitForFunction(() => {
      const input = document.querySelector('input[placeholder="Search for services"]');
      return input && !input.hasAttribute('disabled');
    });

    // Use type() instead of fill() to trigger keydown events that open the menu
    await this.searchInput.type(query);

    // Wait for either search menu (results) or empty state to appear
    await this.searchMenu
      .or(this.emptyState)
      .waitFor({ state: 'visible', timeout: SEARCH_TIMEOUT });
  }

  /**
   * Clears the search input
   */
  async clear() {
    // Ensure search is open before clearing
    await this.open();
    await this.searchInput.clear();
  }

  /**
   * Gets all search result items
   * @returns Array of result MenuItem locators
   */
  getResults(): Locator {
    return this.searchMenu.locator('li[class*="pf-v6-c-menu__list-item"]');
  }

  /**
   * Gets search result titles
   * @returns Array of result title texts
   */
  async getResultTitles(): Promise<string[]> {
    const results = this.getResults();
    const count = await results.count();
    const titles: string[] = [];

    for (let i = 0; i < count; i++) {
      const title = await results.nth(i).textContent();
      if (title) {
        titles.push(title.trim());
      }
    }

    return titles;
  }

  /**
   * Checks if search results contain a specific text
   * @param text - Text to search for in results
   * @returns true if any result contains the text
   */
  async resultsContain(text: string): Promise<boolean> {
    const titles = await this.getResultTitles();
    return titles.some((title) => title.toLowerCase().includes(text.toLowerCase()));
  }

  /**
   * Checks if the empty state is displayed
   * @returns true if empty state is visible
   */
  async isEmpty(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  /**
   * Gets the count of search results
   * @returns Number of results
   */
  async getResultCount(): Promise<number> {
    return await this.getResults().count();
  }

  /**
   * Waits for search results to appear
   * @param timeout - Optional timeout in milliseconds
   */
  async waitForResults(timeout = SEARCH_TIMEOUT) {
    await this.searchMenu.waitFor({ state: 'visible', timeout });
  }

  /**
   * Clicks on a search result by index
   * @param index - Zero-based index of the result to click
   */
  async clickResult(index: number) {
    await this.getResults().nth(index).click();
  }

  /**
   * Clicks on a search result by title text
   * @param title - Title text to search for
   */
  async clickResultByTitle(title: string) {
    await this.searchMenu.getByRole('menuitem').filter({ hasText: new RegExp(title, 'i') }).click();
  }
}
