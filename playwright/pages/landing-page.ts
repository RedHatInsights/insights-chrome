import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

export const WIDGET_LOAD_TIMEOUT = 45000;

const DASHBOARD_HEADING = /Welcome to your Hybrid Cloud Console/i;
const WIDGET_LAYOUT = '#widget-layout-container';
const FAVORITES_WIDGET_ID = 'chrome-./DashboardFavorites-widget';
const APP_SWITCHER_NAME = /Red Hat Hybrid Cloud Console/i;
const MY_FAVORITES_PANEL_NAME = /My Favorite services/i;

/** Page object for the landing-page dashboard and its widgets. */
export class LandingPage {
  readonly page: Page;
  readonly layout: Locator;

  constructor(page: Page) {
    this.page = page;
    this.layout = page.locator(WIDGET_LAYOUT);
  }

  /** Opens the landing page and waits for its widgets to finish loading. */
  async open(): Promise<Locator> {
    await this.page.goto('/');
    return this.waitForDashboard();
  }

  /** Waits for the dashboard layout to become idle. */
  async waitForDashboard(): Promise<Locator> {
    await expect(this.page.getByRole('heading', { name: DASHBOARD_HEADING })).toBeVisible({ timeout: WIDGET_LOAD_TIMEOUT });
    await expect(this.layout).toBeVisible({ timeout: WIDGET_LOAD_TIMEOUT });
    await expect(this.layout.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: WIDGET_LOAD_TIMEOUT });
    return this.layout;
  }

  /** Returns a widget by OUIA ID, optionally scoped to the dashboard layout. */
  widgetByOuiaId(ouiaId: string, within: Page | Locator = this.page): Locator {
    return within.locator(`[data-ouia-component-id=${JSON.stringify(ouiaId)}]`);
  }

  /** Returns the dashboard's favorites widget. */
  favoritesWidget(): Locator {
    return this.widgetByOuiaId(FAVORITES_WIDGET_ID);
  }

  /** Opens the app switcher and selects its favorites panel when a tab is present. */
  async openFavoritesInAppSwitcher(): Promise<Locator> {
    await this.page.getByRole('button', { name: APP_SWITCHER_NAME }).click();

    const favoritesTab = this.page.getByRole('tab', { name: MY_FAVORITES_PANEL_NAME });
    if ((await favoritesTab.count()) > 0) {
      await favoritesTab.click();
    }

    const favoritesPanel = this.page.getByRole('tabpanel', { name: MY_FAVORITES_PANEL_NAME });
    await expect(favoritesPanel).toBeVisible();
    return favoritesPanel;
  }

  /** Returns an exact-name service link from a landing-page surface. */
  favoriteServiceLink(surface: Locator, serviceName: string): Locator {
    const escapedName = serviceName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return surface.getByRole('link', { name: new RegExp(`^${escapedName}$`, 'i') });
  }

  /** Opens the widget catalog. */
  async openWidgetCatalog(): Promise<void> {
    await this.page.locator('[data-ouia-component-id="add-widget-button"]').click();
  }

  /** Returns a widget card from the catalog by OUIA ID. */
  widgetCatalogItem(ouiaId: string): Locator {
    return this.widgetByOuiaId(ouiaId);
  }

  /** Adds a catalog widget by dragging it to the first existing dashboard widget. */
  async addWidgetToFirstSlot(catalogCard: Locator): Promise<void> {
    const dropTarget = this.layout.locator('[data-ouia-component-id$="-widget"]').first();
    await expect(dropTarget).toBeVisible();
    await catalogCard.dragTo(dropTarget);
  }

  /** Removes a widget through its actions menu and waits for it to disappear. */
  async removeWidget(widget: Locator): Promise<void> {
    await widget.hover();
    await widget.getByRole('button', { name: 'Widget actions' }).click();
    await this.page.getByRole('menuitem', { name: /^Remove/i }).click();
    await expect(widget).toHaveCount(0);
  }
}
