import { APIRequestContext, expect, test } from '@playwright/test';
import { getConfig } from './route-data';

const RATE_LIMIT_DELAY = 250;
const config = getConfig();

test.describe('Route reachability', () => {
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

  for (const { path, description } of config.reachabilityRoutes) {
    test(`${path} (${description}) returns 200`, async () => {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));

      const response = await requestContext.get(path);
      expect(response.status()).toBe(200);
    });
  }
});
