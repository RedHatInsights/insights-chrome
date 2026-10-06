import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { UnleashClient, useFlag, useFlagsStatus } from '@unleash/proxy-client-react';
import { ChromeUser } from '@redhat-cloud-services/types';
import { captureException, captureMessage } from '@sentry/react';
import ChromeAuthContext, { ChromeAuthContextValue } from '../../auth/ChromeAuthContext';
import FeatureFlagsProvider from './FeatureFlagsProvider';
import {
  FEATURE_FLAGS_INITIAL_TIMEOUT_MS,
  createFeatureFlagsFetch,
  getBootstrapFeatureFlag,
  getFeatureFlagsClient,
  startFeatureFlagsClient,
  stopFeatureFlagsClient,
} from './featureFlagsClient';
import { getUnleashClient } from './unleashClient';
import { ENTITLEMENTS_FALLBACK_FLAG } from '../../auth/entitlementsConstants';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';

jest.mock('../../utils/common', () => ({ getEnv: () => 'stage' }));
jest.mock('@sentry/react', () => ({ captureException: jest.fn(), captureMessage: jest.fn() }));

const toggle = { name: ENTITLEMENTS_FALLBACK_FLAG, enabled: true, variant: { name: 'disabled', enabled: false }, impressionData: false };
const jsonResponse = (toggles = [toggle]) => new Response(JSON.stringify({ toggles }), { headers: { 'content-type': 'application/json' } });
let sequence = 0;
let user: ChromeUser;
let mockFetch: jest.SpiedFunction<typeof window.fetch>;
const clients: UnleashClient[] = [];

function clientFor(identity = user) {
  const client = getFeatureFlagsClient(identity, false);
  clients.push(client);
  return client;
}

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  sequence += 1;
  user = {
    entitlements: {},
    identity: {
      org_id: `org-${sequence}`,
      account_number: '123',
      internal: { org_id: `org-${sequence}`, account_id: `user-${sequence}` },
      user: { email: 'user@example.com' },
    },
  } as ChromeUser;
  mockFetch = jest.spyOn(window, 'fetch').mockImplementation(async () => jsonResponse());
});

afterEach(async () => {
  cleanup();
  clients.splice(0).forEach(stopFeatureFlagsClient);
  await Promise.resolve();
  jest.useRealTimers();
  mockFetch.mockRestore();
});

it('evaluates the live flag before the authenticated provider mounts, then reuses that client', async () => {
  const client = clientFor();
  expect(await getBootstrapFeatureFlag(user, false, ENTITLEMENTS_FALLBACK_FLAG)).toBe(true);
  expect(client.getContext()).toMatchObject({
    orgId: user.identity.internal?.org_id,
    userId: user.identity.internal?.account_id,
    accountNumber: '123',
    properties: { account_number: '123', email: 'user@example.com' },
    'platform.chrome.ui.env': 'stage',
    'platform.chrome.ui.preview': false,
  });
  const Probe = () => <div data-testid="flag">{String(useFlag(ENTITLEMENTS_FALLBACK_FLAG))}</div>;
  const { getByTestId } = render(
    <JotaiProvider>
      <ChromeAuthContext.Provider value={{ user } as ChromeAuthContextValue}>
        <FeatureFlagsProvider>
          <Probe />
        </FeatureFlagsProvider>
      </ChromeAuthContext.Provider>
    </JotaiProvider>
  );
  await waitFor(() => expect(getByTestId('flag')).toHaveTextContent('true'));
  expect(getUnleashClient()).toBe(client);
  expect(mockFetch).toHaveBeenCalledTimes(1);
});

it('defaults an absent flag off', async () => {
  mockFetch.mockImplementation(async () => jsonResponse([]));
  clientFor();
  expect(await getBootstrapFeatureFlag(user, false, ENTITLEMENTS_FALLBACK_FLAG)).toBe(false);
});

