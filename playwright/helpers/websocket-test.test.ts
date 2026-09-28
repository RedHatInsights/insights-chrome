import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { observeWebSocket } from './websocket-monitor';
import { test } from './websocket-test';

jest.mock('node:fs/promises', () => ({ mkdtemp: jest.fn(), readFile: jest.fn(), rm: jest.fn() }));
jest.mock('@playwright/test', () => ({ chromium: { launch: jest.fn() }, test: { extend: (fixtures: unknown) => fixtures } }));
jest.mock('./auth', () => ({ login: jest.fn() }));
jest.mock('./websocket-monitor', () => ({ observeWebSocket: jest.fn(), getHeartbeats: jest.fn().mockReturnValue([]) }));

type Session = { observe: (path: string) => Promise<unknown>; finish: () => Promise<unknown> };
const { webSocketSession } = test as unknown as {
  webSocketSession: (options: { baseURL: string }, use: (session: Session) => Promise<void>, info: { attach: jest.Mock }) => Promise<void>;
};

describe('WebSocket browser cleanup', () => {
  it.each(['finish', 'teardown', 'close failure', 'no monitor', 'fallback close failure', 'monitor failure', 'context failure'])(
    'closes once and removes raw logs: %s',
    async (scenario) => {
      jest.clearAllMocks();
      const failure = new Error(scenario);
      const close = jest.fn(async () => {
        if (scenario === 'close failure' || scenario === 'fallback close failure') throw failure;
      });
      const page = { setDefaultTimeout: jest.fn(), setDefaultNavigationTimeout: jest.fn() };
      const newContext = jest.fn(async () => {
        if (scenario === 'context failure') throw failure;
        return { newPage: async () => page };
      });
      jest.mocked(chromium.launch).mockResolvedValue({ close, newContext } as unknown as Awaited<ReturnType<typeof chromium.launch>>);
      jest.mocked(mkdtemp).mockResolvedValue('/tmp/mock-netlog');
      jest.mocked(readFile).mockImplementation(async () => {
        expect(close).toHaveBeenCalledTimes(1);
        return '{}';
      });
      jest.mocked(observeWebSocket).mockResolvedValue({
        stop: async () => {
          if (scenario === 'monitor failure') throw failure;
          return {};
        },
      } as unknown as Awaited<ReturnType<typeof observeWebSocket>>);
      const attach = jest.fn();
      const result = webSocketSession(
        { baseURL: 'https://console.example.test' },
        async (session) => {
          if (scenario === 'no monitor' || scenario === 'fallback close failure') return;
          await session.observe('/socket');
          if (scenario === 'finish' || scenario === 'close failure') await session.finish();
        },
        { attach }
      );
      if (scenario.includes('failure')) {
        await expect(result).rejects.toBe(failure);
        expect(readFile).not.toHaveBeenCalled();
        expect(attach).not.toHaveBeenCalled();
      } else {
        await expect(result).resolves.toBeUndefined();
        expect(attach).toHaveBeenCalledTimes(scenario === 'no monitor' ? 0 : 1);
      }
      expect(close).toHaveBeenCalledTimes(1);
      expect(rm).toHaveBeenCalledWith('/tmp/mock-netlog', { recursive: true, force: true });
    }
  );
});
