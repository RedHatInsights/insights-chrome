describe('Navigation', () => {
  beforeEach('', () => {
    cy.login();
    cy.visit('/');
  });

  it('visit services', () => {
    // click on services button
    cy.get('.chr-c-link-service-toggle').click();
  });

  it('Navigate to users', () => {
    // click on services button
    cy.get('.chr-c-link-service-toggle').click();

    // click on all services
    cy.get('[data-ouia-component-id="View all link"]').first().click();

    // check that we are on all services page
    cy.url().should('include', '/allservices');
  });
});
