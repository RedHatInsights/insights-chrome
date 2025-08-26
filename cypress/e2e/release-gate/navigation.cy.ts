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

    // check if favorite services links exist
    cy.contains('.pf-v6-c-tabs__link', 'Favorites');

    // click on all services
    cy.get('[data-ouia-component-id="View all link"]').first().click();

    // get users link
    cy.get('p:contains("Users")').click();
  });
});
