import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { loadBreadcrumbStore } from '../../chrome/breadcrumbStoreBridge';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import ChromeRoute from './ChromeRoute';

jest.mock('@scalprum/react-core', () => ({
  ScalprumComponent: () => <div data-testid="remote-module" />,
}));

jest.mock('../ErrorComponents/DefaultErrorComponent', () => {
  const DefaultErrorComponent = () => null;
  DefaultErrorComponent.displayName = 'DefaultErrorComponent';
  return DefaultErrorComponent;
});
jest.mock('../ErrorComponents/GatewayErrorComponent', () => {
  const GatewayErrorComponent = () => <div data-testid="gateway-error" />;
  GatewayErrorComponent.displayName = 'GatewayErrorComponent';
  return GatewayErrorComponent;
});
jest.mock('../NotFoundRoute', () => {
  const NotFoundRoute = () => <div data-testid="not-found" />;
  NotFoundRoute.displayName = 'NotFoundRoute';
  return NotFoundRoute;
});

jest.mock('../../chrome/breadcrumbStoreBridge', () => ({
  loadBreadcrumbStore: jest.fn(),
}));

const mockedLoadBreadcrumbStore = loadBreadcrumbStore as jest.MockedFunction<typeof loadBreadcrumbStore>;

const renderRoute = (path = '/insights/advisor/*') => {
  const store = createStore();
  store.set(activeModuleAtom, undefined);
  return render(
    <JotaiProvider store={store}>
      <ChromeRoute scope="insights" module="./RootApp" path={path} />
    </JotaiProvider>
  );
};

describe('ChromeRoute breadcrumb store', () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

  beforeEach(() => {
    mockedLoadBreadcrumbStore.mockReset();
    consoleError.mockClear();
  });

  afterAll(() => {
    consoleError.mockRestore();
  });

  it('clears previous app breadcrumbs and sets the mount path when the store loads', async () => {
    const breadcrumbStore = { updateState: jest.fn() };
    mockedLoadBreadcrumbStore.mockResolvedValue(breadcrumbStore as never);

    await act(async () => {
      renderRoute();
    });

    await waitFor(() => {
      expect(breadcrumbStore.updateState).toHaveBeenCalledWith('CLEAR');
      expect(breadcrumbStore.updateState).toHaveBeenCalledWith('SET_APP_MOUNT_PATHNAME', '/insights/advisor');
    });
    expect(screen.getByTestId('remote-module')).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('logs scope and mountPath when the federated store fails and still renders the module', async () => {
    const error = new Error('breadcrumb remote unavailable');
    mockedLoadBreadcrumbStore.mockRejectedValue(error);

    await act(async () => {
      renderRoute('/settings/*');
    });

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to load federated breadcrumb store; skipping CLEAR and SET_APP_MOUNT_PATHNAME',
        expect.objectContaining({
          scope: 'insights',
          mountPath: '/settings',
          error,
        })
      );
    });
    expect(screen.getByTestId('remote-module')).toBeInTheDocument();
  });
});