it.each(['server error', 'network error'])('unblocks flag-dependent initialization after a bootstrap %s with no stored toggles', async (kind) => {
  mockFetch.mockImplementation(async () => {
    if (kind === 'network error') {
      throw new TypeError('offline');
    }
    return new Response('', { status: 503 });
  });
  clientFor();
  expect(await getBootstrapFeatureFlag(user, false, ENTITLEMENTS_FALLBACK_FLAG)).toBe(false);
  const Probe = () => {
    const { flagsReady, flagsError } = useFlagsStatus();
    return <div data-testid="initialization">{flagsReady || flagsError ? 'unblocked' : 'pending'}</div>;
  };
  const { getByTestId } = render(
    <JotaiProvider>
      <ChromeAuthContext.Provider value={{ user } as ChromeAuthContextValue}>
        <FeatureFlagsProvider>
          <Probe />
        </FeatureFlagsProvider>
      </ChromeAuthContext.Provider>
    </JotaiProvider>
  );
  await waitFor(() => expect(getByTestId('initialization')).toHaveTextContent('unblocked'));
});

it('switches the React flag hooks to the new scoped client when the identity changes', async () => {
  clientFor();
  expect(await getBootstrapFeatureFlag(user, false, ENTITLEMENTS_FALLBACK_FLAG)).toBe(true);
  const Probe = () => <div data-testid="flag">{String(useFlag(ENTITLEMENTS_FALLBACK_FLAG))}</div>;
  const tree = (identity: ChromeUser) => (
    <JotaiProvider>
      <ChromeAuthContext.Provider value={{ user: identity } as ChromeAuthContextValue}>
        <FeatureFlagsProvider>
          <Probe />
        </FeatureFlagsProvider>
      </ChromeAuthContext.Provider>
    </JotaiProvider>
  );
  const { getByTestId, rerender } = render(tree(user));
  await waitFor(() => expect(getByTestId('flag')).toHaveTextContent('true'));

  const nextUser = {
    ...user,
    identity: { ...user.identity, org_id: 'next-org', internal: { org_id: 'next-org', account_id: 'next-user' } },
  } as ChromeUser;
  mockFetch.mockImplementation(async () => jsonResponse([{ ...toggle, enabled: false }]));
  clientFor(nextUser);
  expect(await getBootstrapFeatureFlag(nextUser, false, ENTITLEMENTS_FALLBACK_FLAG)).toBe(false);
  rerender(tree(nextUser));
  await waitFor(() => expect(getByTestId('flag')).toHaveTextContent('false'));
  expect(getUnleashClient().getContext()).toMatchObject({ orgId: 'next-org', userId: 'next-user' });
});

it('switches the React flag hooks to the preview client when the release context changes', async () => {
  const store = createStore();
  clientFor();
  expect(await getBootstrapFeatureFlag(user, false, ENTITLEMENTS_FALLBACK_FLAG)).toBe(true);
  const Probe = () => <div data-testid="flag">{String(useFlag(ENTITLEMENTS_FALLBACK_FLAG))}</div>;
  const { getByTestId } = render(
    <JotaiProvider store={store}>
      <ChromeAuthContext.Provider value={{ user } as ChromeAuthContextValue}>
        <FeatureFlagsProvider>
          <Probe />
        </FeatureFlagsProvider>
      </ChromeAuthContext.Provider>
    </JotaiProvider>
  );
  await waitFor(() => expect(getByTestId('flag')).toHaveTextContent('true'));
  mockFetch.mockImplementation(async () => jsonResponse([{ ...toggle, enabled: false }]));
  clients.push(getFeatureFlagsClient(user, true));
  expect(await getBootstrapFeatureFlag(user, true, ENTITLEMENTS_FALLBACK_FLAG)).toBe(false);
  act(() => store.set(isPreviewAtom, true));
  await waitFor(() => expect(getByTestId('flag')).toHaveTextContent('false'));
  expect(getUnleashClient().getContext()).toMatchObject({ 'platform.chrome.ui.preview': true });
});

