import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Provider, createStore } from 'jotai';
import DefaultErrorComponent from './DefaultErrorComponent';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { chunkLoadErrorRefreshKey } from '../../utils/common';
import { _testHooks } from '../../utils/chunkLoadErrorUtils';

// Mock Sentry
jest.mock('@sentry/react', () => ({
  captureException: jest.fn(() => 'mock-sentry-id'),
}));

// Mock responseInterceptors
jest.mock('../../utils/responseInterceptors', () => ({
  get3scaleError: jest.fn(() => null),
}));

// Mock useBundle
jest.mock('../../hooks/useBundle', () => ({
  __esModule: true,
  default: () => ({ bundleId: 'insights', bundleTitle: 'RHEL' }),
  getUrl: () => 'insights',
}));

/**
 * Note: In jsdom 26, location.reload is non-configurable and cannot be spied on.
 * The actual page reload behavior should be verified via Cypress/Playwright e2e tests.
 * (Same limitation as crossAccountBouncer.test.ts)
 *
 * These tests verify the chunk error detection, localStorage flag management,
 * and analytics tracking — i.e. everything that leads up to the reload call.
 */

const renderWithProviders = (ui: React.ReactElement, { activeModule }: { activeModule?: string } = {}) => {
  const store = createStore();
  if (activeModule) {
    store.set(activeModuleAtom, activeModule);
  }

  return render(
    <IntlProvider locale="en">
      <Provider store={store}>{ui}</Provider>
    </IntlProvider>
  );
};

