import React from 'react';
import ConnectedSideNav from './SideNav';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';

describe('ConnectedSideNav', () => {
  let initialState;
  let mockStore;

  beforeEach(() => {
    mockStore = configureStore();
    initialState = {
      chrome: {
        activeTechnology: 'someTechnology',
        activeLocation: 'someLocation',
      },
    };
  });
  it('should render correctly', () => {
    const store = mockStore(initialState);
    const { container } = render(
      <Provider store={store}>
        <ConnectedSideNav />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
  it('should render correctly part 2', () => {
    const store = mockStore(initialState);
    const { container } = render(
      <Provider store={store}>
        <ConnectedSideNav />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
