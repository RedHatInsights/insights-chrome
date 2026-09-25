import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { useFlag } from '@unleash/proxy-client-react';
import { Provider, createStore, useAtomValue } from 'jotai';
import ChromeAuthContext, { ChromeAuthContextValue } from '../../auth/ChromeAuthContext';
import { degradedStateAtom } from '../../state/atoms/degradedStateAtom';
import FeatureFlagsProvider, { createFetchFeatureFlags } from './FeatureFlagsProvider';
import { FEATURE_FLAGS_INITIAL_TIMEOUT_MS, FEATURE_FLAGS_REFRESH_TIMEOUT_MS, UNLEASH_ERROR_KEY, getUnleashClient } from './unleashClient';

const FEATURE_FLAGS_PATH = '/api/featureflags/v0';
const FEATURE_FLAGS_URL = `${window.location.origin}${FEATURE_FLAGS_PATH}`;
const USER_CACHE_KEY = 'unleash:repository:123:123:repo';
const LEGACY_CACHE_KEY = 'unleash:repository:repo';
const cachedToggle = { name: 'cached.flag', enabled: true, variant: { name: 'enabled', enabled: true }, impressionData: false };

const authValue = {
  user: {
    identity: {
      account_number: '123',
      org_id: '123',
      type: 'User',
      internal: { account_id: '123', org_id: '123' },
      user: { email: 'user@example.com' },
    },
    entitlements: {},
  },
} as unknown as ChromeAuthContextValue;

const response = (status: number, toggles: unknown[] = []) =>
  ({
    status,
    statusText: status === 503 ? 'Service Unavailable' : status === 401 ? 'Unauthorized' : 'OK',
    ok: status >= 200 && status < 300,
    headers: { get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : null) },
    json: async () => ({ toggles }),
  }) as Response;

const requestPath = (input: RequestInfo | URL) => new URL(String(input), window.location.origin).pathname;

const FeatureFlagsProbe = () => {
  const serviceHealth = useAtomValue(degradedStateAtom);
  const flag = useFlag('cached.flag');
  return (
    <div data-testid="feature-flags-probe" data-degraded={String(serviceHealth.featureFlags)} data-flag={String(flag)}>
      Chrome shell
    </div>
  );
};

const renderProvider = (store: ReturnType<typeof createStore>, auth: ChromeAuthContextValue = authValue) =>
  render(
    <Provider store={store}>
      <ChromeAuthContext.Provider value={auth}>
        <FeatureFlagsProvider>
          <FeatureFlagsProbe />
        </FeatureFlagsProvider>
      </ChromeAuthContext.Provider>
    </Provider>
  );

