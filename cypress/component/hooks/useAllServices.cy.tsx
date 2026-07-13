import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider as JotaiProvider, createStore } from 'jotai';
import useAllServices from '../../../src/hooks/useAllServices';
import { visibleServiceTilesAtom, visibleServiceTilesReadyAtom } from '../../../src/state/atoms/visibleBundlesAtom';

let store = createStore();

const TestComponent = () => {
  const { linkSections, error, ready } = useAllServices();

  return (
    <div>
      <div data-cy="ready-status">Ready: {ready.toString()}</div>
      <div data-cy="error-status">Error: {error ? 'true' : 'false'}</div>
      <div data-cy="sections-count">Sections: {linkSections.length}</div>
      {linkSections.map((section, index) => (
        <div key={index} data-cy={`section-${index}`}>
          <div data-cy={`section-${index}-title`}>{section.title}</div>
          <div data-cy={`section-${index}-links-count`}>{section.links.length}</div>
          {section.links.map((link, linkIndex) => (
            <div key={linkIndex} data-cy={`section-${index}-link-${linkIndex}-title`}>
              {link.title}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <JotaiProvider store={store}>
    <BrowserRouter>
      <IntlProvider locale="en">{children}</IntlProvider>
    </BrowserRouter>
  </JotaiProvider>
);

describe('useAllServices', () => {
  beforeEach(() => {
    store = createStore();
  });

  const serviceTilesData = [
    {
      title: 'Section 1',
      links: [
        { title: 'Link 1', href: '/link1' },
        { title: 'Link 2', href: '/link2' },
      ],
    },
    {
      title: 'Section 2',
      links: [{ title: 'Link 3', href: '/link3' }],
    },
  ];

  it('should render service tiles from the shared atom', () => {
    store.set(visibleServiceTilesAtom, serviceTilesData);
    store.set(visibleServiceTilesReadyAtom, true);

    cy.mount(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    );

    cy.get('[data-cy="ready-status"]').should('contain', 'Ready: true');
    cy.get('[data-cy="error-status"]').should('contain', 'Error: false');
    cy.get('[data-cy="sections-count"]').should('contain', 'Sections: 2');
    cy.get('[data-cy="section-0-title"]').should('contain', 'Section 1');
    cy.get('[data-cy="section-0-links-count"]').should('contain', '2');
    cy.get('[data-cy="section-1-title"]').should('contain', 'Section 2');
  });

  it('should show ready=false when tiles have not loaded', () => {
    store.set(visibleServiceTilesAtom, []);
    store.set(visibleServiceTilesReadyAtom, false);

    cy.mount(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    );

    cy.get('[data-cy="ready-status"]').should('contain', 'Ready: false');
    cy.get('[data-cy="sections-count"]').should('contain', 'Sections: 0');
  });

  it('should filter empty sections', () => {
    store.set(visibleServiceTilesAtom, [
      { title: 'Has Links', links: [{ title: 'Link', href: '/a' }] },
      { title: 'Empty', links: [] },
    ]);
    store.set(visibleServiceTilesReadyAtom, true);

    cy.mount(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    );

    cy.get('[data-cy="sections-count"]').should('contain', 'Sections: 1');
    cy.get('[data-cy="section-0-title"]').should('contain', 'Has Links');
  });
});
