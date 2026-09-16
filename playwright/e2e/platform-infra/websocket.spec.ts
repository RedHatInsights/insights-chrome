import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, expect, test } from '@playwright/test';
import { login } from '../../helpers/auth';
import { AUTH_TIMEOUT, NAVIGATION_TIMEOUT } from '../../setup/constants';
import { getConfig } from './route-data';

const config = getConfig();
// Keep API infrastructure routing separate from the browser's network path.
const browserProxy = process.env.PLATFORM_INFRA_BROWSER_PROXY ?? config.proxy;
const WEBSOCKET_PATH = '/wss/chrome-service/v1/ws';
// chrome-service sends a ping every 54 seconds. Allow time for stage network delays.
const HEARTBEAT_TIMEOUT = 75000;
const TEST_TIMEOUT = AUTH_TIMEOUT + NAVIGATION_TIMEOUT + 2 * HEARTBEAT_TIMEOUT;

test.use({ trace: 'off', video: 'off', screenshot: 'off' });

test.describe('Stage WebSocket connectivity', () => {
  test.skip(process.env.PLATFORM_INFRA_ENV !== 'stage', 'WebSocket infrastructure checks require stage');
  test('dashboard establishes a WebSocket and exchanges heartbeat frames', async ({}, testInfo) => {
    test.setTimeout(TEST_TIMEOUT);
    expect(Boolean(process.env.E2E_USER && process.env.E2E_PASSWORD), 'E2E_USER and E2E_PASSWORD must be set for the stage check').toBe(true);
    const directory = await mkdtemp(join(tmpdir(), 'chrome-websocket-'));
    const logPath = join(directory, 'netlog.json');
    const browser = await chromium.launch({ args: [`--log-net-log=${logPath}`, ...(browserProxy === 'direct' ? ['--no-proxy-server'] : [])] });
    try {
      const context = await browser.newContext({
        baseURL: config.baseUrl,
        ignoreHTTPSErrors: true,
        ...(browserProxy && browserProxy !== 'direct' && { proxy: { server: browserProxy } }),
      });
      const page = await context.newPage();
      page.setDefaultTimeout(AUTH_TIMEOUT);
      page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);
      try {
        await login(page);
      } catch (error) {
        // Preserve useful diagnostics without recording credentials, tokens, or SSO query parameters.
        const url = new URL(page.url());
        await testInfo.attach('login-page-summary', {
          body: JSON.stringify(
            {
              location: `${url.origin}${url.pathname}`,
              title: await page.title(),
              usernameFields: await page.getByLabel('Red Hat login').count(),
              visibleUsernameFields: await page.getByLabel('Red Hat login').filter({ visible: true }).count(),
              lockdownVisible: await page.getByText('Lockdown', { exact: false }).first().isVisible(),
            },
            null,
            2
          ),
          contentType: 'application/json',
        });
        throw error;
      }

      // Observe the dashboard's own socket handshake and connection failures.
      const session = await context.newCDPSession(page);
      const observedSockets: string[] = [];
      const featureFlags: { status: number; notificationsEnabled?: boolean }[] = [];
      const flagReads: Promise<void>[] = [];
      page.on('response', (response) => {
        if (new URL(response.url()).pathname !== '/api/featureflags/v0') return;
        const result: { status: number; notificationsEnabled?: boolean } = { status: response.status() };
        featureFlags.push(result);
        flagReads.push(
          response
            .json()
            .then((body: { toggles?: { name: string; enabled: boolean }[] }) => {
              result.notificationsEnabled = body.toggles?.find((toggle) => toggle.name === 'platform.chrome.notifications-drawer')?.enabled ?? false;
            })
            .catch(() => {
              /* Status is still available when the response is not JSON. */
            })
        );
      });
      const connections = new Map<string, { status?: number; protocol?: string; error?: string; csJwtSent?: boolean; closed: boolean; failed: boolean }>();
      session.on('Network.webSocketCreated', ({ requestId, url }) => {
        const socketUrl = new URL(url);
        observedSockets.push(`${socketUrl.origin}${socketUrl.pathname}`);
        if (url === `${config.baseUrl.replace(/^https:/, 'wss:')}${WEBSOCKET_PATH}`) {
          connections.set(requestId, { closed: false, failed: false });
        }
      });
      session.on('Network.webSocketWillSendHandshakeRequest', ({ requestId, request }) => {
        const connection = connections.get(requestId);
        if (connection) {
          // Check the outgoing header, not just the cookie jar. Never retain cookie values.
          const cookieHeader = Object.entries(request.headers).find(([name]) => name.toLowerCase() === 'cookie')?.[1];
          connection.csJwtSent = (cookieHeader ?? '').split(';').some((cookie) => cookie.trim().startsWith('cs_jwt='));
        }
      });
      session.on('Network.webSocketHandshakeResponseReceived', ({ requestId, response }) => {
        const connection = connections.get(requestId);
        if (connection) {
          connection.status = response.status;
          connection.protocol = Object.entries(response.headers).find(([name]) => name.toLowerCase() === 'sec-websocket-protocol')?.[1];
        }
      });
      session.on('Network.webSocketClosed', ({ requestId }) => {
        const connection = connections.get(requestId);
        if (connection) connection.closed = true;
      });
      session.on('Network.webSocketFrameError', ({ requestId, errorMessage }) => {
        const connection = connections.get(requestId);
        if (connection) {
          connection.failed = true;
          // Retain diagnostic codes, without arbitrary server text or URLs containing credentials.
          connection.error =
            errorMessage.match(/Unexpected response code: \d{3}/i)?.[0] ??
            errorMessage.match(/net::ERR_[A-Z_]+/)?.[0] ??
            'WebSocket error without an HTTP status or network error code';
        }
      });

      let connectionFailure: unknown;
      let hasWebSocketCookie = false;
      try {
        await session.send('Network.enable');
        // A full navigation creates a fresh application socket after listeners are registered.
        await page.goto('/insights/dashboard');
        await expect(page.getByRole('button', { name: /User Avatar/ })).toBeVisible();
        await expect
          .poll(() => [...connections.values()], { timeout: HEARTBEAT_TIMEOUT, message: 'Dashboard WebSocket must upgrade with the CloudEvents protocol' })
          .toEqual(expect.arrayContaining([expect.objectContaining({ status: 101, protocol: 'cloudevents.json', closed: false, failed: false })]));
        // NetLog includes control frames; CDP and Playwright's frame events omit them.
        await page.waitForTimeout(HEARTBEAT_TIMEOUT);
        expect([...connections.values()].some((connection) => connection.status === 101 && !connection.closed && !connection.failed)).toBe(true);
      } catch (error) {
        connectionFailure = error;
      } finally {
        hasWebSocketCookie = (await context.cookies(`${config.baseUrl}${WEBSOCKET_PATH}`)).some((cookie) => cookie.name === 'cs_jwt');
        await Promise.all(flagReads);
        await session.detach();
        await browser.close(); // Flush the network log before reading it.
      }
      const log = JSON.parse(await readFile(logPath, 'utf8')) as {
        constants: { logEventTypes: Record<string, number> };
        events: { type: number; source: { id: number }; params?: { url?: string; opcode?: number } }[];
      };
      const types = log.constants.logEventTypes;
      const socketUrl = `${config.baseUrl.replace(/^https:/, 'wss:')}${WEBSOCKET_PATH}`;
      // Use the last connection so login traffic or an earlier failed attempt cannot satisfy the check.
      const sources = log.events
        .filter((event) => event.type === types.REQUEST_ALIVE && event.params?.url === socketUrl)
        .slice(-1)
        .map((event) => event.source.id);
      const heartbeats = [...sources].map((id) => {
        const frames = log.events.filter((event) => event.source.id === id);
        const pingIndex = frames.findIndex((event) => event.type === types.WEBSOCKET_RECV_FRAME_HEADER && event.params?.opcode === 9);
        const pong = frames.some((event, index) => index > pingIndex && event.type === types.WEBSOCKET_SENT_FRAME_HEADER && event.params?.opcode === 10);
        return { receivedPing: pingIndex >= 0, sentPong: pingIndex >= 0 && pong };
      });
      await testInfo.attach('websocket-network-summary', {
        body: JSON.stringify(
          {
            path: WEBSOCKET_PATH,
            networkMode: browserProxy === 'direct' ? 'direct' : browserProxy ? 'explicit proxy' : 'browser default',
            observedSockets,
            featureFlags,
            hasWebSocketCookie,
            connections: [...connections.values()],
            heartbeats,
          },
          null,
          2
        ),
        contentType: 'application/json',
      });
      if (connectionFailure) throw connectionFailure;
      expect(
        heartbeats.some(({ receivedPing, sentPong }) => receivedPing && sentPong),
        'The stage socket must receive a server ping and send a pong'
      ).toBe(true);
    } finally {
      await browser.close();
      // Never retain raw network logs, which may contain account or request data.
      await rm(directory, { recursive: true, force: true });
    }
  });
});