describe('FeatureFlagsProvider outage lifecycle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it.each([
    ['HTTP 401', () => Promise.resolve(response(401))],
    ['HTTP 503', () => Promise.resolve(response(503))],
    ['network rejection', () => Promise.reject(new TypeError('Failed to fetch'))],
  ])('keeps Chrome rendered and records %s as degraded', async (_description, failRequest) => {
    const fetch = jest.spyOn(window, 'fetch').mockImplementation((input) => {
      if (requestPath(input) === FEATURE_FLAGS_PATH) {
        return failRequest() as Promise<Response>;
      }
      return Promise.resolve(response(200));
    });
    const store = createStore();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    renderProvider(store);

    await waitFor(() => expect(store.get(degradedStateAtom).featureFlags).toBe(true));

    expect(screen.getByText('Chrome shell')).toBeInTheDocument();
    expect(localStorage.getItem(UNLEASH_ERROR_KEY)).toBe('true');
    expect(consoleError.mock.calls.flat().join(' ')).not.toMatch(/Rendered fewer hooks than expected/);
    expect(fetch).toHaveBeenCalled();
  });

  it('does not degrade feature flags when the metrics request fails', async () => {
    const fetch = jest.spyOn(window, 'fetch').mockImplementation((input) => {
      if (requestPath(input) === FEATURE_FLAGS_PATH) {
        return Promise.resolve(response(200, [{ name: 'cached.flag', enabled: true }]));
      }
      if (requestPath(input).endsWith('/client/metrics')) {
        return Promise.reject(new TypeError('Failed to fetch'));
      }
      return Promise.resolve(response(200));
    });
    const store = createStore();

    renderProvider(store);
    await waitFor(() => expect(getUnleashClient().isReady()).toBe(true));

    const client = getUnleashClient();
    const updates = jest.fn();
    client.on('update', updates);
    expect(client.isEnabled('cached.flag')).toBe(true);

    await act(async () => {
      await client.sendMetrics();
    });

    expect(fetch.mock.calls.some(([input]) => requestPath(input).endsWith('/client/metrics'))).toBe(true);
    expect(store.get(degradedStateAtom).featureFlags).toBe(false);
    expect(localStorage.getItem(UNLEASH_ERROR_KEY)).toBe('false');
    expect(updates).not.toHaveBeenCalled();
  });

  it('marks a refresh failure degraded without emitting an update', async () => {
    let flagRequests = 0;
    jest.spyOn(window, 'fetch').mockImplementation((input) => {
      if (requestPath(input) === FEATURE_FLAGS_PATH) {
        flagRequests += 1;
        return Promise.resolve(flagRequests === 1 ? response(200, [{ name: 'cached.flag', enabled: true }]) : response(503));
      }
      return Promise.resolve(response(200));
    });
    const store = createStore();

    renderProvider(store);
    await waitFor(() => expect(getUnleashClient().isReady()).toBe(true));

    const client = getUnleashClient();
    const updates = jest.fn();
    client.on('update', updates);

    await act(async () => {
      await client.updateContext({ userId: 'refresh-user' });
    });

    await waitFor(() => expect(store.get(degradedStateAtom).featureFlags).toBe(true));
    expect(localStorage.getItem(UNLEASH_ERROR_KEY)).toBe('true');
    expect(updates).not.toHaveBeenCalled();
  });

  it('retains cached toggles through an outage and clears degraded state after recovery', async () => {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify([cachedToggle]));
    let flagRequests = 0;
    jest.spyOn(window, 'fetch').mockImplementation((input) => {
      if (requestPath(input) === FEATURE_FLAGS_PATH) {
        flagRequests += 1;
        return Promise.resolve(flagRequests === 1 ? response(503) : response(200, [{ name: 'cached.flag', enabled: true }]));
      }
      return Promise.resolve(response(200));
    });
    const store = createStore();

    renderProvider(store);
    await waitFor(() => expect(store.get(degradedStateAtom).featureFlags).toBe(true));
    expect(getUnleashClient().isEnabled('cached.flag')).toBe(true);
    expect(screen.getByTestId('feature-flags-probe')).toHaveAttribute('data-flag', 'true');

    await act(async () => {
      await getUnleashClient().updateContext({ userId: 'recovered-user' });
    });

    await waitFor(() => expect(store.get(degradedStateAtom).featureFlags).toBe(false));
    expect(localStorage.getItem(UNLEASH_ERROR_KEY)).toBe('false');
    expect(screen.getByText('Chrome shell')).toBeInTheDocument();
  });

  it('bounds a stalled request and records the timeout without unmounting Chrome', async () => {
    jest.useFakeTimers();
    const signal: { current?: AbortSignal | null } = {};
    jest.spyOn(window, 'fetch').mockImplementation((input, init) => {
      if (requestPath(input) === FEATURE_FLAGS_PATH) {
        signal.current = init?.signal;
        return new Promise<Response>(() => undefined);
      }
      return Promise.resolve(response(200));
    });
    const store = createStore();

    renderProvider(store);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(FEATURE_FLAGS_INITIAL_TIMEOUT_MS);
    });

    expect(signal.current?.aborted).toBe(true);
    expect(store.get(degradedStateAtom).featureFlags).toBe(true);
    expect(screen.getByText('Chrome shell')).toBeInTheDocument();
  });

  it('does not evaluate toggles cached for another user or by an older Chrome version', async () => {
    localStorage.setItem('unleash:repository:999:999:repo', JSON.stringify([cachedToggle]));
    localStorage.setItem(LEGACY_CACHE_KEY, JSON.stringify([cachedToggle]));
    jest.spyOn(window, 'fetch').mockImplementation((input) => Promise.resolve(requestPath(input) === FEATURE_FLAGS_PATH ? response(503) : response(200)));
    const store = createStore();

    renderProvider(store);
    await waitFor(() => expect(store.get(degradedStateAtom).featureFlags).toBe(true));

    expect(getUnleashClient().isEnabled('cached.flag')).toBe(false);
    expect(screen.getByTestId('feature-flags-probe')).toHaveAttribute('data-flag', 'false');
    expect(localStorage.getItem(LEGACY_CACHE_KEY)).toBeNull();
    expect(localStorage.getItem('unleash:repository:999:999:repo')).not.toBeNull();
  });

  it('stores toggles under the current org and user', async () => {
    jest
      .spyOn(window, 'fetch')
      .mockImplementation((input) => Promise.resolve(requestPath(input) === FEATURE_FLAGS_PATH ? response(200, [cachedToggle]) : response(200)));

    renderProvider(createStore());
    await waitFor(() => expect(getUnleashClient().isReady()).toBe(true));

    await waitFor(() => expect(JSON.parse(localStorage.getItem(USER_CACHE_KEY) ?? '[]')).toEqual([cachedToggle]));
    expect(localStorage.getItem(LEGACY_CACHE_KEY)).toBeNull();
  });

  it('keeps toggles in memory only when the identity is incomplete', async () => {
    jest
      .spyOn(window, 'fetch')
      .mockImplementation((input) => Promise.resolve(requestPath(input) === FEATURE_FLAGS_PATH ? response(200, [cachedToggle]) : response(200)));
    const anonymousAuth = { ...authValue, user: undefined } as unknown as ChromeAuthContextValue;

    renderProvider(createStore(), anonymousAuth);
    await waitFor(() => expect(getUnleashClient().isReady()).toBe(true));

    expect(getUnleashClient().isEnabled('cached.flag')).toBe(true);
    expect(Object.keys(localStorage).filter((key) => key.startsWith('unleash:repository'))).toEqual([]);
  });
});

