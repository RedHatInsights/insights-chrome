import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import RootApp, { ConnectedRootApp } from './RootApp';
import { act, render, waitFor } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

jest.mock('../utils', () => {
  const utils = jest.requireActual('../utils');
  return {
    __esModule: true,
    ...utils,
    isBeta: jest.fn().mockReturnValue(false),
    getEnv: jest.fn().mockReturnValue('qa'),
  };
});

jest.mock('react-router-dom', () => {
  const routerDom = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...routerDom,
    useLocation: jest.fn().mockImplementation((...args) => {
      return routerDom.useLocation(...args);
    }),
  };
});

import * as utils from '../utils';
import * as routerDom from 'react-router-dom';

describe('RootApp', () => {
  let initialState;
  let mockStore;
  let config;

  beforeEach(() => {
    config = {
      foo: {
        manifestLocation: '/bar',
        appName: 'foo',
      },
    };
    mockStore = configureStore();
    initialState = {
      chrome: {
        activeApp: 'some-app',
        activeLocation: 'some-location',
        appId: 'app-id',
        navigation: {
          '/': {
            navItems: [],
          },
          insights: {
            navItems: [],
          },
        },
      },
      globalFilter: {
        tags: {},
        sid: {},
        workloads: {},
      },
    };
  });

  it('should render correctly - no data', async () => {
    const store = mockStore({ chrome: {} });
    const { container } = render(
      <Provider store={store}>
        <RootApp config={config} />
      </Provider>
    );
    expect(container.querySelector('.pf-c-drawer__content')).toMatchSnapshot();
  });

  it('should render correctly', () => {
    const store = mockStore(initialState);
    const { container } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/some-location/app-id']}>
          <ConnectedRootApp config={config} />
        </MemoryRouter>
      </Provider>
    );
    expect(container.querySelector('.pf-c-drawer__content')).toMatchSnapshot();
  });

  it('should render correctly with pageAction', () => {
    const store = mockStore({
      chrome: {
        ...initialState.chrome,
        pageAction: 'some-action',
      },
    });
    const { container } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/some-location/app-id']}>
          <ConnectedRootApp config={config} />
        </MemoryRouter>
      </Provider>
    );
    expect(container.querySelector('.pf-c-drawer__content')).toMatchSnapshot();
  });

  it('should render correctly with pageObjectId', () => {
    const store = mockStore({
      chrome: {
        ...initialState.chrome,
        pageObjectId: 'some-object-id',
      },
    });
    const { container } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/some-location/app-id']}>
          <ConnectedRootApp config={config} />
        </MemoryRouter>
      </Provider>
    );
    expect(container.querySelector('.pf-c-drawer__content')).toMatchSnapshot();
  });

  it('should render correctly with pageObjectId and pageAction', () => {
    const store = mockStore({
      chrome: {
        ...initialState.chrome,
        pageAction: 'some-action',
        pageObjectId: 'some-object-id',
      },
    });
    const { container } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/some-location/app-id']}>
          <ConnectedRootApp config={config} />
        </MemoryRouter>
      </Provider>
    );
    expect(container.querySelector('.pf-c-drawer__content')).toMatchSnapshot();
  });

  it('should render PageSidebar with LandingNav component', async () => {
    /**
     * Temporarily override the module mock
     */
    const isBetaSpy = jest.spyOn(utils, 'isBeta');
    isBetaSpy.mockReturnValue(true);
    const getEnvSpy = jest.spyOn(utils, 'getEnv');
    getEnvSpy.mockReturnValue('ci');

    const store = mockStore({
      chrome: {
        ...initialState.chrome,
        navigation: {
          landingPage: [],
        },
        user: {
          identity: {
            account_number: 'foo',
            user: {},
          },
        },
      },
    });
    let container;
    await act(async () => {
      const { container: internalContainer } = await render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/']}>
            <ConnectedRootApp config={config} />
          </MemoryRouter>
        </Provider>
      );
      container = internalContainer;
    });
    expect(container.querySelector('.ins-c-landing-nav')).toBeTruthy();
    /**
     * We have to clear the restore the mock to match the mocked module
     */
    isBetaSpy.mockReturnValue(false);
    getEnvSpy.mockReturnValue('qa');
  });

  it('should render PageSidebar with SideNav component', async () => {
    const useLocationSpy = jest.spyOn(routerDom, 'useLocation');
    useLocationSpy.mockReturnValue({ pathname: '/insights', search: undefined, hash: undefined });
    const store = mockStore({
      chrome: {
        ...initialState.chrome,
        user: {
          identity: {
            account_number: 'foo',
            user: {},
          },
        },
      },
    });
    let getByLabelText;
    await act(async () => {
      const { getByLabelText: internalGetByLabelText } = await render(
        <Provider store={store}>
          <RootApp config={config} />
        </Provider>
      );
      getByLabelText = internalGetByLabelText;
    });
    expect(getByLabelText('Insights Global Navigation')).toBeTruthy();
  });

  it('should render GlobalFilter', async () => {
    const useLocationSpy = jest.spyOn(routerDom, 'useLocation');
    useLocationSpy.mockReturnValue({ pathname: '/insights', search: undefined, hash: undefined });
    const store = mockStore({
      ...initialState,
      chrome: {
        ...initialState.chrome,
        activeLocation: 'insights',
      },
    });

    const { container } = render(
      <Provider store={store}>
        <RootApp config={config} globalFilterHidden={false} />
      </Provider>
    );
    await waitFor(() => expect(container.querySelector('#global-filter')).toBeTruthy());

    useLocationSpy.mockRestore();
  });
});
