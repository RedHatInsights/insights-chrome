import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider as JotaiProvider, createStore } from 'jotai';
import NavContext from '../Navigation/navContext';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { moduleRoutesAtom } from '../../state/atoms/chromeModuleAtom';
import { _resetDarkModeStore, getDarkModeStore } from '../../state/stores/darkModeStore';
import LightwellServicesLink from './LightwellServicesLink';

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

  it('should render the Lightwell label', () => {
    renderWithProviders();
    expect(screen.getByText('Lightwell')).toBeInTheDocument();
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

  it('should render the light Lightwell icon by default', () => {
    const { container } = renderWithProviders();
    const icon = container.querySelector('img[src*="lightwell-logomark"]');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', '/apps/frontend-assets/partners-icons/lightwell-logomark-light.svg');
    expect(icon).toHaveAttribute('width', '22');
    expect(icon).toHaveAttribute('height', '22');
  });

  it('should switch Lightwell icon when the dark mode store updates', () => {
    const { container } = renderWithProviders();
    expect(container.querySelector('img')).toHaveAttribute('src', '/apps/frontend-assets/partners-icons/lightwell-logomark-light.svg');

    act(() => {
      getDarkModeStore().updateState('SET_DARK');
    });

    expect(container.querySelector('img')).toHaveAttribute('src', '/apps/frontend-assets/partners-icons/lightwell-logomark-dark.svg');

    act(() => {
      getDarkModeStore().updateState('SET_LIGHT');
    });

    expect(container.querySelector('img')).toHaveAttribute('src', '/apps/frontend-assets/partners-icons/lightwell-logomark-light.svg');
  });

  it('should make the entire content clickable as a single link', () => {
    const { container } = renderWithProviders();
    // Only one link should exist — icon and label are both inside it
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/lightwell');
  });
});
