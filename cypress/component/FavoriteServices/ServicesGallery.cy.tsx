import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import ChromeContext from '@redhat-cloud-services/chrome/ChromeContext/ChromeContext';
import SegmentContext from '../../../src/analytics/SegmentContext';
import FavoriteServicesGallery from '../../../src/components/FavoriteServices/ServicesGallery';

function createChromeContextValue(favoritePages: { pathname: string; favorite: boolean }[] = []): React.ContextType<typeof ChromeContext> {
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
      favoritePages,
      visitedBundles: {},
      initialized: true,
    }),
  };
}

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <IntlProvider locale="en">
    <SegmentContext.Provider value={{ ready: false }}>
      <ChromeContext.Provider value={createChromeContextValue()}>
        <MemoryRouter>{children}</MemoryRouter>
      </ChromeContext.Provider>
    </SegmentContext.Provider>
  </IntlProvider>
);

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
    cy.contains('.pf-v6-c-menu__group', 'RHEL').within(() => {
      cy.contains('Dashboard').should('exist');
      cy.contains('Advisor').should('exist');
    });
    cy.contains('.pf-v6-c-menu__group', 'OpenShift').within(() => {
      cy.contains('Clusters').should('exist');
    });
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
    cy.contains('a', 'View all services').should('have.attr', 'href', '/allservices');
  });
});