describe('DefaultErrorComponent', () => {
  let originalReload: typeof _testHooks.reload;
  let reloadSpy: jest.Mock;

  beforeEach(() => {
    localStorage.clear();
    originalReload = _testHooks.reload;
    reloadSpy = jest.fn();
    _testHooks.reload = reloadSpy;
    Object.defineProperty(window, 'segment', {
      value: { track: jest.fn() },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    _testHooks.reload = originalReload;
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('renders error page', () => {
    it('renders Something went wrong message', () => {
      renderWithProviders(<DefaultErrorComponent error={new Error('test error')} />);
      expect(screen.getByText('Something went wrong', { exact: false })).toBeInTheDocument();
    });

    it('renders without error', () => {
      renderWithProviders(<DefaultErrorComponent />);
      expect(screen.getByText('Something went wrong', { exact: false })).toBeInTheDocument();
    });

    it('renders Return to home page link', () => {
      renderWithProviders(<DefaultErrorComponent error={new Error('test')} />);
      expect(screen.getByText('Return to home page')).toBeInTheDocument();
    });

    it('renders sentry error ID when error provided', () => {
      renderWithProviders(<DefaultErrorComponent error={new Error('test')} />);
      expect(screen.getByText('Sentry error ID:', { exact: false })).toBeInTheDocument();
    });

    it('renders error message in expandable section', () => {
      renderWithProviders(<DefaultErrorComponent error={new Error('detailed error info')} />);
      expect(screen.getByText('detailed error info')).toBeInTheDocument();
    });

    it('renders string error', () => {
      renderWithProviders(<DefaultErrorComponent error="string error message" />);
      // String error appears both in the error message area and expandable stack trace
      expect(screen.getAllByText('string error message').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('chunk load error detection — localStorage flag management', () => {
    it('sets localStorage flag for webpack chunk load error', async () => {
      const error = new Error('Loading chunk 123 failed.\n(error: https://cdn.example.com/chunk.123.js)');
      renderWithProviders(<DefaultErrorComponent error={error} />, { activeModule: 'test-module' });

      await waitFor(() => {
        expect(localStorage.getItem(`${chunkLoadErrorRefreshKey}-test-module`)).toBe('true');
      });
    });

    it('sets localStorage flag for CSS chunk load error', async () => {
      const error = new Error('Loading CSS chunk 456 failed.');
      renderWithProviders(<DefaultErrorComponent error={error} />, { activeModule: 'css-module' });

      await waitFor(() => {
        expect(localStorage.getItem(`${chunkLoadErrorRefreshKey}-css-module`)).toBe('true');
      });
    });

    it('sets localStorage flag for ESM dynamic import error', async () => {
      const error = new Error('Failed to fetch dynamically imported module: https://example.com/mod.js');
      renderWithProviders(<DefaultErrorComponent error={error} />, { activeModule: 'esm-module' });

      await waitFor(() => {
        expect(localStorage.getItem(`${chunkLoadErrorRefreshKey}-esm-module`)).toBe('true');
      });
    });

    it('sets localStorage flag for error with ChunkLoadError name', async () => {
      const error = new Error('chunk failed');
      error.name = 'ChunkLoadError';
      renderWithProviders(<DefaultErrorComponent error={error} />, { activeModule: 'named-module' });

      await waitFor(() => {
        expect(localStorage.getItem(`${chunkLoadErrorRefreshKey}-named-module`)).toBe('true');
      });
    });

    it('sets localStorage flag for error with cause.name ChunkLoadError', async () => {
      const cause = new Error('underlying');
      cause.name = 'ChunkLoadError';
      const error = new Error('wrapper', { cause });
      renderWithProviders(<DefaultErrorComponent error={error} />, { activeModule: 'cause-module' });

      await waitFor(() => {
        expect(localStorage.getItem(`${chunkLoadErrorRefreshKey}-cause-module`)).toBe('true');
      });
    });

    it('does NOT set localStorage flag when activeModule is not set', async () => {
      const error = new Error('Loading chunk 123 failed.');
      renderWithProviders(<DefaultErrorComponent error={error} />);

      // Wait for effects to settle
      await waitFor(() => {
        expect(screen.getByText('Something went wrong', { exact: false })).toBeInTheDocument();
      });
      // No module → no localStorage flag
      const keys = Object.keys(localStorage).filter((k) => k.includes(chunkLoadErrorRefreshKey));
      expect(keys).toHaveLength(0);
    });

    it('does NOT set localStorage flag for non-chunk errors', async () => {
      const error = new Error('Cannot read properties of undefined');
      renderWithProviders(<DefaultErrorComponent error={error} />, { activeModule: 'my-app' });

      await waitFor(() => {
        expect(screen.getByText('Something went wrong', { exact: false })).toBeInTheDocument();
      });
      expect(localStorage.getItem(`${chunkLoadErrorRefreshKey}-my-app`)).toBeNull();
    });

    it('does NOT set localStorage flag for auth errors', async () => {
      const error = new Error('Token expired');
      renderWithProviders(<DefaultErrorComponent error={error} />, { activeModule: 'my-app' });

      await waitFor(() => {
        expect(screen.getByText('Something went wrong', { exact: false })).toBeInTheDocument();
      });
      expect(localStorage.getItem(`${chunkLoadErrorRefreshKey}-my-app`)).toBeNull();
    });

    it('does NOT set localStorage flag for generic TypeError (e.g. Failed to fetch)', async () => {
      const error = new TypeError('Failed to fetch');
      renderWithProviders(<DefaultErrorComponent error={error} />, { activeModule: 'my-app' });

      await waitFor(() => {
        expect(screen.getByText('Something went wrong', { exact: false })).toBeInTheDocument();
      });
      expect(localStorage.getItem(`${chunkLoadErrorRefreshKey}-my-app`)).toBeNull();
    });
  });

  describe('chunk load error — segment analytics tracking', () => {
    it('tracks chunk loading error event', async () => {
      const trackSpy = jest.fn();
      Object.defineProperty(window, 'segment', {
        value: { track: trackSpy },
        writable: true,
        configurable: true,
      });

      const error = new Error('Loading chunk 123 failed.');
      renderWithProviders(<DefaultErrorComponent error={error} />, { activeModule: 'tracked-module' });

      await waitFor(() => {
        expect(trackSpy).toHaveBeenCalledWith(
          'chunk-loading-error',
          expect.objectContaining({
            message: 'Loading chunk 123 failed.',
          })
        );
      });
    });

    it('tracks string chunk error with correct message', async () => {
      const trackSpy = jest.fn();
      Object.defineProperty(window, 'segment', {
        value: { track: trackSpy },
        writable: true,
        configurable: true,
      });

      renderWithProviders(<DefaultErrorComponent error="Loading chunk vendors failed." />, { activeModule: 'str-module' });

      await waitFor(() => {
        expect(trackSpy).toHaveBeenCalledWith(
          'chunk-loading-error',
          expect.objectContaining({
            message: 'Loading chunk vendors failed.',
          })
        );
      });
    });

    it('does NOT track segment event for non-chunk errors', async () => {
      const trackSpy = jest.fn();
      Object.defineProperty(window, 'segment', {
        value: { track: trackSpy },
        writable: true,
        configurable: true,
      });

      const error = new Error('Runtime error');
      renderWithProviders(<DefaultErrorComponent error={error} />, { activeModule: 'my-app' });

      await waitFor(() => {
        expect(screen.getByText('Something went wrong', { exact: false })).toBeInTheDocument();
      });
      expect(trackSpy).not.toHaveBeenCalledWith('chunk-loading-error', expect.anything());
    });
  });

  describe('chunk load error — infinite reload prevention', () => {
    it('does not re-set localStorage if flag already exists', async () => {
      const moduleName = 'already-reloaded';
      const key = `${chunkLoadErrorRefreshKey}-${moduleName}`;
      localStorage.setItem(key, 'true');

      const error = new Error('Loading chunk 123 failed.');
      renderWithProviders(<DefaultErrorComponent error={error} />, { activeModule: moduleName });

      // Effect runs, checks localStorage, finds 'true', skips reload
      await waitFor(() => {
        expect(screen.getByText('Something went wrong', { exact: false })).toBeInTheDocument();
      });
      // Flag still there (not changed)
      expect(localStorage.getItem(key)).toBe('true');
    });

    it('does not call reload when localStorage flag already set', async () => {
      const moduleName = 'prevent-reload';
      const key = `${chunkLoadErrorRefreshKey}-${moduleName}`;
      localStorage.setItem(key, 'true');

      const error = new Error('Loading chunk 999 failed.');
      renderWithProviders(<DefaultErrorComponent error={error} />, { activeModule: moduleName });

      await waitFor(() => {
        expect(screen.getByText('Something went wrong', { exact: false })).toBeInTheDocument();
      });
      // Reload must NOT be called — flag was already set (infinite reload prevention)
      expect(reloadSpy).not.toHaveBeenCalled();
    });
  });
});
