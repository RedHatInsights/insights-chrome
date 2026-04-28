import { Page, Locator } from '@playwright/test';

/**
 * Page Object for Chrome Topbar components
 *
 * This corresponds to IQE's Topbar and OverflowActions views in the
 * iqe-platform-ui-plugin repository.
 *
 * Provides methods to interact with the Chrome masthead/topbar including:
 * - User overflow actions (user menu)
 * - Organization ID display
 * - Help, settings, and other topbar elements
 */
export class ChromeTopbar {
  private static readonly MENU_TIMEOUT = 5000;

  readonly page: Page;
  readonly overflowActionsButton: Locator;
  readonly orgIdElement: Locator;
  readonly helpButton: Locator;
  readonly servicesButton: Locator;
  readonly notificationsBadge: Locator;

  constructor(page: Page) {
    this.page = page;

    // Overflow actions (user menu) button
    // Uses the same selector pattern as other tests in insights-chrome
    this.overflowActionsButton = page.getByRole('button', { name: /User Avatar/ });

    // Org ID display element within the overflow actions dropdown
    // Uses OUIA component ID for stability
    this.orgIdElement = page.locator('[data-ouia-component-id="chrome-user-org-id"]');

    // Other topbar elements
    this.helpButton = page.getByRole('button', { name: 'Help' });
    this.servicesButton = page.locator('.chr-c-link-service-toggle');
    this.notificationsBadge = page.locator('button.chr-c-notification-badge');
  }

  /**
   * Opens the user overflow actions dropdown menu (idempotent)
   */
  async openOverflowActions(): Promise<void> {
    // Check if menu is already open by checking aria-expanded attribute
    const isExpanded = await this.overflowActionsButton.getAttribute('aria-expanded');

    // Only click if menu is not already open
    if (isExpanded !== 'true') {
      await this.overflowActionsButton.click();
    }
  }

  /**
   * Gets the organization ID from the user menu
   * Note: Opens the overflow menu if not already open
   *
   * @returns The organization ID as a string, or null if not found
   */
  async getOrgId(): Promise<string | null> {
    await this.openOverflowActions();

    // Wait for the org ID element to be visible
    await this.orgIdElement.waitFor({ state: 'visible', timeout: ChromeTopbar.MENU_TIMEOUT });

    // Try to find a child element that contains just the ID value
    // This is more robust than parsing the full text
    const valueElements = [
      this.orgIdElement.locator('[data-testid="org-id-value"]'),
      this.orgIdElement.locator('dd'),
      this.orgIdElement.locator('span').last(),
    ];

    for (const valueElement of valueElements) {
      try {
        const count = await valueElement.count();
        if (count > 0) {
          const text = await valueElement.textContent();
          if (text && /^\d+$/.test(text.trim())) {
            return text.trim();
          }
        }
      } catch {
        // Continue to next selector
      }
    }

    // Fallback: extract numeric ID from full text without relying on English label
    const fullText = await this.orgIdElement.textContent();
    if (fullText) {
      // Match any sequence of digits (org IDs are numeric)
      const match = fullText.match(/(\d+)/);
      return match ? match[1] : fullText.trim();
    }

    return fullText;
  }

  /**
   * Checks if the organization ID is visible in the overflow menu
   * Note: Opens the overflow menu if not already open
   */
  async isOrgIdVisible(): Promise<boolean> {
    await this.openOverflowActions();

    try {
      await this.orgIdElement.waitFor({ state: 'visible', timeout: ChromeTopbar.MENU_TIMEOUT });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Opens the help menu
   */
  async openHelp(): Promise<void> {
    await this.helpButton.click();
  }

  /**
   * Checks if the settings menu is open
   */
  async isSettingsOpen(): Promise<boolean> {
    // Check aria-expanded or visibility of menu
    const settingsGearButton = this.page.locator('#SettingsMenu');
    const expanded = await settingsGearButton.getAttribute('aria-expanded');
    return expanded === 'true';
  }

  /**
   * Opens the settings menu (idempotent)
   */
  async openSettings(): Promise<void> {
    if (!(await this.isSettingsOpen())) {
      const settingsGearButton = this.page.locator('#SettingsMenu');
      await settingsGearButton.click();

      // Wait for the menu to actually open by polling the state
      await this.page.waitForFunction(
        () => {
          const button = document.querySelector('#SettingsMenu');
          return button?.getAttribute('aria-expanded') === 'true';
        },
        { timeout: ChromeTopbar.MENU_TIMEOUT }
      );
    }
  }

  /**
   * Closes the settings menu (idempotent)
   */
  async closeSettings(): Promise<void> {
    if (await this.isSettingsOpen()) {
      const settingsGearButton = this.page.locator('#SettingsMenu');
      await settingsGearButton.click();

      // Wait for the menu to actually close by polling the state
      await this.page.waitForFunction(
        () => {
          const button = document.querySelector('#SettingsMenu');
          return button?.getAttribute('aria-expanded') === 'false';
        },
        { timeout: ChromeTopbar.MENU_TIMEOUT }
      );
    }
  }

  /**
   * Gets the list of items in the settings menu
   * @returns Array of unique menu item text (first line only, badges stripped)
   */
  async getSettingsMenuItems(): Promise<string[]> {
    await this.openSettings();

    // Use PF6 menu list-item class, excluding dividers (role="separator")
    const menuItems = this.page.locator('[data-ouia-component-id="chrome-settings"] li.pf-v6-c-menu__list-item:not([role="separator"])');
    await menuItems.first().waitFor({ state: 'visible', timeout: ChromeTopbar.MENU_TIMEOUT });

    const count = await menuItems.count();

    const seen = new Set<string>();
    const items: string[] = [];
    for (let i = 0; i < count; i++) {
      const menuItem = menuItems.nth(i);
      const text = await menuItem.innerText();
      if (text) {
        const cleanText = text.trim().split('\n')[0].trim();
        if (cleanText && !seen.has(cleanText)) {
          seen.add(cleanText);
          items.push(cleanText);
        }
      }
    }

    return items;
  }

  /**
   * Selects a specific item from the settings menu
   * @param itemName The text of the menu item to select (partial match supported)
   */
  async selectSettingsItem(itemName: string): Promise<void> {
    await this.openSettings();

    const menuItems = this.page.locator('[data-ouia-component-id="chrome-settings"] li.pf-v6-c-menu__list-item:not([role="separator"])');
    await menuItems.first().waitFor({ state: 'visible', timeout: ChromeTopbar.MENU_TIMEOUT });

    const matchingItems = menuItems.filter({ hasText: itemName });
    const count = await matchingItems.count();

    if (count === 0) {
      throw new Error(`No settings menu item found matching "${itemName}"`);
    }

    await matchingItems.first().click();
  }

  /**
   * Opens the services menu
   */
  async openServices(): Promise<void> {
    await this.servicesButton.click();
  }
}
