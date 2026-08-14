import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import ChromeContext from '@redhat-cloud-services/chrome/ChromeContext/ChromeContext';
import SegmentContext from '../../../src/analytics/SegmentContext';
import { AllServicesDropdownContext } from '../../../src/components/AllServicesDropdown/common';
import AllServicesGallery from '../../../src/components/AllServicesDropdown/AllServicesGallery';
import AllServicesGalleryLink from '../../../src/components/AllServicesDropdown/AllServicesGalleryLink';
import AllServicesGallerySection from '../../../src/components/AllServicesDropdown/AllServicesGallerySection';
import type { AllServicesSection } from '../../../src/components/AllServices/allServicesLinks';

const chromeContextValue: React.ContextType<typeof ChromeContext> = {
  update: () => undefined,
  setLastVisited: () => undefined,
  setFavoritePages: () => undefined,
  subscribe: () => Symbol(0),
  unsubscribe: () => undefined,
  setIdentity: () => undefined,
  setVisitedBundles: () => undefined,
  getState: () => ({
    lastVisitedPages: [],
    favoritePages: [],
    visitedBundles: {},
    initialized: true,
  }),
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <IntlProvider locale="en">
    <SegmentContext.Provider value={{ ready: false }}>
      <ChromeContext.Provider value={chromeContextValue}>
        <MemoryRouter>
          <AllServicesDropdownContext.Provider value={{ onLinkClick: () => undefined }}>{children}</AllServicesDropdownContext.Provider>
        </MemoryRouter>
      </ChromeContext.Provider>
    </SegmentContext.Provider>
  </IntlProvider>
);

describe('AllServicesGalleryLink', () => {
  it('should render an internal link with favorite toggle', () => {
    cy.mount(
      <Wrapper>
        <AllServicesGalleryLink href="/insights/dashboard" title="Dashboard" category="rhel" />
      </Wrapper>
    );
    cy.contains('Dashboard').should('exist');
    cy.get('[aria-label="Favorite Dashboard"]').should('exist');
  });

  it('should render an external link without favorite toggle', () => {
    cy.mount(
      <Wrapper>
        <AllServicesGalleryLink href="https://example.com" title="External" category="rhel" isExternal />
      </Wrapper>
    );
    cy.contains('External').should('exist');
    cy.get('[aria-label*="Favorite"]').should('not.exist');
    cy.get('[aria-label*="Unfavorite"]').should('not.exist');
  });

  it('should render description text', () => {
    cy.mount(
      <Wrapper>
        <AllServicesGalleryLink href="/insights/dashboard" title="Dashboard" description="View your dashboard" category="rhel" />
      </Wrapper>
    );
    cy.contains('View your dashboard').should('exist');
  });

  it('should set correct OUIA component IDs', () => {
    cy.mount(
      <Wrapper>
        <AllServicesGalleryLink href="/insights/dashboard" title="Dashboard" category="rhel" group="observe" />
      </Wrapper>
    );
    cy.get('[data-ouia-component-id="rhel-observe-Dashboard-Link"]').should('exist');
    cy.get('[data-ouia-component-id="rhel-observe-Dashboard-FavoriteToggle"]').should('exist');
  });

  it('should render using ChromeLink component, not a native anchor', () => {
    cy.mount(
      <Wrapper>
        <AllServicesGalleryLink href="/insights/dashboard" title="Dashboard" category="rhel" />
      </Wrapper>
    );
    cy.get('.pf-v6-c-menu__item').should('have.attr', 'href', '/insights/dashboard');
  });

  it('should call favoritePage when clicking the favorite action', () => {
    cy.intercept('POST', '/api/chrome-service/v1/favorite-pages', { statusCode: 200, body: [{ pathname: '/insights/dashboard', favorite: true }] }).as(
      'favoritePage'
    );
    cy.mount(
      <Wrapper>
        <AllServicesGalleryLink href="/insights/dashboard" title="Dashboard" category="rhel" />
      </Wrapper>
    );
    cy.get('[aria-label="Favorite Dashboard"]').click();
    cy.wait('@favoritePage');
  });
});

