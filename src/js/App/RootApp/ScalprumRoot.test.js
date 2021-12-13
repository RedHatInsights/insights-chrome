import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ScalprumRoot from './ScalprumRoot';
import { act, render, waitFor } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

jest.mock('../../utils', () => {
  const utils = jest.requireActual('../../utils');
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

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

import * as utils from '../../utils';
import * as routerDom from 'react-router-dom';

describe('ScalprumRoot', () => {
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
        quickstarts: {
          quickstarts: {},
        },
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

  it('should render PageSidebar with LandingNav component', async () => {
    /**
     * Temporarily override the module mock
     */
    const isBetaSpy = jest.spyOn(utils, 'isBeta');
    isBetaSpy.mockReturnValue(true);
    const getEnvSpy = jest.spyOn(utils, 'getEnv');
    getEnvSpy.mockReturnValue('ci');

    const store = mockStore({
      ...initialState,
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
            <ScalprumRoot config={config} />
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
      globalFilter: { tags: {}, sid: {}, workloads: {} },
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
          <MemoryRouter initialEntries={['/']}>
            <ScalprumRoot globalFilterHidden config={config} />
          </MemoryRouter>
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
        <MemoryRouter initialEntries={['/']}>
          <ScalprumRoot config={config} globalFilterHidden={false} />
        </MemoryRouter>
      </Provider>
    );
    await waitFor(() => expect(container.querySelector('#global-filter')).toBeTruthy());

    useLocationSpy.mockRestore();
  });
});
