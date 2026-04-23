import { test } from '../../setup/test-setup';

const userPayload = {
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
};

const lastVisitedPayload = {
  data: [
    {
      bundle: 'Openshift',
      pathname: '/',
      title: 'Overview | Red Hat OpenShift Cluster Manager',
    },
    { pathname: '/', title: 'Hybrid Cloud Console Home | Home', bundle: 'Home' },
  ],
};

test.describe('last-visited-pages empty behavior', () => {
  test('will send updated localStorage to the API when hidden', async ({ page }) => {
    await page.route('**/api/chrome-service/v1/user', (route) => route.fulfill({ json: userPayload }));
    await page.route('**/api/chrome-service/v1/last-visited', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ json: lastVisitedPayload });
      }
      return route.continue();
    });

    await page.goto('/settings/learning-resources');

    await page.clock.install();
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.clock.fastForward(20_000);
    await page.waitForTimeout(500);
  });

  test('will send updated localStorage to the API on an interval', async ({ page }) => {
    await page.route('**/api/chrome-service/v1/user', (route) => route.fulfill({ json: userPayload }));
    await page.route('**/api/chrome-service/v1/last-visited', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ json: lastVisitedPayload });
      }
      return route.continue();
    });

    await page.goto('/settings/learning-resources');

    await page.clock.install();
    await page.clock.fastForward(3 * 60 * 1000);
    await page.waitForTimeout(500);
  });
});
