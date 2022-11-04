import React from 'react';
import UserIcon from '../UserIcon';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';

describe('<UserIcon />', () => {
  let initialState;
  let mockStore;
  beforeEach(() => {
    mockStore = configureStore();
    initialState = {
      chrome: {
        user: {
          identity: {
            user: {
              username: 'test-user',
            },
          },
        },
      },
    };
  });

  it('should render correctly with initial state', () => {
    const store = mockStore(initialState);
    const { container } = render(
      <Provider store={store}>
        <UserIcon />
      </Provider>
    );
    expect(container.querySelector('img')).toMatchSnapshot();
  });
});
