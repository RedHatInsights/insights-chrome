import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider, createStore } from 'jotai';
import Breadcrumbs from './Breadcrumbs';
import { _resetBreadcrumbStore, getBreadcrumbStore } from '../../state/stores/breadcrumbStore';
import { useFlag } from '@unleash/proxy-client-react';
import { layoutLightwellShellAtom } from '../../state/atoms/releaseAtom';

// Controllable store ref — the outer Breadcrumbs consumes the store through the
// bridge (self-consumed MF remote). We mock the bridge and return the REAL store
// singleton so we can seed it via updateState, or undefined to exercise the
// chrome-only fallback path.
const mockUseBreadcrumbStoreRef = jest.fn();
jest.mock('../../chrome/breadcrumbStoreBridge', () => ({
  useBreadcrumbStoreRef: () => mockUseBreadcrumbStoreRef(),
}));

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

// Seed helpers hitting the real store singleton.
const seedReplace = (override: { pathname: string; title: string; options?: any }[]) => {
  getBreadcrumbStore().updateState('SET_REPLACE_MODE', true);
  getBreadcrumbStore().updateState('SET_OVERRIDE', override);
};
const seedIncremental = (entries: [string, { title: string; options?: any }][]) => {
  entries.forEach(([pathname, entry]) => getBreadcrumbStore().updateState('SET_BREADCRUMB', { pathname, entry }));
};
const seedAppMount = (mount: string) => getBreadcrumbStore().updateState('SET_APP_MOUNT_PATHNAME', mount);

