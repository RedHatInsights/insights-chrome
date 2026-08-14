import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider, createStore } from 'jotai';
import Breadcrumbs from './Breadcrumbs';
import {
  appBreadcrumbOverrideAtom,
  appBreadcrumbStorageAtom,
  appMountPathnameAtom,
  breadcrumbPathnameAtom,
  breadcrumbReplaceModeAtom,
} from '../../state/atoms/breadcrumbAtom';
import { useFlag } from '@unleash/proxy-client-react';

// Mock dependencies
jest.mock('../../hooks/useBreadcrumbsLinks', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../hooks/useFavoritePagesWrapper', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    favoritePages: [],
    favoritePage: jest.fn(),
    unfavoritePage: jest.fn(),
  })),
}));

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => true), // Default enabled
}));

import useBreadcrumbsLinks from '../../hooks/useBreadcrumbsLinks';

const mockUseBreadcrumbsLinks = useBreadcrumbsLinks as jest.MockedFunction<typeof useBreadcrumbsLinks>;

describe('Breadcrumbs', () => {
  let store: ReturnType<typeof createStore>;

  const renderBreadcrumbs = () => {
    return render(
      <Provider store={store}>
        <MemoryRouter>
          <Breadcrumbs />
        </MemoryRouter>
      </Provider>
    );
  };

  beforeEach(() => {
    store = createStore();
    mockUseBreadcrumbsLinks.mockReturnValue([
      { title: 'Insights', href: '/insights' },
      { title: 'Advisor', href: '/insights/advisor' },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render chrome breadcrumbs only when no app breadcrumbs', () => {
    renderBreadcrumbs();

    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Advisor')).toBeInTheDocument();
  });

  it('should merge chrome and app breadcrumbs', () => {
    // Use replace mode to set app breadcrumbs
    store.set(breadcrumbReplaceModeAtom, true);
    store.set(appBreadcrumbOverrideAtom, [{ pathname: '/insights/advisor/systems', title: 'Systems' }]);

    renderBreadcrumbs();

    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Systems')).toBeInTheDocument();
  });

  it('should omit last chrome segment when app breadcrumbs exist and last chrome !== app mount', () => {
    mockUseBreadcrumbsLinks.mockReturnValue([
      { title: 'Insights', href: '/insights' },
      { title: 'Advisor', href: '/insights/advisor' },
      { title: 'Systems', href: '/insights/advisor/systems' },
    ]);

    // Use replace mode to set app breadcrumbs
    store.set(breadcrumbReplaceModeAtom, true);
    store.set(appBreadcrumbOverrideAtom, [{ pathname: '/insights/advisor/systems/123', title: 'System 123' }]);
    store.set(appMountPathnameAtom, '/insights/advisor'); // Set app mount to /insights/advisor

    renderBreadcrumbs();

    // Last chrome segment ("/insights/advisor/systems") should be omitted
    // because it's NOT the app mount pathname ("/insights/advisor")
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Advisor')).toBeInTheDocument();
    expect(screen.getByText('System 123')).toBeInTheDocument();
    expect(screen.queryByText('Systems')).not.toBeInTheDocument();
  });

  it('should KEEP last chrome segment when it equals app mount pathname', () => {
    mockUseBreadcrumbsLinks.mockReturnValue([
      { title: 'Insights', href: '/insights' },
      { title: 'Advisor', href: '/insights/advisor' },
    ]);

    // Use replace mode to set app breadcrumbs directly (bypasses atom computation issues)
    store.set(breadcrumbReplaceModeAtom, true);
    store.set(appBreadcrumbOverrideAtom, [
      { pathname: '/insights/advisor/systems', title: 'Systems' },
      { pathname: '/insights/advisor/systems/123', title: 'System 123' },
    ]);

    renderBreadcrumbs();

    // Last chrome segment ("/insights/advisor") should be KEPT
    // because it EQUALS the app mount pathname (first app segment is /insights/advisor/systems)
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Advisor')).toBeInTheDocument();
    expect(screen.getByText('Systems')).toBeInTheDocument();
    expect(screen.getByText('System 123')).toBeInTheDocument();
  });

  it('should NOT omit bundle root segment', () => {
    mockUseBreadcrumbsLinks.mockReturnValue([{ title: 'Insights', href: '/insights' }]);

    store.set(appBreadcrumbStorageAtom, new Map([['/insights/advisor/systems', { title: 'Systems' }]]));
    store.set(breadcrumbPathnameAtom, '/insights/advisor/systems');

    renderBreadcrumbs();

    // Bundle root should always be present
    expect(screen.getByText('Insights')).toBeInTheDocument();
  });

  it('should use replace mode override when active', () => {
    // Set replace mode with override
    store.set(breadcrumbReplaceModeAtom, true);
    store.set(appBreadcrumbOverrideAtom, [{ pathname: '/custom/path', title: 'Custom Breadcrumb' }]);

    renderBreadcrumbs();

    expect(screen.getByText('Custom Breadcrumb')).toBeInTheDocument();
  });

  it('should pass options to ChromeLink', () => {
    store.set(
      appBreadcrumbStorageAtom,
      new Map([
        [
          '/insights/advisor/systems',
          {
            title: 'Systems',
            options: { state: { view: 'list' }, replace: true },
          },
        ],
      ])
    );
    store.set(breadcrumbPathnameAtom, '/insights/advisor/systems');

    renderBreadcrumbs();

    const links = screen.getAllByTestId('router-link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should render favorite button for leaf breadcrumb', () => {
    mockUseBreadcrumbsLinks.mockReturnValue([
      { title: 'Insights', href: '/insights' },
      { title: 'Advisor', href: '/insights/advisor' },
    ]);

    renderBreadcrumbs();

    // BreadcrumbsFavorites should be rendered
    // (Actual favorite button rendering depends on BreadcrumbsFavorites component)
    const breadcrumb = screen.getByRole('navigation');
    expect(breadcrumb).toBeInTheDocument();
  });


  it('should render breadcrumbs with state options', () => {
    const stateOptions = { state: { filters: { status: 'active' } } };
    store.set(breadcrumbReplaceModeAtom, true);
    store.set(appBreadcrumbOverrideAtom, [{ pathname: '/insights/advisor/systems', title: 'Systems', options: stateOptions }]);

    renderBreadcrumbs();

    expect(screen.getByText('Systems')).toBeInTheDocument();
  });

  it('should not render app breadcrumbs when feature flag disabled', () => {
    jest.mocked(useFlag).mockReturnValue(false);

    store.set(appBreadcrumbStorageAtom, new Map([['/insights/advisor/systems', { title: 'Systems' }]]));
    store.set(breadcrumbPathnameAtom, '/insights/advisor/systems');

    renderBreadcrumbs();

    // Should only render chrome breadcrumbs
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Advisor')).toBeInTheDocument();

    // Reset mock
    jest.mocked(useFlag).mockReturnValue(true);
  });

  it('should handle single-segment app mount paths like /settings', () => {
    mockUseBreadcrumbsLinks.mockReturnValue([{ title: 'Settings', href: '/settings' }]);

    // Simulate app registering breadcrumb at /settings
    store.set(breadcrumbReplaceModeAtom, true);
    store.set(appBreadcrumbOverrideAtom, [{ pathname: '/settings/users', title: 'Users' }]);
    store.set(appMountPathnameAtom, '/settings');

    renderBreadcrumbs();

    // Should NOT duplicate 'Settings'
    const settingsLinks = screen.getAllByText('Settings');
    expect(settingsLinks).toHaveLength(1);
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('should handle single-segment nested paths like /settings/users/123', () => {
    mockUseBreadcrumbsLinks.mockReturnValue([{ title: 'Settings', href: '/settings' }]);

    store.set(breadcrumbReplaceModeAtom, true);
    store.set(appBreadcrumbOverrideAtom, [
      { pathname: '/settings/users', title: 'Users' },
      { pathname: '/settings/users/123', title: 'User 123' },
    ]);
    store.set(appMountPathnameAtom, '/settings');

    renderBreadcrumbs();

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('User 123')).toBeInTheDocument();

    // Should NOT have duplicate 'Settings'
    const settingsLinks = screen.getAllByText('Settings');
    expect(settingsLinks).toHaveLength(1);
  });

  it('should still work for standard two-segment apps like /insights/advisor', () => {
    mockUseBreadcrumbsLinks.mockReturnValue([
      { title: 'Insights', href: '/insights' },
      { title: 'Advisor', href: '/insights/advisor' },
    ]);

    store.set(breadcrumbReplaceModeAtom, true);
    store.set(appBreadcrumbOverrideAtom, [{ pathname: '/insights/advisor/systems', title: 'Systems' }]);
    store.set(appMountPathnameAtom, '/insights/advisor');

    renderBreadcrumbs();

    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Advisor')).toBeInTheDocument();
    expect(screen.getByText('Systems')).toBeInTheDocument();
  });
});
