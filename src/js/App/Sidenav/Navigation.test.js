import React from 'react';
import ConnectedNavigation, { Navigation } from './Navigation';
import { render, act } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

let settingsData = [
  { id: 'overview', title: 'Overview', group: 'insights', active: true, subItems: [{ id: 'someID', title: 'Clusters', default: true }] },
  { id: 'rules', title: 'Rules', group: 'insights', active: false },
  { id: 'topics', title: 'Topics', group: 'insights', active: false },
  { title: 'Inventory', id: 'inventory', active: false },
  { title: 'Remediations', id: 'remediations', active: false },
];

jest.mock('./ExpandableNav', () => () => '<ExpandableNav />');

jest.mock('react-router-dom', () => ({
  useHistory: () => ({
    listen: jest.fn(() => () => {}),
    push: jest.fn(),
  }),
}));

jest.mock('@patternfly/react-core/dist/js/helpers/util', () => ({
  isElementInView: jest.fn(),
}));

describe('Navigation', () => {
  const initialProps = {
    settings: settingsData,
    activeApp: 'someApp',
    activeLocation: 'openshift',
    documentation: 'someDocs',
    onNavigate: jest.fn(),
  };
  let initialState;
  let mockStore;
  let globalNavData = require('../../../../testdata/globalNav.json');

  beforeEach(() => {
    mockStore = configureStore();
    initialState = {
      chrome: {
        globalNav: [globalNavData],
        activeApp: 'someApp',
        navHidden: false,
        activeLocation: 'someLocation',
        activeGroup: 'someGroup',
        appId: 'someId',
      },
    };
    const pathname = '/';
    Object.defineProperty(window, 'location', {
      value: {
        pathname: pathname,
      },
      writable: true,
    });
  });
  it('should render corectly', () => {
    let props = {
      ...initialProps,
      appId: 'overview',
      activeGroup: 'someID',
    };
    const mockSelect = jest.fn();
    const mockClick = jest.fn();
    const store = mockStore(initialState);
    const { container } = render(
      <Provider store={store}>
        <Navigation onSelect={mockSelect} onClick={mockClick} store={store} {...props} />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
  it('should render correctly 2', () => {
    let props = {
      ...initialProps,
      appId: 'overview',
      activeGroup: 'insights',
    };
    const mockSelect = jest.fn();
    const mockClick = jest.fn();
    const mockNavigate = jest.fn();
    const mockClear = jest.fn();
    const store = mockStore(initialState);
    const { container } = render(
      <Provider store={store}>
        <Navigation onSelect={mockSelect} onClick={mockClick} onNavigate={mockNavigate} onClearActive={mockClear} {...props} />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
});

describe('ConnectedNavigation', () => {
  let initialState;
  let mockStore;
  let globalNavData = require('../../../../testdata/globalNav.json');

  beforeEach(() => {
    mockStore = configureStore();
    initialState = {
      chrome: {
        globalNav: [globalNavData],
        activeApp: 'someApp',
        navHidden: false,
        activeLocation: 'someLocation',
        activeGroup: 'someGroup',
        appId: 'someId',
      },
    };
  });

  it('should render correctly with initial state', () => {
    const store = mockStore(initialState);
    const { container } = render(
      <Provider store={store}>
        <ConnectedNavigation />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
  it('mapDispatchToProps function fires', async () => {
    const store = mockStore(initialState);
    let container;
    await act(async () => {
      container = render(
        <Provider store={store}>
          <ConnectedNavigation />
        </Provider>
      ).container;
    });
    expect(container).toMatchSnapshot();
  });
});
