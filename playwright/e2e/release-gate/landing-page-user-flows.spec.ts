import { test as baseTest, expect } from '../../setup/test-setup';
import { LandingPage, WIDGET_LOAD_TIMEOUT } from '../../pages/landing-page';

const LANDING_PAGE_FLOW_TIMEOUT = 180000;

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

      const landingPage = new LandingPage(page);
      const widget = landingPage.widgetByOuiaId(widgetOuiaId);
      await page.reload();
      await landingPage.waitForDashboard();
      if ((await widget.count()) > 0) {
        await landingPage.removeWidget(widget);
        await page.reload();
        await landingPage.waitForDashboard();
        await expect(widget).toHaveCount(0);
      }
    },
    { timeout: CLEANUP_TIMEOUT },
  ],
});

test.describe('Landing page user flows', () => {
  test.describe.configure({ timeout: LANDING_PAGE_FLOW_TIMEOUT });

  test('LP-01: renders the account default widget inventory after loading', async ({ page }) => {
    test.skip(
      expectedWidgetIds.length === 0,
      'Blocked — test data unavailable: configure LANDING_PAGE_EXPECTED_WIDGETS for the account default layout and enabled flags.'
    );

    const landingPage = new LandingPage(page);
    const layout = await landingPage.open();

    for (const ouiaId of expectedWidgetIds) {
      const widget = landingPage.widgetByOuiaId(ouiaId, layout);
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
      const landingPage = new LandingPage(page);
      await landingPage.open();
      const favoritesWidget = landingPage.favoritesWidget();
      await expect(favoritesWidget).toBeVisible({ timeout: WIDGET_LOAD_TIMEOUT });
      const homeFavoriteLink = landingPage.favoriteServiceLink(favoritesWidget, favoriteService!);
      await expect(homeFavoriteLink).toBeVisible({ timeout: WIDGET_LOAD_TIMEOUT });
      const favoritesPanel = await landingPage.openFavoritesInAppSwitcher();
      const switcherFavoriteLink = landingPage.favoriteServiceLink(favoritesPanel, favoriteService!);
      await expect(switcherFavoriteLink).toBeVisible({ timeout: WIDGET_LOAD_TIMEOUT });
      return { homeFavorite: true, switcherFavorite: true };
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

    const landingPage = new LandingPage(page);
    await landingPage.open();
    const widget = landingPage.widgetByOuiaId(mutableWidgetOuiaId!);
    test.skip((await widget.count()) > 0, 'Blocked — test data unavailable: selected widget must be absent from the account baseline.');

    await landingPage.openWidgetCatalog();
    const catalogCard = landingPage.widgetCatalogItem(mutableWidgetCatalogId!);
    test.skip((await catalogCard.count()) === 0, 'Blocked — test data unavailable: selected widget is not present in the add-widget catalog.');
    await expect(catalogCard).toBeVisible();

    registerWidgetCleanup(mutableWidgetOuiaId!);
    await landingPage.addWidgetToFirstSlot(catalogCard);
    await expect(widget).toBeVisible({ timeout: WIDGET_LOAD_TIMEOUT });

    await page.reload();
    await landingPage.waitForDashboard();
    await expect(widget).toBeVisible({ timeout: WIDGET_LOAD_TIMEOUT });

    await landingPage.removeWidget(widget);
    await page.reload();
    await landingPage.waitForDashboard();
    await expect(widget).toHaveCount(0);
  });
});
