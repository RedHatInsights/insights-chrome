import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { useFlag } from '@unleash/proxy-client-react';
import GlobalFilterWrapper from './GlobalFilter';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import InternalChromeContext from '../../utils/internalChromeContext';
import { ChromeAPI } from '@redhat-cloud-services/types';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => false),
}));

jest.mock('../../utils/common', () => ({
  ...jest.requireActual('../../utils/common'),
  isGlobalFilterAllowed: jest.fn(() => true),
}));

jest.mock('./GlobalFilterMenu', () => ({
  GlobalFilterDropdown: () => <div data-testid="global-filter-dropdown" />,
}));

jest.mock('./tagsApi', () => ({
  getAllTags: jest.fn(() => Promise.resolve()),
  getAllWorkloads: jest.fn(() => Promise.resolve()),
}));

jest.mock('@redhat-cloud-services/frontend-components/FilterHooks', () => ({
  useTagsFilter: jest.fn(() => ({
    filter: {},
    chips: [],
    selectedTags: {},
    setValue: jest.fn(),
    filterTagsBy: '',
  })),
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

const makeStore = () => {
  const store = createStore();
  // activeModuleAtom defaults to undefined, which makes isGlobalFilterDisabledAtom true
  // and causes the wrapper to return null regardless of any feature flag. Seed a valid
  // module so that path is open and only the flag determines visibility.
  store.set(activeModuleAtom, 'insights-dashboard');
  return store;
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <JotaiProvider store={makeStore()}>
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
    render(<GlobalFilterWrapper />, { wrapper: Wrapper });
    await waitFor(() => expect(mockGetUserPermissions).toHaveBeenCalledWith('inventory'));
  });

  it('should skip getUserPermissions when rbac.workspaces flag is enabled', async () => {
    mockedUseFlag.mockImplementation((flag: string) => flag === 'platform.rbac.workspaces');
    render(<GlobalFilterWrapper />, { wrapper: Wrapper });
    await waitFor(() => expect(mockGetUserPermissions).not.toHaveBeenCalled());
  });

  it('should skip getUserPermissions when hbi.rbac-v2 flag is enabled', async () => {
    mockedUseFlag.mockImplementation((flag: string) => flag === 'hbi.rbac-v2');
    render(<GlobalFilterWrapper />, { wrapper: Wrapper });
    await waitFor(() => expect(mockGetUserPermissions).not.toHaveBeenCalled());
  });

  it('should hide the global filter when platform.chrome.hide.global-filter is enabled', async () => {
    // First establish that the dropdown renders when the flag is off, proving the test
    // setup (auth, active module, allowed URL) is sufficient to show the component.
    const { unmount } = render(<GlobalFilterWrapper />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('global-filter-dropdown')).toBeInTheDocument());
    unmount();

    // Now enable only the hide flag and verify the flag alone causes the dropdown to disappear.
    mockedUseFlag.mockImplementation((flag: string) => flag === 'platform.chrome.hide.global-filter');
    render(<GlobalFilterWrapper />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.queryByTestId('global-filter-dropdown')).not.toBeInTheDocument());
  });
});
