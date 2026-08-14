import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import ChromeContext from '@redhat-cloud-services/chrome/ChromeContext/ChromeContext';
import SegmentContext from '../../../src/analytics/SegmentContext';
import ServiceTile from '../../../src/components/FavoriteServices/ServiceTile';

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

  it('should call unfavoritePage when clicking the unfavorite action', () => {
    cy.intercept('POST', '/api/chrome-service/v1/favorite-pages', { statusCode: 200, body: [] }).as('unfavoritePage');
    cy.mount(
      <Wrapper>
        <ServiceTile name="Dashboard" pathname="/insights/dashboard" />
      </Wrapper>
    );
    cy.get('[aria-label="Unfavorite Dashboard"]').click();
    cy.wait('@unfavoritePage');
  });
});
