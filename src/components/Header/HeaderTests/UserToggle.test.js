import React from 'react';
import { render, screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import UserToggle from '../UserToggle';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import ChromeAuthContext from '../../../auth/ChromeAuthContext';

jest.mock('../UserIcon', () => () => '<UserIcon />');

jest.mock('@unleash/proxy-client-react', () => {
  const actual = jest.requireActual('@unleash/proxy-client-react');
  return {
    __esModule: true,
    ...actual,

    useFlag: () => false,
    useFlagsStatus: () => ({ flagsReady: true }),
  };
});

describe('UserToggle', () => {
  const contextValueMock = {
    user: {
      identity: {
        account_number: 'some accountNumber',
        user: {
          username: 'someUsername',
          first_name: 'someFirstName',
          last_name: 'someLastName',
        },
      },
    },
  };
  it('should render correctly with isSmall false', async () => {
    const { container } = render(
      <MemoryRouter>
        <Provider store={configureStore()({ chrome: {} })}>
          <ChromeAuthContext.Provider value={contextValueMock}>
            <UserToggle />
          </ChromeAuthContext.Provider>
        </Provider>
      </MemoryRouter>
    );
    await act(async () => {
      await screen.getByText('someFirstName someLastName').click();
    });
    expect(container).toMatchSnapshot();
  });

  it('should render correctly with isSmall true', () => {
    const { container } = render(
      <ChromeAuthContext.Provider value={contextValueMock}>
        <UserToggle isSmall />
      </ChromeAuthContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should render correctly as org admin', () => {
    const { container } = render(
      <ChromeAuthContext.Provider
        value={{
          user: {
            ...contextValueMock.user,
            is_org_admin: true,
          },
        }}
      >
        <UserToggle />
      </ChromeAuthContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
