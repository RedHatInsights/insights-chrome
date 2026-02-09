import React from 'react';
import { render } from '@testing-library/react';
import ChromeRoute from './ChromeRoute';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { routeAuthScopeReady } from '../../state/atoms/routeAuthScopeReady';
import { silentReauthEnabledAtom } from '../../state/atoms/silentReauthAtom';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { chromeModulesAtom } from '../../state/atoms/chromeModuleAtom';

jest.mock('@scalprum/react-core', () => {
  return {
    ScalprumComponent: () => React.createElement('div', { 'data-testid': 'scalprum-stub' }),
  };
});

describe('ChromeRoute - auth scope gating', () => {
  it('shows loading when silent reauth enabled, scopes not ready, and route requires scopes', () => {
    const store = createStore();
    store.set(silentReauthEnabledAtom, true);
    store.set(routeAuthScopeReady, false);
    store.set(activeModuleAtom, 'foo');
    store.set(chromeModulesAtom, {
      foo: {
        manifestLocation: '/test',
        config: { ssoScopes: ['scope1', 'scope2'] },
      },
    });

    const { container } = render(
      <JotaiProvider store={store}>
        <ChromeRoute scope="foo" module="foo#foo" path="*" />
      </JotaiProvider>
    );

    const spinner = container.querySelector('[data-ouia-component-id="remote-module-loader"]');
    expect(spinner).toBeTruthy();
  });

  it('does NOT block when silent reauth disabled even if scopes not ready', () => {
    const store = createStore();
    store.set(silentReauthEnabledAtom, false);
    store.set(routeAuthScopeReady, false);
    store.set(activeModuleAtom, 'foo');
    store.set(chromeModulesAtom, {
      foo: {
        manifestLocation: '/test',
        config: { ssoScopes: ['scope1'] },
      },
    });

    const { container } = render(
      <JotaiProvider store={store}>
        <ChromeRoute scope="foo" module="foo#foo" path="*" />
      </JotaiProvider>
    );

    // Should render immediately when feature flag disabled
    const stub = container.querySelector('[data-testid="scalprum-stub"]');
    expect(stub).toBeTruthy();
  });

  it('does NOT block routes without scopes even when silent reauth in progress', () => {
    const store = createStore();
    store.set(silentReauthEnabledAtom, true);
    store.set(routeAuthScopeReady, false);
    store.set(activeModuleAtom, 'bar');
    store.set(chromeModulesAtom, {
      bar: {
        manifestLocation: '/test',
        config: {}, // No ssoScopes
      },
    });

    const { container } = render(
      <JotaiProvider store={store}>
        <ChromeRoute scope="bar" module="bar#bar" path="*" />
      </JotaiProvider>
    );

    // Should render immediately since this route doesn't need scopes
    const stub = container.querySelector('[data-testid="scalprum-stub"]');
    expect(stub).toBeTruthy();
  });

  it('shows loading fallback when checking permissions', () => {
    const store = createStore();
    const { container } = render(
      <JotaiProvider store={store}>
        <ChromeRoute scope="foo" module="foo#foo" path="*" permissions={[{ method: 'withEmail', args: ['@redhat.com'] }] as any} />
      </JotaiProvider>
    );
    // Routes with permissions show loading while evaluating visibility
    const spinner = container.querySelector('[data-ouia-component-id="remote-module-loader"]');
    expect(spinner).toBeTruthy();
  });
});
