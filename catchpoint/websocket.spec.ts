import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import { resolve } from 'node:path';
import { Page, expect, test } from '@playwright/test';
import { WebSocketServer } from 'ws';

type Mode = 'healthy' | 'reject' | 'close' | 'wrong-protocol' | 'missing-cookie' | 'timeout' | 'lockdown';

async function runMonitor(page: Page, mode: Mode, authenticated = false, outcomes: string[] = []) {
  const handshakes: { hasCookie: boolean; protocol?: string }[] = [];
  const server = createServer((request, response) => {
    response.setHeader('Content-Type', 'text/html');
    if (mode === 'lockdown') {
      response.end('<!doctype html><h1>Lockdown</h1>');
      return;
    }
    if (request.headers.cookie?.includes('session=logged-in')) {
      response.end('<!doctype html><button aria-label="User Avatar">Test user</button>');
      return;
    }
    response.end(`<!doctype html>
      <label>Red Hat login<input name="username"></label><button id="next">Next</button>
      <div id="password-step" hidden><label>Password<input type="password"></label><button id="login">Log in</button></div>
      <script>
        document.querySelector('#next').onclick = () => document.querySelector('#password-step').hidden = false;
        document.querySelector('#login').onclick = () => {
          document.cookie = 'session=logged-in; path=/';
          ${mode === 'missing-cookie' ? '' : "document.cookie = 'cs_jwt=dummy-test-token; path=/wss';"}
          location.reload();
        };
      </script>`);
  });
  const sockets = new WebSocketServer({ noServer: true, handleProtocols: () => (mode === 'wrong-protocol' ? 'wrong-protocol' : 'cloudevents.json') });
  server.on('upgrade', (request, socket, head) => {
    const hasCookie = request.headers.cookie?.includes('cs_jwt=dummy-test-token') ?? false;
    handshakes.push({ hasCookie, protocol: request.headers['sec-websocket-protocol'] });
    if (mode === 'timeout') return;
    if (mode === 'reject' || !hasCookie) {
      socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
      return;
    }
    sockets.handleUpgrade(request, socket, head, (connection) => {
      if (mode === 'close') setTimeout(() => connection.close(1011), 20);
    });
  });
  // Also track unupgraded sockets so the timeout case cannot leave the server running.
  const connections = new Set<import('node:net').Socket>();
  server.on('connection', (socket) => {
    connections.add(socket);
    socket.on('close', () => connections.delete(socket));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const source = (await readFile(resolve(__dirname, 'websocket.ts'), 'utf8'))
    .replace('https://console.redhat.com', origin)
    .replace('authTimeout: 90000', 'authTimeout: 3000')
    .replace('connectTimeout: 15000', 'connectTimeout: 500')
    .replace('holdOpenTime: 10000', 'holdOpenTime: 100')
    .replace("resultTracepoint: ''", "resultTracepoint: 'test-result'");
  const steps: string[] = [];
  const catchpoint = {
    setTracepoint: async (_token: string, value: string) => {
      outcomes.push(value);
    },
    username: async () => 'dummy-user',
    password: async () => 'dummy-password',
    startStep: async (name: string) => {
      steps.push(name);
    },
  };
  try {
    if (authenticated) {
      await page.context().addCookies([
        { name: 'session', value: 'logged-in', url: origin },
        { name: 'cs_jwt', value: 'dummy-test-token', domain: '127.0.0.1', path: '/wss' },
      ]);
    }
    // Execute exactly what is pasted into Catchpoint: no TypeScript transform or imports.
    const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
    await new AsyncFunction('page', 'Catchpoint', 'expect', source)(page, catchpoint, expect);
    return { handshakes, steps, outcomes };
  } finally {
    for (const connection of sockets.clients) connection.terminate();
    for (const connection of connections) connection.destroy();
    await new Promise<void>((resolve) => sockets.close(() => resolve()));
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

test('logs in and opens a cookie-authenticated socket', async ({ page }) => {
  const result = await runMonitor(page, 'healthy');
  expect(result.outcomes).toEqual([
    'NOT COMPLETED: login or WebSocket check has not finished.',
    'PASS: Negotiated cloudevents.json and stayed open for 0.1 seconds.',
  ]);
  expect(result.handshakes).toEqual([{ hasCookie: true, protocol: 'cloudevents.json' }]);
  expect(result.steps).toEqual(['Log in to Console', 'Verify authenticated WebSocket availability', 'WebSocket result - PASS']);
});

test('accepts an existing authenticated browser session', async ({ page }) => {
  expect((await runMonitor(page, 'healthy', true)).handshakes).toHaveLength(1);
});

for (const mode of ['reject', 'wrong-protocol', 'missing-cookie'] as const) {
  test(`fails for ${mode}`, async ({ page }) => {
    const outcomes: string[] = [];
    await expect(runMonitor(page, mode, false, outcomes)).rejects.toThrow('FAIL: WebSocket connection failed');
    expect(outcomes.at(-1)).toContain('FAIL:');
    expect(outcomes.some((value) => value.startsWith('PASS:'))).toBe(false);
  });
}

test('fails if the server closes the socket during observation', async ({ page }) => {
  await expect(runMonitor(page, 'close')).rejects.toThrow('WebSocket closed before the observation period finished (code 1011)');
});

test('fails when the handshake does not complete', async ({ page }) => {
  await expect(runMonitor(page, 'timeout')).rejects.toThrow('WebSocket did not open before the connection timeout');
});

test('identifies a stage routing failure before attempting login', async ({ page }) => {
  const outcomes: string[] = [];
  await expect(runMonitor(page, 'lockdown', false, outcomes)).rejects.toThrow('Lockdown page detected. Check the Catchpoint node and Squid proxy');
  expect(outcomes).toEqual(['NOT COMPLETED: login or WebSocket check has not finished.']);
});
