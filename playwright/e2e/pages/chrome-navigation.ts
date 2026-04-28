import { Page, Locator } from '@playwright/test';

/**
 * Page Object for Chrome Navigation Sidebar
 *
 * This corresponds to IQE's Navigation view in the iqe-platform-ui-plugin repository.
 *
 * Provides methods to interact with the Chrome sidebar navigation including:
 * - Navigation toggle (hamburger menu)
 * - Sidebar visibility
 * - Navigation item selection
 */
export class ChromeNavigation {
  readonly page: Page;
  readonly navToggle: Locator;
  readonly sidebar: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation toggle button (hamburger menu)
    this.navToggle = page.getByRole('button', { name: 'Global navigation' });

    // Sidebar panel
    this.sidebar = page.locator('#chr-c-sidebar');
  }

  /**
   * Clicks the navigation toggle button
   */
  async clickToggle(): Promise<void> {
    await this.navToggle.click();
  }

  /**
   * Checks if the navigation sidebar is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.sidebar.isVisible();
  }

  /**
   * Selects a navigation item by name
   * @param itemName The text of the navigation item to select
   */
  async selectItem(itemName: string): Promise<void> {
    // Find and click the navigation item within the sidebar
    await this.sidebar.getByRole('link', { name: itemName }).click();
  }

  /**
   * Gets the currently selected navigation item(s)
   * @returns Array of navigation item names that are currently active/selected
   */
  async getCurrentlySelected(): Promise<string[]> {
    // Find navigation items with aria-current="page" attribute
    const activeItems = this.sidebar.locator('[aria-current="page"]');
    const count = await activeItems.count();

    const selectedItems: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await activeItems.nth(i).textContent();
      if (text) {
        selectedItems.push(text.trim());
      }
    }

    return selectedItems;
  }
}
