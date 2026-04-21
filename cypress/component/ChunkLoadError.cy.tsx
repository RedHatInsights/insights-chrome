import React from 'react';
import { IntlProvider } from 'react-intl';
import { Provider as JotaiProvider, createStore } from 'jotai';
import DefaultErrorComponent from '../../src/components/ErrorComponents/DefaultErrorComponent';
import ErrorBoundary from '../../src/components/ErrorComponents/ErrorBoundary';
import { activeModuleAtom } from '../../src/state/atoms/activeModuleAtom';
import { chunkLoadErrorRefreshKey } from '../../src/utils/common';
import * as chunkLoadErrorUtils from '../../src/utils/chunkLoadErrorUtils';

/**
 * Cypress component tests for chunk load error detection and recovery.
 *
 * These tests verify the end-to-end behavior of the ChunkLoadError
 * detection, localStorage flag management, Segment analytics tracking,
 * and infinite reload prevention in DefaultErrorComponent.
 */

// Wrapper that provides all required contexts
const renderWithProviders = (ui: React.ReactElement, activeModule?: string) => {
  const store = createStore();
  if (activeModule) {
    store.set(activeModuleAtom, activeModule);
  }

  return cy.mount(
    <JotaiProvider store={store}>
      <IntlProvider locale="en">{ui}</IntlProvider>
    </JotaiProvider>
  );
};

// Component that throws an error to trigger ErrorBoundary
const ThrowComponent = ({ error }: { error: Error }) => {
  throw error;
};

