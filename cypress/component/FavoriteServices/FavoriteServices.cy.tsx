import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import ChromeContext from '@redhat-cloud-services/chrome/ChromeContext/ChromeContext';
import SegmentContext from '../../../src/analytics/SegmentContext';
import ServiceTile from '../../../src/components/FavoriteServices/ServiceTile';
import FavoriteServicesGallery from '../../../src/components/FavoriteServices/ServicesGallery';

function createChromeContextValue(favoritePages: { pathname: string; favorite: boolean }[] = []) {
  return {
    update: () => undefined,
    setLastVisited: () => undefined,
    setFavoritePages: () => undefined,
    subscribe: () => Symbol(0),
    unsubscribe: () => undefined,
    setIdentity: () => undefined,
    setVisitedBundles: () => undefined,
    getState: () => ({
      lastVisitedPages: [],
      subscribtions: {},
      favoritePages,
      visitedBundles: {},
      initialized: true,
    }),
  };
}

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <IntlProvider locale="en">
    <SegmentContext.Provider value={{ ready: false }}>
      <ChromeContext.Provider value={createChromeContextValue() as any}>
        <MemoryRouter>{children}</MemoryRouter>
      </ChromeContext.Provider>
    </SegmentContext.Provider>
  </IntlProvider>
);

describe('ServiceTile', () => {
  it('should render an internal service tile with unfavorite action', () => {
    cy.mount(
      <Wrapper>
        <ServiceTile name="Dashboard" pathname="/insights/dashboard" />
      </Wrapper>
    );
    cy.contains('Dashboard').should('exist');
    cy.get('[aria-label="Unfavorite Dashboard"]').should('exist');
  });

  it('should render description when provided', () => {
    cy.mount(
      <Wrapper>
        <ServiceTile name="Dashboard" pathname="/insights/dashboard" description="View your dashboard" />
      </Wrapper>
    );
    cy.contains('View your dashboard').should('exist');
  });

  it('should render an external link without unfavorite action', () => {
    cy.mount(
      <Wrapper>
        <ServiceTile name="External" pathname="https://example.com" isExternal />
      </Wrapper>
    );
    cy.contains('External').should('exist');
    cy.get('[aria-label*="Unfavorite"]').should('not.exist');
  });

  it('should render using ChromeLink component, not a native anchor', () => {
    cy.mount(
      <Wrapper>
        <ServiceTile name="Dashboard" pathname="/insights/dashboard" />
      </Wrapper>
    );
    cy.get('.pf-v6-c-menu__item').should('have.attr', 'href', '/insights/dashboard');
  });
});

describe('FavoriteServicesGallery', () => {
  it('should render the empty state when there are no favorites', () => {
    cy.mount(
      <Wrapper>
        <FavoriteServicesGallery favoritedServices={[]} />
      </Wrapper>
    );
    cy.contains('No favorited services').should('exist');
    cy.contains('View all services').should('exist');
  });

  it('should render services grouped by bundle', () => {
    cy.mount(
      <Wrapper>
        <FavoriteServicesGallery
          favoritedServices={[
            { name: 'Dashboard', pathname: '/insights/dashboard' },
            { name: 'Advisor', pathname: '/insights/advisor' },
            { name: 'Clusters', pathname: '/openshift/clusters' },
          ]}
        />
      </Wrapper>
    );
    cy.contains('Dashboard').should('exist');
    cy.contains('Advisor').should('exist');
    cy.contains('Clusters').should('exist');
    cy.contains('RHEL').should('exist');
    cy.contains('OpenShift').should('exist');
  });

  it('should render dividers between bundle groups', () => {
    cy.mount(
      <Wrapper>
        <FavoriteServicesGallery
          favoritedServices={[
            { name: 'Dashboard', pathname: '/insights/dashboard' },
            { name: 'Clusters', pathname: '/openshift/clusters' },
          ]}
        />
      </Wrapper>
    );
    cy.get('hr').should('have.length.gte', 1);
  });

  it('should not render dividers for a single bundle', () => {
    cy.mount(
      <Wrapper>
        <FavoriteServicesGallery
          favoritedServices={[
            { name: 'Dashboard', pathname: '/insights/dashboard' },
            { name: 'Advisor', pathname: '/insights/advisor' },
          ]}
        />
      </Wrapper>
    );
    cy.get('hr').should('have.length', 0);
  });

  it('should render the info alert with link to all services', () => {
    cy.mount(
      <Wrapper>
        <FavoriteServicesGallery favoritedServices={[{ name: 'Dashboard', pathname: '/insights/dashboard' }]} />
      </Wrapper>
    );
    cy.contains('Want to add more favorites?').should('exist');
  });
});
