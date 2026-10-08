import { renderHook, waitFor } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import React from 'react';
import { useOrgOptIn } from './useOrgOptIn';
import { fetchOrgOptIn } from '../utils/orgOptInApi';
import { ITLess } from '../utils/common';
import ChromeAuthContext, { ChromeAuthContextValue } from '../auth/ChromeAuthContext';

jest.mock('../utils/orgOptInApi', () => ({
  fetchOrgOptIn: jest.fn(),
}));

jest.mock('../utils/common', () => ({
  ...jest.requireActual('../utils/common'),
  ITLess: jest.fn(() => false),
}));

const mockedFetchOrgOptIn = fetchOrgOptIn as jest.Mock;
const mockedITLess = ITLess as jest.Mock;

const createAuthValue = (orgId?: string): Partial<ChromeAuthContextValue> => ({
  ready: true,
  user: orgId
    ? {
        identity: { org_id: orgId, account_number: '456', type: 'User' },
        entitlements: {},
      }
    : undefined,
});

function CreateWrapper(orgId?: string) {
  const store = createStore();
  const authValue = createAuthValue(orgId) as ChromeAuthContextValue;
  const WrapperComponent = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(Provider, { store }, React.createElement(ChromeAuthContext.Provider, { value: authValue }, children));
  };
  WrapperComponent.displayName = 'OrgOptInTestWrapper';
  return WrapperComponent;
}

