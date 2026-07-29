jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: () => false,
}));

import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider, createStore } from 'jotai';
import AllServicesTabs, { AllServicesTabsProps } from './AllServicesTabs';
import type { AllServicesSection } from '../AllServices/allServicesLinks';
import { describe, expect, it, jest } from '@jest/globals';

const defaultProps: AllServicesTabsProps = {
  activeTabKey: 'favorites',
  handleTabClick: jest.fn(),
  isExpanded: false,
  onToggle: jest.fn(),
  linkSections: [],
  tabContentRef: React.createRef<HTMLElement>(),
  onTabClick: jest.fn(),
  activeTabTitle: 'My Favorite services',
  setIsExpanded: jest.fn(),
};

const renderTabs = (props: Partial<AllServicesTabsProps> = {}) => {
  const store = createStore();
  return render(
    <MemoryRouter>
      <Provider store={store}>
        <AllServicesTabs {...defaultProps} {...props} />
      </Provider>
    </MemoryRouter>
  );
};

describe('AllServicesTabs', () => {
  it('should render the Lightwell section with a link to /lightwell', () => {
    renderTabs();
    const link = document.querySelector('[data-ouia-component-id="AllServices-Dropdown-Lightwell"]');
    expect(link).toBeTruthy();
    expect(link!.getAttribute('href')).toBe('/lightwell');
    expect(link!.textContent).toBe('Lightwell');
  });

  it('should render the Lightwell logomark image', () => {
    renderTabs();
    const img = document.querySelector('img[src*="lightwell-logomark"]');
    expect(img).toBeTruthy();
    expect(img!.getAttribute('alt')).toBe('');
    expect(img!.classList.contains('platform-icon')).toBe(true);
  });

  it('should render the View all services link', () => {
    renderTabs();
    const link = document.querySelector('[data-ouia-component-id="View all link"]');
    expect(link).toBeTruthy();
    expect(link!.getAttribute('href')).toBe('/allservices');
  });

  it('should render My Favorite services tab', () => {
    renderTabs();
    const favTab = document.querySelector('[data-ouia-component-id="AllServices-favorites-Tab"]');
    expect(favTab).toBeTruthy();
  });

  it('should render tabs for each linkSection', () => {
    const sections: AllServicesSection[] = [
      { id: 'ai-ml', title: 'AI/ML', links: [] },
      { id: 'security', title: 'Security', links: [] },
    ];
    renderTabs({ linkSections: sections });

    const aiTab = document.querySelector('[data-ouia-component-id="AllServices-ai-ml-Tab"]');
    const secTab = document.querySelector('[data-ouia-component-id="AllServices-security-Tab"]');
    expect(aiTab).toBeTruthy();
    expect(secTab).toBeTruthy();
  });

  it('should call onTabClick when a section tab is clicked', async () => {
    const onTabClick = jest.fn();
    const sections: AllServicesSection[] = [{ id: 'settings', title: 'Settings', links: [] }];
    renderTabs({ linkSections: sections, onTabClick });

    const tab = document.querySelector('[data-ouia-component-id="AllServices-settings-Tab"]') as HTMLElement;
    await userEvent.click(tab);

    expect(onTabClick).toHaveBeenCalledWith(sections[0], '0-settings');
  });

  it('should call setIsExpanded(false) when View all services is clicked', async () => {
    const setIsExpanded = jest.fn();
    renderTabs({ setIsExpanded });

    const link = document.querySelector('[data-ouia-component-id="View all link"]') as HTMLElement;
    await userEvent.click(link);

    expect(setIsExpanded).toHaveBeenCalledWith(false);
  });
});
