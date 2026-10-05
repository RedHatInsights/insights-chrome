import { type Server, createServer } from 'node:http';
import { expect, test } from '@playwright/test';
import { mockFeatureFlags } from '../helpers/feature-flags';

const toggle = (name: string, enabled: boolean) => ({
  name,
  enabled,
  impressionData: false,
  variant: { name: 'disabled', enabled: false },
});

// No Console credentials or stage dependencies: exercise actual Playwright
// interception against an upstream that enables the conflicting automatic mode.
test.use({ storageState: { cookies: [], origins: [] } });

let server: Server;
let origin: string;
const upstreamToggles = [toggle('platform.chrome.felt-theme', false), toggle('platform.chrome-felt-auto', true), toggle('unrelated-feature', true)];

test.beforeAll(async () => {
  server = createServer((request, response) => {
    if (request.url?.startsWith('/api/featureflags/v0')) {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ toggles: upstreamToggles }));
    } else {
      response.setHeader('Content-Type', 'text/html');
      response.end('<!doctype html><title>Feature flag interception test</title>');
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected a TCP address for the test server');
  origin = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  if (server?.listening) {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test('legacy enabled-only overrides preserve the live automatic-mode flag', async ({ page }) => {
  await mockFeatureFlags(page, ['platform.chrome.felt-theme'], [], origin);
  await page.goto(origin);

  const result = await page.evaluate(async () => (await fetch('/api/featureflags/v0')).json());

  expect(result.toggles).toEqual([toggle('platform.chrome-felt-auto', true), toggle('unrelated-feature', true), toggle('platform.chrome.felt-theme', true)]);
});

test('manual-mode overrides win over live flags and survive page reload', async ({ page, request }) => {
  const upstream = await request.get(`${origin}/api/featureflags/v0`);
  expect((await upstream.json()).toggles).toEqual(upstreamToggles);

  await mockFeatureFlags(page, ['platform.chrome.felt-theme'], ['platform.chrome-felt-auto'], origin);
  await page.goto(origin);

  const expected = [toggle('unrelated-feature', true), toggle('platform.chrome.felt-theme', true), toggle('platform.chrome-felt-auto', false)];
  const beforeReload = await page.evaluate(async () => (await fetch('/api/featureflags/v0')).json());
  expect(beforeReload.toggles).toEqual(expected);

  await page.reload();
  const afterReload = await page.evaluate(async () => (await fetch('/api/featureflags/v0')).json());
  expect(afterReload.toggles).toEqual(expected);
});