describe('useOrgOptIn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedITLess.mockReturnValue(false);
  });

  test('fetches opt-in status and returns resolved state', async () => {
    mockedFetchOrgOptIn.mockResolvedValue(true);
    const { result } = renderHook(() => useOrgOptIn(), { wrapper: CreateWrapper('org-1') });

    await waitFor(() => expect(result.current.isResolved).toBe(true));
    expect(result.current.v2OptedIn).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(mockedFetchOrgOptIn).toHaveBeenCalledWith('org-1');
  });

  test('returns false for ITLess environments without calling API', async () => {
    mockedITLess.mockReturnValue(true);
    const { result } = renderHook(() => useOrgOptIn(), { wrapper: CreateWrapper('org-1') });

    await waitFor(() => expect(result.current.isResolved).toBe(true));
    expect(result.current.v2OptedIn).toBe(false);
    expect(mockedFetchOrgOptIn).not.toHaveBeenCalled();
  });

  test('returns error state when API fails', async () => {
    mockedFetchOrgOptIn.mockResolvedValue(null);
    const { result } = renderHook(() => useOrgOptIn(), { wrapper: CreateWrapper('org-1') });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.v2OptedIn).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  test('does not fetch when no org ID available', async () => {
    const { result } = renderHook(() => useOrgOptIn(), { wrapper: CreateWrapper(undefined) });

    // Should stay in idle/loading state
    expect(result.current.isLoading).toBe(true);
    expect(mockedFetchOrgOptIn).not.toHaveBeenCalled();
  });

  test('returns not opted-in when API returns false', async () => {
    mockedFetchOrgOptIn.mockResolvedValue(false);
    const { result } = renderHook(() => useOrgOptIn(), { wrapper: CreateWrapper('org-2') });

    await waitFor(() => expect(result.current.isResolved).toBe(true));
    expect(result.current.v2OptedIn).toBe(false);
  });

  test('clears shared state when orgId disappears', async () => {
    // First, resolve an org successfully
    mockedFetchOrgOptIn.mockResolvedValue(true);
    const store = createStore();

    const makeWrapper = (orgId?: string) => {
      const authValue = createAuthValue(orgId) as ChromeAuthContextValue;
      const Wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(Provider, { store }, React.createElement(ChromeAuthContext.Provider, { value: authValue }, children));
      Wrapper.displayName = 'OrgOptInTestWrapper';
      return Wrapper;
    };

    const { result, unmount } = renderHook(() => useOrgOptIn(), { wrapper: makeWrapper('org-1') });
    await waitFor(() => expect(result.current.isResolved).toBe(true));
    expect(result.current.v2OptedIn).toBe(true);
    unmount();

    // Now render without orgId — old resolved result must not be exposed
    const { result: result2 } = renderHook(() => useOrgOptIn(), { wrapper: makeWrapper(undefined) });
    expect(result2.current.isLoading).toBe(true);
    expect(result2.current.v2OptedIn).toBeNull();
    expect(result2.current.isResolved).toBe(false);
  });

  test('rejects stale A request in A→B→A identity change', async () => {
    // Simulate: identity A starts fetch → identity changes to B → back to A.
    // First A request resolves AFTER the second A request.
    // The stale first-A result must be discarded.
    let resolveFirstA: (v: boolean) => void;
    const firstAPromise = new Promise<boolean>((r) => {
      resolveFirstA = r;
    });
    let resolveSecondA: (v: boolean) => void;
    const secondAPromise = new Promise<boolean>((r) => {
      resolveSecondA = r;
    });

    const store = createStore();
    const makeWrapper = (orgId?: string) => {
      const authValue = createAuthValue(orgId) as ChromeAuthContextValue;
      const Wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(Provider, { store }, React.createElement(ChromeAuthContext.Provider, { value: authValue }, children));
      Wrapper.displayName = 'OrgOptInTestWrapper';
      return Wrapper;
    };

    // Step 1: render with org-A, first fetch starts
    mockedFetchOrgOptIn.mockReturnValue(firstAPromise);
    const { unmount: unmount1 } = renderHook(() => useOrgOptIn(), { wrapper: makeWrapper('org-A') });

    // Step 2: identity changes to B (unmount + remount simulates re-render with new identity)
    unmount1();
    mockedFetchOrgOptIn.mockResolvedValue(false);
    const { unmount: unmount2 } = renderHook(() => useOrgOptIn(), { wrapper: makeWrapper('org-B') });

    // Step 3: back to A — second A fetch starts
    unmount2();
    mockedFetchOrgOptIn.mockReturnValue(secondAPromise);
    const { result } = renderHook(() => useOrgOptIn(), { wrapper: makeWrapper('org-A') });

    // Step 4: second A resolves first with expected value
    resolveSecondA!(true);
    await waitFor(() => expect(result.current.isResolved).toBe(true));
    expect(result.current.v2OptedIn).toBe(true);

    // Step 5: first A resolves late — must NOT overwrite
    resolveFirstA!(false);
    // Allow microtask to process
    await waitFor(() => expect(result.current.v2OptedIn).toBe(true));
    expect(result.current.isResolved).toBe(true);
  });

  test('treats stale result for different identity as loading', async () => {
    // When identity changes A→B before effect fires, status flags from A
    // should not leak through as isResolved/isError.
    mockedFetchOrgOptIn.mockResolvedValue(true);

    const store = createStore();
    const makeWrapper = (orgId?: string) => {
      const authValue = createAuthValue(orgId) as ChromeAuthContextValue;
      const Wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(Provider, { store }, React.createElement(ChromeAuthContext.Provider, { value: authValue }, children));
      Wrapper.displayName = 'OrgOptInTestWrapper';
      return Wrapper;
    };

    // Resolve org-A
    const { unmount } = renderHook(() => useOrgOptIn(), { wrapper: makeWrapper('org-A') });
    await waitFor(() => {
      // wait for fetch to complete
    });
    unmount();

    // Render with org-B — atom still has org-A result until effect runs
    let resolveB: (v: boolean) => void;
    mockedFetchOrgOptIn.mockReturnValue(
      new Promise<boolean>((r) => {
        resolveB = r;
      })
    );
    const { result } = renderHook(() => useOrgOptIn(), { wrapper: makeWrapper('org-B') });

    // Before B resolves, status should show loading (not A's resolved)
    await waitFor(() => expect(result.current.isLoading).toBe(true));
    expect(result.current.isResolved).toBe(false);
    expect(result.current.v2OptedIn).toBeNull();

    // Resolve B
    resolveB!(false);
    await waitFor(() => expect(result.current.isResolved).toBe(true));
    expect(result.current.v2OptedIn).toBe(false);
  });

  test('resets lastFetchedOrgRef on error to allow retry on remount', async () => {
    mockedFetchOrgOptIn.mockResolvedValue(null);
    const { result, unmount } = renderHook(() => useOrgOptIn(), { wrapper: CreateWrapper('org-1') });

    await waitFor(() => expect(result.current.isError).toBe(true));
    unmount();

    // Remount — should attempt fetch again since error reset the ref
    mockedFetchOrgOptIn.mockResolvedValue(true);
    const { result: result2 } = renderHook(() => useOrgOptIn(), { wrapper: CreateWrapper('org-1') });

    await waitFor(() => expect(result2.current.isResolved).toBe(true));
    expect(result2.current.v2OptedIn).toBe(true);
    expect(mockedFetchOrgOptIn).toHaveBeenCalledTimes(2);
  });
});
