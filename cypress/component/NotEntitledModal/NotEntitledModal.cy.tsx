import React from 'react';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';

import notEntitledData from '../../../src/components/NotEntitledModal/notEntitledData';
import NotEntitledModal from '../../../src/components/NotEntitledModal';

const Wrapper: React.FC<MemoryRouterProps> = ({ children, ...rest }) => {
  return <MemoryRouter {...rest}>{children}</MemoryRouter>;
};

describe('NonEntitledModal', () => {
  notEntitledData.forEach(({ entitlement, image }) => {
    it(`should render modal for ${entitlement}`, () => {
      const elem = cy
        .mount(
          <Wrapper initialEntries={[`/?not_entitled=${entitlement}`]}>
            <NotEntitledModal />
          </Wrapper>
        )
        .get('html');

      // wait for the image to be loaded before start matching snapshots
      if (image) {
        cy.get(`[src="${image}"]`).should('be.visible');
      }
      elem.matchImageSnapshot();
    });
  });

  it('should not render modal for unknown entitlement', () => {
    const elem = cy
      .mount(
        <Wrapper initialEntries={['/?not_entitled=foobar']}>
          <div>
            <h1>This title should be visible</h1>
          </div>
          <NotEntitledModal />
        </Wrapper>
      )
      .get('html');
    elem.matchImageSnapshot();
  });

  it('should clode modal if close button is clicked', () => {
    cy.mount(
      <Wrapper initialEntries={[`/?not_entitled=${[notEntitledData[0].entitlement]}`]}>
        <NotEntitledModal />
      </Wrapper>
    );
    cy.contains(notEntitledData[0].title).should('exist');
    cy.get(`[aria-label="Close"]`).click();
    cy.contains(notEntitledData[0].title).should('not.exist');
  });

  it('should clode modal if "Not now" button is clicked', () => {
    cy.mount(
      <Wrapper initialEntries={[`/?not_entitled=${[notEntitledData[0].entitlement]}`]}>
        <NotEntitledModal />
      </Wrapper>
    );
    cy.contains(notEntitledData[0].title).should('exist');
    cy.contains('Not now').click();
    cy.contains(notEntitledData[0].title).should('not.exist');
  });
});
