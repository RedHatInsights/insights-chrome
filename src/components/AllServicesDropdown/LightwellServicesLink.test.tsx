import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider as JotaiProvider, createStore } from 'jotai';
import NavContext from '../Navigation/navContext';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { moduleRoutesAtom } from '../../state/atoms/chromeModuleAtom';
import LightwellServicesLink from './LightwellServicesLink';

const mockUseScalprum = jest.fn();

jest.mock('@scalprum/react-core', () => ({
  ScalprumComponent: (props: Record<string, unknown>) => <div data-testid="scalprum-lightwell-icon" data-scope={props.scope} data-module={props.module} />,
  useScalprum: () => mockUseScalprum(),
}));

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
    mockUseScalprum.mockReturnValue({
      config: { 'frontend-assets': { name: 'frontend-assets', manifestLocation: '/frontend-assets/manifest.json' } },
    });
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

  it('should render the LightwellIcon via ScalprumComponent from frontend-assets', () => {
    renderWithProviders();
    const icon = screen.getByTestId('scalprum-lightwell-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('data-scope', 'frontend-assets');
    expect(icon).toHaveAttribute('data-module', './LightwellIcon');
  });

  it('should make the entire content clickable as a single link', () => {
    const { container } = renderWithProviders();
    // Only one link should exist — icon and label are both inside it
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/lightwell');
  });

  it('should not render the icon when frontend-assets scope is unavailable', () => {
    mockUseScalprum.mockReturnValue({ config: {} });
    renderWithProviders();
    expect(screen.queryByTestId('scalprum-lightwell-icon')).not.toBeInTheDocument();
    // Link and label still render
    expect(screen.getByRole('link', { name: /lightwell/i })).toBeInTheDocument();
    expect(screen.getByText('Lightwell')).toBeInTheDocument();
  });
});
