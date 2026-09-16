import { APIRequestContext, expect, test } from '@playwright/test';
import { getConfig } from './route-data';

const RATE_LIMIT_DELAY = 250;
const config = getConfig();

test.describe('Akamai redirects', () => {
  test.describe.configure({ mode: 'serial' });

  let requestContext: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    requestContext = await playwright.request.newContext({
      baseURL: config.baseUrl,
      ignoreHTTPSErrors: true,
      ...(config.proxy && { proxy: { server: config.proxy } }),
    });
  });

  test.afterAll(async () => {
    await requestContext?.dispose();
  });

  for (const { oldPath, newPath } of config.redirects) {
    test(`${oldPath} -> ${newPath}`, async () => {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));

      const response = await requestContext.get(oldPath);
      const finalUrl = response.url();
      const expected = `${config.baseUrl}${newPath}`;

      expect(finalUrl.replace(/\/$/, '')).toBe(expected.replace(/\/$/, ''));
    });
  }
});
