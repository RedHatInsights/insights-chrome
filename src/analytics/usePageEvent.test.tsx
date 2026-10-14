import React, { useRef } from 'react';
import { act, render } from '@testing-library/react';
import type { AnalyticsBrowser } from '@segment/analytics-next';
import type { ChromeUser } from '@redhat-cloud-services/types';
import ChromeAuthContext from '../auth/ChromeAuthContext';

const mockLocation = { pathname: '/', search: '' };
const mockPage = jest.fn();
const mockWaitForRenderedThemeInitialization = jest.fn(() => Promise.resolve());

jest.mock('../utils/themeTelemetry', () => ({
  ...jest.requireActual('../utils/themeTelemetry'),
  waitForRenderedThemeInitialization: () => mockWaitForRenderedThemeInitialization(),
}));

jest.mock('react-router-dom', () => ({
  useLocation: () => mockLocation,
}));

jest.mock('../auth/ChromeAuthContext', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return { __esModule: true, default: React.createContext({ user: { identity: { internal: { org_id: 'org-123' } } } }) };
});

jest.mock('../state/chromeStore', () => ({
  __esModule: true,
  default: {
    get: (atom: string) => {
      if (atom === 'is-preview') return true;
      if (atom === 'active-module') return 'landing';
      return {};
    },
  },
}));

jest.mock('../state/atoms/activeModuleAtom', () => ({ activeModuleAtom: 'active-module' }));
jest.mock('../state/atoms/segmentPageOptionsAtom', () => ({ segmentPageOptionsAtom: 'page-options' }));
jest.mock('../state/atoms/releaseAtom', () => ({ isPreviewAtom: 'is-preview' }));
jest.mock('js-cookie', () => ({ __esModule: true, default: { get: jest.fn() } }));

import usePageEvent from './usePageEvent';

const PageEventHook = () => {
  const analytics = useRef({ page: mockPage } as unknown as AnalyticsBrowser);
  usePageEvent(analytics);
  return null;
};

const TestPageEvents = ({ user }: { user: ChromeUser }) => (
  <ChromeAuthContext.Provider value={{ user } as React.ContextType<typeof ChromeAuthContext>}>
    <PageEventHook />
  </ChromeAuthContext.Provider>
);

const makeUser = (orgId: string) => ({ identity: { internal: { org_id: orgId } } }) as ChromeUser;

describe('usePageEvent theme telemetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPage.mockClear();
    mockWaitForRenderedThemeInitialization.mockReset().mockResolvedValue(undefined);
    mockLocation.pathname = '/';
    mockLocation.search = '';
    localStorage.clear();
    document.documentElement.className = '';
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('waits for initial theme classes and sends current rendered theme on page events', async () => {
    let resolveThemeInitialization: () => void = () => undefined;
    mockWaitForRenderedThemeInitialization.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveThemeInitialization = resolve;
      })
    );
    document.documentElement.classList.add('pf-v6-theme-dark', 'pf-v6-theme-glass');
    const { rerender } = render(<TestPageEvents user={makeUser('org-123')} />);

    act(() => jest.advanceTimersByTime(500));
    expect(mockPage).not.toHaveBeenCalled();

    document.documentElement.classList.remove('pf-v6-theme-dark', 'pf-v6-theme-glass');
    document.documentElement.classList.add('pf-v6-theme-high-contrast');
    mockLocation.pathname = '/insights/dashboard';
    rerender(<TestPageEvents user={makeUser('org-123')} />);
    act(() => jest.advanceTimersByTime(500));
    expect(mockPage).not.toHaveBeenCalled();

    await act(async () => {
      resolveThemeInitialization();
      await Promise.resolve();
    });
    expect(mockPage).toHaveBeenCalledTimes(1);
    expect(mockPage.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        path: '/insights/dashboard',
        colorSchemeRendered: 'light',
        contrastModeRendered: 'high-contrast',
      })
    );

    document.documentElement.classList.remove('pf-v6-theme-high-contrast');
    document.documentElement.classList.add('pf-v6-theme-dark');
    mockLocation.pathname = '/insights/services';
    rerender(<TestPageEvents user={makeUser('org-123')} />);

    await act(async () => {
      jest.advanceTimersByTime(500);
      await Promise.resolve();
    });
    expect(mockPage).toHaveBeenCalledTimes(2);
    expect(mockPage.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        path: '/insights/services',
        colorSchemeRendered: 'dark',
        contrastModeRendered: 'default',
      })
    );
  });

  it('drops superseded A to B to A Page callbacks while theme initialization is pending', async () => {
    let resolveThemeInitialization: () => void = () => undefined;
    mockWaitForRenderedThemeInitialization.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveThemeInitialization = resolve;
      })
    );
    const { rerender } = render(<TestPageEvents user={makeUser('org-123')} />);

    act(() => jest.advanceTimersByTime(500));
    expect(mockWaitForRenderedThemeInitialization).toHaveBeenCalledTimes(1);

    mockLocation.pathname = '/b';
    rerender(<TestPageEvents user={makeUser('org-123')} />);
    act(() => jest.advanceTimersByTime(500));
    expect(mockWaitForRenderedThemeInitialization).toHaveBeenCalledTimes(2);

    mockLocation.pathname = '/';
    rerender(<TestPageEvents user={makeUser('org-123')} />);
    act(() => jest.advanceTimersByTime(500));
    expect(mockWaitForRenderedThemeInitialization).toHaveBeenCalledTimes(3);
    expect(mockPage).not.toHaveBeenCalled();

    await act(async () => {
      resolveThemeInitialization();
      await Promise.resolve();
    });

    expect(mockPage).toHaveBeenCalledTimes(1);
    expect(mockPage.mock.calls[0][0]).toEqual(expect.objectContaining({ path: '/' }));
  });

  it('uses the latest user when a pending Page callback resumes', async () => {
    let resolveThemeInitialization: () => void = () => undefined;
    mockWaitForRenderedThemeInitialization.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveThemeInitialization = resolve;
      })
    );
    const { rerender } = render(<TestPageEvents user={makeUser('org-before')} />);

    act(() => jest.advanceTimersByTime(500));
    rerender(<TestPageEvents user={makeUser('org-after')} />);

    await act(async () => {
      resolveThemeInitialization();
      await Promise.resolve();
    });

    expect(mockPage).toHaveBeenCalledTimes(1);
    expect(mockPage.mock.calls[0][1]).toEqual(expect.objectContaining({ context: { groupId: 'org-after' } }));
  });
});
