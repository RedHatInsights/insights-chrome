import React, { PropsWithChildren } from 'react';
import { MemoryRouter, MemoryRouterProps, useLocation } from 'react-router-dom';
import ChromeAuthContext, { ChromeAuthContextValue } from '../auth/ChromeAuthContext';
import { ChromeUser } from '@redhat-cloud-services/types';
import { renderHook, screen } from '@testing-library/react';
import useTrialRedirect from './useTrialRedirect';

const PathnameSpy = () => {
  const { pathname } = useLocation();
  return <h1 aria-label="pathname-spy">{pathname}</h1>;
};

type WrapperProps = PropsWithChildren<{ chromeAuthContext?: ChromeAuthContextValue; initialEntries?: MemoryRouterProps['initialEntries'] }>;

const RouterWrapper = ({ children, initialEntries = ['/'] }: WrapperProps) => {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
      <PathnameSpy />
    </MemoryRouter>
  );
};

const defaultChromeUser: ChromeUser = {
  entitlements: {},
  identity: {},
} as ChromeUser;

const defaultChromeAuthContextValue: ChromeAuthContextValue = {
  user: defaultChromeUser,
} as ChromeAuthContextValue;

const ChromeAuthWrapper = ({ children, chromeAuthContext = defaultChromeAuthContextValue, ...rest }: WrapperProps) => {
  return (
    <ChromeAuthContext.Provider value={chromeAuthContext}>
      <RouterWrapper {...rest}>{children}</RouterWrapper>
    </ChromeAuthContext.Provider>
  );
};

const cases: { entitlements: ChromeUser['entitlements']; expected: string; initialEntries: string[] }[] = [
  {
    entitlements: {
      ansible: {
        is_entitled: false,
        is_trial: false,
      },
    },
    expected: '/ansible/ansible-dashboard/trial',
    initialEntries: ['/ansible/ansible-dashboard/foo/bar'],
  },
  {
    entitlements: {
      ansible: {
        is_entitled: true,
        is_trial: false,
      },
    },
    expected: '/ansible/ansible-dashboard/foo/bar',
    initialEntries: ['/ansible/ansible-dashboard/foo/bar'],
  },
  {
    entitlements: {
      ansible: {
        is_entitled: false,
        is_trial: true,
      },
    },
    expected: '/ansible/ansible-dashboard/foo/bar',
    initialEntries: ['/ansible/ansible-dashboard/foo/bar'],
  },
  {
    entitlements: {
      ansible: {
        is_entitled: false,
        is_trial: false,
      },
    },
    expected: '/ansible/ansible-dashboard/trial/success',
    initialEntries: ['/ansible/ansible-dashboard/trial/success'],
  },
];

describe('useTrialRedirect', () => {
  cases.forEach(({ entitlements, expected, initialEntries }) => {
    test(`should be on ${expected} route based on entitlements`, () => {
      renderHook(() => useTrialRedirect(), {
        wrapper: (props) => (
          <ChromeAuthWrapper
            initialEntries={initialEntries}
            chromeAuthContext={
              {
                user: {
                  ...defaultChromeUser,
                  entitlements,
                },
              } as ChromeAuthContextValue
            }
            {...props}
          />
        ),
      });

      expect(screen.getByLabelText('pathname-spy')).toHaveTextContent(expected);
    });
  });
});
