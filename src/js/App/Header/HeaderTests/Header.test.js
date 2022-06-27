import React from 'react';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import UnauthedHeader from '../UnAuthtedHeader';

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
      <MemoryRouter>
        <Provider store={store}>
          <UnauthedHeader />
        </Provider>
      </MemoryRouter>
    );
    expect(container.querySelector('div')).toMatchSnapshot();
  });
});
