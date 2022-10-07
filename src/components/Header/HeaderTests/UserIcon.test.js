import React from 'react';
import ConnectedUserIcon, { UserIcon } from '../UserIcon';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';

describe('Connected User Icon', () => {
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
        <ConnectedUserIcon />
      </Provider>
    );
    expect(container.querySelector('img')).toMatchSnapshot();
  });
});

describe('User Icon', () => {
  it('should render correctly with initial state', () => {
    const account = {
      username: 'test',
    };
    const mockGetImage = jest.fn();
    const { container } = render(<UserIcon account={account} getImage={mockGetImage} />);
    expect(container.querySelector('img')).toMatchSnapshot();
  });
});