describe('AllServicesGallerySection', () => {
  it('should render group title and links', () => {
    cy.mount(
      <Wrapper>
        <AllServicesGallerySection
          isGroup={true as const}
          title="Observe"
          links={[
            { href: '/insights/drift', title: 'Drift' },
            { href: '/insights/policies', title: 'Policies' },
          ]}
          category="rhel"
        />
      </Wrapper>
    );
    cy.contains('Observe').should('exist');
    cy.contains('Drift').should('exist');
    cy.contains('Policies').should('exist');
  });

  it('should not render its own divider (divider is handled by parent)', () => {
    cy.mount(
      <Wrapper>
        <AllServicesGallerySection isGroup={true as const} title="Observe" links={[{ href: '/insights/drift', title: 'Drift' }]} category="rhel" />
      </Wrapper>
    );
    cy.get('hr').should('not.exist');
  });

  it('should render nothing when links array is empty', () => {
    cy.mount(
      <Wrapper>
        <AllServicesGallerySection isGroup={true as const} title="Empty" links={[]} category="rhel" />
      </Wrapper>
    );
    cy.contains('Empty').should('not.exist');
    cy.get('hr').should('not.exist');
    cy.get('.pf-v6-c-menu__group').should('not.exist');
  });

  it('should set labelHeadingLevel to h4 on the menu group', () => {
    cy.mount(
      <Wrapper>
        <AllServicesGallerySection isGroup={true as const} title="Observe" links={[{ href: '/insights/drift', title: 'Drift' }]} category="rhel" />
      </Wrapper>
    );
    cy.get('h4').contains('Observe').should('exist');
  });
});

describe('AllServicesGallery', () => {
  it('should render direct links only', () => {
    const service: AllServicesSection = {
      title: 'RHEL',
      links: [
        { href: '/insights/dashboard', title: 'Dashboard' },
        { href: '/insights/advisor', title: 'Advisor' },
      ],
    };
    cy.mount(
      <Wrapper>
        <AllServicesGallery selectedService={service} />
      </Wrapper>
    );
    cy.contains('Dashboard').should('exist');
    cy.contains('Advisor').should('exist');
  });

  it('should render grouped links only', () => {
    const service: AllServicesSection = {
      title: 'RHEL',
      links: [
        {
          isGroup: true as const,
          title: 'Observe',
          links: [
            { href: '/insights/drift', title: 'Drift' },
            { href: '/insights/policies', title: 'Policies' },
          ],
        },
      ],
    };
    cy.mount(
      <Wrapper>
        <AllServicesGallery selectedService={service} />
      </Wrapper>
    );
    cy.contains('Observe').should('exist');
    cy.contains('Drift').should('exist');
    cy.contains('Policies').should('exist');
  });

  it('should render mixed direct and grouped links', () => {
    const service: AllServicesSection = {
      title: 'RHEL',
      links: [
        { href: '/insights/dashboard', title: 'Dashboard' },
        {
          isGroup: true as const,
          title: 'Observe',
          links: [{ href: '/insights/drift', title: 'Drift' }],
        },
      ],
    };
    cy.mount(
      <Wrapper>
        <AllServicesGallery selectedService={service} />
      </Wrapper>
    );
    cy.contains('Dashboard').should('exist');
    cy.contains('Observe').should('exist');
    cy.contains('Drift').should('exist');
  });

  it('should not render a leading divider when there are only grouped sections', () => {
    const service: AllServicesSection = {
      title: 'RHEL',
      links: [
        {
          isGroup: true as const,
          title: 'Observe',
          links: [{ href: '/insights/drift', title: 'Drift' }],
        },
        {
          isGroup: true as const,
          title: 'Automate',
          links: [{ href: '/insights/remediations', title: 'Remediations' }],
        },
      ],
    };
    cy.mount(
      <Wrapper>
        <AllServicesGallery selectedService={service} />
      </Wrapper>
    );
    cy.get('hr').should('have.length', 1);
  });

  it('should render a divider between direct links and first section', () => {
    const service: AllServicesSection = {
      title: 'RHEL',
      links: [
        { href: '/insights/dashboard', title: 'Dashboard' },
        {
          isGroup: true as const,
          title: 'Observe',
          links: [{ href: '/insights/drift', title: 'Drift' }],
        },
      ],
    };
    cy.mount(
      <Wrapper>
        <AllServicesGallery selectedService={service} />
      </Wrapper>
    );
    cy.get('hr').should('have.length', 1);
  });

  it('should render external links without favorite toggle', () => {
    const service: AllServicesSection = {
      title: 'External',
      links: [{ href: 'https://example.com', title: 'External Service', isExternal: true }],
    };
    cy.mount(
      <Wrapper>
        <AllServicesGallery selectedService={service} />
      </Wrapper>
    );
    cy.contains('External Service').should('exist');
    cy.get('[aria-label*="Favorite"]').should('not.exist');
  });
});
