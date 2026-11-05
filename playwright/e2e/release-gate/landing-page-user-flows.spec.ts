import { expect, test as baseTest } from '../../setup/test-setup';
import type { Locator, Page } from '@playwright/test';

const DASHBOARD_HEADING = /Welcome to your Hybrid Cloud Console/i;
const WIDGET_LAYOUT = '#widget-layout-container';
const FAVORITES_WIDGET_ID = 'chrome-./DashboardFavorites-widget';
const APP_SWITCHER_NAME = /Red Hat Hybrid Cloud Console/i;
const MY_FAVORITES_PANEL_NAME = /My Favorite services/i;
const WIDGET_LOAD_TIMEOUT = 45000;

const expectedWidgetIds = (process.env.LANDING_PAGE_EXPECTED_WIDGETS ?? '')
  .split(',')
  .map((widgetId) => widgetId.trim())
  .filter(Boolean);
const favoriteService = process.env.LANDING_PAGE_FAVORITE_SERVICE?.trim();
const mutableWidgetName = process.env.LANDING_PAGE_MUTABLE_WIDGET?.trim();
const mutableWidgetCatalogId = process.env.LANDING_PAGE_MUTABLE_WIDGET_CATALOG_ID?.trim();
const mutableWidgetOuiaId = process.env.LANDING_PAGE_MUTABLE_WIDGET_OUIA_ID?.trim();
const mutationEnabled = process.env.LANDING_PAGE_MUTATION_ENABLED === 'true';
const CLEANUP_TIMEOUT = 120000;

const test = baseTest.extend<{ registerWidgetCleanup: (ouiaId: string) => void }>({
  registerWidgetCleanup: [
    async ({ page }, use) => {
      let widgetOuiaId: string | undefined;
      await use((ouiaId) => {
        widgetOuiaId = ouiaId;
      });

      if (!widgetOuiaId) return;

      const widget = widgetByOuiaId(page, widgetOuiaId);
      await page.reload();
      await waitForDashboard(page);
      if ((await widget.count()) > 0) {
        await removeWidget(page, widget);
        await page.reload();
        await waitForDashboard(page);
        await expect(widget).toHaveCount(0);
      }
    },
    { timeout: CLEANUP_TIMEOUT },
  ],
});

async function waitForDashboard(page: Page) {
  await expect(page.getByRole('heading', { name: DASHBOARD_HEADING })).toBeVisible({ timeout: WIDGET_LOAD_TIMEOUT });
  const layout = page.locator(WIDGET_LAYOUT);
  await expect(layout).toBeVisible({ timeout: WIDGET_LOAD_TIMEOUT });
  await expect(layout.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: WIDGET_LOAD_TIMEOUT });
  return layout;
}

function widgetByOuiaId(page: Page, ouiaId: string) {
  return page.locator(`[data-ouia-component-id=${JSON.stringify(ouiaId)}]`);
}

function exactName(value: string): RegExp {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
}

async function favoriteIsVisibleInSwitcher(page: Page, serviceName: string) {
  await page.getByRole('button', { name: APP_SWITCHER_NAME }).click();

  const favoritesTab = page.getByRole('tab', { name: MY_FAVORITES_PANEL_NAME });
  if ((await favoritesTab.count()) > 0) {
    await favoritesTab.click();
  }

  const favoritesPanel = page.getByRole('tabpanel', { name: MY_FAVORITES_PANEL_NAME });
  await expect(favoritesPanel).toBeVisible();
  const serviceLink = favoritesPanel.getByRole('link', { name: exactName(serviceName) });
  await expect(serviceLink).toBeVisible({ timeout: WIDGET_LOAD_TIMEOUT });
  return true;
}

async function removeWidget(page: Page, widget: Locator) {
  await widget.hover();
  await widget.getByRole('button', { name: 'Widget actions' }).click();
  await page.getByRole('menuitem', { name: /^Remove/i }).click();
  await expect(widget).toHaveCount(0);
}

