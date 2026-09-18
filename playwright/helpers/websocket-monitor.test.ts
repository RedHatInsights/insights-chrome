import { EventEmitter } from 'node:events';
import type { Page } from '@playwright/test';
import { ChromiumNetworkLog, getHeartbeats, observeWebSocket } from './websocket-monitor';

const SOCKET_URL = 'wss://console.example.test/wss/chrome-service/v1/ws';
const REQUEST = 1;
const RECEIVED = 2;
const SENT = 3;
const log = (events: ChromiumNetworkLog['events']): ChromiumNetworkLog => ({
  constants: { logEventTypes: { REQUEST_ALIVE: REQUEST, WEBSOCKET_RECV_FRAME_HEADER: RECEIVED, WEBSOCKET_SENT_FRAME_HEADER: SENT } },
  events,
});
const request = (id: number, url = SOCKET_URL) => ({ type: REQUEST, source: { id }, params: { url } });
const ping = (id: number) => ({ type: RECEIVED, source: { id }, params: { opcode: 9 } });
const pong = (id: number) => ({ type: SENT, source: { id }, params: { opcode: 10 } });

describe('getHeartbeats', () => {
  it('accepts a ping followed by a pong on the target socket', () => {
    expect(getHeartbeats(log([request(1), ping(1), pong(1)]), SOCKET_URL)).toEqual([{ receivedPing: true, sentPong: true }]);
  });

  it('does not count a heartbeat from a previous connection', () => {
    expect(getHeartbeats(log([request(1), ping(1), pong(1), request(2)]), SOCKET_URL)).toEqual([{ receivedPing: false, sentPong: false }]);
  });

  it('does not combine frames from different sockets', () => {
    expect(getHeartbeats(log([request(1), request(2, 'wss://unrelated.example.test'), ping(1), pong(2)]), SOCKET_URL)).toEqual([
      { receivedPing: true, sentPong: false },
    ]);
  });

  it('requires the pong to follow a ping', () => {
    expect(getHeartbeats(log([request(1), pong(1), ping(1)]), SOCKET_URL)).toEqual([{ receivedPing: true, sentPong: false }]);
  });

  it('does not accept frames when the target socket was never created', () => {
    expect(getHeartbeats(log([request(1, 'wss://unrelated.example.test'), ping(1), pong(1)]), SOCKET_URL)).toEqual([]);
  });
});

describe('observeWebSocket', () => {
  async function setup() {
    const session = Object.assign(new EventEmitter(), { send: jest.fn(), detach: jest.fn() });
    const context = { newCDPSession: jest.fn().mockResolvedValue(session), cookies: jest.fn().mockResolvedValue([{ name: 'cs_jwt', value: 'secret' }]) };
    const page = Object.assign(new EventEmitter(), { context: () => context });
    const monitor = await observeWebSocket(page as unknown as Page, SOCKET_URL);
    return { page, session, monitor };
  }

  it('records handshake and cookie presence without leaking token values or query parameters', async () => {
    const { page, session, monitor } = await setup();
    session.emit('Network.webSocketCreated', { requestId: 'unrelated', url: 'wss://other.example.test/?token=secret' });
    session.emit('Network.webSocketCreated', { requestId: 'target', url: SOCKET_URL });
    session.emit('Network.webSocketWillSendHandshakeRequest', { requestId: 'target', request: { headers: { Cookie: 'cs_jwt=secret' } } });
    session.emit('Network.webSocketHandshakeResponseReceived', {
      requestId: 'target',
      response: { status: 101, headers: { 'Sec-WebSocket-Protocol': 'cloudevents.json', 'Set-Cookie': 'secret' } },
    });
    expect(monitor.connections()).toEqual([{ status: 101, protocol: 'cloudevents.json', csJwtSent: true, closed: false, failed: false }]);
    const summary = await monitor.stop();
    expect(summary.hasWebSocketCookie).toBe(true);
    expect(JSON.stringify(summary)).not.toContain('secret');
    expect(page.listenerCount('response')).toBe(0);
    expect(session.detach).toHaveBeenCalledTimes(1);
  });

  it('preserves sanitized failure evidence and feature flag status', async () => {
    const { page, session, monitor } = await setup();
    page.emit('response', {
      url: () => 'https://console.example.test/api/featureflags/v0?user=secret',
      status: () => 200,
      json: async () => ({ toggles: [{ name: 'platform.chrome.notifications-drawer', enabled: true }] }),
    });
    session.emit('Network.webSocketCreated', { requestId: 'target', url: SOCKET_URL });
    session.emit('Network.webSocketFrameError', { requestId: 'target', errorMessage: 'Unexpected response code: 400 secret' });
    session.emit('Network.webSocketClosed', { requestId: 'target' });
    const summary = await monitor.stop();
    expect(summary.connections).toEqual([{ error: 'Unexpected response code: 400', closed: true, failed: true }]);
    expect(summary.featureFlags).toEqual([{ status: 200, notificationsEnabled: true }]);
    expect(JSON.stringify(summary)).not.toContain('secret');
  });
});