describe('ChunkLoadError detection and recovery', () => {
  beforeEach(() => {
    localStorage.clear();
    // Stub the internal reload hook instead of the module export directly.
    // Webpack 5 ESM namespaces are read-only (getter-backed bindings), so
    // cy.stub(chunkLoadErrorUtils, 'reloadPage') silently fails in CI.
    // The _testHooks object is a plain mutable JS object, so cy.stub works reliably.
    cy.stub(chunkLoadErrorUtils._testHooks, 'reload').as('locationReload');
    // Mock Segment analytics on window
    Object.defineProperty(window, 'segment', {
      value: { track: cy.stub().as('segmentTrack') },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('DefaultErrorComponent — chunk error rendering', () => {
    it('renders Something Went Wrong page for a webpack chunk error', () => {
      const error = new Error('Loading chunk 123 failed.\n(error: https://cdn.example.com/chunk.123.js)');
      renderWithProviders(<DefaultErrorComponent error={error} />, 'test-module');

      cy.contains('Something went wrong').should('exist');
      cy.contains('Loading chunk 123 failed.').should('exist');
    });

    it('renders Something Went Wrong page for a CSS chunk error', () => {
      const error = new Error('Loading CSS chunk 456 failed.');
      renderWithProviders(<DefaultErrorComponent error={error} />, 'css-module');

      cy.contains('Something went wrong').should('exist');
    });

    it('renders Something Went Wrong page for ESM dynamic import error', () => {
      const error = new Error('Failed to fetch dynamically imported module: https://example.com/mod.js');
      renderWithProviders(<DefaultErrorComponent error={error} />, 'esm-module');

      cy.contains('Something went wrong').should('exist');
    });

    it('renders Something Went Wrong page for a string chunk error', () => {
      renderWithProviders(<DefaultErrorComponent error="Loading chunk vendors failed." />, 'str-module');

      cy.contains('Something went wrong').should('exist');
      cy.contains('Loading chunk vendors failed.').should('exist');
    });

    it('renders Something Went Wrong page for a non-chunk error', () => {
      const error = new Error('Cannot read properties of undefined');
      renderWithProviders(<DefaultErrorComponent error={error} />, 'my-app');

      cy.contains('Something went wrong').should('exist');
      cy.contains('Cannot read properties of undefined').should('exist');
    });

    it('renders Return to home page link', () => {
      const error = new Error('Loading chunk 123 failed.');
      renderWithProviders(<DefaultErrorComponent error={error} />, 'my-app');

      cy.contains('Return to home page').should('exist');
    });

    it('renders Sentry error ID', () => {
      const error = new Error('Loading chunk 123 failed.');
      renderWithProviders(<DefaultErrorComponent error={error} />, 'my-app');

      cy.contains('Sentry error ID:').should('exist');
    });
  });

  describe('localStorage flag management', () => {
    it('sets localStorage flag for webpack chunk load error and triggers reload', () => {
      const error = new Error('Loading chunk 123 failed.\n(error: https://cdn.example.com/chunk.123.js)');
      renderWithProviders(<DefaultErrorComponent error={error} />, 'webpack-module');

      cy.wrap(null).should(() => {
        expect(localStorage.getItem(`${chunkLoadErrorRefreshKey}-webpack-module`)).to.eq('true');
      });
      cy.get('@locationReload').should('have.been.calledOnce');
    });

    it('sets localStorage flag for CSS chunk load error', () => {
      const error = new Error('Loading CSS chunk 456 failed.');
      renderWithProviders(<DefaultErrorComponent error={error} />, 'css-mod');

      cy.wrap(null).should(() => {
        expect(localStorage.getItem(`${chunkLoadErrorRefreshKey}-css-mod`)).to.eq('true');
      });
    });

    it('sets localStorage flag for ESM dynamic import error (Chrome/Vite)', () => {
      const error = new Error('Failed to fetch dynamically imported module: https://example.com/mod.js');
      renderWithProviders(<DefaultErrorComponent error={error} />, 'esm-mod');

      cy.wrap(null).should(() => {
        expect(localStorage.getItem(`${chunkLoadErrorRefreshKey}-esm-mod`)).to.eq('true');
      });
    });

    it('sets localStorage flag for Firefox dynamic import error', () => {
      const error = new Error('error loading dynamically imported module');
      renderWithProviders(<DefaultErrorComponent error={error} />, 'ff-mod');

      cy.wrap(null).should(() => {
        expect(localStorage.getItem(`${chunkLoadErrorRefreshKey}-ff-mod`)).to.eq('true');
      });
    });

    it('sets localStorage flag for Safari dynamic import error', () => {
      const error = new Error('Importing a module script failed.');
      renderWithProviders(<DefaultErrorComponent error={error} />, 'safari-mod');

      cy.wrap(null).should(() => {
        expect(localStorage.getItem(`${chunkLoadErrorRefreshKey}-safari-mod`)).to.eq('true');
      });
    });

    it('sets localStorage flag for error with ChunkLoadError name', () => {
      const error = new Error('chunk failed');
      error.name = 'ChunkLoadError';
      renderWithProviders(<DefaultErrorComponent error={error} />, 'named-mod');

      cy.wrap(null).should(() => {
        expect(localStorage.getItem(`${chunkLoadErrorRefreshKey}-named-mod`)).to.eq('true');
      });
    });

    it('does NOT set localStorage flag for non-chunk errors', () => {
      const error = new Error('Cannot read properties of undefined');
      renderWithProviders(<DefaultErrorComponent error={error} />, 'safe-mod');

      cy.contains('Something went wrong').should('exist');
      // Allow useEffect to settle before checking localStorage
      cy.wait(0).should(() => {
        expect(localStorage.getItem(`${chunkLoadErrorRefreshKey}-safe-mod`)).to.equal(null);
      });
      cy.get('@locationReload').should('not.have.been.called');
    });

    it('does NOT set localStorage flag for auth errors', () => {
      const error = new Error('Token expired');
      renderWithProviders(<DefaultErrorComponent error={error} />, 'auth-mod');

      cy.contains('Something went wrong').should('exist');
      cy.wait(0).should(() => {
        expect(localStorage.getItem(`${chunkLoadErrorRefreshKey}-auth-mod`)).to.equal(null);
      });
      cy.get('@locationReload').should('not.have.been.called');
    });

    it('does NOT set localStorage flag for generic TypeError', () => {
      const error = new TypeError('Failed to fetch');
      renderWithProviders(<DefaultErrorComponent error={error} />, 'net-mod');

      cy.contains('Something went wrong').should('exist');
      cy.wait(0).should(() => {
        expect(localStorage.getItem(`${chunkLoadErrorRefreshKey}-net-mod`)).to.equal(null);
      });
      cy.get('@locationReload').should('not.have.been.called');
    });

    it('does NOT set localStorage flag when no activeModule', () => {
      // activeModuleAtom defaults to undefined — no module means no chunk error handling
      const error = new Error('Loading chunk 123 failed.');
      renderWithProviders(<DefaultErrorComponent error={error} />);

      cy.contains('Something went wrong').should('exist');
      cy.wait(0).should(() => {
        const keys = Object.keys(localStorage).filter((k) => k.includes(chunkLoadErrorRefreshKey));
        expect(keys).to.have.lengthOf(0);
      });
    });
  });

  describe('infinite reload prevention', () => {
    it('does not attempt reload if localStorage flag already set', () => {
      const moduleName = 'already-reloaded';
      const key = `${chunkLoadErrorRefreshKey}-${moduleName}`;
      localStorage.setItem(key, 'true');

      const error = new Error('Loading chunk 123 failed.');
      renderWithProviders(<DefaultErrorComponent error={error} />, moduleName);

      // Should render the error page (not reload)
      cy.contains('Something went wrong').should('exist');
      cy.wrap(null).should(() => {
        expect(localStorage.getItem(key)).to.eq('true');
      });
      // Reload should NOT be called because flag was already set
      cy.get('@locationReload').should('not.have.been.called');
    });
  });

  describe('Segment analytics tracking', () => {
    it('tracks chunk-loading-error event with correct payload', () => {
      const error = new Error('Loading chunk 123 failed.');
      renderWithProviders(<DefaultErrorComponent error={error} />, 'tracked-mod');

      cy.get('@segmentTrack').should('have.been.calledWithMatch', 'chunk-loading-error', {
        message: 'Loading chunk 123 failed.',
      });
    });

    it('tracks string chunk error with correct message', () => {
      renderWithProviders(<DefaultErrorComponent error="Loading chunk vendors failed." />, 'str-tracked');

      cy.get('@segmentTrack').should('have.been.calledWithMatch', 'chunk-loading-error', {
        message: 'Loading chunk vendors failed.',
      });
    });

    it('does NOT track non-chunk errors', () => {
      const error = new Error('Runtime error');
      renderWithProviders(<DefaultErrorComponent error={error} />, 'no-track-mod');

      cy.contains('Something went wrong').should('exist');
      cy.wait(0);
      cy.get('@segmentTrack').should('not.have.been.calledWith', 'chunk-loading-error');
    });
  });

  describe('ErrorBoundary integration', () => {
    it('catches thrown chunk load error and renders DefaultErrorComponent', () => {
      cy.on('uncaught:exception', () => false);
      const store = createStore();
      store.set(activeModuleAtom, 'boundary-mod');

      const error = new Error('Loading chunk abc failed.');
      cy.mount(
        <JotaiProvider store={store}>
          <IntlProvider locale="en">
            <ErrorBoundary>
              <ThrowComponent error={error} />
            </ErrorBoundary>
          </IntlProvider>
        </JotaiProvider>
      );

      cy.contains('Something went wrong').should('exist');
      cy.contains('Loading chunk abc failed.').should('exist');
    });

    it('catches thrown non-chunk error and renders DefaultErrorComponent', () => {
      cy.on('uncaught:exception', () => false);
      const store = createStore();
      store.set(activeModuleAtom, 'boundary-mod-2');

      const error = new Error('Unexpected token < in JSON');
      cy.mount(
        <JotaiProvider store={store}>
          <IntlProvider locale="en">
            <ErrorBoundary>
              <ThrowComponent error={error} />
            </ErrorBoundary>
          </IntlProvider>
        </JotaiProvider>
      );

      cy.contains('Something went wrong').should('exist');
      cy.contains('Unexpected token < in JSON').should('exist');
      // Non-chunk error — no localStorage flag
      cy.wait(0).should(() => {
        expect(localStorage.getItem(`${chunkLoadErrorRefreshKey}-boundary-mod-2`)).to.equal(null);
      });
    });
  });
});