test.describe('Landing page user flows', () => {
  test('LP-01: renders the account default widget inventory after loading', async ({ page }) => {
    test.skip(
      expectedWidgetIds.length === 0,
      'Blocked — test data unavailable: configure LANDING_PAGE_EXPECTED_WIDGETS for the account default layout and enabled flags.'
    );

    await page.goto('/');
    const layout = await waitForDashboard(page);

    for (const ouiaId of expectedWidgetIds) {
      const widget = layout.locator(`[data-ouia-component-id=${JSON.stringify(ouiaId)}]`);
      await expect(widget).toBeVisible({ timeout: WIDGET_LOAD_TIMEOUT });
      await expect(widget.getByRole('progressbar')).toHaveCount(0, { timeout: WIDGET_LOAD_TIMEOUT });
      await expect(widget.getByText(/unable to load content/i)).toHaveCount(0, { timeout: WIDGET_LOAD_TIMEOUT });
    }

    const renderedWidgets = layout.locator('[data-ouia-component-id$="-widget"]');
    await expect
      .poll(
        async () =>
          (
            await renderedWidgets.evaluateAll((widgets) =>
              widgets.map((widget) => widget.getAttribute('data-ouia-component-id')).filter((widgetId): widgetId is string => widgetId !== null)
            )
          ).sort(),
        { timeout: WIDGET_LOAD_TIMEOUT }
      )
      .toEqual([...expectedWidgetIds].sort());
  });

  test('LP-02: shows the same known favorite in the landing widget and app switcher', async ({ page }) => {
    test.skip(!favoriteService, 'Blocked — test data unavailable: configure LANDING_PAGE_FAVORITE_SERVICE to a favorite already set on the test account.');

    const compareSurfaces = async () => {
      await page.goto('/');
      await waitForDashboard(page);
      const favoritesWidget = widgetByOuiaId(page, FAVORITES_WIDGET_ID);
      await expect(favoritesWidget).toBeVisible({ timeout: WIDGET_LOAD_TIMEOUT });
      const homeFavoriteLink = favoritesWidget.getByRole('link', { name: exactName(favoriteService!) });
      await expect(homeFavoriteLink).toBeVisible({ timeout: WIDGET_LOAD_TIMEOUT });
      const switcherFavorite = await favoriteIsVisibleInSwitcher(page, favoriteService!);
      return { homeFavorite: true, switcherFavorite };
    };

    const result = await compareSurfaces();
    expect(result.homeFavorite).toBe(true);
    expect(result.switcherFavorite).toBe(true);
  });

  test('LP-03: adds, persists, removes, and restores a dashboard widget', async ({ page, registerWidgetCleanup }) => {
    test.setTimeout(240000);

    test.skip(
      !mutationEnabled || !mutableWidgetName || !mutableWidgetCatalogId || !mutableWidgetOuiaId,
      'Blocked — test data unavailable: enable a dedicated mutable account and configure the widget name and OUIA IDs.'
    );

    await page.goto('/');
    const layout = await waitForDashboard(page);
    const widget = widgetByOuiaId(page, mutableWidgetOuiaId!);
    test.skip((await widget.count()) > 0, 'Blocked — test data unavailable: selected widget must be absent from the account baseline.');

    await page.locator('[data-ouia-component-id="add-widget-button"]').click();
    const catalogCard = page.locator(`[data-ouia-component-id=${JSON.stringify(mutableWidgetCatalogId)}]`);
    test.skip((await catalogCard.count()) === 0, 'Blocked — test data unavailable: selected widget is not present in the add-widget catalog.');
    await expect(catalogCard).toBeVisible();

    const dropTarget = layout.locator('[data-ouia-component-id$="-widget"]').first();
    await expect(dropTarget).toBeVisible();

    registerWidgetCleanup(mutableWidgetOuiaId!);
    await catalogCard.dragTo(dropTarget);
    await expect(widget).toBeVisible({ timeout: WIDGET_LOAD_TIMEOUT });

    await page.reload();
    await waitForDashboard(page);
    await expect(widget).toBeVisible({ timeout: WIDGET_LOAD_TIMEOUT });

    await removeWidget(page, widget);
    await page.reload();
    await waitForDashboard(page);
    await expect(widget).toHaveCount(0);
  });
});
