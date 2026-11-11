import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider as JotaiProvider, createStore } from 'jotai';
import NavContext from '../Navigation/navContext';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { moduleRoutesAtom } from '../../state/atoms/chromeModuleAtom';
import { _resetDarkModeStore, getDarkModeStore } from '../../state/stores/darkModeStore';
import LightwellServicesLink from './LightwellServicesLink';

// Mock the logo asset module (rather than the raw `.svg` imports it wraps)
// with distinct values per theme so tests can assert the correct asset is
// selected. Every `.svg` import is routed to the same stub by the
// `moduleNameMapper` regex in jest.config.js, so mocking the raw paths
// directly would collide; `../Header/logoAssets` is a plain module and mocks
// cleanly.
jest.mock('../Header/logoAssets', () => ({
  lightwellLogoLight: 'lightwell-logo-light.svg',
  lightwellLogoDark: 'lightwell-logo-dark.svg',
}));

// Mock the bridge to delegate to the real globalThis-anchored store.
jest.mock('../../chrome/darkModeStoreBridge', () => {
  const { getDarkModeStore: getStore } = jest.requireActual('../../state/stores/darkModeStore');
  const { useGetState } = jest.requireActual('@scalprum/react-core');
  return {
    useDarkModeIsDark: () => useGetState(getStore()).isDark,
  };
});

const renderWithProviders = () => {
  const store = createStore();
  store.set(activeModuleAtom, 'testModule');
  store.set(moduleRoutesAtom, []);

  return render(
    <MemoryRouter>
      <JotaiProvider store={store}>
        <NavContext.Provider
          value={{
            onLinkClick: jest.fn(),
            componentMapper: {
              group: () => null,
              expandable: () => null,
              item: () => null,
              dynamicNav: () => null,
            },
          }}
        >
          <LightwellServicesLink />
        </NavContext.Provider>
      </JotaiProvider>
    </MemoryRouter>
  );
};

describe('LightwellServicesLink', () => {
  beforeEach(() => {
    _resetDarkModeStore();
  });

  it('should render the Lightwell logo', () => {
    renderWithProviders();
    expect(screen.getByAltText('Lightwell')).toBeInTheDocument();
  });

  it('should render a link to /lightwell', () => {
    renderWithProviders();
    const link = screen.getByRole('link', { name: /lightwell/i });
    expect(link).toHaveAttribute('href', '/lightwell');
  });

  it('should set the OUIA component ID', () => {
    renderWithProviders();
    const link = screen.getByRole('link', { name: /lightwell/i });
    expect(link).toHaveAttribute('data-ouia-component-id', 'AllServices-Dropdown-Lightwell');
  });

  it('should render the Lightwell logo at 22px height', () => {
    renderWithProviders();
    const icon = screen.getByRole('img', { name: 'Lightwell' });
    expect(icon).toHaveAttribute('height', '22');
  });

  it('should keep rendering the Lightwell logo when the dark mode store updates', () => {
    renderWithProviders();
    expect(screen.getByRole('img', { name: 'Lightwell' })).toHaveAttribute('src', 'lightwell-logo-light.svg');

    act(() => {
      getDarkModeStore().updateState('SET_DARK');
    });

    expect(screen.getByRole('img', { name: 'Lightwell' })).toHaveAttribute('src', 'lightwell-logo-dark.svg');

    act(() => {
      getDarkModeStore().updateState('SET_LIGHT');
    });

    expect(screen.getByRole('img', { name: 'Lightwell' })).toHaveAttribute('src', 'lightwell-logo-light.svg');
  });

  it('should make the entire content clickable as a single link', () => {
    const { container } = renderWithProviders();
    // Only one link should exist — icon and label are both inside it
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/lightwell');
  });
});
