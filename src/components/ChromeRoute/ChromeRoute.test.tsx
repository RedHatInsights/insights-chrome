import React from 'react';
import { render } from '@testing-library/react';
import ChromeRoute from './ChromeRoute';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { routeAuthScopeReady } from '../../state/atoms/routeAuthScopeReady';
import { SILENT_REAUTH_ENABLED_KEY } from '../../utils/consts';

jest.mock('@scalprum/react-core', () => {
  return {
    ScalprumComponent: () => React.createElement('div', { 'data-testid': 'scalprum-stub' }),
  };
});

describe('ChromeRoute - auth scope gating', () => {
  beforeEach(() => {
    localStorage.removeItem(SILENT_REAUTH_ENABLED_KEY);
  });

  it('renders loading fallback when routeAuthScopeReady is false', () => {
    localStorage.setItem(SILENT_REAUTH_ENABLED_KEY, 'true');
    const store = createStore();
    store.set(routeAuthScopeReady, false);
    const { container } = render(
      <JotaiProvider store={store}>
        <ChromeRoute scope="foo" module="foo#foo" path="*" permissions={[{ method: 'withEmail', args: ['@redhat.com'] }] as any} />
      </JotaiProvider>
    );
    const spinner = container.querySelector('[data-ouia-component-id="remote-module-loader"]');
    expect(spinner).toBeTruthy();
  });

  it('shows LoadingFallback when silent reauth is enabled via localStorage and auth scope is not ready', () => {
    localStorage.setItem(SILENT_REAUTH_ENABLED_KEY, 'true');
    const store = createStore();
    store.set(routeAuthScopeReady, false);
    const { container } = render(
      <JotaiProvider store={store}>
        <ChromeRoute scope="foo" module="foo#foo" path="*" />
      </JotaiProvider>
    );
    const spinner = container.querySelector('[data-ouia-component-id="remote-module-loader"]');
    expect(spinner).toBeTruthy();
  });

  it('does NOT show LoadingFallback when silent reauth is disabled via localStorage and auth scope is not ready', () => {
    localStorage.removeItem(SILENT_REAUTH_ENABLED_KEY);
    const store = createStore();
    store.set(routeAuthScopeReady, false);
    const { container } = render(
      <JotaiProvider store={store}>
        <ChromeRoute scope="foo" module="foo#foo" path="*" />
      </JotaiProvider>
    );
    const spinner = container.querySelector('[data-ouia-component-id="remote-module-loader"]');
    expect(spinner).toBeFalsy();
  });
});
