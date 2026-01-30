import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

import UserToggle from '../UserToggle';
import ChromeAuthContext from '../../../auth/ChromeAuthContext';
import { activeModuleAtom } from '../../../state/atoms/activeModuleAtom';
import { moduleRoutesAtom } from '../../../state/atoms/chromeModuleAtom';
import { triggerNavListenersAtom } from '../../../state/atoms/activeAppAtom';

const HydrateAtoms = ({ initialValues, children }) => {
  useHydrateAtoms(initialValues);
  return children;
};

const Wrapper = ({ children, atomValues = [] }) => (
  <MemoryRouter>
    <JotaiProvider>
      <HydrateAtoms initialValues={atomValues}>{children}</HydrateAtoms>
    </JotaiProvider>
  </MemoryRouter>
);

describe('UserToggle', () => {
  const defaultAtomValues = [
    [activeModuleAtom, 'testModule'],
    [moduleRoutesAtom, []],
    [triggerNavListenersAtom, jest.fn()],
  ];

  const mockUser = {
    identity: {
      account_number: '0',
      type: 'User',
      internal: {
        org_id: '123',
      },
      user: {
        username: 'foo',
        first_name: 'foo',
        last_name: 'foo',
        is_org_admin: false,
        is_internal: false,
      },
    },
  };

  const contextValue = {
    user: mockUser,
    logout: jest.fn(),
  };

  test('should render user toggle', () => {
    const { container } = render(
      <Wrapper atomValues={defaultAtomValues}>
        <ChromeAuthContext.Provider value={contextValue}>
          <UserToggle />
        </ChromeAuthContext.Provider>
      </Wrapper>
    );
    expect(container).toMatchSnapshot();
  });

  test('should render user toggle for small screens', () => {
    const { container } = render(
      <Wrapper atomValues={defaultAtomValues}>
        <ChromeAuthContext.Provider value={contextValue}>
          <UserToggle isSmall />
        </ChromeAuthContext.Provider>
      </Wrapper>
    );
    expect(container).toMatchSnapshot();
  });
});
