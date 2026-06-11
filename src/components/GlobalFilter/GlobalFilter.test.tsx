import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider as JotaiProvider } from 'jotai';
import { useFlag } from '@unleash/proxy-client-react';
import GlobalFilterWrapper from './GlobalFilter';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import InternalChromeContext from '../../utils/internalChromeContext';
import { ChromeAPI } from '@redhat-cloud-services/types';

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => false),
}));

jest.mock('../../utils/common', () => ({
  ...jest.requireActual('../../utils/common'),
  isGlobalFilterAllowed: jest.fn(() => true),
}));

const mockedUseFlag = useFlag as jest.Mock;

const mockGetUserPermissions = jest.fn(() => Promise.resolve([{ permission: 'inventory:hosts:read' }]));

const mockChromeAuth = {
  ready: true,
  user: {
    identity: {
      user: { username: 'test', is_org_admin: false, is_internal: false },
      org_id: '123',
      account_number: '456',
    },
  },
} as unknown as typeof ChromeAuthContext extends React.Context<infer T> ? T : never;

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <JotaiProvider>
    <ChromeAuthContext.Provider value={mockChromeAuth}>
      <InternalChromeContext.Provider value={{ getUserPermissions: mockGetUserPermissions } as unknown as ChromeAPI}>
        <MemoryRouter initialEntries={['/insights/dashboard']}>{children}</MemoryRouter>
      </InternalChromeContext.Provider>
    </ChromeAuthContext.Provider>
  </JotaiProvider>
);

describe('GlobalFilterWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseFlag.mockReturnValue(false);
  });

  it('should call getUserPermissions when rbac.workspaces flag is disabled', async () => {
    mockedUseFlag.mockReturnValue(false);
    render(<GlobalFilterWrapper />, { wrapper: Wrapper });
    await waitFor(() => expect(mockGetUserPermissions).toHaveBeenCalledWith('inventory'));
  });

  it('should skip getUserPermissions when rbac.workspaces flag is enabled', async () => {
    mockedUseFlag.mockReturnValue(true);
    render(<GlobalFilterWrapper />, { wrapper: Wrapper });
    await waitFor(() => expect(mockGetUserPermissions).not.toHaveBeenCalled());
  });
});
