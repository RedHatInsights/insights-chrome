import { test, expect, APIRequestContext } from '@playwright/test';
import { getConfig } from './route-data';

const RATE_LIMIT_DELAY = 250;
const config = getConfig();

test.describe('OpenShift Google Cloud redirects', () => {
  test.describe.configure({ mode: 'serial' });

  let requestContext: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    requestContext = await playwright.request.newContext({
      ignoreHTTPSErrors: true,
      ...(config.proxy && { proxy: { server: config.proxy } }),
    });
  });

  test.afterAll(async () => {
    await requestContext?.dispose();
  });

  for (const { sourceUrl, expectedUrl } of config.crossHostRedirects) {
    test(`${sourceUrl} -> ${expectedUrl}`, async () => {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));

      const response = await requestContext.get(sourceUrl);
      const finalUrl = response.url();

      expect(finalUrl.replace(/\/$/, '')).toBe(expectedUrl.replace(/\/$/, ''));
    });
  }
});
