import React from 'react';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { Header } from '../Header';
import UnauthedHeader from '../UnAuthtedHeader';

describe('Header', () => {
  let initialState;
  let mockStore;

  beforeEach(() => {
    mockStore = configureStore();
    initialState = {
      chrome: {
        activeTechnology: 'someTechnology',
        activeLocation: 'someLocation',
        user: {},
        navigation: {}
      },
    };
  });
  it('should render correctly', () => {
    const store = mockStore(initialState);
    const { container } = render(
      <Provider store={store}>
        <Header />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
});

describe('unauthed', () => {
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
        <UnauthedHeader />
      </Provider>
    );
    expect(container.querySelector('div')).toMatchSnapshot();
  });
});
