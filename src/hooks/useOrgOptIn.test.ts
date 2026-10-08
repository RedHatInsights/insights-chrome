import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import React from 'react';
import { useOrgOptIn } from './useOrgOptIn';
import { fetchOrgOptIn, resetOrgOptInCache } from '../utils/orgOptInApi';
import { ITLess } from '../utils/common';
import ChromeAuthContext from '../auth/ChromeAuthContext';
import { orgOptInAtom } from '../state/atoms/orgOptInAtom';

jest.mock('../utils/orgOptInApi', () => ({
  fetchOrgOptIn: jest.fn(),
  resetOrgOptInCache: jest.fn(),
}));

jest.mock('../utils/common', () => ({
  ...jest.requireActual('../utils/common'),
  ITLess: jest.fn(() => false),
}));

const mockedFetchOrgOptIn = fetchOrgOptIn as jest.Mock;
const mockedResetOrgOptInCache = resetOrgOptInCache as jest.Mock;
const mockedITLess = ITLess as jest.Mock;

const createWrapper =
  (orgId?: string) =>
  ({ children }: { children: React.ReactNode }) => {
    const store = createStore();
    const authValue = {
      ready: true,
      user: orgId
        ? {
            identity: { org_id: orgId, account_number: '456', type: 'User' },
            entitlements: {},
          }
        : undefined,
    } as any;

    return React.createElement(
      Provider,
      { store },
      React.createElement(ChromeAuthContext.Provider, { value: authValue }, children)
    );
  };

describe('useOrgOptIn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedITLess.mockReturnValue(false);
  });

  test('fetches opt-in status and returns resolved state', async () => {
    mockedFetchOrgOptIn.mockResolvedValue(true);
    const { result } = renderHook(() => useOrgOptIn(), { wrapper: createWrapper('org-1') });

    await waitFor(() => expect(result.current.isResolved).toBe(true));
    expect(result.current.v2OptedIn).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(mockedFetchOrgOptIn).toHaveBeenCalledWith('org-1');
  });

  test('returns false for ITLess environments without calling API', async () => {
    mockedITLess.mockReturnValue(true);
    const { result } = renderHook(() => useOrgOptIn(), { wrapper: createWrapper('org-1') });

    await waitFor(() => expect(result.current.isResolved).toBe(true));
    expect(result.current.v2OptedIn).toBe(false);
    expect(mockedFetchOrgOptIn).not.toHaveBeenCalled();
  });

  test('returns error state when API fails', async () => {
    mockedFetchOrgOptIn.mockResolvedValue(null);
    const { result } = renderHook(() => useOrgOptIn(), { wrapper: createWrapper('org-1') });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.v2OptedIn).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  test('does not fetch when no org ID available', async () => {
    const { result } = renderHook(() => useOrgOptIn(), { wrapper: createWrapper(undefined) });

    // Should stay in idle/loading state
    expect(result.current.isLoading).toBe(true);
    expect(mockedFetchOrgOptIn).not.toHaveBeenCalled();
  });

  test('returns not opted-in when API returns false', async () => {
    mockedFetchOrgOptIn.mockResolvedValue(false);
    const { result } = renderHook(() => useOrgOptIn(), { wrapper: createWrapper('org-2') });

    await waitFor(() => expect(result.current.isResolved).toBe(true));
    expect(result.current.v2OptedIn).toBe(false);
  });
});