it('keeps identity-scoped stored toggles on HTTP failure and reports only a warning', async () => {
  localStorage.setItem(`unleash:repository:${user.identity.internal?.org_id}:${user.identity.internal?.account_id}:repo`, JSON.stringify([toggle]));
  mockFetch.mockImplementation(async () => new Response('', { status: 503 }));
  clientFor();
  expect(await getBootstrapFeatureFlag(user, false, ENTITLEMENTS_FALLBACK_FLAG)).toBe(true);
  expect(captureMessage).toHaveBeenCalledWith(expect.any(String), 'warning');
  expect(captureException).not.toHaveBeenCalled();
});

it('does not evaluate another user or legacy unscoped stored toggles', async () => {
  localStorage.setItem('unleash:repository:repo', JSON.stringify([toggle]));
  localStorage.setItem('unleash:repository:other-org:other-user:repo', JSON.stringify([toggle]));
  mockFetch.mockImplementation(async () => {
    throw new TypeError('offline');
  });
  clientFor();
  expect(await getBootstrapFeatureFlag(user, false, ENTITLEMENTS_FALLBACK_FLAG)).toBe(false);
});

it('does not use persistent toggles with an incomplete identity', async () => {
  user.identity.internal!.account_id = undefined;
  localStorage.setItem(`unleash:repository:${user.identity.internal?.org_id}:undefined:repo`, JSON.stringify([toggle]));
  mockFetch.mockImplementation(async () => {
    throw new TypeError('offline');
  });
  clientFor();
  expect(await getBootstrapFeatureFlag(user, false, ENTITLEMENTS_FALLBACK_FLAG)).toBe(false);
});

it('bounds a hung bootstrap lookup even when fetch ignores abort', async () => {
  jest.useFakeTimers();
  mockFetch.mockImplementation(() => new Promise(() => {}));
  clientFor();
  const pending = getBootstrapFeatureFlag(user, false, ENTITLEMENTS_FALLBACK_FLAG);
  await jest.advanceTimersByTimeAsync(FEATURE_FLAGS_INITIAL_TIMEOUT_MS);
  expect(await pending).toBe(false);
  expect(captureException).toHaveBeenCalledWith(expect.objectContaining({ name: 'TimeoutError' }));
});

it('starts only once and restarts after provider cleanup', async () => {
  const client = clientFor();
  await Promise.all([startFeatureFlagsClient(client), startFeatureFlagsClient(client)]);
  expect(mockFetch).toHaveBeenCalledTimes(1);
  stopFeatureFlagsClient(client);
  await startFeatureFlagsClient(client);
  expect(mockFetch).toHaveBeenCalledTimes(2);
});

it('clears a flag-fetch error on recovery', async () => {
  mockFetch.mockImplementationOnce(async () => new Response('', { status: 503 })).mockImplementation(async () => jsonResponse());
  const client = clientFor();
  expect(await getBootstrapFeatureFlag(user, false, ENTITLEMENTS_FALLBACK_FLAG)).toBe(false);
  await client.updateToggles();
  expect(client.isEnabled(ENTITLEMENTS_FALLBACK_FLAG)).toBe(true);
  expect(localStorage.getItem('chrome:feature-flags:error')).toBe('false');
});

it('uses the longer refresh timeout and ignores intentional cancellations', async () => {
  jest.useFakeTimers();
  const fetch = createFeatureFlagsFetch();
  await fetch('https://test.com/api/featureflags/v0', {});
  mockFetch.mockImplementation(() => new Promise(() => {}));
  const pending = fetch('https://test.com/api/featureflags/v0', {}).catch((error: unknown) => error);
  await jest.advanceTimersByTimeAsync(FEATURE_FLAGS_INITIAL_TIMEOUT_MS);
  expect(captureException).not.toHaveBeenCalled();
  await jest.advanceTimersByTimeAsync(10000);
  expect(await pending).toMatchObject({ name: 'TimeoutError' });
  jest.mocked(captureException).mockClear();
  const controller = new AbortController();
  controller.abort();
  await expect(fetch('https://test.com/api/featureflags/v0', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  expect(captureException).not.toHaveBeenCalled();
});
