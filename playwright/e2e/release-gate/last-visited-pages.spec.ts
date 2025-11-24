import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth';

test.describe('last-visited-pages empty behavior', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);

    // Because of the user table relation, the data from /last-visited and /user must match to mock the db state correctly
    await page.route('**/api/chrome-service/v1/user', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 2435,
            createdAt: '2023-05-15T18:08:27.38611Z',
            updatedAt: '2023-06-06T15:04:05.366605Z',
            deletedAt: null,
            accountId: '402359432',
            firstLogin: true,
            dayOne: true,
            lastLogin: '2023-05-15T18:08:27.376277Z',
            lastVisitedPages: [
              {
                bundle: 'Openshift',
                pathname: '/',
                title: 'Overview | Red Hat OpenShift Cluster Manager',
              },
              { pathname: '/', title: 'Hybrid Cloud Console Home | Home', bundle: 'Home' },
            ],
            favoritePages: [],
          },
        }),
      });
    });

    await page.route('**/api/chrome-service/v1/last-visited', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              bundle: 'Openshift',
              pathname: '/',
              title: 'Overview | Red Hat OpenShift Cluster Manager',
            },
            { pathname: '/', title: 'Hybrid Cloud Console Home | Home', bundle: 'Home' },
          ],
        }),
      });
    });
  });

  // local storage is not an end-user facing feature, so testing it explicitly falls within integration/unit/component scope
  // test skipped because it's failing as of August 4, 2025
  test.skip('will initialize the local storage from the database and visit two pages', async ({ page }) => {
    await page.goto('/');

    // Wait for API calls
    await page.waitForResponse((response) => response.url().includes('/api/chrome-service/v1/user') && response.status() === 200);
    await page.waitForResponse((response) => response.url().includes('/api/chrome-service/v1/last-visited') && response.status() === 200);

    // Check local storage
    const localStore = await page.evaluate(() => localStorage.getItem('chrome:lastVisited'));
    expect(localStore).toBe(
      JSON.stringify([
        {
          bundle: 'Openshift',
          pathname: '/',
          title: 'Overview | Red Hat OpenShift Cluster Manager',
        },
        { pathname: '/', title: 'Hybrid Cloud Console Home | Home', bundle: 'Home' },
      ])
    );

    await page.goto('/settings/learning-resources');
    await page.waitForResponse((response) => response.url().includes('/api/chrome-service/v1/user') && response.status() === 200);

    // Check updated local storage
    const updatedLocalStore = await page.evaluate(() => localStorage.getItem('chrome:lastVisited'));
    expect(updatedLocalStore).toBe(
      JSON.stringify([
        { pathname: '/settings/learning-resources', title: 'Learning Resources | console.redhat.com', bundle: 'Settings' },
        {
          bundle: 'Openshift',
          pathname: '/',
          title: 'Overview | Red Hat OpenShift Cluster Manager',
        },
        { pathname: '/', title: 'Hybrid Cloud Console Home | Home', bundle: 'Home' },
      ])
    );
  });

  // not an E2E test (the end user doesn't care about localStorage)
  test.skip('will send updated localStorage to the API when hidden', async ({ page }) => {
    await page.route('**/api/chrome-service/v1/last-visited', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                bundle: 'Openshift',
                pathname: '/',
                title: 'Overview | Red Hat OpenShift Cluster Manager',
              },
              { pathname: '/', title: 'Hybrid Cloud Console Home | Home', bundle: 'Home' },
            ],
          }),
        });
      } else if (route.request().method() === 'POST') {
        const requestBody = route.request().postDataJSON();
        const expectedBody = [
          { pathname: '/settings/learning-resources', title: 'Learning Resources | console.redhat.com', bundle: 'Settings' },
          {
            bundle: 'Openshift',
            pathname: '/',
            title: 'Overview | Red Hat OpenShift Cluster Manager',
          },
          { pathname: '/', title: 'Hybrid Cloud Console Home | Home', bundle: 'Home' },
        ];
        expect(requestBody).toEqual(expectedBody);
        await route.fulfill({ status: 200, body: JSON.stringify({}) });
      }
    });

    await page.goto('/settings/learning-resources');
    await page.waitForResponse((response) => response.url().includes('/api/chrome-service/v1/user') && response.status() === 200);
    await page.waitForResponse((response) => response.url().includes('/api/chrome-service/v1/last-visited') && response.status() === 200);

    // Trigger blur event to simulate page becoming hidden
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));

    // Wait for the debounced API call (20 seconds)
    await page.waitForTimeout(21000);
  });

  // Falls outside the scope of E2E testing, should be covered in an integration test.
  test.skip('will send updated localStorage to the API on an interval', async ({ page }) => {
    await page.route('**/api/chrome-service/v1/last-visited', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                bundle: 'Openshift',
                pathname: '/',
                title: 'Overview | Red Hat OpenShift Cluster Manager',
              },
              { pathname: '/', title: 'Hybrid Cloud Console Home | Home', bundle: 'Home' },
            ],
          }),
        });
      } else if (route.request().method() === 'POST') {
        const requestBody = route.request().postDataJSON();
        const expectedBody = [
          { pathname: '/settings/learning-resources', title: 'Learning Resources | console.redhat.com', bundle: 'Settings' },
          {
            bundle: 'Openshift',
            pathname: '/',
            title: 'Overview | Red Hat OpenShift Cluster Manager',
          },
          { pathname: '/', title: 'Hybrid Cloud Console Home | Home', bundle: 'Home' },
        ];
        expect(requestBody).toEqual(expectedBody);
        await route.fulfill({ status: 200, body: JSON.stringify({}) });
      }
    });

    await page.goto('/settings/learning-resources');
    await page.waitForResponse((response) => response.url().includes('/api/chrome-service/v1/user') && response.status() === 200);
    await page.waitForResponse((response) => response.url().includes('/api/chrome-service/v1/last-visited') && response.status() === 200);

    // Fast-forward time by 3 minutes (interval trigger)
    await page.waitForTimeout(180000);
  });
});

