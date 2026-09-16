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

  it('applies preview once with a single side effect when the value changes (no false->value double set)', async () => {
    // Seed while the singleton does not yet exist so seeding does not itself POST.
    store.set(isPreviewAtom, false);
    // Visibility singleton already exists, so isPreviewAtom.onToggle will POST update-ui-preview.
    mockedVisibilityFunctionsExist.mockReturnValue(true);
    mockedPost.mockClear();
    mockedInitChromeUserConfig.mockResolvedValueOnce({ data: { uiPreview: true, uiPreviewSeen: true } });

    const tokenRef = { current: 'tok' };
    const { result } = renderHook(() => useSessionConfig(), { wrapper: buildWrapper(store, tokenRef) });

    await waitFor(() => expect(result.current.configLoaded).toBe(true));

    expect(store.get(isPreviewAtom)).toBe(true);
    // Singleton already existed, so we do not re-init the visibility functions.
    expect(mockedInitVisibilityFunctions).not.toHaveBeenCalled();
    // Exactly one update-ui-preview POST — the old false-then-true double set fired it twice.
    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/api/chrome-service/v1/user/update-ui-preview', { uiPreview: true }));
    expect(mockedPost.mock.calls.filter(([url]) => url === '/api/chrome-service/v1/user/update-ui-preview')).toHaveLength(1);
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

  it('forces preview off while degraded even when the singleton already exists (remount)', async () => {
    // Seed while the singleton does not yet exist so seeding does not itself POST.
    store.set(isPreviewAtom, true);
    mockedVisibilityFunctionsExist.mockReturnValue(true);
    mockedInitChromeUserConfig.mockRejectedValueOnce(new Error('500'));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const tokenRef = { current: 'tok' };
    const { result } = renderHook(() => useSessionConfig(), { wrapper: buildWrapper(store, tokenRef) });

    await waitFor(() => expect(result.current.configLoaded).toBe(true));

    expect(store.get(isPreviewAtom)).toBe(false);
    expect(store.get(degradedStateAtom).userPersonalization).toBe(true);

    consoleError.mockRestore();
  });
});
