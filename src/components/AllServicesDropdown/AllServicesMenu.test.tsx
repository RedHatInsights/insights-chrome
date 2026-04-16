import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider, createStore } from 'jotai';
import AllServicesMenu from './AllServicesMenu';
import type { AllServicesSection } from '../AllServices/allServicesLinks';

// Mock child components to isolate the unit under test
jest.mock('../FavoriteServices/ServicesGallery', () => ({
  __esModule: true,
  default: () => <div data-testid="favorites-gallery">Favorites Gallery</div>,
}));

jest.mock('./AllServicesTabs', () => ({
  __esModule: true,
  default: ({ onTabClick, linkSections }: { onTabClick: (section: AllServicesSection, index: string) => void; linkSections: AllServicesSection[] }) => (
    <div data-testid="all-services-tabs">
      {linkSections.map((section, index) => (
        <button key={section.id} data-testid={`tab-${section.id}`} onClick={() => onTabClick(section, `${index}-${section.id}`)}>
          {section.title}
        </button>
      ))}
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

const renderMenu = (props = {}) => {
  const store = createStore();
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
    const tabContent = document.getElementById('refTab1Section');
    expect(tabContent).toBeTruthy();
    expect(tabContent?.getAttribute('aria-label')).toBe('My Favorite services');
  });

  it('should set aria-label to the selected service description when a service tab is active', () => {
    renderMenu();
    // Click on the OpenShift tab to switch away from Favorites
    const openshiftTab = screen.getByTestId('tab-openshift');
    act(() => {
      openshiftTab.click();
    });

    const tabContent = document.getElementById('refTab1Section');
    expect(tabContent?.getAttribute('aria-label')).toBe('OpenShift platform services');
  });

  it('should not use first section description as aria-label when Favorites tab is active', () => {
    renderMenu();
    const tabContent = document.getElementById('refTab1Section');
    // The bug: aria-label showed the first section's description (AI/ML) even on Favorites tab
    expect(tabContent?.getAttribute('aria-label')).not.toBe('AI and machine learning services');
  });
});