describe('Breadcrumbs', () => {
  const renderBreadcrumbs = (initialEntries: string[] = ['/']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Breadcrumbs />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    _resetBreadcrumbStore();
    mockUseBreadcrumbStoreRef.mockReturnValue(getBreadcrumbStore());
    jest.mocked(useFlag).mockReturnValue(true);
    mockUseBreadcrumbsLinks.mockReturnValue([
      { title: 'Insights', href: '/insights' },
      { title: 'Advisor', href: '/insights/advisor' },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- Chrome-native parity (primary long-lived flows) -----------------------

  it('should render chrome breadcrumbs only when the store has not resolved (fallback path)', () => {
    mockUseBreadcrumbStoreRef.mockReturnValue(undefined);

    renderBreadcrumbs();

    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Advisor')).toBeInTheDocument();
  });

  it('should render chrome breadcrumbs identically when flag on but app provides nothing (primary flow)', () => {
    // store loaded, flag on, no app breadcrumbs registered
    renderBreadcrumbs();

    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Advisor')).toBeInTheDocument();
    // No app segments — leaf is still the last chrome segment
    expect(screen.queryByText('Systems')).not.toBeInTheDocument();
  });

  it('should render chrome breadcrumbs only when feature flag disabled', () => {
    jest.mocked(useFlag).mockReturnValue(false);

    seedIncremental([['/insights/advisor/systems', { title: 'Systems' }]]);

    renderBreadcrumbs(['/insights/advisor/systems']);

    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Advisor')).toBeInTheDocument();
    // App segment must not appear while the flag is off
    expect(screen.queryByText('Systems')).not.toBeInTheDocument();
  });

  // --- Merge behavior --------------------------------------------------------

  it('should merge chrome and app breadcrumbs', () => {
    seedReplace([{ pathname: '/insights/advisor/systems', title: 'Systems' }]);

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

    seedReplace([{ pathname: '/insights/advisor/systems/123', title: 'System 123' }]);
    seedAppMount('/insights/advisor');

    renderBreadcrumbs();

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

    seedReplace([
      { pathname: '/insights/advisor/systems', title: 'Systems' },
      { pathname: '/insights/advisor/systems/123', title: 'System 123' },
    ]);

    renderBreadcrumbs();

    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Advisor')).toBeInTheDocument();
    expect(screen.getByText('Systems')).toBeInTheDocument();
    expect(screen.getByText('System 123')).toBeInTheDocument();
  });

  it('should NOT omit bundle root segment', () => {
    mockUseBreadcrumbsLinks.mockReturnValue([{ title: 'Insights', href: '/insights' }]);

    seedIncremental([['/insights/advisor/systems', { title: 'Systems' }]]);

    renderBreadcrumbs(['/insights/advisor/systems']);

    expect(screen.getByText('Insights')).toBeInTheDocument();
  });

  it('should use replace mode override when active', () => {
    seedReplace([{ pathname: '/custom/path', title: 'Custom Breadcrumb' }]);

    renderBreadcrumbs();

    expect(screen.getByText('Custom Breadcrumb')).toBeInTheDocument();
  });

  it('should pass options to ChromeLink', () => {
    seedIncremental([['/insights/advisor/systems', { title: 'Systems', options: { state: { view: 'list' }, replace: true } }]]);

    renderBreadcrumbs(['/insights/advisor/systems']);

    const links = screen.getAllByTestId('router-link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should render favorite toggle for leaf breadcrumb', () => {
    mockUseBreadcrumbsLinks.mockReturnValue([
      { title: 'Insights', href: '/insights' },
      { title: 'Advisor', href: '/insights/advisor' },
    ]);

    renderBreadcrumbs();

    expect(screen.getByRole('button', { name: 'Toggle' })).toBeInTheDocument();
  });

  it('should hide favorite toggle when layoutLightwellShellAtom is true', () => {
    mockUseBreadcrumbsLinks.mockReturnValue([{ title: 'Lightwell', href: '/lightwell' }]);

    const store = createStore();
    store.set(layoutLightwellShellAtom, true);

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/lightwell']}>
          <Breadcrumbs />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.queryByRole('button', { name: 'Toggle' })).not.toBeInTheDocument();
    expect(screen.getByText('Lightwell')).toBeInTheDocument();
  });

  it('should render breadcrumbs with state options', () => {
    const stateOptions = { state: { filters: { status: 'active' } } };
    seedReplace([{ pathname: '/insights/advisor/systems', title: 'Systems', options: stateOptions }]);

    renderBreadcrumbs();

    expect(screen.getByText('Systems')).toBeInTheDocument();
  });

  it('should handle single-segment app mount paths like /settings', () => {
    mockUseBreadcrumbsLinks.mockReturnValue([{ title: 'Settings', href: '/settings' }]);

    seedReplace([{ pathname: '/settings/users', title: 'Users' }]);
    seedAppMount('/settings');

    renderBreadcrumbs();

    const settingsLinks = screen.getAllByText('Settings');
    expect(settingsLinks).toHaveLength(1);
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('should handle single-segment nested paths like /settings/users/123', () => {
    mockUseBreadcrumbsLinks.mockReturnValue([{ title: 'Settings', href: '/settings' }]);

    seedReplace([
      { pathname: '/settings/users', title: 'Users' },
      { pathname: '/settings/users/123', title: 'User 123' },
    ]);
    seedAppMount('/settings');

    renderBreadcrumbs();

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('User 123')).toBeInTheDocument();

    const settingsLinks = screen.getAllByText('Settings');
    expect(settingsLinks).toHaveLength(1);
  });

  it('should still work for standard two-segment apps like /insights/advisor', () => {
    mockUseBreadcrumbsLinks.mockReturnValue([
      { title: 'Insights', href: '/insights' },
      { title: 'Advisor', href: '/insights/advisor' },
    ]);

    seedReplace([{ pathname: '/insights/advisor/systems', title: 'Systems' }]);
    seedAppMount('/insights/advisor');

    renderBreadcrumbs();

    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Advisor')).toBeInTheDocument();
    expect(screen.getByText('Systems')).toBeInTheDocument();
  });

  it("should keep last Chrome segment when app's first breadcrumb doesn't match/extend it (gap prevention)", () => {
    mockUseBreadcrumbsLinks.mockReturnValue([
      { title: 'Insights', href: '/insights' },
      { title: 'Advisor', href: '/insights/advisor' },
      { title: 'Systems', href: '/insights/advisor/systems' },
    ]);

    seedReplace([{ pathname: '/insights/advisor/systems/123/details', title: 'Details' }]);
    seedAppMount('/insights/advisor');

    renderBreadcrumbs();

    // All Chrome segments should be kept (no gap): Insights > Advisor > Systems > Details
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Advisor')).toBeInTheDocument();
    expect(screen.getByText('Systems')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it("should drop last Chrome segment when app's first breadcrumb matches it (existing behavior preserved)", () => {
    mockUseBreadcrumbsLinks.mockReturnValue([
      { title: 'Insights', href: '/insights' },
      { title: 'Advisor', href: '/insights/advisor' },
      { title: 'Systems', href: '/insights/advisor/systems' },
    ]);

    seedReplace([{ pathname: '/insights/advisor/systems', title: 'All Systems' }]);
    seedAppMount('/insights/advisor');

    renderBreadcrumbs();

    // Last Chrome segment dropped and replaced: Insights > Advisor > All Systems
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Advisor')).toBeInTheDocument();
    expect(screen.getByText('All Systems')).toBeInTheDocument();
    expect(screen.queryByText('Systems')).not.toBeInTheDocument();
  });

  it("should drop last Chrome segment when app's first breadcrumb extends it (existing behavior preserved)", () => {
    mockUseBreadcrumbsLinks.mockReturnValue([
      { title: 'Insights', href: '/insights' },
      { title: 'Advisor', href: '/insights/advisor' },
      { title: 'Systems', href: '/insights/advisor/systems' },
    ]);

    seedReplace([{ pathname: '/insights/advisor/systems/123', title: 'System 123' }]);
    seedAppMount('/insights/advisor');

    renderBreadcrumbs();

    // Last Chrome segment dropped: Insights > Advisor > System 123
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Advisor')).toBeInTheDocument();
    expect(screen.getByText('System 123')).toBeInTheDocument();
    expect(screen.queryByText('Systems')).not.toBeInTheDocument();
  });

  it('should warn about duplicate hrefs with conflicting titles in dev mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    jest.spyOn(console, 'warn').mockImplementation(() => {});

    mockUseBreadcrumbsLinks.mockReturnValue([
      { title: 'Insights', href: '/insights' },
      { title: 'Systems', href: '/insights/advisor/systems' },
    ]);

    seedReplace([{ pathname: '/insights/advisor/systems', title: 'All Systems' }]);

    renderBreadcrumbs();

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[Breadcrumbs] Duplicate breadcrumb href "/insights/advisor/systems"'));

    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });
});
