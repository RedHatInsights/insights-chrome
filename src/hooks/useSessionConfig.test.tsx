import React from 'react';
import { Provider, createStore } from 'jotai';
import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { ChromeUser } from '@redhat-cloud-services/types';
import useSessionConfig from './useSessionConfig';
import ChromeAuthContext, { ChromeAuthContextValue } from '../auth/ChromeAuthContext';
import { initChromeUserConfig, initVisibilityFunctions } from '../utils/initUserConfig';
import { visibilityFunctionsExist } from '../utils/VisibilitySingleton';
import { isPreviewAtom } from '../state/atoms/releaseAtom';
import { userConfigAtom } from '../state/atoms/userConfigAtom';
import { degradedStateAtom } from '../state/atoms/degradedStateAtom';
import { gatewayErrorAtom } from '../state/atoms/gatewayErrorAtom';
import { ThreeScaleError } from '../utils/responseInterceptors';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

jest.mock('../utils/initUserConfig', () => ({
  initChromeUserConfig: jest.fn(),
  initVisibilityFunctions: jest.fn(),
}));

jest.mock('../utils/VisibilitySingleton', () => ({
  visibilityFunctionsExist: jest.fn(() => false),
  updateVisibilityFunctionsBeta: jest.fn(),
}));

const mockedInitChromeUserConfig = jest.mocked(initChromeUserConfig);
const mockedInitVisibilityFunctions = jest.mocked(initVisibilityFunctions);
const mockedVisibilityFunctionsExist = jest.mocked(visibilityFunctionsExist);
const mockedPost = jest.mocked(axios.post);

const getUser = jest.fn(() => Promise.resolve({} as ChromeUser));

const buildWrapper = (store: ReturnType<typeof createStore>, tokenRef: { current: string }) => {
  // `getToken` reads tokenRef live, mirroring ChromeAuthContext's getToken that stays current after a silent renew.
  const getToken = () => Promise.resolve(tokenRef.current);
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <ChromeAuthContext.Provider value={{ getUser, getToken } as unknown as ChromeAuthContextValue}>{children}</ChromeAuthContext.Provider>
    </Provider>
  );
  return Wrapper;
};

