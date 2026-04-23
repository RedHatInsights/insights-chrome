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
  readonly page: Page;
  readonly overflowActionsButton: Locator;
  readonly orgIdElement: Locator;
  readonly helpButton: Locator;
  readonly settingsButton: Locator;
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
    this.settingsButton = page.locator('[data-ouia-component-id="chrome-settings"]');
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
    await this.orgIdElement.waitFor({ state: 'visible', timeout: 5000 });

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
      await this.orgIdElement.waitFor({ state: 'visible', timeout: 5000 });
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
   * Opens the settings menu
   */
  async openSettings(): Promise<void> {
    await this.settingsButton.click();
  }

  /**
   * Opens the services menu
   */
  async openServices(): Promise<void> {
    await this.servicesButton.click();
  }
}
