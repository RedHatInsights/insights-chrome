import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider, createStore } from 'jotai';
import AllServicesMenu from './AllServicesMenu';
import type { AllServicesSection } from '../AllServices/allServicesLinks';
import { layoutBannerHiddenAtom } from '../../state/atoms/releaseAtom';

// Mock child components to isolate the unit under test
jest.mock('../FavoriteServices/ServicesGallery', () => ({
  __esModule: true,
  default: () => <div data-testid="favorites-gallery">Favorites Gallery</div>,
}));

jest.mock('./AllServicesTabs', () => ({
  __esModule: true,
  default: ({
    onTabClick,
    linkSections,
    setIsExpanded,
  }: {
    onTabClick: (section: AllServicesSection, index: string) => void;
    linkSections: AllServicesSection[];
    setIsExpanded: (isExpanded: boolean) => void;
  }) => (
    <div data-testid="all-services-tabs">
      {linkSections.map((section, index) => (
        <button key={section.id} data-testid={`tab-${section.id}`} onClick={() => onTabClick(section, `${index}-${section.id}`)}>
          {section.title}
        </button>
      ))}
      <button data-testid="collapse-tabs" onClick={() => setIsExpanded(false)}>
        Collapse
      </button>
    </div>
  ),
}));

jest.mock('./AllServicesGallery', () => ({
  __esModule: true,
  default: ({ selectedService }: { selectedService: AllServicesSection }) => <div data-testid="all-services-gallery">{selectedService.title}</div>,
}));

const mockLinkSections: AllServicesSection[] = [
  {
    id: 'ai',
    title: 'AI/ML',
    description: 'AI and machine learning services',
    links: [],
  },
  {
    id: 'openshift',
    title: 'OpenShift',
    description: 'OpenShift platform services',
    links: [],
  },
];

const defaultProps = {
  setIsOpen: jest.fn(),
  isOpen: true,
  menuRef: React.createRef<HTMLDivElement>(),
  linkSections: mockLinkSections,
  favoritedServices: [],
};

const renderMenu = (props = {}, storeOverrides?: (store: ReturnType<typeof createStore>) => void) => {
  const store = createStore();
  if (storeOverrides) {
    storeOverrides(store);
  }
  return render(
    <MemoryRouter>
      <Provider store={store}>
        <AllServicesMenu {...defaultProps} {...props} />
      </Provider>
    </MemoryRouter>
  );
};

describe('AllServicesMenu', () => {
  it('should set aria-label to "My Favorite services" when Favorites tab is active', () => {
    renderMenu();
    // Favorites tab is the default active tab
    expect(screen.getByRole('tabpanel', { name: 'My Favorite services' })).toBeInTheDocument();
  });

  it('should set aria-label to the selected service description when a service tab is active', async () => {
    renderMenu();
    // Click on the OpenShift tab to switch away from Favorites
    const openshiftTab = screen.getByTestId('tab-openshift');
    await userEvent.click(openshiftTab);

    expect(screen.getByRole('tabpanel', { name: 'OpenShift platform services' })).toBeInTheDocument();
  });

  it('should not use first section description as aria-label when Favorites tab is active', () => {
    renderMenu();
    // The bug: aria-label showed the first section's description (AI/ML) even on Favorites tab
    expect(screen.queryByRole('tabpanel', { name: 'AI and machine learning services' })).not.toBeInTheDocument();
  });

  it('should not apply preview-offset class when layoutBannerHiddenAtom is true', () => {
    renderMenu({}, (store) => {
      store.set(layoutBannerHiddenAtom, true);
    });
    const menuEl = screen.getByTestId('chr-c__find-app-service');
    expect(menuEl.classList.contains('preview-offset')).toBe(false);
  });

  it('should not close the menu when tabs are collapsed via setIsExpanded', async () => {
    const setIsOpen = jest.fn();
    renderMenu({ setIsOpen });
    const collapseButton = screen.getByTestId('collapse-tabs');
    await userEvent.click(collapseButton);
    expect(setIsOpen).not.toHaveBeenCalled();
  });

  it('should close the menu when the close button is clicked', async () => {
    const setIsOpen = jest.fn();
    renderMenu({ setIsOpen, isOpen: true });
    const closeButton = screen.getByRole('button', { name: 'Close menu' });
    await userEvent.click(closeButton);
    expect(setIsOpen).toHaveBeenCalled();
  });
});
