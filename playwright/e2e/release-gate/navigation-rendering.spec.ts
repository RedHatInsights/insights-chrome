import { expect, test } from '../../setup/test-setup';

test.describe('Navigation rendering stability', () => {
  test.beforeEach(async ({ page }) => {
    // Dismiss webpack dev server overlay if present (dev-only, blocks pointer events)
    page.on('load', async () => {
      await page.evaluate(() => document.getElementById('webpack-dev-server-client-overlay')?.remove()).catch(() => {});
    });
  });

  test('all services page renders bundle sections and service links without errors', async ({ page }) => {
    const jsErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/allservices');
    await page.waitForLoadState('load');

    // Wait for the page heading — confirms the all services layout mounted
    await expect(page.getByRole('heading', { name: 'All Services', level: 2 })).toBeVisible({ timeout: 30000 });

    // The page must render at least one bundle section heading (h4)
    const sectionHeadings = page.getByRole('heading', { level: 4 });
    await expect(sectionHeadings.first()).toBeVisible({ timeout: 15000 });
    const sectionCount = await sectionHeadings.count();
    expect(sectionCount).toBeGreaterThanOrEqual(3);

    // Each section should contain at least one service link
    const serviceLinks = page.locator('main').getByRole('link');
    const linkCount = await serviceLinks.count();
    expect(linkCount).toBeGreaterThan(10);

    // No navigation-related JS errors should have been thrown
    const navJsErrors = jsErrors.filter(
      (msg) =>
        msg.includes('findNavLeafPath') ||
        msg.includes('isExpandableNav') ||
        msg.includes('evaluateVisibility') ||
        msg.includes("reading 'length'") ||
        msg.includes("reading 'map'")
    );
    expect(navJsErrors).toEqual([]);

    // No bundle evaluation failures should appear in console
    const bundleErrors = consoleErrors.filter((msg) => msg.includes('Failed to fetch and evaluate bundles'));
    expect(bundleErrors).toEqual([]);
  });

  test('all services page search input is interactive', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });

    await page.goto('/allservices');
    await page.waitForLoadState('load');

    // Wait for sections to render before interacting with search
    const sectionHeadings = page.getByRole('heading', { level: 4 });
    await expect(sectionHeadings.first()).toBeVisible({ timeout: 30000 });
    const initialSectionCount = await sectionHeadings.count();

    // Type a search term to filter services — this exercises the navigation data further
    const searchInput = page.getByRole('textbox', { name: /search/i });
    await expect(searchInput).toBeVisible();
    await searchInput.fill('advisor');

    // After filtering, the visible section count should be reduced
    await expect.poll(() => sectionHeadings.count()).toBeLessThan(initialSectionCount);

    // Clear the search to restore all sections
    await searchInput.clear();
    await expect.poll(() => sectionHeadings.count()).toBe(initialSectionCount);

    // No navigation-related JS errors during the whole flow
    const navJsErrors = jsErrors.filter(
      (msg) =>
        msg.includes('findNavLeafPath') ||
        msg.includes('isExpandableNav') ||
        msg.includes('evaluateVisibility') ||
        msg.includes("reading 'length'") ||
        msg.includes("reading 'map'")
    );
    expect(navJsErrors).toEqual([]);
  });

  test('landing page and services dropdown render without navigation errors', async ({ page }) => {
    const jsErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('load');

    // Wait for the page to fully render (user avatar confirms auth + chrome loaded)
    await expect(page.getByRole('button', { name: /User Avatar/ })).toBeVisible({ timeout: 30000 });

    // Open the services dropdown — exercises the AllServicesDropdown and useFavoritedServices
    const servicesToggle = page.getByRole('button', { name: 'Red Hat Hybrid Cloud Console' });
    await servicesToggle.click();

    // Verify dropdown rendered with navigation links
    await expect(page.getByRole('link').first()).toBeVisible({ timeout: 10000 });
    expect(await page.getByRole('link').count()).toBeGreaterThan(0);

    // No navigation-related JS errors
    const navJsErrors = jsErrors.filter(
      (msg) =>
        msg.includes('findNavLeafPath') ||
        msg.includes('isExpandableNav') ||
        msg.includes('evaluateVisibility') ||
        msg.includes("reading 'length'") ||
        msg.includes("reading 'map'")
    );
    expect(navJsErrors).toEqual([]);

    // No bundle evaluation failures
    const bundleErrors = consoleErrors.filter((msg) => msg.includes('Failed to fetch and evaluate bundles'));
    expect(bundleErrors).toEqual([]);
  });
});
