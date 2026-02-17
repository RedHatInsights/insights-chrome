import React from 'react';
import { render } from '@testing-library/react';
import ChromeRoute from './ChromeRoute';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { routeAuthScopeReadyAtom } from '../../state/atoms/routeAuthScopeReady';
import { silentReauthEnabledAtom } from '../../state/atoms/silentReauthAtom';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { chromeModulesAtom } from '../../state/atoms/chromeModuleAtom';

jest.mock('@scalprum/react-core', () => {
  return {
    ScalprumComponent: () => React.createElement('div', { 'data-testid': 'scalprum-stub' }),
  };
});

describe('ChromeRoute - auth scope gating', () => {
  let store: ReturnType<typeof createStore>;

  const renderChromeRoute = (scope: string, module: string, props?: Partial<React.ComponentProps<typeof ChromeRoute>>) => {
    return render(
      <JotaiProvider store={store}>
        <ChromeRoute scope={scope} module={module} path="*" {...props} />
      </JotaiProvider>
    );
  };

  beforeEach(() => {
    store = createStore();
  });

  it('shows loading when silent reauth enabled, scopes not ready, and route requires scopes', () => {
    store.set(silentReauthEnabledAtom, true);
    store.set(routeAuthScopeReadyAtom, { foo: false }); // 'foo' module is not ready
    store.set(activeModuleAtom, 'foo');
    store.set(chromeModulesAtom, {
      foo: {
        manifestLocation: '/test',
        config: { ssoScopes: ['scope1', 'scope2'] },
      },
    });

    const { container } = renderChromeRoute('foo', 'foo#foo');

    const spinner = container.querySelector('[data-ouia-component-id="remote-module-loader"]');
    expect(spinner).toBeTruthy();
  });

  it('does NOT block when silent reauth disabled even if scopes not ready', () => {
    store.set(silentReauthEnabledAtom, false);
    store.set(routeAuthScopeReadyAtom, { foo: false });
    store.set(activeModuleAtom, 'foo');
    store.set(chromeModulesAtom, {
      foo: {
        manifestLocation: '/test',
        config: { ssoScopes: ['scope1'] },
      },
    });

    const { container } = renderChromeRoute('foo', 'foo#foo');

    // Should render immediately when feature flag disabled
    const stub = container.querySelector('[data-testid="scalprum-stub"]');
    expect(stub).toBeTruthy();
  });

  it('does NOT block routes without scopes even when silent reauth in progress', () => {
    store.set(silentReauthEnabledAtom, true);
    store.set(routeAuthScopeReadyAtom, { bar: false });
    store.set(activeModuleAtom, 'bar');
    store.set(chromeModulesAtom, {
      bar: {
        manifestLocation: '/test',
        config: {}, // No ssoScopes
      },
    });

    const { container } = renderChromeRoute('bar', 'bar#bar');

    // Should render immediately since this route doesn't need scopes
    const stub = container.querySelector('[data-testid="scalprum-stub"]');
    expect(stub).toBeTruthy();
  });

  it('shows loading fallback when checking permissions', () => {
    const { container } = renderChromeRoute('foo', 'foo#foo', {
      permissions: [{ method: 'withEmail', args: ['@redhat.com'] }] as any,
    });
    // Routes with permissions show loading while evaluating visibility
    const spinner = container.querySelector('[data-ouia-component-id="remote-module-loader"]');
    expect(spinner).toBeTruthy();
  });

  it('blocks only the specific module that is not ready, not other modules', () => {
    store.set(silentReauthEnabledAtom, true);
    // Module 'foo' is not ready, but 'bar' is ready
    store.set(routeAuthScopeReadyAtom, { foo: false, bar: true });
    store.set(chromeModulesAtom, {
      foo: {
        manifestLocation: '/test',
        config: { ssoScopes: ['scope1'] },
      },
      bar: {
        manifestLocation: '/test',
        config: { ssoScopes: ['scope2'] },
      },
    });

    // Render route for 'foo' - should be blocked
    const { container: fooContainer } = renderChromeRoute('foo', 'foo#foo');
    const fooSpinner = fooContainer.querySelector('[data-ouia-component-id="remote-module-loader"]');
    expect(fooSpinner).toBeTruthy();

    // Render route for 'bar' - should NOT be blocked
    const { container: barContainer } = renderChromeRoute('bar', 'bar#bar');
    const barStub = barContainer.querySelector('[data-testid="scalprum-stub"]');
    expect(barStub).toBeTruthy();
  });

  it('blocks routes on first render when silent reauth enabled and scopes required (race condition fix)', () => {
    store.set(silentReauthEnabledAtom, true);
    // authScopeReadyMap does NOT have an entry for 'baz' yet (simulates first render)
    store.set(routeAuthScopeReadyAtom, {});
    store.set(chromeModulesAtom, {
      baz: {
        manifestLocation: '/test',
        config: { ssoScopes: ['scope1'] },
      },
    });

    const { container } = renderChromeRoute('baz', 'baz#baz');

    // Should block (show loading) because we default to false when undefined + scopes required
    const spinner = container.querySelector('[data-ouia-component-id="remote-module-loader"]');
    expect(spinner).toBeTruthy();
  });

  it('does NOT block routes on first render when silent reauth enabled but no scopes required', () => {
    store.set(silentReauthEnabledAtom, true);
    // authScopeReadyMap does NOT have an entry for 'qux' yet
    store.set(routeAuthScopeReadyAtom, {});
    store.set(chromeModulesAtom, {
      qux: {
        manifestLocation: '/test',
        config: {}, // No scopes
      },
    });

    const { container } = renderChromeRoute('qux', 'qux#qux');

    // Should NOT block because no scopes required
    const stub = container.querySelector('[data-testid="scalprum-stub"]');
    expect(stub).toBeTruthy();
  });
});
