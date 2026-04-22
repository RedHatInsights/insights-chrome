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
    // Matches the locator in IQE: div[(./button[@id='UserMenu'])]
    this.overflowActionsButton = page.locator('[id="UserMenu"]').or(
      page.locator('button:has-text("User Avatar")')
    );

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
   * Opens the user overflow actions dropdown menu
   */
  async openOverflowActions(): Promise<void> {
    await this.overflowActionsButton.click();
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

    return await this.orgIdElement.textContent();
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
