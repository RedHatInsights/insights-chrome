/* eslint-disable camelcase */
import React from 'react';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import ConnectedUserToggle, { UserToggle } from '../UserToggle';
import { Provider } from 'react-redux';

jest.mock('../UserIcon', () => () => '<UserIcon />');

describe('UserToggle', () => {
  it('should render correctly with isSmall false', () => {
    const props = {
      isOpen: false,
      account: {
        number: 'someNumber',
        name: 'someName',
      },
      isSmall: false,
      extraItems: [],
    };
    const mockSelect = jest.fn();
    const { container } = render(<UserToggle {...props} onSelect={mockSelect} />);
    container.querySelector(`[data-ouia-component-id='chrome-user-menu']`).click();
    expect(container).toMatchSnapshot();
  });
  it('should render correctly with isSmall true', () => {
    const props = {
      isOpen: false,
      account: {
        number: 'someNumber',
        name: 'someName',
      },
      isSmall: true,
      extraItems: [],
    };
    const mockSelect = jest.fn();
    const { container } = render(<UserToggle {...props} onSelect={mockSelect} />);
    expect(container).toMatchSnapshot();
  });
});

describe('ConnectedUserToggle -- not org admin', () => {
  let initialState;
  let mockStore;

  beforeEach(() => {
    mockStore = configureStore();
    initialState = {
      chrome: {
        user: {
          identity: {
            account_number: 'some accountNumber',
            user: {
              username: 'someUsername',
              first_name: 'someFirstName',
              last_name: 'someLastName',
              is_org_admin: false,
            },
          },
        },
      },
    };
  });

  it('should render correctly', () => {
    const store = mockStore(initialState);
    const { container } = render(
      <Provider store={store}>
        <ConnectedUserToggle />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
});

describe('ConnectedUserToggle -- org admin', () => {
  let initialState;
  let mockStore;

  beforeEach(() => {
    mockStore = configureStore();
    initialState = {
      chrome: {
        user: {
          identity: {
            account_number: 'some accountNumber',
            user: {
              username: 'someUsername',
              first_name: 'someFirstName',
              last_name: 'someLastName',
              is_org_admin: true,
            },
          },
        },
      },
    };
  });

  it('should render correctly', () => {
    const store = mockStore(initialState);
    const { container } = render(
      <Provider store={store}>
        <ConnectedUserToggle />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
