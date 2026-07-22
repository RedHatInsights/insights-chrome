import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider as JotaiProvider, createStore } from 'jotai';
import NavContext from '../Navigation/navContext';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { moduleRoutesAtom } from '../../state/atoms/chromeModuleAtom';
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

  it('should render the LightwellIcon SVG inside the link', () => {
    renderWithProviders();
    const link = screen.getByRole('link', { name: /lightwell/i });
    const icon = link.querySelector('svg.allservices-icon');
    expect(icon).toBeInTheDocument();
  });

  it('should make the entire content clickable as a single link', () => {
    const { container } = renderWithProviders();
    // Only one link should exist — icon and label are both inside it
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/lightwell');
  });
});
