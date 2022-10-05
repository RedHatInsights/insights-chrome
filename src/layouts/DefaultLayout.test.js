import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import DefaultLayout from './DefaultLayout';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

describe('DefaultLayout', () => {
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
        <MemoryRouter>
          <DefaultLayout config={config} />
        </MemoryRouter>
      </Provider>
    );
    expect(container.querySelector('#chrome-app-render-root')).toMatchSnapshot();
  });

  it('should render correctly', () => {
    const store = mockStore(initialState);
    const { container } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/some-location/app-id']}>
          <DefaultLayout config={config} />
        </MemoryRouter>
      </Provider>
    );
    expect(container.querySelector('#chrome-app-render-root')).toMatchSnapshot();
  });

  it('should render correctly with pageAction', () => {
    const store = mockStore({
      chrome: {
        ...initialState.chrome,
        pageAction: 'some-action',
      },
      globalFilter: {},
    });
    const { container } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/some-location/app-id']}>
          <DefaultLayout config={config} />
        </MemoryRouter>
      </Provider>
    );
    expect(container.querySelector('#chrome-app-render-root')).toMatchSnapshot();
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
          <DefaultLayout config={config} />
        </MemoryRouter>
      </Provider>
    );
    expect(container.querySelector('#chrome-app-render-root')).toMatchSnapshot();
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
          <DefaultLayout config={config} />
        </MemoryRouter>
      </Provider>
    );
    expect(container.querySelector('#chrome-app-render-root')).toMatchSnapshot();
  });
});
