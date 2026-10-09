import React, { useRef } from 'react';
import { act, render } from '@testing-library/react';
import type { AnalyticsBrowser } from '@segment/analytics-next';

const mockLocation = { pathname: '/', search: '' };
const mockPage = jest.fn();

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

const TestPageEvents = () => {
  const analytics = useRef({ page: mockPage } as unknown as AnalyticsBrowser);
  usePageEvent(analytics);
  return null;
};

describe('usePageEvent theme telemetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPage.mockClear();
    mockLocation.pathname = '/';
    mockLocation.search = '';
    localStorage.clear();
    document.documentElement.className = '';
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('sends current rendered theme on the initial page event and navigation events', () => {
    document.documentElement.classList.add('pf-v6-theme-dark', 'pf-v6-theme-glass');
    const { rerender } = render(<TestPageEvents />);

    act(() => jest.advanceTimersByTime(500));
    expect(mockPage).toHaveBeenCalledTimes(1);
    expect(mockPage.mock.calls[0][0]).toEqual(expect.objectContaining({ colorSchemeRendered: 'dark', contrastModeRendered: 'glass' }));

    document.documentElement.classList.remove('pf-v6-theme-dark', 'pf-v6-theme-glass');
    document.documentElement.classList.add('pf-v6-theme-high-contrast');
    mockLocation.pathname = '/insights/dashboard';
    rerender(<TestPageEvents />);

    act(() => jest.advanceTimersByTime(500));
    expect(mockPage).toHaveBeenCalledTimes(2);
    expect(mockPage.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        path: '/insights/dashboard',
        colorSchemeRendered: 'light',
        contrastModeRendered: 'high-contrast',
      })
    );
  });
});
