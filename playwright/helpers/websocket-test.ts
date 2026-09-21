import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Page, TestInfo, chromium, test as base } from '@playwright/test';
import { ChromiumNetworkLog, Heartbeat, getHeartbeats, observeWebSocket } from './websocket-monitor';
import { AUTH_TIMEOUT, NAVIGATION_TIMEOUT } from '../setup/constants';
import { login } from './auth';

type Monitor = Awaited<ReturnType<typeof observeWebSocket>>;

interface WebSocketSession {
  page: Page;
  observe: (path: string) => Promise<Monitor>;
  finish: () => Promise<Heartbeat[]>;
}

/** Own the dedicated browser and raw NetLog, including cleanup after failed assertions. */
export const test = base.extend<{ webSocketSession: WebSocketSession }>({
  webSocketSession: async ({ baseURL, proxy, headless }, use, testInfo) => {
    if (!baseURL) throw new Error('WebSocket checks require a baseURL');
    const directory = await mkdtemp(join(tmpdir(), 'chrome-websocket-'));
    const logPath = join(directory, 'netlog.json');
    const direct = proxy?.server === 'direct';
    const browser = await chromium.launch({ headless, args: [`--log-net-log=${logPath}`, ...(direct ? ['--no-proxy-server'] : [])] });
    let browserCloseAttempted = false;
    try {
      const context = await browser.newContext({ baseURL, ignoreHTTPSErrors: true, ...(!direct && proxy && { proxy }) });
      const page = await context.newPage();
      page.setDefaultTimeout(AUTH_TIMEOUT);
      page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);
      let monitor: Monitor | undefined;
      let targetUrl: string;
      let summary: Promise<Heartbeat[]> | undefined;

      async function saveSummary(): Promise<Heartbeat[]> {
        if (!monitor) return [];
        const network = await monitor.stop();
        // Mark before awaiting so teardown does not retry a failed close.
        browserCloseAttempted = true;
        await browser.close(); // Flush NetLog before parsing; normal page teardown would record a close.
        const log: ChromiumNetworkLog = JSON.parse(await readFile(logPath, 'utf8'));
        const heartbeats = getHeartbeats(log, targetUrl);
        await testInfo.attach('websocket-network-summary', {
          body: JSON.stringify(
            { path: new URL(targetUrl).pathname, networkMode: direct ? 'direct' : proxy ? 'explicit proxy' : 'browser default', ...network, heartbeats },
            null,
            2
          ),
          contentType: 'application/json',
        });
        return heartbeats;
      }

      // The test can finish early to assert on frames; teardown also saves diagnostics on failure.
      const finish = () => (summary ??= saveSummary());
      try {
        await use({
          page,
          async observe(path) {
            targetUrl = new URL(path, baseURL).href.replace(/^https:/, 'wss:');
            monitor = await observeWebSocket(page, targetUrl);
            return monitor;
          },
          finish,
        });
      } finally {
        await finish();
      }
    } finally {
      try {
        if (!browserCloseAttempted) await browser.close();
      } finally {
        // Raw logs can contain account/request data; only the sanitized summary is retained.
        await rm(directory, { recursive: true, force: true });
      }
    }
  },
});

/** Keep credential entry in the shared auth helper; attach only sanitized failure details. */
export async function loginWithDiagnostics(page: Page, testInfo: TestInfo): Promise<void> {
  try {
    await login(page);
  } catch (error) {
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
}