describe('useSessionConfig', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedVisibilityFunctionsExist.mockReturnValue(false);
    store = createStore();
    store.set(isPreviewAtom, false);
    store.set(degradedStateAtom, {
      userPersonalization: false,
      entitlements: false,
      configFromCache: false,
      featureFlags: false,
      quickstarts: false,
    });
  });

  it('loads config, applies preview, and keeps personalization healthy on success', async () => {
    const config = { data: { uiPreview: true, uiPreviewSeen: true } };
    mockedInitChromeUserConfig.mockResolvedValueOnce(config);

    const tokenRef = { current: 'tok' };
    const { result } = renderHook(() => useSessionConfig(), { wrapper: buildWrapper(store, tokenRef) });

    await waitFor(() => expect(result.current.configLoaded).toBe(true));

    expect(mockedInitVisibilityFunctions).toHaveBeenCalledTimes(1);
    // Visibility functions receive the live token getter, not a frozen token string.
    expect(mockedInitVisibilityFunctions).toHaveBeenCalledWith(expect.objectContaining({ getUser, getToken: expect.any(Function) }));
    expect(store.get(isPreviewAtom)).toBe(true);
    expect(store.get(userConfigAtom)).toEqual(config);
    expect(store.get(degradedStateAtom).userPersonalization).toBe(false);
  });

  it('renders the shell with defaults and flags degraded state on failure', async () => {
    mockedInitChromeUserConfig.mockRejectedValueOnce(new Error('500'));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const tokenRef = { current: 'tok' };
    const { result } = renderHook(() => useSessionConfig(), { wrapper: buildWrapper(store, tokenRef) });

    // Shell renders even though the personalization API failed.
    await waitFor(() => expect(result.current.configLoaded).toBe(true));

    expect(mockedInitVisibilityFunctions).toHaveBeenCalledTimes(1);
    expect(store.get(degradedStateAtom).userPersonalization).toBe(true);
    expect(store.get(isPreviewAtom)).toBe(false);
    // Must NOT clobber the user's saved preference by POSTing update-ui-preview on failure.
    expect(mockedPost).not.toHaveBeenCalledWith('/api/chrome-service/v1/user/update-ui-preview', expect.anything());

    consoleError.mockRestore();
  });

  it('falls back to a degraded shell when the fetch times out (ECONNABORTED, not a gateway error)', async () => {
    // A client-side timeout aborts the XHR (ontimeout), so gatewayErrorAtom stays unset and the
    // request lands in the degraded branch instead of blocking the shell forever.
    mockedInitChromeUserConfig.mockRejectedValueOnce(Object.assign(new Error('timeout of 5000ms exceeded'), { code: 'ECONNABORTED' }));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const tokenRef = { current: 'tok' };
    const { result } = renderHook(() => useSessionConfig(), { wrapper: buildWrapper(store, tokenRef) });

    await waitFor(() => expect(result.current.configLoaded).toBe(true));

    expect(result.current.gatewayError).toBeUndefined();
    expect(store.get(degradedStateAtom).userPersonalization).toBe(true);
    expect(mockedPost).not.toHaveBeenCalledWith('/api/chrome-service/v1/user/update-ui-preview', expect.anything());

    consoleError.mockRestore();
  });

  it('fetches config only once per page load (no in-session retry on token change)', async () => {
    mockedInitChromeUserConfig.mockResolvedValue({ data: { uiPreview: false, uiPreviewSeen: false } });

    const tokenRef = { current: 'tok-1' };
    const { result, rerender } = renderHook(() => useSessionConfig(), { wrapper: buildWrapper(store, tokenRef) });

    await waitFor(() => expect(result.current.configLoaded).toBe(true));
    expect(mockedInitChromeUserConfig).toHaveBeenCalledTimes(1);

    // Simulate a silent token refresh — the effect deps change but must not re-fetch.
    tokenRef.current = 'tok-2';
    rerender();

    expect(mockedInitChromeUserConfig).toHaveBeenCalledTimes(1);
  });

  it('renders loaded immediately on remount without re-fetching (no infinite loading)', async () => {
    mockedInitChromeUserConfig.mockResolvedValue({ data: { uiPreview: false, uiPreviewSeen: false } });

    const tokenRef = { current: 'tok' };
    // First mount fetches once.
    const first = renderHook(() => useSessionConfig(), { wrapper: buildWrapper(store, tokenRef) });
    await waitFor(() => expect(first.result.current.configLoaded).toBe(true));
    expect(mockedInitChromeUserConfig).toHaveBeenCalledTimes(1);

    // Fully unmount, then mount a fresh hook against the SAME store — this simulates the ErrorBoundary
    // "Try again" remount. A component-scoped useState/useRef would reset here (re-fetch, or worse hang
    // on the loading placeholder forever); the store-backed guard + loaded signal must prevent both.
    first.unmount();
    const second = renderHook(() => useSessionConfig(), { wrapper: buildWrapper(store, tokenRef) });

    // No re-fetch, and the shell is loaded immediately (regression guard for the infinite-loading bug).
    expect(mockedInitChromeUserConfig).toHaveBeenCalledTimes(1);
    expect(second.result.current.configLoaded).toBe(true);
  });

  it('does not swallow a real gateway outage (leaves configLoaded false so bootstrap shows the gateway error)', async () => {
    const gatewayErr = { detail: 'gateway down' } as unknown as ThreeScaleError;
    // The XHR interceptor records the gateway error on the store before the request rejects.
    store.set(gatewayErrorAtom, gatewayErr);
    mockedInitChromeUserConfig.mockRejectedValueOnce(new Error('gateway'));

    const tokenRef = { current: 'tok' };
    const { result } = renderHook(() => useSessionConfig(), { wrapper: buildWrapper(store, tokenRef) });

    await waitFor(() => expect(mockedInitChromeUserConfig).toHaveBeenCalledTimes(1));
    // Flush the rejected promise so the catch branch runs.
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.gatewayError).toBe(gatewayErr);
    // Must stay false so bootstrap renders the full-page GatewayErrorComponent, not the degraded shell.
    expect(result.current.configLoaded).toBe(false);
    // A total gateway outage is not a personalization-only degradation.
    expect(store.get(degradedStateAtom).userPersonalization).toBe(false);
  });

  it('hydrates preview from the server value without persisting it back (no POST)', async () => {
    // Seed while the singleton does not yet exist so seeding does not itself POST.
    store.set(isPreviewAtom, false);
    // Visibility singleton already exists — a user toggle would POST, but a hydrate must not.
    mockedVisibilityFunctionsExist.mockReturnValue(true);
    mockedPost.mockClear();
    mockedInitChromeUserConfig.mockResolvedValueOnce({ data: { uiPreview: true, uiPreviewSeen: true } });

    const tokenRef = { current: 'tok' };
    const { result } = renderHook(() => useSessionConfig(), { wrapper: buildWrapper(store, tokenRef) });

    await waitFor(() => expect(result.current.configLoaded).toBe(true));

    // The read value reflects the server config...
    expect(store.get(isPreviewAtom)).toBe(true);
    // Singleton already existed, so we do not re-init the visibility functions.
    expect(mockedInitVisibilityFunctions).not.toHaveBeenCalled();
    // ...but hydration must NOT persist it back — no update-ui-preview POST for the value we just read.
    expect(mockedPost).not.toHaveBeenCalledWith('/api/chrome-service/v1/user/update-ui-preview', expect.anything());
  });

  it('does not re-POST preview on remount when the saved value is unchanged', async () => {
    // Seed while the singleton does not yet exist so seeding does not itself POST.
    store.set(isPreviewAtom, true);
    mockedVisibilityFunctionsExist.mockReturnValue(true);
    mockedPost.mockClear();
    mockedInitChromeUserConfig.mockResolvedValueOnce({ data: { uiPreview: true, uiPreviewSeen: true } });

    const tokenRef = { current: 'tok' };
    const { result } = renderHook(() => useSessionConfig(), { wrapper: buildWrapper(store, tokenRef) });

    await waitFor(() => expect(result.current.configLoaded).toBe(true));

    expect(store.get(isPreviewAtom)).toBe(true);
    expect(mockedPost).not.toHaveBeenCalledWith('/api/chrome-service/v1/user/update-ui-preview', expect.anything());
  });

  it('forces preview off while degraded without clobbering the saved preference (no POST)', async () => {
    // Seed while the singleton does not yet exist so seeding does not itself POST.
    // isPreviewAtom is truthy at GET-reject time (e.g. the user flipped the switch during the initial
    // GET) — the exact case where the old code would POST uiPreview:false and overwrite the saved value.
    store.set(isPreviewAtom, true);
    mockedVisibilityFunctionsExist.mockReturnValue(true);
    mockedPost.mockClear();
    mockedInitChromeUserConfig.mockRejectedValueOnce(new Error('500'));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const tokenRef = { current: 'tok' };
    const { result } = renderHook(() => useSessionConfig(), { wrapper: buildWrapper(store, tokenRef) });

    await waitFor(() => expect(result.current.configLoaded).toBe(true));

    expect(store.get(isPreviewAtom)).toBe(false);
    expect(store.get(degradedStateAtom).userPersonalization).toBe(true);
    // The key regression: the degraded fallback must never persist uiPreview:false.
    expect(mockedPost).not.toHaveBeenCalledWith('/api/chrome-service/v1/user/update-ui-preview', expect.anything());

    consoleError.mockRestore();
  });
});