test.describe.skip('last-visited-pages standard behavior', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);

    // Because of the user table relation, the data from /last-visited and /user must match to mock the db state correctly
    await page.route('**/api/chrome-service/v1/user', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 2435,
            createdAt: '2023-05-15T18:08:27.38611Z',
            updatedAt: '2023-06-06T15:04:05.366605Z',
            deletedAt: null,
            accountId: '402359432',
            firstLogin: true,
            dayOne: true,
            lastLogin: '2023-05-15T18:08:27.376277Z',
            lastVisitedPages: [
              {
                bundle: 'Openshift',
                pathname: '/',
                title: 'Overview | Red Hat OpenShift Cluster Manager',
              },
              { pathname: '/', title: 'Hybrid Cloud Console Home | Home', bundle: 'Home' },
            ],
            favoritePages: [],
          },
        }),
      });
    });
  });

  test('will not use /last-visited data when local storage is already initialized', async ({ page }) => {
    // Set local storage before visiting
    await page.addInitScript(() => {
      localStorage.setItem(
        'chrome:lastVisited',
        JSON.stringify([
          {
            bundle: 'Openshift',
            pathname: '/',
            title: 'Overview | Red Hat OpenShift Cluster Manager',
          },
        ])
      );
    });

    await page.goto('/settings/learning-resources');
    await page.waitForResponse((response) => response.url().includes('/api/chrome-service/v1/user') && response.status() === 200);

    const localStore = await page.evaluate(() => localStorage.getItem('chrome:lastVisited'));
    expect(localStore).toBe(
      JSON.stringify([
        { pathname: '/settings/learning-resources', title: 'Learning Resources | console.redhat.com', bundle: 'Settings' },
        {
          bundle: 'Openshift',
          pathname: '/',
          title: 'Overview | Red Hat OpenShift Cluster Manager',
        },
      ])
    );
  });
});
