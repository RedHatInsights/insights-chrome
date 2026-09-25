import type { Page, Response } from '@playwright/test';

export interface WebSocketConnection {
  status?: number;
  protocol?: string;
  error?: string;
  csJwtSent?: boolean;
  closed: boolean;
  failed: boolean;
}

export interface ChromiumNetworkLog {
  constants: { logEventTypes: Record<string, number> };
  events: { type: number; source: { id: number }; params?: { url?: string; opcode?: number } }[];
}

export interface Heartbeat {
  receivedPing: boolean;
  sentPong: boolean;
}

/** Observe the application's socket without intercepting or generating its traffic. */
export async function observeWebSocket(page: Page, targetUrl: string) {
  const session = await page.context().newCDPSession(page);
  const observedSockets: string[] = [];
  const featureFlags: { status: number; notificationsEnabled?: boolean }[] = [];
  const flagReads: Promise<void>[] = [];
  const onResponse = (response: Response) => {
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
  };
  page.on('response', onResponse);
  const connections = new Map<string, WebSocketConnection>();
  session.on('Network.webSocketCreated', ({ requestId, url }) => {
    const socketUrl = new URL(url);
    observedSockets.push(`${socketUrl.origin}${socketUrl.pathname}`);
    if (url === targetUrl) {
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

  await session.send('Network.enable');
  return {
    connections: () => [...connections.values()],
    async stop() {
      page.off('response', onResponse);
      const cookieUrl = targetUrl.replace(/^wss:/, 'https:');
      const hasWebSocketCookie = (await page.context().cookies(cookieUrl)).some((cookie) => cookie.name === 'cs_jwt');
      await Promise.all(flagReads);
      await session.detach();
      return { observedSockets, featureFlags, hasWebSocketCookie, connections: [...connections.values()] };
    },
  };
}

/** CDP omits control frames; Chromium NetLog records server pings and browser pongs. */
export function getHeartbeats(log: ChromiumNetworkLog, targetUrl: string): Heartbeat[] {
  const types = log.constants.logEventTypes;
  // Earlier login sockets or failed attempts must not satisfy the check.
  const sources = log.events
    .filter((event) => event.type === types.REQUEST_ALIVE && event.params?.url === targetUrl)
    .slice(-1)
    .map((event) => event.source.id);
  return sources.map((id) => {
    const frames = log.events.filter((event) => event.source.id === id);
    const pingIndex = frames.findIndex((event) => event.type === types.WEBSOCKET_RECV_FRAME_HEADER && event.params?.opcode === 9);
    const pong = frames.some((event, index) => index > pingIndex && event.type === types.WEBSOCKET_SENT_FRAME_HEADER && event.params?.opcode === 10);
    return { receivedPing: pingIndex >= 0, sentPong: pingIndex >= 0 && pong };
  });
}
