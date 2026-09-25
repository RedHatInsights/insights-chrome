import { expect } from '@playwright/test';
import { loginWithDiagnostics, test } from '../../helpers/websocket-test';
import { AUTH_TIMEOUT, NAVIGATION_TIMEOUT } from '../../setup/constants';
import { getConfig } from './route-data';

const config = getConfig();
const browserProxy = process.env.PLATFORM_INFRA_BROWSER_PROXY ?? config.proxy;
const WEBSOCKET_PATH = '/wss/chrome-service/v1/ws';
// The backend sends a ping every 54 seconds; allow time for stage network delays.
const HEARTBEAT_TIMEOUT = 75000;
const TEST_TIMEOUT = AUTH_TIMEOUT + NAVIGATION_TIMEOUT + 2 * HEARTBEAT_TIMEOUT;
const HEALTHY_CONNECTION = { status: 101, protocol: 'cloudevents.json', closed: false, failed: false };

test.use({
  baseURL: config.baseUrl,
  proxy: browserProxy ? { server: browserProxy } : undefined,
  trace: 'off',
  video: 'off',
  screenshot: 'off',
});

test.describe('Stage WebSocket connectivity', () => {
  test.skip(process.env.PLATFORM_INFRA_ENV !== 'stage', 'WebSocket infrastructure checks require stage');

  test('dashboard establishes a WebSocket and exchanges heartbeat frames', async ({ webSocketSession }, testInfo) => {
    test.setTimeout(TEST_TIMEOUT);
    const { page } = webSocketSession;

    await test.step('Log in to stage', () => loginWithDiagnostics(page, testInfo));
    // Register listeners before navigation so the dashboard's new socket is observed.
    const network = await webSocketSession.observe(WEBSOCKET_PATH);

    await test.step('Open the dashboard and verify the WebSocket upgrade', async () => {
      await page.goto('/insights/dashboard');
      await expect(page.getByRole('button', { name: /User Avatar/ })).toBeVisible();
      await expect
        .poll(network.connections, { timeout: HEARTBEAT_TIMEOUT, message: 'Dashboard WebSocket must upgrade with the CloudEvents protocol' })
        .toEqual([expect.objectContaining(HEALTHY_CONNECTION)]);
    });

    await test.step('Verify the connection stays healthy and exchanges a server ping and browser pong', async () => {
      await page.waitForTimeout(HEARTBEAT_TIMEOUT);
      // The monitor retains closed/failed attempts, so a reconnect cannot hide an interruption.
      expect(network.connections(), 'The original dashboard socket must stay healthy without reconnecting').toEqual([
        expect.objectContaining(HEALTHY_CONNECTION),
      ]);
      const heartbeats = await webSocketSession.finish();
      expect(heartbeats, 'The stage socket must receive a server ping and send a pong').toContainEqual({ receivedPing: true, sentPong: true });
    });
  });
});
