import React from 'react';
import { render } from '@testing-library/react';
import ChromeRoute from './ChromeRoute';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { routeAuthScopeReady } from '../../state/atoms/routeAuthScopeReady';
import { useFlag } from '@unleash/proxy-client-react';

jest.mock('@unleash/proxy-client-react', () => ({ useFlag: jest.fn() }));
jest.mock('@scalprum/react-core', () => {
  return {
    ScalprumComponent: () => React.createElement('div', { 'data-testid': 'scalprum-stub' }),
  };
});

describe('ChromeRoute - auth scope gating', () => {
  beforeEach(() => {
    (useFlag as jest.Mock).mockReset();
  });

  it('renders loading fallback when routeAuthScopeReady is false', () => {
    (useFlag as jest.Mock).mockReturnValue(true);
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

  it("shows LoadingFallback when 'platform.chrome.silent-reauth' flag is enabled and auth scope is not ready", () => {
    (useFlag as jest.Mock).mockReturnValue(true);
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

  it("does NOT show LoadingFallback when 'platform.chrome.silent-reauth' flag is disabled and auth scope is not ready", () => {
    (useFlag as jest.Mock).mockReturnValue(false);
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
