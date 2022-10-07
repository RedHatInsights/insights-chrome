/* eslint-disable camelcase */
import React from 'react';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import UserToggle from '../UserToggle';
import { Provider } from 'react-redux';

jest.mock('../UserIcon', () => () => '<UserIcon />');

describe('UserToggle', () => {
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
  it('should render correctly with isSmall false', () => {
    const store = mockStore(initialState);
    const { container } = render(
      <Provider store={store}>
        <UserToggle />
      </Provider>
    );
    container.querySelector(`[data-ouia-component-id='chrome-user-menu']`).click();
    expect(container).toMatchSnapshot();
  });

  it('should render correctly with isSmall true', () => {
    const store = mockStore(initialState);
    const { container } = render(
      <Provider store={store}>
        <UserToggle isSmall />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should render correctly as org admin', () => {
    const store = mockStore({
      ...initialState,
      chrome: {
        ...initialState.chrome,
        user: {
          ...initialState.chrome.user,
          identity: {
            ...initialState.chrome.user.identity,
            user: {
              ...initialState.chrome.user.identity.user,
              is_org_admin: true,
            },
          },
        },
      },
    });
    const { container } = render(
      <Provider store={store}>
        <UserToggle />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