describe('createFetchFeatureFlags timeouts', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const resolveAfter = (ms: number) => new Promise<Response>((resolve) => setTimeout(() => resolve(response(200)), ms));

  it('times out the initial request after the initial timeout', async () => {
    jest.spyOn(window, 'fetch').mockImplementation(() => new Promise<Response>(() => undefined));
    const fetchFeatureFlags = createFetchFeatureFlags();

    const request = fetchFeatureFlags(FEATURE_FLAGS_URL, {});
    const assertion = expect(request).rejects.toMatchObject({ name: 'TimeoutError' });
    await jest.advanceTimersByTimeAsync(FEATURE_FLAGS_INITIAL_TIMEOUT_MS);
    await assertion;
  });

  it('lets a refresh slower than the initial timeout succeed', async () => {
    const fetch = jest.spyOn(window, 'fetch').mockResolvedValueOnce(response(200));
    const fetchFeatureFlags = createFetchFeatureFlags();
    await fetchFeatureFlags(FEATURE_FLAGS_URL, {});

    fetch.mockImplementationOnce(() => resolveAfter(FEATURE_FLAGS_INITIAL_TIMEOUT_MS + 1_000));
    const refresh = fetchFeatureFlags(FEATURE_FLAGS_URL, {});
    await jest.advanceTimersByTimeAsync(FEATURE_FLAGS_INITIAL_TIMEOUT_MS + 1_000);

    await expect(refresh).resolves.toMatchObject({ status: 200 });
  });

  it('still bounds a stalled refresh with the refresh timeout', async () => {
    const fetch = jest.spyOn(window, 'fetch').mockResolvedValueOnce(response(503));
    const fetchFeatureFlags = createFetchFeatureFlags();
    await fetchFeatureFlags(FEATURE_FLAGS_URL, {});

    fetch.mockImplementationOnce(() => new Promise<Response>(() => undefined));
    const refresh = fetchFeatureFlags(FEATURE_FLAGS_URL, {});
    const assertion = expect(refresh).rejects.toMatchObject({ name: 'TimeoutError' });
    await jest.advanceTimersByTimeAsync(FEATURE_FLAGS_REFRESH_TIMEOUT_MS);
    await assertion;
  });

  it('keeps the initial timeout when the first request was cancelled', async () => {
    const controller = new AbortController();
    controller.abort();
    jest.spyOn(window, 'fetch').mockImplementation(() => new Promise<Response>(() => undefined));
    const fetchFeatureFlags = createFetchFeatureFlags();
    await expect(fetchFeatureFlags(FEATURE_FLAGS_URL, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });

    const request = fetchFeatureFlags(FEATURE_FLAGS_URL, {});
    const assertion = expect(request).rejects.toMatchObject({ name: 'TimeoutError' });
    await jest.advanceTimersByTimeAsync(FEATURE_FLAGS_INITIAL_TIMEOUT_MS);
    await assertion;
  });
});
